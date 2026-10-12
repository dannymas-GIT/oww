"""Ayrshare aggregator provider (one API → LinkedIn / Meta / X / etc.)."""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any

import httpx

from app.core.config import settings
from app.services.social.base import PublishResult

logger = logging.getLogger(__name__)

# Ayrshare platform identifiers
AYRSHARE_PLATFORM_ALIASES = {
    "linkedin": "linkedin",
    "facebook": "facebook",
    "instagram": "instagram",
    "x": "twitter",
    "twitter": "twitter",
    "bluesky": "bluesky",
    "youtube": "youtube",
}


def _normalize_platforms(platforms: list[str]) -> list[str]:
    out: list[str] = []
    for p in platforms:
        key = (p or "").strip().lower()
        mapped = AYRSHARE_PLATFORM_ALIASES.get(key)
        if mapped and mapped not in out:
            out.append(mapped)
    return out


class AyrshareProvider:
    name = "ayrshare"

    def __init__(self, api_key: str | None = None, base_url: str | None = None):
        self.api_key = (api_key if api_key is not None else settings.AYRSHARE_API_KEY) or ""
        self.base_url = (base_url or settings.AYRSHARE_API_BASE).rstrip("/")

    def is_configured(self) -> bool:
        return bool(self.api_key.strip())

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def connected_platforms(self) -> list[str]:
        if not self.is_configured():
            return []
        try:
            with httpx.Client(timeout=20.0) as client:
                resp = client.get(f"{self.base_url}/user", headers=self._headers())
                resp.raise_for_status()
                data = resp.json()
        except Exception as exc:
            logger.warning("Ayrshare /user failed: %s", exc)
            return []
        active = data.get("activeSocialAccounts") or data.get("displayNames") or []
        if isinstance(active, dict):
            return sorted(str(k).lower() for k in active.keys())
        if isinstance(active, list):
            names: list[str] = []
            for item in active:
                if isinstance(item, str):
                    names.append(item.lower())
                elif isinstance(item, dict):
                    plat = item.get("platform") or item.get("name") or ""
                    if plat:
                        names.append(str(plat).lower())
            return sorted(set(names))
        return []

    def publish(
        self,
        *,
        message: str,
        platforms: list[str],
        link_url: str | None = None,
        media_url: str | None = None,
        scheduled_at: datetime | None = None,
    ) -> PublishResult:
        if not self.is_configured():
            return PublishResult(ok=False, status="failed", error="Ayrshare API key not configured")

        plats = _normalize_platforms(platforms) or ["linkedin"]
        body: dict[str, Any] = {
            "post": message,
            "platforms": plats,
        }
        if link_url:
            # Prefer appending link in message; Ayrshare also accepts mediaUrls
            if link_url not in (message or ""):
                body["post"] = f"{message}\n\n{link_url}".strip()
        if media_url:
            body["mediaUrls"] = [media_url]
        if scheduled_at:
            body["scheduleDate"] = scheduled_at.strftime("%Y-%m-%dT%H:%M:%SZ")

        try:
            with httpx.Client(timeout=45.0) as client:
                resp = client.post(f"{self.base_url}/post", headers=self._headers(), json=body)
                data = resp.json() if resp.content else {}
                if resp.status_code >= 400:
                    err = data.get("message") or data.get("error") or resp.text[:300]
                    return PublishResult(
                        ok=False,
                        status="failed",
                        error=str(err),
                        raw=data if isinstance(data, dict) else {"raw": data},
                    )
        except Exception as exc:
            logger.warning("Ayrshare publish failed: %s", exc)
            return PublishResult(ok=False, status="failed", error=str(exc))

        if not isinstance(data, dict):
            data = {"raw": data}

        post_ids = data.get("postIds") or data.get("id") or data.get("postId")
        provider_id: str | None = None
        platform_map: dict[str, Any] = {}

        if isinstance(post_ids, dict):
            provider_id = next((str(v) for v in post_ids.values() if v), None)
            for plat, pid in post_ids.items():
                platform_map[str(plat).lower()] = {"status": "success", "id": str(pid) if pid else None}
        elif isinstance(post_ids, str):
            provider_id = post_ids
            for p in plats:
                platform_map[p] = {"status": "success", "id": post_ids}
        elif isinstance(post_ids, list) and post_ids:
            provider_id = str(post_ids[0])
            for p in plats:
                platform_map[p] = {"status": "success", "id": provider_id}

        errors = data.get("errors") or data.get("failed") or []
        if isinstance(errors, list) and errors:
            for err in errors:
                if isinstance(err, dict):
                    plat = str(err.get("platform") or err.get("social") or "unknown").lower()
                    platform_map[plat] = {
                        "status": "failed",
                        "error": err.get("message") or err.get("error") or str(err),
                    }
                else:
                    platform_map["unknown"] = {"status": "failed", "error": str(err)}

        success_count = sum(1 for v in platform_map.values() if v.get("status") == "success")
        fail_count = sum(1 for v in platform_map.values() if v.get("status") == "failed")
        if success_count and fail_count:
            status = "partial"
            ok = True
        elif success_count:
            status = "posted"
            ok = True
        else:
            status = "failed"
            ok = False

        return PublishResult(
            ok=ok,
            provider_post_id=provider_id,
            status=status,
            platforms=platform_map,
            raw=data,
            error=None if ok else (data.get("message") or "Publish failed"),
        )

    def delete(self, provider_post_id: str) -> bool:
        if not self.is_configured() or not provider_post_id:
            return False
        try:
            with httpx.Client(timeout=20.0) as client:
                resp = client.delete(
                    f"{self.base_url}/post",
                    headers=self._headers(),
                    json={"id": provider_post_id},
                )
                return resp.status_code < 400
        except Exception as exc:
            logger.warning("Ayrshare delete failed: %s", exc)
            return False
