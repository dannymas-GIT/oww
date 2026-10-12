"""Social post composition, persistence, and publish orchestration."""

from __future__ import annotations

import logging
import re
from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.content_page import ContentPage
from app.models.platform_setting import PlatformSetting
from app.models.social_post import SocialPost
from app.models.user import User
from app.services import cms_service
from app.services.social.ayrshare_provider import AyrshareProvider
from app.services.social.base import PublishResult, SocialProvider
from app.services.social.stub_provider import StubProvider

logger = logging.getLogger(__name__)

SETTING_DEFAULT_PLATFORMS = "social_default_platforms"
SETTING_AUTO_SHARE = "social_auto_share_on_publish"
MAX_ATTEMPTS = 3

# Platform character soft limits (hints for the composer UI)
PLATFORM_CHAR_HINTS = {
    "linkedin": 3000,
    "facebook": 63206,
    "instagram": 2200,
    "twitter": 280,
    "x": 280,
    "bluesky": 300,
    "youtube": 5000,
    "oww_blog": 20000,
    "ww360": 5000,
}

# First-party destinations (not sent to Ayrshare)
INTERNAL_PLATFORMS = frozenset({"oww_blog", "ww360"})
COMPOSABLE_SOCIAL = ("linkedin", "facebook", "instagram", "twitter")
COMPOSABLE_DESTINATIONS = (*COMPOSABLE_SOCIAL, "oww_blog", "ww360")


def split_platforms(platforms: list[str] | None) -> tuple[list[str], list[str]]:
    """Return (external_social, internal_destinations)."""
    raw = [str(p).strip().lower() for p in (platforms or []) if str(p).strip()]
    external = [p for p in raw if p not in INTERNAL_PLATFORMS]
    internal = [p for p in raw if p in INTERNAL_PLATFORMS]
    return external, internal


def _slugify(text: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", (text or "").lower()).strip("-")
    return (s[:80] or "update")


def get_provider() -> SocialProvider:
    name = (settings.SOCIAL_PROVIDER or "ayrshare").strip().lower()
    if name == "ayrshare":
        provider = AyrshareProvider()
        if provider.is_configured():
            return provider
        logger.info("Ayrshare key missing — using stub social provider")
        return StubProvider()
    if name == "stub":
        return StubProvider()
    logger.warning("Unknown SOCIAL_PROVIDER=%s — using stub", name)
    return StubProvider()


def _setting_value(db: Session, key: str, default: Any) -> Any:
    row = db.query(PlatformSetting).filter(PlatformSetting.key == key).first()
    if not row:
        return default
    if isinstance(row.value, dict) and "value" in row.value:
        return row.value["value"]
    return row.value if row.value is not None else default


def default_platforms(db: Session) -> list[str]:
    raw = _setting_value(db, SETTING_DEFAULT_PLATFORMS, None)
    if isinstance(raw, list) and raw:
        return [str(p).lower() for p in raw]
    if isinstance(raw, str) and raw.strip():
        return [p.strip().lower() for p in raw.split(",") if p.strip()]
    env = settings.SOCIAL_DEFAULT_PLATFORMS or "linkedin"
    return [p.strip().lower() for p in env.split(",") if p.strip()] or ["linkedin"]


def auto_share_on_publish(db: Session) -> bool:
    return bool(_setting_value(db, SETTING_AUTO_SHARE, False))


def set_social_settings(db: Session, updates: dict[str, Any], admin: User) -> dict[str, Any]:
    now = datetime.utcnow()
    for key, val in updates.items():
        if key == SETTING_DEFAULT_PLATFORMS:
            if isinstance(val, str):
                val = [p.strip().lower() for p in val.split(",") if p.strip()]
            elif isinstance(val, list):
                val = [str(p).strip().lower() for p in val if str(p).strip()]
            else:
                val = ["linkedin"]
        elif key == SETTING_AUTO_SHARE:
            val = bool(val)
        else:
            continue
        row = db.query(PlatformSetting).filter(PlatformSetting.key == key).first()
        if not row:
            row = PlatformSetting(key=key)
            db.add(row)
        row.value = {"value": val}
        row.updated_by = admin.id
        row.updated_at = now
    db.commit()
    return {
        SETTING_DEFAULT_PLATFORMS: default_platforms(db),
        SETTING_AUTO_SHARE: auto_share_on_publish(db),
    }


def public_blog_url(page: ContentPage) -> str:
    base = (settings.PUBLIC_SITE_URL or f"https://{settings.APP_DOMAIN}").rstrip("/")
    state = (page.state_code or "NY").lower()
    slug = (page.slug or "").strip().lower()
    return f"{base}/{state}/blog/{slug}"


def compose_from_page(page: ContentPage) -> dict[str, Any]:
    """Build a default social message + assets from a CMS blog page."""
    title = (page.title or "").strip()
    summary = (page.summary or "").strip()
    link = public_blog_url(page)
    tags = cms_service._normalize_tags(page.tags) if hasattr(cms_service, "_normalize_tags") else []
    if not isinstance(tags, list):
        tags = []
    hashtags = " ".join(
        f"#{re.sub(r'[^a-zA-Z0-9]', '', str(t))}" for t in tags if str(t).strip()
    ).strip()

    parts = [title]
    if summary:
        parts.append(summary)
    parts.append(link)
    if hashtags:
        parts.append(hashtags)
    message = "\n\n".join(p for p in parts if p)

    sections: list = []
    payload = page.body_json if isinstance(page.body_json, dict) else {}
    if isinstance(payload.get("sections"), list):
        sections = payload["sections"]
    media = cms_service.cover_image_from_sections(sections)

    return {
        "content_page_id": page.id,
        "state_code": (page.state_code or "NY").upper()[:2],
        "message": message,
        "link_url": link,
        "media_url": media,
        "title": title,
        "slug": page.slug,
    }


def post_to_dict(post: SocialPost) -> dict[str, Any]:
    return {
        "id": post.id,
        "content_page_id": post.content_page_id,
        "state_code": post.state_code,
        "provider": post.provider,
        "platforms": post.platforms or [],
        "message": post.message,
        "link_url": post.link_url,
        "media_url": post.media_url,
        "status": post.status,
        "scheduled_at": post.scheduled_at.isoformat() if post.scheduled_at else None,
        "posted_at": post.posted_at.isoformat() if post.posted_at else None,
        "provider_post_id": post.provider_post_id,
        "provider_response": post.provider_response or {},
        "error": post.error,
        "attempts": post.attempts or 0,
        "created_by": post.created_by,
        "created_at": post.created_at.isoformat() if post.created_at else None,
        "updated_at": post.updated_at.isoformat() if post.updated_at else None,
    }


def create_post(
    db: Session,
    *,
    message: str,
    platforms: list[str] | None = None,
    content_page_id: int | None = None,
    state_code: str = "NY",
    link_url: str | None = None,
    media_url: str | None = None,
    scheduled_at: datetime | None = None,
    created_by: int | None = None,
    status: str = "draft",
) -> SocialPost:
    provider = get_provider()
    plats = [p.lower() for p in (platforms or default_platforms(db)) if p]
    if not plats:
        plats = ["linkedin"]
    post = SocialPost(
        content_page_id=content_page_id,
        state_code=(state_code or "NY").upper()[:2],
        provider=provider.name,
        platforms=plats,
        message=(message or "").strip(),
        link_url=link_url,
        media_url=media_url,
        status=status,
        scheduled_at=scheduled_at,
        created_by=created_by,
    )
    if scheduled_at and status == "draft":
        post.status = "scheduled"
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


def create_from_page(
    db: Session,
    page: ContentPage,
    *,
    platforms: list[str] | None = None,
    created_by: int | None = None,
    publish: bool = False,
) -> SocialPost:
    composed = compose_from_page(page)
    post = create_post(
        db,
        message=composed["message"],
        platforms=platforms,
        content_page_id=page.id,
        state_code=composed["state_code"],
        link_url=composed["link_url"],
        media_url=composed["media_url"],
        created_by=created_by,
        status="queued" if publish else "draft",
    )
    if publish:
        return publish_now(db, post)
    return post


def _apply_result(post: SocialPost, result: PublishResult) -> None:
    post.attempts = (post.attempts or 0) + 1
    post.provider_response = {
        "platforms": result.platforms,
        "raw": result.raw,
        "status": result.status,
    }
    post.provider_post_id = result.provider_post_id or post.provider_post_id
    post.error = result.error
    post.status = result.status if result.ok or result.status == "partial" else "failed"
    if result.ok or result.status == "partial":
        post.posted_at = datetime.utcnow()
    post.updated_at = datetime.utcnow()


def _publish_oww_blog(db: Session, post: SocialPost) -> dict[str, Any]:
    """Publish (or create+publish) an OWW blog page for this social post."""
    page: ContentPage | None = None
    if post.content_page_id:
        page = db.query(ContentPage).filter(ContentPage.id == post.content_page_id).first()
    if page:
        if page.template != cms_service.BLOG_TEMPLATE:
            page.template = cms_service.BLOG_TEMPLATE
        if not page.is_published:
            page.is_published = True
            cms_service.stamp_publish_dates(page, publishing=True)
            db.commit()
            db.refresh(page)
        post.link_url = post.link_url or public_blog_url(page)
        return {
            "status": "success",
            "id": str(page.id),
            "url": public_blog_url(page),
            "detail": "Published on OWW Blog",
        }

    # Free-form → create a published blog post from the message
    lines = [ln.strip() for ln in (post.message or "").splitlines() if ln.strip()]
    title = (lines[0] if lines else "Workforce update")[:200]
    body_html = "".join(f"<p>{ln}</p>" for ln in (lines[1:] or lines[:1] or ["Update"]))
    base_slug = _slugify(title)
    slug = base_slug
    n = 2
    state = (post.state_code or "NY").upper()[:2]
    while (
        db.query(ContentPage)
        .filter(ContentPage.state_code == state, ContentPage.slug == slug)
        .first()
    ):
        slug = f"{base_slug}-{n}"
        n += 1
    page = ContentPage(
        state_code=state,
        slug=slug,
        title=title,
        template=cms_service.BLOG_TEMPLATE,
        summary=(lines[1] if len(lines) > 1 else title)[:400],
        body_html=body_html,
        body_json={
            "sections": [
                {"type": "rich_text", "title": title, "html": body_html},
            ]
        },
        is_published=True,
        tags=["social", "syndication"],
        author_name="OWW",
    )
    cms_service.stamp_publish_dates(page, publishing=True)
    db.add(page)
    db.commit()
    db.refresh(page)
    post.content_page_id = page.id
    post.link_url = public_blog_url(page)
    return {
        "status": "success",
        "id": str(page.id),
        "url": public_blog_url(page),
        "detail": "Created and published on OWW Blog",
    }


def _publish_ww360(db: Session, post: SocialPost) -> dict[str, Any]:
    """
    Make content available to WW360.

    WW360 embeds the OWW public blog feed — ensure a blog URL exists, then record
    the destination. Optional push to WW360 when service URL/token are configured.
    """
    # Prefer an existing OWW blog URL so WW360 widgets can pick it up
    blog_url = post.link_url
    if post.content_page_id:
        page = db.query(ContentPage).filter(ContentPage.id == post.content_page_id).first()
        if page:
            if not page.is_published:
                # Ensure blog is live for the feed
                _publish_oww_blog(db, post)
                page = db.query(ContentPage).filter(ContentPage.id == post.content_page_id).first()
            blog_url = public_blog_url(page) if page else blog_url

    detail = "Available via OWW blog feed widgets in WW360"
    pushed = False
    base = (settings.WW360_BASE_URL or "").rstrip("/")
    token = (settings.WW360_SERVICE_TOKEN or "").strip()
    if base and token and (post.message or "").strip():
        try:
            import httpx

            payload = {
                "title": (post.message or "").splitlines()[0][:120],
                "body": (post.message or "")[:2000],
                "url": blog_url,
                "source": "oww_social",
                "social_post_id": post.id,
            }
            with httpx.Client(timeout=15.0) as client:
                resp = client.post(
                    f"{base}/api/v1/integrations/oww/announcements",
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
            if resp.status_code < 400:
                pushed = True
                detail = "Pushed announcement to WW360"
            else:
                detail = f"WW360 announce skipped ({resp.status_code}); feed widgets still apply"
        except Exception as exc:
            logger.info("WW360 announce optional push failed: %s", exc)
            detail = "WW360 push unavailable; content still via OWW blog feed"

    return {
        "status": "success",
        "id": f"ww360-{post.id}",
        "url": blog_url,
        "pushed": pushed,
        "detail": detail,
    }


def publish_now(db: Session, post: SocialPost) -> SocialPost:
    provider = get_provider()
    post.provider = provider.name
    post.status = "queued"
    db.commit()

    external, internal = split_platforms(list(post.platforms or ["linkedin"]))
    platform_map: dict[str, Any] = {}
    errors: list[str] = []
    provider_post_id: str | None = None
    raw: dict[str, Any] = {"internal": {}, "external": {}}

    if external:
        result = provider.publish(
            message=post.message or "",
            platforms=external,
            link_url=post.link_url,
            media_url=post.media_url,
            scheduled_at=None,
        )
        platform_map.update(result.platforms or {})
        provider_post_id = result.provider_post_id
        raw["external"] = result.raw or {}
        if result.error:
            errors.append(result.error)
        if not result.ok and result.status == "failed" and not internal:
            _apply_result(post, result)
            db.commit()
            db.refresh(post)
            return post

    if "oww_blog" in internal:
        try:
            platform_map["oww_blog"] = _publish_oww_blog(db, post)
            raw["internal"]["oww_blog"] = platform_map["oww_blog"]
        except Exception as exc:
            logger.exception("oww_blog publish failed")
            platform_map["oww_blog"] = {"status": "error", "message": str(exc)}
            errors.append(f"oww_blog: {exc}")

    if "ww360" in internal:
        try:
            platform_map["ww360"] = _publish_ww360(db, post)
            raw["internal"]["ww360"] = platform_map["ww360"]
        except Exception as exc:
            logger.exception("ww360 publish failed")
            platform_map["ww360"] = {"status": "error", "message": str(exc)}
            errors.append(f"ww360: {exc}")

    successes = [
        k
        for k, v in platform_map.items()
        if isinstance(v, dict) and str(v.get("status", "")).lower() in ("success", "posted")
    ]
    failures = [k for k in platform_map if k not in successes]
    if successes and not failures:
        status = "posted"
        ok = True
    elif successes and failures:
        status = "partial"
        ok = True
    else:
        status = "failed"
        ok = False

    _apply_result(
        post,
        PublishResult(
            ok=ok,
            provider_post_id=provider_post_id,
            status=status,
            platforms=platform_map,
            raw=raw,
            error="; ".join(errors) if errors else None,
        ),
    )
    db.commit()
    db.refresh(post)
    return post


def schedule_post(db: Session, post: SocialPost, when: datetime) -> SocialPost:
    """Schedule via provider if it supports scheduleDate; otherwise queue locally."""
    provider = get_provider()
    post.provider = provider.name
    post.scheduled_at = when
    external, internal = split_platforms(list(post.platforms or ["linkedin"]))
    # Prefer provider-side scheduling for external networks when live key is present
    if external and isinstance(provider, AyrshareProvider) and provider.is_configured() and not internal:
        result = provider.publish(
            message=post.message or "",
            platforms=external,
            link_url=post.link_url,
            media_url=post.media_url,
            scheduled_at=when,
        )
        _apply_result(post, result)
        if result.ok:
            post.status = "scheduled"
    else:
        # Local schedule (covers internal destinations + stub)
        post.status = "scheduled"
    post.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(post)
    return post


def process_due(db: Session) -> dict[str, int]:
    """Publish scheduled posts that are due and retry failed ones (max attempts)."""
    now = datetime.utcnow()
    due = (
        db.query(SocialPost)
        .filter(
            SocialPost.status == "scheduled",
            SocialPost.scheduled_at.isnot(None),
            SocialPost.scheduled_at <= now,
        )
        .all()
    )
    failed = (
        db.query(SocialPost)
        .filter(
            SocialPost.status == "failed",
            SocialPost.attempts < MAX_ATTEMPTS,
        )
        .limit(20)
        .all()
    )
    published = 0
    retried = 0
    for post in due:
        # Skip if already handed to provider with a schedule id
        if post.provider_post_id and post.status == "scheduled":
            # Local-only schedule: publish now
            pass
        publish_now(db, post)
        published += 1
    for post in failed:
        publish_now(db, post)
        retried += 1
    return {"published": published, "retried": retried}


def list_posts(
    db: Session,
    *,
    state_code: str | None = None,
    status: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[SocialPost], int]:
    q = db.query(SocialPost)
    if state_code:
        q = q.filter(SocialPost.state_code == state_code.upper()[:2])
    if status:
        q = q.filter(SocialPost.status == status)
    total = q.count()
    rows = q.order_by(SocialPost.created_at.desc()).offset(offset).limit(min(limit, 100)).all()
    return rows, total


def provider_status(db: Session) -> dict[str, Any]:
    provider = get_provider()
    connected = provider.connected_platforms()
    live = provider.name != "stub"
    return {
        "provider": provider.name,
        "configured": provider.is_configured() if hasattr(provider, "is_configured") else True,
        "live": live,
        "connected_platforms": connected,
        "default_platforms": default_platforms(db),
        "auto_share_on_publish": auto_share_on_publish(db),
        "char_hints": PLATFORM_CHAR_HINTS,
        "composable_destinations": list(COMPOSABLE_DESTINATIONS),
        "internal_destinations": sorted(INTERNAL_PLATFORMS),
        "public_site_url": (settings.PUBLIC_SITE_URL or f"https://{settings.APP_DOMAIN}").rstrip("/"),
        "api_key_configured": bool((settings.AYRSHARE_API_KEY or "").strip()),
        "setup": {
            "provider_label": "Ayrshare",
            "docs_url": "https://www.ayrshare.com",
            "env_var": "AYRSHARE_API_KEY",
            "ready": live,
            "message": (
                "Live LinkedIn publishing is on."
                if live
                else "Optional: add AYRSHARE_API_KEY to the OWW host .env, connect the LinkedIn Page in Ayrshare, and restart the backend. Until then, Social posts run in stub mode (logged only)."
            ),
            "steps": [
                "Create an Ayrshare account and connect the NYSAWWA / OWW LinkedIn Page",
                "Copy the API key into the OWW host .env as AYRSHARE_API_KEY (never commit it)",
                "Restart the OWW backend",
                "Confirm status shows ayrshare (live) under Communications → Social or Platform settings",
            ],
        },
    }


def maybe_auto_share_blog(db: Session, page: ContentPage, *, user_id: int | None = None) -> SocialPost | None:
    """If auto-share is enabled and page is a published blog post, queue a social post."""
    if page.template != cms_service.BLOG_TEMPLATE:
        return None
    if not page.is_published:
        return None
    if not auto_share_on_publish(db):
        return None
    # Avoid duplicate auto-share for the same page in the last hour
    existing = (
        db.query(SocialPost)
        .filter(
            SocialPost.content_page_id == page.id,
            SocialPost.status.in_(["queued", "posted", "partial", "scheduled"]),
        )
        .order_by(SocialPost.id.desc())
        .first()
    )
    if existing:
        return existing
    try:
        return create_from_page(db, page, created_by=user_id, publish=True)
    except Exception as exc:
        logger.warning("auto-share failed for page %s: %s", page.id, exc)
        return None
