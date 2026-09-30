
from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.api.deps import get_current_user, require_roles
from app.models.user import User
from app.models.job import Job
from app.models.job_template import JobTemplate
from app.models.application import Application
from app.models.individual_profile import IndividualProfile
from app.models.organization import Organization
from app.services.matching_service import refresh_matches_for_job
from app.services.engagement_service import track
from app.services.outbound_service import send_email
from app.services.membership_service import require_membership
from app.services.role_catalog_service import HIRING_ROLES, ORG_ADMIN_ROLES

router = APIRouter(prefix="/jobs", tags=["jobs"])

POSTERS = (*ORG_ADMIN_ROLES, "utility_manager", "platform_admin")

class JobIn(BaseModel):
    title: str | None = None
    description: str | None = None
    opportunity_type: str | None = None
    career_area: str | None = None
    city: str | None = None
    region: str | None = None
    state_code: str | None = None
    criteria: dict | None = None
    status: str | None = None
    latitude: float | None = None
    longitude: float | None = None

class FeatureIn(BaseModel):
    featured: bool = True

class ApplyIn(BaseModel):
    cover_note: str | None = None

def _org_for(db, user):
    if not user.org_id:
        raise HTTPException(400, "No organization on account")
    return user.org_id

@router.get("")
def list_my_jobs(db: Session = Depends(get_db), user: User = Depends(require_roles(*HIRING_ROLES, "platform_admin"))):
    org_id = _org_for(db, user)
    jobs = db.query(Job).filter(Job.org_id == org_id).order_by(Job.id.desc()).all()
    return [{"id": j.id, "title": j.title, "status": j.status, "is_featured": j.is_featured, "city": j.city, "state_code": j.state_code, "opportunity_type": j.opportunity_type, "career_area": j.primary_career_area, "description": j.description} for j in jobs]

@router.post("")
def create_job(body: JobIn, db: Session = Depends(get_db), user: User = Depends(require_roles(*POSTERS)), _paid: User = Depends(require_membership("employer", "utility"))):
    org_id = _org_for(db, user)
    j = Job(
        org_id=org_id,
        title=body.title or "Untitled role",
        description=body.description,
        opportunity_type=body.opportunity_type,
        primary_career_area=body.career_area,
        career_areas=[body.career_area] if body.career_area else [],
        city=body.city,
        region=body.region,
        state_code=(body.state_code or user.state_code or "NY").upper(),
        criteria=body.criteria or {},
        status=body.status or "open",
        latitude=body.latitude,
        longitude=body.longitude,
        published_at=datetime.utcnow(),
        created_by=user.id,
    )
    db.add(j)
    db.commit()
    db.refresh(j)
    refresh_matches_for_job(db, j)
    track(db, event_type="job_posted", pipeline_stage="engagement", actor_user_id=user.id, org_id=org_id, state_code=j.state_code)
    return {"id": j.id, "title": j.title, "status": j.status}

@router.patch("/{job_id}")
def update_job(job_id: int, body: JobIn, db: Session = Depends(get_db), user: User = Depends(require_roles(*POSTERS))):
    j = db.query(Job).filter(Job.id == job_id, Job.org_id == user.org_id).first()
    if not j and not user.has_role("platform_admin"):
        raise HTTPException(404, "Not found")
    if not j:
        j = db.query(Job).filter(Job.id == job_id).first()
    for field, attr in [("title", "title"), ("description", "description"), ("opportunity_type", "opportunity_type"), ("city", "city"), ("region", "region"), ("status", "status")]:
        val = getattr(body, field)
        if val is not None:
            setattr(j, attr, val)
    if body.career_area is not None:
        j.primary_career_area = body.career_area
    if body.criteria is not None:
        j.criteria = body.criteria
    db.commit()
    refresh_matches_for_job(db, j)
    return {"id": j.id, "title": j.title, "status": j.status}

@router.post("/{job_id}/duplicate")
def duplicate(job_id: int, db: Session = Depends(get_db), user: User = Depends(require_roles(*POSTERS)), _paid: User = Depends(require_membership("employer", "utility"))):
    src = db.query(Job).filter(Job.id == job_id).first()
    if not src:
        raise HTTPException(404)
    j = Job(
        org_id=user.org_id or src.org_id,
        title=f"{src.title} (copy)",
        description=src.description,
        opportunity_type=src.opportunity_type,
        primary_career_area=src.primary_career_area,
        career_areas=src.career_areas or [],
        city=src.city,
        region=src.region,
        state_code=src.state_code,
        criteria=src.criteria or {},
        status="draft",
        created_by=user.id,
    )
    db.add(j)
    db.commit()
    db.refresh(j)
    return {"id": j.id, "title": j.title, "status": j.status}

@router.post("/{job_id}/feature")
def feature(job_id: int, body: FeatureIn, db: Session = Depends(get_db), user: User = Depends(require_roles(*POSTERS)), _paid: User = Depends(require_membership("employer", "utility"))):
    j = db.query(Job).filter(Job.id == job_id).first()
    if not j:
        raise HTTPException(404)
    j.is_featured = body.featured
    db.commit()
    return {"id": j.id, "title": j.title, "is_featured": j.is_featured, "status": j.status}

@router.get("/templates")
def templates(db: Session = Depends(get_db), user: User = Depends(require_roles(*POSTERS))):
    rows = db.query(JobTemplate).filter((JobTemplate.org_id == user.org_id) | (JobTemplate.org_id.is_(None))).all()
    return [{"id": t.id, "title": t.title or t.name, "description": t.description, "status": "template"} for t in rows]

@router.get("/applications")
def list_apps(job_id: int | None = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    q = db.query(Application)
    if user.has_any_role("employer", "employer_admin", "employer_member") and user.org_id:
        q = q.filter(Application.org_id == user.org_id)
    elif user.has_role("individual"):
        q = q.filter(Application.user_id == user.id)
    if job_id:
        q = q.filter(Application.job_id == job_id)
    out = []
    for a in q.order_by(Application.id.desc()).limit(200).all():
        job = db.query(Job).filter(Job.id == a.job_id).first()
        profile = db.query(IndividualProfile).filter(IndividualProfile.id == a.individual_profile_id).first()
        out.append({
            "id": a.id,
            "job_id": a.job_id,
            "job_title": job.title if job else None,
            "individual_name": profile.display_name if profile else None,
            "status": a.status,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        })
    return out

@router.post("/{job_id}/applications")
def apply(job_id: int, body: ApplyIn, db: Session = Depends(get_db), user: User = Depends(require_roles("individual", "platform_admin"))):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(404)
    profile = db.query(IndividualProfile).filter(IndividualProfile.user_id == user.id).first()
    if not profile:
        profile = IndividualProfile(user_id=user.id, state_code=user.state_code or "NY", answers={}, display_name=user.full_name)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    app = Application(
        job_id=job.id,
        individual_profile_id=profile.id,
        user_id=user.id,
        org_id=job.org_id,
        status="submitted",
        cover_note=body.cover_note,
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    track(db, event_type="application", pipeline_stage="interview", actor_user_id=user.id, org_id=job.org_id, state_code=job.state_code)
    return {"id": app.id, "job_id": job.id, "status": app.status}
