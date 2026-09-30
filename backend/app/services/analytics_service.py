
"""Admin analytics aggregates."""
from __future__ import annotations
from collections import Counter
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.user import User
from app.models.job import Job
from app.models.application import Application
from app.models.match import Match
from app.models.interest_submission import InterestSubmission
from app.models.engagement_event import EngagementEvent
from app.models.organization import Organization

def summary(db: Session, state_code: str | None = None) -> dict:
    def scoped(q, model):
        if state_code and hasattr(model, "state_code"):
            return q.filter(model.state_code == state_code.upper())
        return q

    individuals = scoped(db.query(User).filter(User.roles.contains(["individual"])), User).count()
    # fallback count by role containment for JSONB
    if individuals == 0:
        individuals = sum(1 for u in db.query(User).all() if "individual" in (u.roles or []))
    employers = db.query(Organization).count() if not state_code else db.query(Organization).filter(Organization.state_code == state_code.upper()).count()
    jobs = scoped(db.query(Job), Job).count()
    applications = db.query(Application).count()
    matches = scoped(db.query(Match), Match).count()
    interest = scoped(db.query(InterestSubmission), InterestSubmission).count()

    since = datetime.utcnow() - timedelta(days=30)
    by_day = (
        db.query(func.date(EngagementEvent.created_at), func.count())
        .filter(EngagementEvent.created_at >= since)
        .group_by(func.date(EngagementEvent.created_at))
        .all()
    )
    stages = (
        db.query(EngagementEvent.stage, func.count())
        .filter(EngagementEvent.stage.isnot(None))
        .group_by(EngagementEvent.stage)
        .all()
    )
    return {
        "individuals": individuals,
        "employers": employers,
        "jobs": jobs,
        "applications": applications,
        "matches": matches,
        "interest_submissions": interest,
        "engagement_by_day": [{"date": str(d), "count": c} for d, c in by_day],
        "funnel": [{"stage": s or "unknown", "count": c} for s, c in stages],
    }

def export_rows(db: Session) -> list[dict]:
    rows = []
    for ev in db.query(EngagementEvent).order_by(EngagementEvent.id.desc()).limit(5000).all():
        rows.append({
            "id": ev.id,
            "event_type": ev.event_type,
            "stage": ev.stage,
            "region": ev.region,
            "career_stage": ev.career_stage,
            "state_code": ev.state_code,
            "created_at": ev.created_at.isoformat() if ev.created_at else "",
        })
    return rows
