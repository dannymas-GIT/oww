
from __future__ import annotations

from datetime import datetime

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
from app.services import org_public_share_service as share_svc

router = APIRouter(prefix="/orgs", tags=["orgs"])

SHARE_PREF_ROLES = ("utility_admin", "employer_admin", "platform_admin")


class OrgIn(BaseModel):
    name: str | None = None
    description: str | None = None
    website: str | None = None
    city: str | None = None
    region: str | None = None
    answers: dict | None = None
    hiring_projections: dict | None = None
    public_share_prefs: dict | None = None


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


def _can_edit_share_prefs(user: User) -> bool:
    return user.has_any_role(*SHARE_PREF_ROLES)


@router.get("/me")
def get_my_org(db: Session = Depends(get_db), user: User = Depends(require_roles(*HIRING_ROLES, "platform_admin", "state_admin"))):
    from app.services.sample_data_service import sample_pack_active, sample_status_for_org

    org = _ensure_org(db, user)
    prefs = share_svc.normalize_prefs(org.public_share_prefs)
    return {
        "id": org.id,
        "name": org.name,
        "description": org.description,
        "website": org.website,
        "city": org.city,
        "region": org.region,
        "state_code": org.state_code,
        "answers": org.profile or {},
        "hiring_projections": org.hiring_projections or {},
        "public_share_prefs": prefs,
        "can_edit_public_share": _can_edit_share_prefs(user),
        "share_labels": share_svc.SHARE_LABELS,
        "latitude": org.latitude,
        "longitude": org.longitude,
        "sample_pack_active": sample_pack_active(org),
        "sample_status": sample_status_for_org(db, org.id),
    }


@router.put("/me")
def put_my_org(body: OrgIn, db: Session = Depends(get_db), user: User = Depends(require_roles(*HIRING_ROLES, "platform_admin"))):
    org = _ensure_org(db, user)
    for field in ("name", "description", "website", "city", "region"):
        val = getattr(body, field)
        if val is not None:
            setattr(org, field, val)
    if body.answers is not None:
        # Preserve sample-pack bookkeeping keys when the form posts a thin answers object.
        prev = dict(org.profile or {})
        merged = dict(body.answers)
        for key in ("sample_pack_active", "sample_pack"):
            if key in prev and key not in merged:
                merged[key] = prev[key]
        org.profile = merged
    if body.hiring_projections is not None:
        org.hiring_projections = body.hiring_projections
    if body.public_share_prefs is not None:
        if not _can_edit_share_prefs(user):
            raise HTTPException(
                403,
                "Only utility admins, employer admins, or platform admins can change public data sharing.",
            )
        org.public_share_prefs = share_svc.normalize_prefs(body.public_share_prefs)
        org.public_share_updated_at = datetime.utcnow()
        org.public_share_updated_by = user.id
    db.commit()
    db.refresh(org)
    return {
        "id": org.id,
        "name": org.name,
        "answers": org.profile or {},
        "public_share_prefs": share_svc.normalize_prefs(org.public_share_prefs),
    }


@router.get("/sample-status")
def get_sample_status(db: Session = Depends(get_db), user: User = Depends(require_roles(*HIRING_ROLES, "platform_admin"))):
    from app.services.sample_data_service import sample_status_for_org

    org = _ensure_org(db, user)
    return sample_status_for_org(db, org.id)


@router.post("/sample-pack/clear")
def clear_sample_pack(db: Session = Depends(get_db), user: User = Depends(require_roles(*HIRING_ROLES, "platform_admin"))):
    from app.services.sample_data_service import clear_utility_sample_pack

    org = _ensure_org(db, user)
    return clear_utility_sample_pack(db, org.id)


@router.post("/sample-pack/ensure")
def ensure_sample_pack(db: Session = Depends(get_db), user: User = Depends(require_roles(*HIRING_ROLES, "platform_admin"))):
    from app.services.sample_data_service import ensure_utility_sample_pack

    org = _ensure_org(db, user)
    return ensure_utility_sample_pack(db, org.id, actor_user_id=user.id)


@router.get("/candidates")
def search_candidates(q: str | None = None, career_area: str | None = None, db: Session = Depends(get_db), user: User = Depends(require_roles(*HIRING_ROLES, "platform_admin", "state_admin")), _paid: User = Depends(require_membership("employer", "utility"))):
    from app.services.sample_data_service import filter_sample_section

    org = _ensure_org(db, user)
    matches = db.query(Match).filter(Match.org_id == org.id).order_by(Match.score.desc()).limit(100).all()
    matches, showing_sample = filter_sample_section(matches, is_sample_fn=lambda m: bool(m.is_sample))
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
            "is_sample": bool(m.is_sample),
            "showing_sample": showing_sample,
        })
    return out
