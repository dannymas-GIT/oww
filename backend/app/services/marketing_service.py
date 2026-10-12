"""CRUD helpers for marketing / SEO efforts."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from app.models.marketing_effort import MarketingEffort

KINDS = ("seo", "campaign", "content", "social", "event", "other")
STATUSES = ("planned", "active", "completed", "archived")


def to_dict(row: MarketingEffort) -> dict[str, Any]:
    return {
        "id": row.id,
        "state_code": row.state_code,
        "title": row.title,
        "kind": row.kind,
        "status": row.status,
        "channel": row.channel,
        "description": row.description,
        "seo_keywords": row.seo_keywords or [],
        "target_url": row.target_url,
        "template_id": row.template_id,
        "send_method": row.send_method,
        "content_page_id": row.content_page_id,
        "communication_id": row.communication_id,
        "social_post_id": row.social_post_id,
        "metrics": row.metrics or {},
        "starts_at": row.starts_at.isoformat() if row.starts_at else None,
        "ends_at": row.ends_at.isoformat() if row.ends_at else None,
        "created_by": row.created_by,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }


def list_efforts(
    db: Session,
    *,
    state_code: str | None = None,
    kind: str | None = None,
    status: str | None = None,
    limit: int = 100,
    offset: int = 0,
) -> tuple[list[MarketingEffort], int]:
    q = db.query(MarketingEffort)
    if state_code:
        q = q.filter(MarketingEffort.state_code == state_code.upper()[:2])
    if kind:
        q = q.filter(MarketingEffort.kind == kind)
    if status:
        q = q.filter(MarketingEffort.status == status)
    total = q.count()
    rows = q.order_by(MarketingEffort.updated_at.desc().nullslast(), MarketingEffort.id.desc()).offset(offset).limit(min(limit, 200)).all()
    return rows, total


def create_effort(db: Session, data: dict[str, Any], *, created_by: int | None = None) -> MarketingEffort:
    kind = (data.get("kind") or "campaign").lower()
    if kind not in KINDS:
        kind = "campaign"
    status = (data.get("status") or "planned").lower()
    if status not in STATUSES:
        status = "planned"
    keywords = data.get("seo_keywords") or []
    if isinstance(keywords, str):
        keywords = [k.strip() for k in keywords.split(",") if k.strip()]
    row = MarketingEffort(
        state_code=(data.get("state_code") or "NY").upper()[:2],
        title=(data.get("title") or "Untitled effort").strip(),
        kind=kind,
        status=status,
        channel=data.get("channel"),
        description=data.get("description"),
        seo_keywords=keywords,
        target_url=data.get("target_url"),
        template_id=data.get("template_id"),
        send_method=data.get("send_method"),
        content_page_id=data.get("content_page_id"),
        communication_id=data.get("communication_id"),
        social_post_id=data.get("social_post_id"),
        metrics=data.get("metrics") or {},
        created_by=created_by,
    )
    for field, key in (("starts_at", "starts_at"), ("ends_at", "ends_at")):
        raw = data.get(key)
        if raw:
            try:
                setattr(
                    row,
                    field,
                    datetime.fromisoformat(str(raw).replace("Z", "+00:00")).replace(tzinfo=None),
                )
            except ValueError:
                pass
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def update_effort(db: Session, row: MarketingEffort, data: dict[str, Any]) -> MarketingEffort:
    if "title" in data and data["title"] is not None:
        row.title = str(data["title"]).strip()
    if "kind" in data and data["kind"]:
        k = str(data["kind"]).lower()
        if k in KINDS:
            row.kind = k
    if "status" in data and data["status"]:
        s = str(data["status"]).lower()
        if s in STATUSES:
            row.status = s
    for key in ("channel", "description", "target_url", "template_id", "send_method"):
        if key in data:
            setattr(row, key, data[key])
    if "seo_keywords" in data:
        kw = data["seo_keywords"]
        if isinstance(kw, str):
            kw = [k.strip() for k in kw.split(",") if k.strip()]
        row.seo_keywords = kw or []
    if "metrics" in data and isinstance(data["metrics"], dict):
        row.metrics = data["metrics"]
    for fk in ("content_page_id", "communication_id", "social_post_id"):
        if fk in data:
            setattr(row, fk, data[fk])
    if "state_code" in data and data["state_code"]:
        row.state_code = str(data["state_code"]).upper()[:2]
    for field in ("starts_at", "ends_at"):
        if field in data:
            raw = data[field]
            if not raw:
                setattr(row, field, None)
            else:
                try:
                    setattr(
                        row,
                        field,
                        datetime.fromisoformat(str(raw).replace("Z", "+00:00")).replace(tzinfo=None),
                    )
                except ValueError:
                    pass
    row.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(row)
    return row
