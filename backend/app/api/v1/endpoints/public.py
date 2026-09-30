
"""Public microsite endpoints."""
from __future__ import annotations
from pydantic import BaseModel, EmailStr
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.job import Job
from app.models.organization import Organization
from app.models.testimonial import Testimonial
from app.models.microvideo import Microvideo
from app.models.resource_item import ResourceItem
from app.models.interest_submission import InterestSubmission
from app.models.program_submission import ProgramSubmission
from app.services.engagement_service import track

router = APIRouter(prefix="/public", tags=["public"])

class InterestIn(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str | None = None
    organization: str | None = None
    pathway: str
    county: str | None = None
    state_code: str | None = "NY"
    message: str | None = None
    hear_about: str | None = None
    consent_contact: bool = False
    career_stage: str | None = None
    interests: list[str] | None = None

class ProgramIn(BaseModel):
    organization_name: str
    contact_name: str
    email: EmailStr
    phone: str | None = None
    program_title: str
    program_type: str
    description: str
    state_code: str | None = "NY"
    website: str | None = None

def _job_ser(j: Job, org: Organization | None = None) -> dict:
    return {
        "id": j.id,
        "title": j.title,
        "organization_id": j.org_id,
        "organization_name": org.name if org else None,
        "location": ", ".join([x for x in [j.city, j.region, j.state_code] if x]),
        "city": j.city,
        "state_code": j.state_code,
        "opportunity_type": j.opportunity_type,
        "career_area": j.primary_career_area,
        "description": j.description,
        "is_featured": j.is_featured,
        "status": j.status,
        "latitude": j.latitude,
        "longitude": j.longitude,
        "created_at": j.created_at.isoformat() if j.created_at else None,
        "posted_at": j.published_at.isoformat() if j.published_at else None,
    }

def _org_ser(o: Organization) -> dict:
    return {
        "id": o.id,
        "name": o.name,
        "org_type": (o.org_type or [None])[0] if isinstance(o.org_type, list) else o.org_type,
        "city": o.city,
        "state_code": o.state_code,
        "website": o.website,
        "description": o.description,
        "latitude": o.latitude,
        "longitude": o.longitude,
        "logo_url": o.logo_url,
        "region": o.region,
        "hiring_projections": o.hiring_projections,
    }

@router.post("/interest")
def submit_interest(body: InterestIn, db: Session = Depends(get_db)):
    row = InterestSubmission(
        state_code=(body.state_code or "NY").upper(),
        full_name=f"{body.first_name} {body.last_name}".strip(),
        email=body.email.lower(),
        phone=body.phone,
        pathway=body.pathway,
        career_stage=body.career_stage,
        region=body.county,
        interests=body.interests or [],
        permissions={"consent_contact": body.consent_contact},
        source=body.hear_about,
        notes=body.message,
    )
    db.add(row)
    db.commit()
    track(db, event_type="interest_form", pipeline_stage="interest", state_code=row.state_code, career_stage=body.career_stage, region=body.county, source="public")
    return {"ok": True, "id": row.id}

@router.post("/programs")
def submit_program(body: ProgramIn, db: Session = Depends(get_db)):
    row = ProgramSubmission(
        program_name=body.program_title,
        organization_name=body.organization_name,
        contact_name=body.contact_name,
        contact_email=body.email.lower(),
        contact_phone=body.phone,
        program_type=body.program_type,
        description=body.description,
        tags=[body.program_type],
        state_code=(body.state_code or "NY").upper(),
        status="pending",
        payload={"website": body.website},
    )
    db.add(row)
    db.commit()
    track(db, event_type="program_submit", pipeline_stage="engagement", state_code=row.state_code, source="public")
    return {"ok": True, "id": row.id}

@router.get("/jobs")
def list_jobs(state: str | None = None, q: str | None = None, db: Session = Depends(get_db)):
    query = db.query(Job).filter(Job.status.in_(["open", "active"]))
    if state:
        query = query.filter(Job.state_code == state.upper())
    if q:
        like = f"%{q}%"
        query = query.filter(Job.title.ilike(like))
    jobs = query.order_by(Job.is_featured.desc(), Job.id.desc()).limit(200).all()
    orgs = {o.id: o for o in db.query(Organization).all()}
    return [_job_ser(j, orgs.get(j.org_id)) for j in jobs]

@router.get("/jobs/{job_id}")
def get_job(job_id: int, db: Session = Depends(get_db)):
    j = db.query(Job).filter(Job.id == job_id).first()
    if not j:
        raise HTTPException(404, "Job not found")
    j.views = (j.views or 0) + 1
    db.commit()
    org = db.query(Organization).filter(Organization.id == j.org_id).first()
    return _job_ser(j, org)

@router.get("/companies")
def list_companies(state: str | None = None, q: str | None = None, db: Session = Depends(get_db)):
    query = db.query(Organization).filter(Organization.is_active.is_(True))
    if state:
        query = query.filter(Organization.state_code == state.upper())
    if q:
        query = query.filter(Organization.name.ilike(f"%{q}%"))
    return [_org_ser(o) for o in query.order_by(Organization.name).limit(200).all()]

@router.get("/companies/{org_id}")
def get_company(org_id: int, db: Session = Depends(get_db)):
    o = db.query(Organization).filter(Organization.id == org_id).first()
    if not o:
        raise HTTPException(404, "Not found")
    return _org_ser(o)

@router.get("/testimonials")
def testimonials(state: str | None = None, db: Session = Depends(get_db)):
    q = db.query(Testimonial).filter(Testimonial.published.is_(True))
    if state:
        q = q.filter(Testimonial.state_code == state.upper())
    return [
        {"id": t.id, "quote": t.quote, "author_name": t.author_name, "author_role": t.author_title, "organization": None}
        for t in q.order_by(Testimonial.sort_order).all()
    ]

@router.get("/microvideos")
def microvideos(state: str | None = None, db: Session = Depends(get_db)):
    q = db.query(Microvideo).filter(Microvideo.published.is_(True))
    if state:
        q = q.filter(Microvideo.state_code == state.upper())
    out = []
    for m in q.order_by(Microvideo.sort_order).all():
        yt = m.youtube_url or ""
        yt_id = yt.split("v=")[-1][:11] if "v=" in yt else yt.rstrip("/").split("/")[-1][:11]
        out.append({"id": m.id, "title": m.title, "youtube_id": yt_id, "url": m.youtube_url})
    return out

@router.get("/resources")
def resources(state: str | None = None, category: str | None = None, db: Session = Depends(get_db)):
    q = db.query(ResourceItem).filter(ResourceItem.published.is_(True))
    if state:
        q = q.filter(ResourceItem.state_code == state.upper())
    if category:
        q = q.filter(ResourceItem.category == category)
    return [{"id": r.id, "title": r.title, "url": r.url, "category": r.category, "pathway": r.pathway} for r in q.all()]
