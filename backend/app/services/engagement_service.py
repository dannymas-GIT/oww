
"""Pipeline engagement tracking."""
from __future__ import annotations
from typing import Any, Optional
from sqlalchemy.orm import Session
from app.models.engagement_event import EngagementEvent

def track(
    db: Session,
    *,
    event_type: str,
    pipeline_stage: Optional[str] = None,
    actor_user_id: Optional[int] = None,
    org_id: Optional[int] = None,
    region: Optional[str] = None,
    career_stage: Optional[str] = None,
    state_code: str = "NY",
    source: Optional[str] = None,
    meta: Optional[dict[str, Any]] = None,
) -> EngagementEvent:
    payload = dict(meta or {})
    if org_id is not None:
        payload["org_id"] = org_id
    ev = EngagementEvent(
        actor_user_id=actor_user_id,
        event_type=event_type,
        stage=pipeline_stage,
        region=region,
        career_stage=career_stage,
        state_code=state_code.upper(),
        source=source,
        payload=payload,
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return ev
