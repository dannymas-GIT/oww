
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.api.deps import get_current_user, require_roles
from app.models.user import User
from app.models.individual_profile import IndividualProfile
from app.models.match import Match
from app.models.job import Job
from app.models.organization import Organization
from app.services.matching_service import refresh_matches_for_profile, refresh_all_matches

router = APIRouter(prefix="/matches", tags=["matches"])

@router.get("")
def list_matches(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    out = []
    if user.has_any_role("individual"):
        profile = db.query(IndividualProfile).filter(IndividualProfile.user_id == user.id).first()
        if not profile:
            return []
        rows = db.query(Match).filter(Match.individual_profile_id == profile.id).order_by(Match.score.desc()).limit(100).all()
        for m in rows:
            job = db.query(Job).filter(Job.id == m.job_id).first()
            org = db.query(Organization).filter(Organization.id == m.org_id).first()
            out.append({
                "id": m.id,
                "match_type": m.match_type,
                "score": m.score,
                "job_id": m.job_id,
                "job_title": job.title if job else None,
                "organization_name": org.name if org else None,
                "explanation": (m.explanation or {}).get("summary"),
            })
    elif user.has_any_role("employer", "employer_admin", "employer_member") and user.org_id:
        rows = db.query(Match).filter(Match.org_id == user.org_id).order_by(Match.score.desc()).limit(100).all()
        for m in rows:
            p = db.query(IndividualProfile).filter(IndividualProfile.id == m.individual_profile_id).first()
            job = db.query(Job).filter(Job.id == m.job_id).first()
            out.append({
                "id": m.id,
                "match_type": m.match_type,
                "score": m.score,
                "job_id": m.job_id,
                "job_title": job.title if job else None,
                "individual_id": p.user_id if p else None,
                "individual_name": p.display_name if p else None,
                "explanation": (m.explanation or {}).get("summary"),
            })
    return out

@router.post("/refresh")
def refresh(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.has_role("platform_admin"):
        n = refresh_all_matches(db)
        return {"ok": True, "refreshed": n}
    profile = db.query(IndividualProfile).filter(IndividualProfile.user_id == user.id).first()
    if profile:
        n = refresh_matches_for_profile(db, profile)
        return {"ok": True, "refreshed": n}
    return {"ok": True, "refreshed": 0}
