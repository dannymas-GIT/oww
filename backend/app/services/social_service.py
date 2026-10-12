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
}


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


def publish_now(db: Session, post: SocialPost) -> SocialPost:
    provider = get_provider()
    post.provider = provider.name
    post.status = "queued"
    db.commit()

    result = provider.publish(
        message=post.message or "",
        platforms=list(post.platforms or ["linkedin"]),
        link_url=post.link_url,
        media_url=post.media_url,
        scheduled_at=None,
    )
    _apply_result(post, result)
    db.commit()
    db.refresh(post)
    return post


def schedule_post(db: Session, post: SocialPost, when: datetime) -> SocialPost:
    """Schedule via provider if it supports scheduleDate; otherwise queue locally."""
    provider = get_provider()
    post.provider = provider.name
    post.scheduled_at = when
    # Prefer provider-side scheduling when live key is present
    if isinstance(provider, AyrshareProvider) and provider.is_configured():
        result = provider.publish(
            message=post.message or "",
            platforms=list(post.platforms or ["linkedin"]),
            link_url=post.link_url,
            media_url=post.media_url,
            scheduled_at=when,
        )
        _apply_result(post, result)
        if result.ok:
            post.status = "scheduled"
    else:
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
    return {
        "provider": provider.name,
        "configured": provider.is_configured() if hasattr(provider, "is_configured") else True,
        "live": provider.name != "stub",
        "connected_platforms": connected,
        "default_platforms": default_platforms(db),
        "auto_share_on_publish": auto_share_on_publish(db),
        "char_hints": PLATFORM_CHAR_HINTS,
        "public_site_url": (settings.PUBLIC_SITE_URL or f"https://{settings.APP_DOMAIN}").rstrip("/"),
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
