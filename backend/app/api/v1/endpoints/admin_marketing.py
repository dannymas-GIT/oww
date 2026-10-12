"""Admin marketing / SEO efforts."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.database import get_db
from app.models.marketing_effort import MarketingEffort
from app.models.user import User
from app.services import marketing_service
from app.services.role_catalog_service import PLATFORM_EDITOR_ROLES, PLATFORM_OPS_ROLES

router = APIRouter(prefix="/admin/marketing", tags=["admin-marketing"])

ACCESS_ROLES = tuple(sorted(set(PLATFORM_EDITOR_ROLES) | set(PLATFORM_OPS_ROLES)))


class EffortIn(BaseModel):
    title: str | None = None
    kind: str | None = None
    status: str | None = None
    channel: str | None = None
    description: str | None = None
    seo_keywords: list[str] | str | None = None
    target_url: str | None = None
    template_id: str | None = None
    send_method: str | None = None
    content_page_id: int | None = None
    communication_id: int | None = None
    social_post_id: int | None = None
    metrics: dict[str, Any] | None = None
    state_code: str | None = "NY"
    starts_at: str | None = None
    ends_at: str | None = None


@router.get("/efforts")
def list_efforts(
    state_code: str | None = None,
    kind: str | None = None,
    status: str | None = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*ACCESS_ROLES)),
):
    _ = user
    rows, total = marketing_service.list_efforts(
        db, state_code=state_code, kind=kind, status=status, limit=limit, offset=offset
    )
    return {"total": total, "items": [marketing_service.to_dict(r) for r in rows]}


@router.post("/efforts", status_code=201)
def create_effort(
    body: EffortIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*ACCESS_ROLES)),
):
    if not (body.title or "").strip():
        raise HTTPException(400, "title is required")
    row = marketing_service.create_effort(db, body.model_dump(exclude_unset=True), created_by=user.id)
    return marketing_service.to_dict(row)


@router.patch("/efforts/{effort_id}")
def patch_effort(
    effort_id: int,
    body: EffortIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*ACCESS_ROLES)),
):
    _ = user
    row = db.query(MarketingEffort).filter(MarketingEffort.id == effort_id).first()
    if not row:
        raise HTTPException(404, "Effort not found")
    row = marketing_service.update_effort(db, row, body.model_dump(exclude_unset=True))
    return marketing_service.to_dict(row)


@router.delete("/efforts/{effort_id}")
def delete_effort(
    effort_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*ACCESS_ROLES)),
):
    _ = user
    row = db.query(MarketingEffort).filter(MarketingEffort.id == effort_id).first()
    if not row:
        raise HTTPException(404, "Effort not found")
    db.delete(row)
    db.commit()
    return {"ok": True}


@router.get("/catalog")
def marketing_catalog(user: User = Depends(require_roles(*ACCESS_ROLES))):
    """Kinds, statuses, and send methods for the UI."""
    _ = user
    return {
        "kinds": [
            {"id": "seo", "label": "SEO"},
            {"id": "campaign", "label": "Campaign"},
            {"id": "content", "label": "Content"},
            {"id": "social", "label": "Social"},
            {"id": "event", "label": "Event"},
            {"id": "other", "label": "Other"},
        ],
        "statuses": list(marketing_service.STATUSES),
        "send_methods": [
            {"id": "email", "label": "Email blast"},
            {"id": "sms", "label": "SMS"},
            {"id": "blog_publish", "label": "Publish blog"},
            {"id": "social_share", "label": "Share to social"},
            {"id": "manual", "label": "Manual / checklist"},
        ],
    }
