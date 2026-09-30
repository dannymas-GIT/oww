
from __future__ import annotations
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.api.deps import get_current_user, require_roles
from app.models.user import User
from app.models.organization import Organization
from app.models.individual_profile import IndividualProfile
from app.models.match import Match
from app.services.membership_service import require_membership
from app.services.role_catalog_service import HIRING_ROLES

router = APIRouter(prefix="/orgs", tags=["orgs"])

class OrgIn(BaseModel):
    name: str | None = None
    description: str | None = None
    website: str | None = None
    city: str | None = None
    region: str | None = None
    answers: dict | None = None
    hiring_projections: dict | None = None

def _ensure_org(db: Session, user: User) -> Organization:
    if user.org_id:
        org = db.query(Organization).filter(Organization.id == user.org_id).first()
        if org:
            return org
    org = Organization(name=f"{user.full_name or user.username} Organization", state_code=user.state_code or "NY", profile={})
    db.add(org)
    db.commit()
    db.refresh(org)
    user.org_id = org.id
    if not user.has_any_role("employer", "employer_admin", "employer_member"):
        roles = list(user.roles or [])
        roles.append("employer")
        user.roles = roles
    db.commit()
    return org

@router.get("/me")
def get_my_org(db: Session = Depends(get_db), user: User = Depends(require_roles(*HIRING_ROLES, "platform_admin", "state_admin"))):
    org = _ensure_org(db, user)
    return {
        "id": org.id,
        "name": org.name,
        "description": org.description,
        "website": org.website,
        "city": org.city,
        "state_code": org.state_code,
        "answers": org.profile or {},
        "hiring_projections": org.hiring_projections or {},
        "latitude": org.latitude,
        "longitude": org.longitude,
    }

@router.put("/me")
def put_my_org(body: OrgIn, db: Session = Depends(get_db), user: User = Depends(require_roles(*HIRING_ROLES, "platform_admin"))):
    org = _ensure_org(db, user)
    for field in ("name", "description", "website", "city", "region"):
        val = getattr(body, field)
        if val is not None:
            setattr(org, field, val)
    if body.answers is not None:
        org.profile = body.answers
    if body.hiring_projections is not None:
        org.hiring_projections = body.hiring_projections
    db.commit()
    db.refresh(org)
    return {"id": org.id, "name": org.name, "answers": org.profile or {}}

@router.get("/candidates")
def search_candidates(q: str | None = None, career_area: str | None = None, db: Session = Depends(get_db), user: User = Depends(require_roles(*HIRING_ROLES, "platform_admin", "state_admin")), _paid: User = Depends(require_membership("employer", "utility"))):
    org = _ensure_org(db, user)
    matches = db.query(Match).filter(Match.org_id == org.id).order_by(Match.score.desc()).limit(100).all()
    out = []
    for m in matches:
        p = db.query(IndividualProfile).filter(IndividualProfile.id == m.individual_profile_id).first()
        if not p:
            continue
        if q and q.lower() not in (p.display_name or "").lower():
            continue
        answers = p.answers or {}
        areas = answers.get("career_area") or []
        if career_area and career_area not in areas and career_area != p.career_stage:
            continue
        out.append({
            "id": p.user_id,
            "display_name": p.display_name or f"Candidate {p.id}",
            "career_area": (areas[0] if isinstance(areas, list) and areas else None),
            "match_score": m.score,
            "match_type": m.match_type,
        })
    return out
