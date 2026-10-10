
from __future__ import annotations
import csv
import io
from datetime import datetime
from typing import Any

from pydantic import BaseModel
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.api.deps import require_roles
from app.models.user import User
from app.models.jurisdiction import Jurisdiction
from app.models.content_page import ContentPage
from app.models.media_asset import MediaAsset
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
from app.services import cms_service, media_service
from app.services import home_hero_slide_service as hero_slides

router = APIRouter(prefix="/admin", tags=["admin"])

from app.core.scoping import coerce_state
from app.services.role_catalog_service import (
    PLATFORM_EDITOR_ROLES,
    PLATFORM_OPS_ROLES,
    is_platform_staff,
)

CMS_ROLES = PLATFORM_EDITOR_ROLES
OPS_ROLES = PLATFORM_OPS_ROLES

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
    demonym: str | None = None
    geo_unit_label: str | None = None
    regions: list[Any] | None = None
    regulators: list[Any] | None = None
    certifications: list[Any] | None = None
    copy_tokens: dict[str, Any] | None = None
    map: dict[str, Any] | None = None
    partner: dict[str, Any] | None = None
    branding: dict[str, Any] | None = None
    enabled_features: dict[str, Any] | None = None

class CmsIn(BaseModel):
    id: int | None = None
    slug: str | None = None
    title: str | None = None
    body: str | None = None
    state_code: str | None = None
    published: bool | None = None
    pathway: str | None = None
    template: str | None = None
    summary: str | None = None
    sections: list[dict[str, Any]] | None = None
    sort_order: int | None = None
    author_name: str | None = None
    published_at: str | None = None  # ISO datetime
    tags: list[str] | str | None = None

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
    """Platform staff only — people with platform_* permissions."""
    from app.services.sample_data_service import user_is_sample

    rows = db.query(User).order_by(User.id).all()
    out = []
    for u in rows:
        if not is_platform_staff(u.roles or []):
            continue
        d = user_to_dict(u)
        d["is_sample"] = user_is_sample(u)
        out.append(d)
    if q:
        ql = q.lower()
        out = [
            u
            for u in out
            if ql in (u.get("username") or "").lower()
            or ql in (u.get("email") or "").lower()
            or ql in (u.get("full_name") or "").lower()
        ]
    return out

@router.patch("/users/{user_id}")
def patch_user(user_id: int, body: UserPatch, db: Session = Depends(get_db), admin: User = Depends(require_roles("platform_admin"))):
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
def reset_password(user_id: int, body: PasswordReset, db: Session = Depends(get_db), admin: User = Depends(require_roles("platform_admin"))):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(404)
    u.hashed_password = get_password_hash(body.new_password)
    db.commit()
    return {"ok": True}

def _admin_jurisdiction_ser(j: Jurisdiction, cfg: dict | None = None) -> dict:
    partner = getattr(j, "partner", None) or (cfg or {}).get("partner") or {}
    regions = j.regions or (cfg or {}).get("regions") or []
    return {
        "id": j.id,
        "code": j.state_code.lower(),
        "name": j.name,
        "is_active": j.is_active,
        "partner_name": j.partner_name or partner.get("short"),
        "tagline": j.tagline,
        "demonym": getattr(j, "demonym", None) or (cfg or {}).get("demonym"),
        "geo_unit_label": getattr(j, "geo_unit_label", None) or (cfg or {}).get("geo_unit_label"),
        "regions": regions,
        "regions_count": len(regions) if isinstance(regions, list) else 0,
        "regulators": getattr(j, "regulators", None) or (cfg or {}).get("regulators") or [],
        "certifications": getattr(j, "certifications", None) or (cfg or {}).get("certification_ladders") or [],
        "copy_tokens": getattr(j, "copy_tokens", None) or (cfg or {}).get("copy_tokens") or {},
        "map": getattr(j, "map", None) or (cfg or {}).get("map") or {},
        "partner": partner,
        "branding": j.branding or {},
        "enabled_features": j.enabled_features or {},
        "pack_version": (cfg or {}).get("pack_version"),
    }


@router.get("/jurisdictions")
def admin_jurisdictions(db: Session = Depends(get_db), user: User = Depends(require_roles("platform_admin", "state_admin"))):
    from app.core.scoping import scope_state
    from app.jurisdictions.registry import effective, ensure_jurisdictions

    ensure_jurisdictions(db)
    q = db.query(Jurisdiction)
    scoped = scope_state(user)
    if scoped:
        q = q.filter(Jurisdiction.state_code == scoped)
    rows = q.order_by(Jurisdiction.state_code).all()
    return [_admin_jurisdiction_ser(j, effective(db, j.state_code)) for j in rows]


@router.get("/jurisdictions/{code}")
def admin_jurisdiction_detail(
    code: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("platform_admin", "state_admin")),
):
    from app.core.scoping import require_state_access
    from app.jurisdictions.registry import effective, ensure_jurisdictions

    ensure_jurisdictions(db)
    state = require_state_access(user, code)
    j = db.query(Jurisdiction).filter(Jurisdiction.state_code == state).first()
    if not j:
        raise HTTPException(404, "Not found")
    return _admin_jurisdiction_ser(j, effective(db, state))


@router.post("/jurisdictions")
def upsert_jurisdiction(body: JurisdictionIn, db: Session = Depends(get_db), user: User = Depends(require_roles("platform_admin"))):
    from app.jurisdictions.registry import ensure_jurisdictions, normalize_code

    ensure_jurisdictions(db)
    code = normalize_code(body.code)
    j = db.query(Jurisdiction).filter(Jurisdiction.state_code == code).first()
    if not j:
        j = Jurisdiction(state_code=code, name=body.name)
        db.add(j)
    j.name = body.name
    j.is_active = body.is_active
    if body.partner_name is not None:
        j.partner_name = body.partner_name
    if body.tagline is not None:
        j.tagline = body.tagline
    if body.demonym is not None:
        j.demonym = body.demonym
    if body.geo_unit_label is not None:
        j.geo_unit_label = body.geo_unit_label
    if body.regions is not None:
        j.regions = body.regions
    if body.regulators is not None:
        j.regulators = body.regulators
    if body.certifications is not None:
        j.certifications = body.certifications
    if body.copy_tokens is not None:
        j.copy_tokens = body.copy_tokens
    if body.map is not None:
        j.map = body.map
    if body.partner is not None:
        j.partner = body.partner
        if body.partner.get("short") and not body.partner_name:
            j.partner_name = body.partner.get("short")
    if body.branding is not None:
        j.branding = body.branding
    if body.enabled_features is not None:
        j.enabled_features = body.enabled_features
    db.commit()
    db.refresh(j)
    from app.jurisdictions.registry import effective

    return _admin_jurisdiction_ser(j, effective(db, code))

@router.get("/cms/catalog")
def cms_catalog(user: User = Depends(require_roles(*CMS_ROLES))):
    return cms_service.catalog()


@router.get("/cms")
def list_cms(
    kind: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*CMS_ROLES)),
):
    cms_service.ensure_default_home_page(db)
    q = db.query(ContentPage)
    if kind == "blog":
        q = q.filter(ContentPage.template == cms_service.BLOG_TEMPLATE)
    elif kind == "page":
        q = q.filter(ContentPage.template != cms_service.BLOG_TEMPLATE)
    pages = q.order_by(ContentPage.published_at.desc().nullslast(), ContentPage.sort_order, ContentPage.id).all()
    return [cms_service.page_to_dict(p) for p in pages]


@router.post("/cms/media")
async def upload_cms_media(
    file: UploadFile = File(...),
    state_code: str | None = Form(default=None),
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*CMS_ROLES)),
):
    asset = await media_service.save_upload(
        db,
        upload=file,
        uploaded_by=user.id,
        state_code=coerce_state(state_code or user.state_code),
    )
    return media_service.asset_to_dict(asset)


@router.get("/cms/media")
def list_cms_media(db: Session = Depends(get_db), user: User = Depends(require_roles(*CMS_ROLES))):
    rows = db.query(MediaAsset).order_by(MediaAsset.id.desc()).limit(100).all()
    return [media_service.asset_to_dict(a) for a in rows]


class HomeSlideIn(BaseModel):
    state_code: str | None = "NY"
    scope: str | None = "home"
    kicker: str | None = ""
    title: str | None = None
    body: str | None = ""
    image_url: str | None = None
    image_alt: str | None = ""
    cta_label: str | None = None
    cta_href: str | None = None
    sort_order: int | None = 100
    is_active: bool | None = True


@router.get("/home-slides")
def admin_list_home_slides(
    state_code: str | None = None,
    scope: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*CMS_ROLES)),
):
    _ = user
    try:
        slides = hero_slides.list_admin_slides(db, state_code=state_code, scope=scope)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    return {"slides": slides}


@router.post("/home-slides")
def admin_create_home_slide(
    body: HomeSlideIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*CMS_ROLES)),
):
    _ = user
    try:
        row = hero_slides.create_slide(db, body.model_dump())
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    return hero_slides.slide_to_dict(row)


@router.patch("/home-slides/{slide_id}")
def admin_patch_home_slide(
    slide_id: int,
    body: HomeSlideIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*CMS_ROLES)),
):
    _ = user
    try:
        row = hero_slides.update_slide(db, slide_id, body.model_dump(exclude_unset=True))
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    if not row:
        raise HTTPException(404, "Slide not found")
    return hero_slides.slide_to_dict(row)


@router.delete("/home-slides/{slide_id}")
def admin_delete_home_slide(
    slide_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*CMS_ROLES)),
):
    _ = user
    if not hero_slides.delete_slide(db, slide_id):
        raise HTTPException(404, "Slide not found")
    return {"ok": True}


@router.get("/cms/{page_id}")
def get_cms(page_id: int, db: Session = Depends(get_db), user: User = Depends(require_roles(*CMS_ROLES))):
    p = db.query(ContentPage).filter(ContentPage.id == page_id).first()
    if not p:
        raise HTTPException(404, "Page not found")
    return cms_service.page_to_dict(p)


@router.post("/cms")
def create_cms(body: CmsIn, db: Session = Depends(get_db), user: User = Depends(require_roles(*CMS_ROLES))):
    template = body.template or "simple_page"
    if template not in cms_service.TEMPLATES:
        raise HTTPException(400, f"Unknown template: {template}")
    slug = (body.slug or cms_service.TEMPLATES[template]["suggested_slug"] or "page").strip().lower()
    state = coerce_state(body.state_code or user.state_code)
    if db.query(ContentPage).filter(ContentPage.state_code == state, ContentPage.slug == slug).first():
        raise HTTPException(409, "A page with this slug already exists for the state")
    sections = body.sections if body.sections is not None else cms_service.default_sections_for_template(template)
    published = bool(body.published) if body.published is not None else False
    p = ContentPage(
        slug=slug,
        title=body.title or "Untitled",
        template=template,
        body_html=body.body or "",
        body_json={"sections": cms_service.sanitize_sections(sections)},
        state_code=state,
        is_published=published,
        pathway=body.pathway,
        summary=body.summary,
        sort_order=body.sort_order or 0,
        author_name=body.author_name or (user.full_name if template == cms_service.BLOG_TEMPLATE else None),
        tags=cms_service._normalize_tags(body.tags),
        created_by=user.id,
    )
    if body.published_at:
        try:
            p.published_at = datetime.fromisoformat(body.published_at.replace("Z", "+00:00")).replace(tzinfo=None)
        except ValueError:
            pass
    cms_service.stamp_publish_dates(p, publishing=published)
    db.add(p)
    db.commit()
    db.refresh(p)
    return cms_service.page_to_dict(p)


@router.patch("/cms/{page_id}")
def patch_cms(page_id: int, body: CmsIn, db: Session = Depends(get_db), user: User = Depends(require_roles(*CMS_ROLES))):
    p = db.query(ContentPage).filter(ContentPage.id == page_id).first()
    if not p:
        raise HTTPException(404)
    was_published = bool(p.is_published)
    if body.slug is not None:
        p.slug = body.slug.strip().lower()
    if body.title is not None:
        p.title = body.title
    if body.body is not None:
        p.body_html = body.body
    if body.pathway is not None:
        p.pathway = body.pathway
    if body.summary is not None:
        p.summary = body.summary
    if body.sort_order is not None:
        p.sort_order = body.sort_order
    if body.template is not None:
        if body.template not in cms_service.TEMPLATES:
            raise HTTPException(400, f"Unknown template: {body.template}")
        p.template = body.template
    if body.sections is not None:
        p.body_json = {"sections": cms_service.sanitize_sections(body.sections)}
    if body.state_code is not None:
        p.state_code = body.state_code.upper()[:2]
    if body.author_name is not None:
        p.author_name = body.author_name
    if body.tags is not None:
        p.tags = cms_service._normalize_tags(body.tags)
    if body.published_at is not None:
        if body.published_at == "":
            p.published_at = None
        else:
            try:
                p.published_at = datetime.fromisoformat(body.published_at.replace("Z", "+00:00")).replace(tzinfo=None)
            except ValueError:
                raise HTTPException(400, "published_at must be ISO datetime")
    if body.published is not None:
        p.is_published = body.published
    cms_service.stamp_publish_dates(p, publishing=bool(p.is_published) and not was_published)
    db.commit()
    db.refresh(p)
    return cms_service.page_to_dict(p)


@router.delete("/cms/{page_id}")
def delete_cms(page_id: int, db: Session = Depends(get_db), user: User = Depends(require_roles(*CMS_ROLES))):
    p = db.query(ContentPage).filter(ContentPage.id == page_id).first()
    if not p:
        raise HTTPException(404)
    if p.slug == "home":
        raise HTTPException(400, "The home landing page cannot be deleted; unpublish it instead.")
    db.delete(p)
    db.commit()
    return {"ok": True}

@router.get("/programs")
def list_programs(db: Session = Depends(get_db), user: User = Depends(require_roles(*CMS_ROLES))):
    return [
        {"id": p.id, "program_name": p.program_name, "organization_name": p.organization_name, "status": p.status, "program_type": p.program_type, "contact_email": p.contact_email, "state_code": p.state_code}
        for p in db.query(ProgramSubmission).order_by(ProgramSubmission.id.desc()).all()
    ]

@router.get("/featured")
def list_featured(db: Session = Depends(get_db), user: User = Depends(require_roles(*CMS_ROLES))):
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
def create_featured(body: FeaturedIn, db: Session = Depends(get_db), user: User = Depends(require_roles(*CMS_ROLES))):
    post = featured_post_service.queue_post(db, job_id=body.job_id, channel=body.channel or "linkedin")
    return {"id": post.id, "title": f"Job {post.job_id}", "is_active": True}

@router.patch("/featured/{post_id}")
def patch_featured(post_id: int, body: FeaturedIn, db: Session = Depends(get_db), user: User = Depends(require_roles(*CMS_ROLES))):
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
def analytics(db: Session = Depends(get_db), user: User = Depends(require_roles(*OPS_ROLES))):
    state = None if user.has_role("platform_admin") else user.state_code
    return summary(db, state)

@router.get("/analytics/export.csv")
def analytics_csv(db: Session = Depends(get_db), user: User = Depends(require_roles(*OPS_ROLES))):
    rows = export_rows(db)
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=["id", "event_type", "stage", "region", "career_stage", "state_code", "created_at"])
    writer.writeheader()
    writer.writerows(rows)
    buf.seek(0)
    return StreamingResponse(iter([buf.getvalue()]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=oww-analytics.csv"})

@router.post("/crm/export")
def crm_export(db: Session = Depends(get_db), user: User = Depends(require_roles(*OPS_ROLES))):
    contacts = [{"email": u.email, "name": u.full_name, "roles": u.roles} for u in db.query(User).filter(User.email.isnot(None)).all()]
    post_webhook({"type": "oww_contacts", "contacts": contacts, "exported_at": datetime.utcnow().isoformat()})
    return {"ok": True, "count": len(contacts)}

@router.get("/certifications")
def list_certs(db: Session = Depends(get_db), user: User = Depends(require_roles(*CMS_ROLES))):
    return [{"id": c.id, "name": c.name, "issuer": c.issuer, "category": c.level, "state_code": c.state_code} for c in db.query(CertificationCatalog).all()]

@router.post("/certifications")
def create_cert(body: CertIn, db: Session = Depends(get_db), user: User = Depends(require_roles(*CMS_ROLES))):
    c = CertificationCatalog(name=body.name or "Certification", issuer=body.issuer, level=body.level or body.category, state_code=coerce_state(body.state_code))
    db.add(c)
    db.commit()
    db.refresh(c)
    return {"id": c.id, "name": c.name, "issuer": c.issuer, "category": c.level, "state_code": c.state_code}

@router.patch("/certifications/{cid}")
def patch_cert(cid: int, body: CertIn, db: Session = Depends(get_db), user: User = Depends(require_roles(*CMS_ROLES))):
    c = db.query(CertificationCatalog).filter(CertificationCatalog.id == cid).first()
    if not c:
        raise HTTPException(404)
    if body.name: c.name = body.name
    if body.issuer is not None: c.issuer = body.issuer
    if body.level or body.category: c.level = body.level or body.category
    db.commit()
    return {"id": c.id, "name": c.name, "issuer": c.issuer, "category": c.level, "state_code": c.state_code}

@router.get("/locations")
def list_locations(db: Session = Depends(get_db), user: User = Depends(require_roles(*CMS_ROLES))):
    return [{"id": l.id, "name": l.city or l.region or l.zip_code or f"Loc {l.id}", "location_type": "place", "city": l.city, "state_code": l.state_code, "latitude": l.lat, "longitude": l.lng} for l in db.query(Location).all()]

@router.post("/locations")
def create_location(body: LocIn, db: Session = Depends(get_db), user: User = Depends(require_roles(*CMS_ROLES))):
    l = Location(state_code=coerce_state(body.state_code), city=body.city or body.name, region=body.region, zip_code=body.zip_code, lat=body.latitude, lng=body.longitude)
    db.add(l)
    db.commit()
    db.refresh(l)
    return {"id": l.id, "name": l.city, "city": l.city, "state_code": l.state_code, "latitude": l.lat, "longitude": l.lng}

@router.patch("/locations/{lid}")
def patch_location(lid: int, body: LocIn, db: Session = Depends(get_db), user: User = Depends(require_roles(*CMS_ROLES))):
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
    from app.jurisdictions.registry import ensure_jurisdictions

    ensure_jurisdictions(db)
    juris = db.query(Jurisdiction).all()
    out = []
    for j in juris:
        individuals = db.query(IndividualProfile).filter(IndividualProfile.state_code == j.state_code).count()
        jobs = db.query(Job).filter(Job.state_code == j.state_code).count()
        orgs = db.query(Organization).filter(Organization.state_code == j.state_code).count()
        out.append(
            {
                "code": j.state_code,
                "name": j.name,
                "individuals": individuals,
                "jobs": jobs,
                "orgs": orgs,
            }
        )
    return {"jurisdictions": out}
