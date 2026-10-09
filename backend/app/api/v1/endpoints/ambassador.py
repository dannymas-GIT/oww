"""Authenticated ambassador desk — outreach activity, toolkits, interest status."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.database import get_db
from app.models.engagement_event import EngagementEvent
from app.models.interest_submission import InterestSubmission
from app.models.resource_item import ResourceItem
from app.models.user import User

router = APIRouter(prefix="/ambassador", tags=["ambassador"])


@router.get("/desk")
def ambassador_desk(
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("ambassador", "platform_admin", "state_admin")),
):
    """Workspace payload for signed-in ambassadors (View as role + real accounts)."""
    email = (user.email or "").lower()
    interests = []
    if email:
        interests = [
            {
                "id": row.id,
                "pathway": row.pathway,
                "career_stage": row.career_stage,
                "region": row.region,
                "status": row.status,
                "interests": row.interests or [],
                "created_at": row.created_at.isoformat() if row.created_at else None,
            }
            for row in (
                db.query(InterestSubmission)
                .filter(InterestSubmission.email == email)
                .order_by(InterestSubmission.id.desc())
                .limit(10)
                .all()
            )
        ]

    outreach = [
        {
            "id": ev.id,
            "event_type": ev.event_type,
            "stage": ev.stage,
            "region": ev.region,
            "note": (ev.payload or {}).get("note") or ev.notes,
            "created_at": ev.created_at.isoformat() if ev.created_at else None,
        }
        for ev in (
            db.query(EngagementEvent)
            .filter(EngagementEvent.actor_user_id == user.id)
            .order_by(EngagementEvent.id.desc())
            .limit(20)
            .all()
        )
    ]

    toolkits = [
        {
            "id": r.id,
            "title": r.title,
            "url": r.url,
            "category": r.category,
            "pathway": r.pathway,
        }
        for r in (
            db.query(ResourceItem)
            .filter(
                ResourceItem.published.is_(True),
                ResourceItem.pathway == "ambassador",
            )
            .order_by(ResourceItem.id.desc())
            .limit(20)
            .all()
        )
    ]

    return {
        "full_name": user.full_name,
        "email": user.email,
        "state_code": user.state_code or "NY",
        "interest_count": len(interests),
        "outreach_count": len(outreach),
        "toolkit_count": len(toolkits),
        "interests": interests,
        "outreach": outreach,
        "toolkits": toolkits,
        "talking_points": [
            "Workforce development is a current operational necessity—not a future problem.",
            "Clean water capital projects only move as fast as the people who operate, maintain, review, and deliver them.",
            "OWW connects career awareness, training, and hiring so utilities can build sustainable pathways—not one-off postings.",
            "Ambassadors help schools, civic groups, and elected officials see water careers as skilled public-service work.",
        ],
    }
