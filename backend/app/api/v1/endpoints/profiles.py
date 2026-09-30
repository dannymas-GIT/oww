
from __future__ import annotations
from pydantic import BaseModel
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.individual_profile import IndividualProfile
from app.services.matching_service import refresh_matches_for_profile
from app.services.engagement_service import track

router = APIRouter(prefix="/profiles", tags=["profiles"])

class ProfileIn(BaseModel):
    answers: dict
    display_name: str | None = None
    resume_bank_opt_in: bool | None = None
    career_stage: str | None = None
    region: str | None = None

def _ser(p: IndividualProfile) -> dict:
    return {
        "id": p.id,
        "user_id": p.user_id,
        "display_name": p.display_name,
        "answers": p.answers or {},
        "completion_pct": p.profile_completeness,
        "resume_bank_opt_in": p.resume_bank_opt_in,
        "career_stage": p.career_stage,
        "region": p.region,
        "updated_at": p.updated_at.isoformat() if p.updated_at else None,
    }

def _completeness(answers: dict) -> int:
    keys = ["career_area", "opportunity_type", "timing", "skills", "location", "schedule", "education"]
    filled = sum(1 for k in keys if answers.get(k))
    return int(100 * filled / len(keys))

@router.get("/me")
def get_me(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    p = db.query(IndividualProfile).filter(IndividualProfile.user_id == user.id).first()
    if not p:
        p = IndividualProfile(user_id=user.id, state_code=user.state_code or "NY", answers={}, display_name=user.full_name)
        db.add(p)
        db.commit()
        db.refresh(p)
    return _ser(p)

@router.put("/me")
def put_me(body: ProfileIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    p = db.query(IndividualProfile).filter(IndividualProfile.user_id == user.id).first()
    if not p:
        p = IndividualProfile(user_id=user.id, state_code=user.state_code or "NY", answers={})
        db.add(p)
    p.answers = body.answers or {}
    if body.display_name is not None:
        p.display_name = body.display_name
    if body.resume_bank_opt_in is not None:
        p.resume_bank_opt_in = body.resume_bank_opt_in
    if body.career_stage is not None:
        p.career_stage = body.career_stage
    if body.region is not None:
        p.region = body.region
    p.profile_completeness = _completeness(p.answers)
    db.commit()
    db.refresh(p)
    refresh_matches_for_profile(db, p)
    track(db, event_type="profile_update", pipeline_stage="engagement", actor_user_id=user.id, state_code=p.state_code)
    return _ser(p)
