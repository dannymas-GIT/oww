
from __future__ import annotations
import csv
import io
from datetime import datetime
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.api.deps import require_roles
from app.models.user import User
from app.models.jurisdiction import Jurisdiction
from app.models.content_page import ContentPage
from app.models.program_submission import ProgramSubmission
from app.models.featured_post import FeaturedPost
from app.models.certification_catalog import CertificationCatalog
from app.models.location import Location
from app.models.individual_profile import IndividualProfile
from app.models.job import Job
from app.models.organization import Organization
from app.core.security import get_password_hash
from app.services.analytics_service import summary, export_rows
from app.services.outbound_service import post_webhook
from app.services.auth_service import user_to_dict
from app.services import featured_post_service

router = APIRouter(prefix="/admin", tags=["admin"])

class UserPatch(BaseModel):
    full_name: str | None = None
    roles: list[str] | None = None
    is_active: bool | None = None
    email: str | None = None

class PasswordReset(BaseModel):
    new_password: str

class JurisdictionIn(BaseModel):
    code: str
    name: str
    is_active: bool = True
    partner_name: str | None = None
    tagline: str | None = None

class CmsIn(BaseModel):
    id: int | None = None
    slug: str | None = None
    title: str | None = None
    body: str | None = None
    state_code: str | None = None
    published: bool | None = None
    pathway: str | None = None

class FeaturedIn(BaseModel):
    id: int | None = None
    title: str | None = None
    body: str | None = None
    url: str | None = None
    is_active: bool | None = None
    job_id: int | None = None
    channel: str | None = "linkedin"

class CertIn(BaseModel):
    id: int | None = None
    name: str | None = None
    issuer: str | None = None
    category: str | None = None
    state_code: str | None = None
    level: str | None = None

class LocIn(BaseModel):
    id: int | None = None
    name: str | None = None
    location_type: str | None = None
    city: str | None = None
    state_code: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    region: str | None = None
    zip_code: str | None = None

@router.get("/users")
def list_users(q: str | None = None, db: Session = Depends(get_db), user: User = Depends(require_roles("platform_admin", "state_admin"))):
    rows = db.query(User).order_by(User.id).all()
    out = [user_to_dict(u) for u in rows]
    if q:
        ql = q.lower()
        out = [u for u in out if ql in (u.get("username") or "").lower() or ql in (u.get("email") or "").lower() or ql in (u.get("full_name") or "").lower()]
    return out

@router.patch("/users/{user_id}")
def patch_user(user_id: int, body: UserPatch, db: Session = Depends(get_db), admin: User = Depends(require_roles("platform_admin", "state_admin"))):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(404)
    if body.full_name is not None:
        u.full_name = body.full_name
    if body.roles is not None:
        from app.services.role_catalog_service import PROTECTED_ROLES, validate_assignment
        current_protected = set(u.roles or []) & PROTECTED_ROLES
        rejected = validate_assignment(admin.roles or [], set(body.roles) - current_protected)
        if rejected:
            raise HTTPException(403, f"You cannot assign: {', '.join(rejected)}")
        if current_protected and not admin.has_role("platform_admin") and not current_protected.issubset(set(body.roles)):
            raise HTTPException(403, "Cannot remove protected roles")
        u.roles = sorted(set(body.roles))
    if body.is_active is not None:
        u.is_active = body.is_active
    if body.email is not None:
        u.email = body.email.lower()
    db.commit()
    return user_to_dict(u)

@router.post("/users/{user_id}/reset-password")
def reset_password(user_id: int, body: PasswordReset, db: Session = Depends(get_db), admin: User = Depends(require_roles("platform_admin", "state_admin"))):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(404)
    u.hashed_password = get_password_hash(body.new_password)
    db.commit()
    return {"ok": True}

@router.get("/jurisdictions")
def admin_jurisdictions(db: Session = Depends(get_db), user: User = Depends(require_roles("platform_admin", "state_admin"))):
    return [{"id": j.id, "code": j.state_code.lower(), "name": j.name, "is_active": j.is_active} for j in db.query(Jurisdiction).all()]

@router.post("/jurisdictions")
def upsert_jurisdiction(body: JurisdictionIn, db: Session = Depends(get_db), user: User = Depends(require_roles("platform_admin"))):
    code = body.code.upper()
    j = db.query(Jurisdiction).filter(Jurisdiction.state_code == code).first()
    if not j:
        j = Jurisdiction(state_code=code, name=body.name)
        db.add(j)
    j.name = body.name
    j.is_active = body.is_active
    j.partner_name = body.partner_name
    j.tagline = body.tagline
    db.commit()
    db.refresh(j)
    return {"id": j.id, "code": j.state_code.lower(), "name": j.name, "is_active": j.is_active}

@router.get("/cms")
def list_cms(db: Session = Depends(get_db), user: User = Depends(require_roles("platform_admin", "state_admin"))):
    return [{"id": p.id, "slug": p.slug, "title": p.title, "body": p.body_html or "", "state_code": p.state_code, "published": p.is_published} for p in db.query(ContentPage).all()]

@router.post("/cms")
def create_cms(body: CmsIn, db: Session = Depends(get_db), user: User = Depends(require_roles("platform_admin", "state_admin"))):
    p = ContentPage(slug=body.slug or "page", title=body.title or "Untitled", body_html=body.body or "", state_code=(body.state_code or "NY").upper(), is_published=bool(body.published), pathway=body.pathway, created_by=user.id)
    db.add(p)
    db.commit()
    db.refresh(p)
    return {"id": p.id, "slug": p.slug, "title": p.title, "body": p.body_html or "", "published": p.is_published}

@router.patch("/cms/{page_id}")
def patch_cms(page_id: int, body: CmsIn, db: Session = Depends(get_db), user: User = Depends(require_roles("platform_admin", "state_admin"))):
    p = db.query(ContentPage).filter(ContentPage.id == page_id).first()
    if not p:
        raise HTTPException(404)
    if body.slug is not None: p.slug = body.slug
    if body.title is not None: p.title = body.title
    if body.body is not None: p.body_html = body.body
    if body.published is not None: p.is_published = body.published
    if body.pathway is not None: p.pathway = body.pathway
    db.commit()
    return {"id": p.id, "slug": p.slug, "title": p.title, "body": p.body_html or "", "published": p.is_published}

@router.get("/programs")
def list_programs(db: Session = Depends(get_db), user: User = Depends(require_roles("platform_admin", "state_admin"))):
    return [
        {"id": p.id, "program_name": p.program_name, "organization_name": p.organization_name, "status": p.status, "program_type": p.program_type, "contact_email": p.contact_email, "state_code": p.state_code}
        for p in db.query(ProgramSubmission).order_by(ProgramSubmission.id.desc()).all()
    ]

@router.get("/featured")
def list_featured(db: Session = Depends(get_db), user: User = Depends(require_roles("platform_admin", "state_admin"))):
    out = []
    for f in db.query(FeaturedPost).order_by(FeaturedPost.id.desc()).all():
        out.append({
            "id": f.id,
            "title": f"Job {f.job_id}" if f.job_id else f"Event {f.event_id}",
            "body": f.channel,
            "url": None,
            "is_active": f.status in ("queued", "posted"),
            "starts_at": f.posted_at.isoformat() if f.posted_at else None,
            "ends_at": f.expires_at.isoformat() if f.expires_at else None,
        })
    return out

@router.post("/featured")
def create_featured(body: FeaturedIn, db: Session = Depends(get_db), user: User = Depends(require_roles("platform_admin", "state_admin"))):
    post = featured_post_service.queue_post(db, job_id=body.job_id, channel=body.channel or "linkedin")
    return {"id": post.id, "title": f"Job {post.job_id}", "is_active": True}

@router.patch("/featured/{post_id}")
def patch_featured(post_id: int, body: FeaturedIn, db: Session = Depends(get_db), user: User = Depends(require_roles("platform_admin", "state_admin"))):
    if body.is_active:
        post = featured_post_service.mark_posted(db, post_id)
    else:
        post = db.query(FeaturedPost).filter(FeaturedPost.id == post_id).first()
        if not post:
            raise HTTPException(404)
        post.status = "expired"
        db.commit()
    return {"id": post.id, "title": f"Job {post.job_id}", "is_active": post.status == "posted"}

@router.get("/analytics")
def analytics(db: Session = Depends(get_db), user: User = Depends(require_roles("platform_admin", "state_admin"))):
    state = None if user.has_role("platform_admin") else user.state_code
    return summary(db, state)

@router.get("/analytics/export.csv")
def analytics_csv(db: Session = Depends(get_db), user: User = Depends(require_roles("platform_admin", "state_admin"))):
    rows = export_rows(db)
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=["id", "event_type", "stage", "region", "career_stage", "state_code", "created_at"])
    writer.writeheader()
    writer.writerows(rows)
    buf.seek(0)
    return StreamingResponse(iter([buf.getvalue()]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=oww-analytics.csv"})

@router.post("/crm/export")
def crm_export(db: Session = Depends(get_db), user: User = Depends(require_roles("platform_admin", "state_admin"))):
    contacts = [{"email": u.email, "name": u.full_name, "roles": u.roles} for u in db.query(User).filter(User.email.isnot(None)).all()]
    post_webhook({"type": "oww_contacts", "contacts": contacts, "exported_at": datetime.utcnow().isoformat()})
    return {"ok": True, "count": len(contacts)}

@router.get("/certifications")
def list_certs(db: Session = Depends(get_db), user: User = Depends(require_roles("platform_admin", "state_admin"))):
    return [{"id": c.id, "name": c.name, "issuer": c.issuer, "category": c.level, "state_code": c.state_code} for c in db.query(CertificationCatalog).all()]

@router.post("/certifications")
def create_cert(body: CertIn, db: Session = Depends(get_db), user: User = Depends(require_roles("platform_admin", "state_admin"))):
    c = CertificationCatalog(name=body.name or "Certification", issuer=body.issuer, level=body.level or body.category, state_code=(body.state_code or "NY").upper())
    db.add(c)
    db.commit()
    db.refresh(c)
    return {"id": c.id, "name": c.name, "issuer": c.issuer, "category": c.level, "state_code": c.state_code}

@router.patch("/certifications/{cid}")
def patch_cert(cid: int, body: CertIn, db: Session = Depends(get_db), user: User = Depends(require_roles("platform_admin", "state_admin"))):
    c = db.query(CertificationCatalog).filter(CertificationCatalog.id == cid).first()
    if not c:
        raise HTTPException(404)
    if body.name: c.name = body.name
    if body.issuer is not None: c.issuer = body.issuer
    if body.level or body.category: c.level = body.level or body.category
    db.commit()
    return {"id": c.id, "name": c.name, "issuer": c.issuer, "category": c.level, "state_code": c.state_code}

@router.get("/locations")
def list_locations(db: Session = Depends(get_db), user: User = Depends(require_roles("platform_admin", "state_admin"))):
    return [{"id": l.id, "name": l.city or l.region or l.zip_code or f"Loc {l.id}", "location_type": "place", "city": l.city, "state_code": l.state_code, "latitude": l.lat, "longitude": l.lng} for l in db.query(Location).all()]

@router.post("/locations")
def create_location(body: LocIn, db: Session = Depends(get_db), user: User = Depends(require_roles("platform_admin", "state_admin"))):
    l = Location(state_code=(body.state_code or "NY").upper(), city=body.city or body.name, region=body.region, zip_code=body.zip_code, lat=body.latitude, lng=body.longitude)
    db.add(l)
    db.commit()
    db.refresh(l)
    return {"id": l.id, "name": l.city, "city": l.city, "state_code": l.state_code, "latitude": l.lat, "longitude": l.lng}

@router.patch("/locations/{lid}")
def patch_location(lid: int, body: LocIn, db: Session = Depends(get_db), user: User = Depends(require_roles("platform_admin", "state_admin"))):
    l = db.query(Location).filter(Location.id == lid).first()
    if not l:
        raise HTTPException(404)
    if body.city or body.name: l.city = body.city or body.name
    if body.latitude is not None: l.lat = body.latitude
    if body.longitude is not None: l.lng = body.longitude
    if body.region is not None: l.region = body.region
    db.commit()
    return {"id": l.id, "name": l.city, "city": l.city, "state_code": l.state_code, "latitude": l.lat, "longitude": l.lng}

@router.get("/map")
def national_map(db: Session = Depends(get_db), user: User = Depends(require_roles("platform_admin"))):
    juris = db.query(Jurisdiction).all()
    out = []
    for j in juris:
        individuals = db.query(IndividualProfile).filter(IndividualProfile.state_code == j.state_code).count()
        jobs = db.query(Job).filter(Job.state_code == j.state_code).count()
        out.append({"code": j.state_code, "name": j.name, "individuals": individuals, "jobs": jobs})
    return {"jurisdictions": out}
