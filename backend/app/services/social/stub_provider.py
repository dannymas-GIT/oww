"""Log-only social provider used when no aggregator API key is configured."""

from __future__ import annotations

import logging
import uuid
from datetime import datetime
from typing import Any

from app.services.social.base import PublishResult

logger = logging.getLogger(__name__)


class StubProvider:
    name = "stub"

    def is_configured(self) -> bool:
        return True

    def connected_platforms(self) -> list[str]:
        return ["linkedin", "facebook", "instagram", "twitter"]

    def publish(
        self,
        *,
        message: str,
        platforms: list[str],
        link_url: str | None = None,
        media_url: str | None = None,
        scheduled_at: datetime | None = None,
    ) -> PublishResult:
        post_id = f"stub-{uuid.uuid4().hex[:12]}"
        platform_map: dict[str, Any] = {
            p: {"status": "success", "id": f"{post_id}-{p}"} for p in platforms
        }
        logger.info(
            "[social stub] platforms=%s scheduled=%s link=%s media=%s message=%s",
            platforms,
            scheduled_at.isoformat() if scheduled_at else None,
            link_url,
            media_url,
            (message or "")[:200],
        )
        return PublishResult(
            ok=True,
            provider_post_id=post_id,
            status="posted",
            platforms=platform_map,
            raw={"stub": True, "platforms": platforms},
        )

    def delete(self, provider_post_id: str) -> bool:
        logger.info("[social stub] delete %s", provider_post_id)
        return True
