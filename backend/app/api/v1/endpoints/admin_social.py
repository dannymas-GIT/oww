"""Admin social syndication endpoints (post once → aggregator)."""

from __future__ import annotations

from datetime import datetime
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.database import get_db
from app.models.content_page import ContentPage
from app.models.social_post import SocialPost
from app.models.user import User
from app.services import social_service
from app.services.role_catalog_service import PLATFORM_EDITOR_ROLES

router = APIRouter(prefix="/admin/social", tags=["admin-social"])

CMS_ROLES = PLATFORM_EDITOR_ROLES


class SocialPostIn(BaseModel):
    message: str = Field(..., min_length=1)
    platforms: list[str] | None = None
    content_page_id: int | None = None
    state_code: str | None = "NY"
    link_url: str | None = None
    media_url: str | None = None
    scheduled_at: str | None = None  # ISO datetime
    publish: bool = False


class SocialSettingsIn(BaseModel):
    social_default_platforms: list[str] | None = None
    social_auto_share_on_publish: bool | None = None


def _parse_iso(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).replace(tzinfo=None)
    except ValueError as exc:
        raise HTTPException(400, "scheduled_at must be ISO datetime") from exc


@router.get("/status")
def social_status(db: Session = Depends(get_db), user: User = Depends(require_roles(*CMS_ROLES))):
    _ = user
    return social_service.provider_status(db)


@router.put("/settings")
def put_social_settings(
    body: SocialSettingsIn,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("platform_admin", "state_admin")),
):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(400, "No settings to update")
    return social_service.set_social_settings(db, updates, admin)


@router.get("/posts")
def list_social_posts(
    state_code: str | None = None,
    status: str | None = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*CMS_ROLES)),
):
    _ = user
    rows, total = social_service.list_posts(
        db, state_code=state_code, status=status, limit=limit, offset=offset
    )
    return {"total": total, "items": [social_service.post_to_dict(r) for r in rows]}


@router.get("/compose/{content_page_id}")
def compose_from_cms(
    content_page_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*CMS_ROLES)),
):
    _ = user
    page = db.query(ContentPage).filter(ContentPage.id == content_page_id).first()
    if not page:
        raise HTTPException(404, "Page not found")
    composed = social_service.compose_from_page(page)
    return {
        **composed,
        "default_platforms": social_service.default_platforms(db),
        "char_hints": social_service.PLATFORM_CHAR_HINTS,
    }


@router.post("/posts")
def create_social_post(
    body: SocialPostIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*CMS_ROLES)),
):
    scheduled = _parse_iso(body.scheduled_at)
    status = "draft"
    if body.publish and not scheduled:
        status = "queued"
    elif scheduled:
        status = "scheduled"

    if body.content_page_id:
        page = db.query(ContentPage).filter(ContentPage.id == body.content_page_id).first()
        if not page:
            raise HTTPException(404, "content_page_id not found")

    post = social_service.create_post(
        db,
        message=body.message,
        platforms=body.platforms,
        content_page_id=body.content_page_id,
        state_code=body.state_code or "NY",
        link_url=body.link_url,
        media_url=body.media_url,
        scheduled_at=scheduled,
        created_by=user.id,
        status=status,
    )
    if scheduled and body.publish:
        post = social_service.schedule_post(db, post, scheduled)
    elif body.publish:
        post = social_service.publish_now(db, post)
    return social_service.post_to_dict(post)


@router.post("/posts/{post_id}/publish")
def publish_social_post(
    post_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*CMS_ROLES)),
):
    _ = user
    post = db.query(SocialPost).filter(SocialPost.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")
    if post.status in ("posted",) and post.provider_post_id:
        raise HTTPException(400, "Post already published")
    post = social_service.publish_now(db, post)
    return social_service.post_to_dict(post)


@router.post("/posts/{post_id}/retry")
def retry_social_post(
    post_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*CMS_ROLES)),
):
    _ = user
    post = db.query(SocialPost).filter(SocialPost.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")
    if post.status not in ("failed", "partial", "queued", "draft"):
        raise HTTPException(400, f"Cannot retry status={post.status}")
    post = social_service.publish_now(db, post)
    return social_service.post_to_dict(post)


@router.delete("/posts/{post_id}")
def delete_social_post(
    post_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*CMS_ROLES)),
):
    _ = user
    post = db.query(SocialPost).filter(SocialPost.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")
    if post.provider_post_id:
        provider = social_service.get_provider()
        try:
            provider.delete(post.provider_post_id)
        except Exception:
            pass
    db.delete(post)
    db.commit()
    return {"ok": True}


@router.post("/from-page/{content_page_id}")
def share_page_now(
    content_page_id: int,
    background_tasks: BackgroundTasks,
    platforms: list[str] | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*CMS_ROLES)),
):
    """Compose + publish a CMS blog page immediately (or stub)."""
    page = db.query(ContentPage).filter(ContentPage.id == content_page_id).first()
    if not page:
        raise HTTPException(404, "Page not found")
    if not page.is_published:
        raise HTTPException(400, "Page must be published before sharing")
    post = social_service.create_from_page(
        db, page, platforms=platforms, created_by=user.id, publish=True
    )
    _ = background_tasks
    return social_service.post_to_dict(post)
