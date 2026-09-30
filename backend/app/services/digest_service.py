
"""Scheduled match digests (email stubs)."""
from __future__ import annotations
import logging
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.individual_profile import IndividualProfile
from app.models.match import Match
from app.models.job import Job
from app.services.outbound_service import send_email

logger = logging.getLogger(__name__)

def send_candidate_digests(db: Session) -> int:
    sent = 0
    profiles = db.query(IndividualProfile).all()
    for profile in profiles:
        user = db.query(User).filter(User.id == profile.user_id).first()
        if not user or not user.email:
            continue
        matches = (
            db.query(Match)
            .filter(Match.individual_profile_id == profile.id, Match.score >= 0.4)
            .order_by(Match.score.desc())
            .limit(5)
            .all()
        )
        if not matches:
            continue
        lines = []
        for m in matches:
            job = db.query(Job).filter(Job.id == m.job_id).first()
            lines.append(f"- {job.title if job else m.job_id} ({m.match_type}, {m.score:.0%})")
        body = "New One Water Workforce matches:\n" + "\n".join(lines)
        send_email(user.email, "Your OWW job matches", body)
        sent += 1
    logger.info("candidate digests sent=%s", sent)
    return sent

def send_employer_digests(db: Session) -> int:
    # Simplified: one digest per org via first admin email matching org_id
    from app.models.organization import Organization
    sent = 0
    for org in db.query(Organization).filter(Organization.is_active.is_(True)).all():
        admin = db.query(User).filter(User.org_id == org.id).first()
        if not admin or not admin.email:
            continue
        matches = db.query(Match).filter(Match.org_id == org.id, Match.score >= 0.5).limit(10).all()
        if not matches:
            continue
        send_email(admin.email, f"Weekly OWW candidates for {org.name}", f"{len(matches)} strong matches this week.")
        sent += 1
    return sent
