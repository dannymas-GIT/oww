
"""Public microsite endpoints."""
from __future__ import annotations
from pydantic import BaseModel, EmailStr
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.job import Job
from app.models.organization import Organization
from app.models.testimonial import Testimonial
from app.models.microvideo import Microvideo
from app.models.resource_item import ResourceItem
from app.models.interest_submission import InterestSubmission
from app.models.program_submission import ProgramSubmission
from app.models.content_page import ContentPage
from app.models.media_asset import MediaAsset
from app.services.engagement_service import track
from app.services import cms_service, media_service
from app.services import home_hero_slide_service as hero_slides
from app.core.scoping import coerce_state

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

def _org_ser(o: Organization, db: Session | None = None, *, include_public_stats: bool = False) -> dict:
    data = {
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
    if include_public_stats and db is not None:
        from app.services import org_public_share_service as share_svc

        payload = share_svc.compute_share_payload(db, o)
        if payload:
            data["public_stats"] = payload
    return data

@router.post("/interest")
def submit_interest(body: InterestIn, db: Session = Depends(get_db)):
    row = InterestSubmission(
        state_code=coerce_state(body.state_code),
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
        state_code=coerce_state(body.state_code),
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
    return _org_ser(o, db, include_public_stats=True)


@router.get("/workforce-stats/{state_code}")
def workforce_stats(state_code: str, db: Session = Depends(get_db)):
    """Statewide rollup of utilities that opted in to share workforce aggregates."""
    from app.services import org_public_share_service as share_svc

    return share_svc.statewide_workforce_stats(db, state_code=state_code)

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


@router.get("/pages/{state_code}/{slug}")
def get_published_page(state_code: str, slug: str, db: Session = Depends(get_db)):
    """Published CMS landing page for the public microsite."""
    state = (state_code or "ny").upper()[:2]
    page_slug = (slug or "home").strip().lower()
    if page_slug == "home":
        cms_service.ensure_default_home_page(db, state_code=state)
    page = (
        db.query(ContentPage)
        .filter(
            ContentPage.state_code == state,
            ContentPage.slug == page_slug,
            ContentPage.is_published.is_(True),
        )
        .first()
    )
    if not page:
        raise HTTPException(404, "Page not found")
    return cms_service.page_to_dict(page, include_draft=True)


@router.get("/blog/{state_code}")
def list_blog_posts(
    state_code: str,
    tag: str | None = None,
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    """Published blog posts for ongoing topics / updates."""
    pages, total = cms_service.list_published_blog_posts(
        db,
        state_code=state_code,
        tag=tag,
        limit=limit,
        offset=offset,
    )
    return {
        "total": total,
        "items": [cms_service.blog_card_dict(p) for p in pages],
        "state_code": (state_code or "ny").upper()[:2],
        "tag": tag,
    }


@router.get("/blog/{state_code}/{slug}")
def get_blog_post(state_code: str, slug: str, db: Session = Depends(get_db)):
    state = (state_code or "ny").upper()[:2]
    page = (
        db.query(ContentPage)
        .filter(
            ContentPage.state_code == state,
            ContentPage.slug == (slug or "").strip().lower(),
            ContentPage.template == cms_service.BLOG_TEMPLATE,
            ContentPage.is_published.is_(True),
        )
        .first()
    )
    if not page:
        raise HTTPException(404, "Post not found")
    return cms_service.page_to_dict(page, include_draft=True)


@router.get("/media/{filename}")
def get_media_file(filename: str, db: Session = Depends(get_db)):
    path = media_service.resolve_stored_file(filename)
    asset = db.query(MediaAsset).filter(MediaAsset.filename == path.name).first()
    media_type = asset.content_type if asset else "application/octet-stream"
    return FileResponse(path, media_type=media_type, filename=asset.original_name if asset else path.name)


@router.get("/home-slides/{state_code}")
def list_home_slides(
    state_code: str,
    scope: str = "home",
    db: Session = Depends(get_db),
):
    """Active hero rotator slides for home or a pathway scope."""
    try:
        slides = hero_slides.list_public_slides(db, state_code=state_code, scope=scope)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    return {"slides": slides}
