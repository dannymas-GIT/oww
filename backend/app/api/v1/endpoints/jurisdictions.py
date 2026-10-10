from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.jurisdictions.registry import effective, ensure_jurisdictions, normalize_code
from app.models.certification_catalog import CertificationCatalog
from app.models.jurisdiction import Jurisdiction

router = APIRouter(prefix="/jurisdictions", tags=["jurisdictions"])


def _list_ser(j: Jurisdiction, cfg: dict | None = None) -> dict:
    partner = (cfg or {}).get("partner") or {}
    return {
        "id": j.id,
        "code": j.state_code.lower(),
        "name": j.name,
        "is_active": j.is_active,
        "partner_name": j.partner_name or partner.get("short"),
        "tagline": j.tagline,
        "regions": j.regions or (cfg or {}).get("regions") or [],
        "branding": j.branding or {},
        "demonym": getattr(j, "demonym", None) or (cfg or {}).get("demonym"),
        "geo_unit_label": getattr(j, "geo_unit_label", None) or (cfg or {}).get("geo_unit_label"),
    }


@router.get("")
def list_jurisdictions(db: Session = Depends(get_db)):
    ensure_jurisdictions(db)
    rows = db.query(Jurisdiction).filter(Jurisdiction.is_active.is_(True)).all()
    out = []
    for j in rows:
        cfg = effective(db, j.state_code)
        out.append(_list_ser(j, cfg))
    return out


@router.get("/{state}")
def get_jurisdiction(state: str, db: Session = Depends(get_db)):
    ensure_jurisdictions(db)
    code = normalize_code(state)
    row = db.query(Jurisdiction).filter(Jurisdiction.state_code == code).first()
    cfg = effective(db, code)
    if not cfg or (row and not row.is_active):
        raise HTTPException(404, "Not found")
    if not row and not cfg.get("is_active", True):
        raise HTTPException(404, "Not found")
    return cfg


@router.get("/{state}/certifications")
def list_certifications(state: str, db: Session = Depends(get_db)):
    code = normalize_code(state)
    cfg = effective(db, code)
    if not cfg or not cfg.get("is_active", True):
        raise HTTPException(404, "Not found")
    rows = (
        db.query(CertificationCatalog)
        .filter(CertificationCatalog.state_code == code)
        .order_by(CertificationCatalog.sort_order, CertificationCatalog.id)
        .all()
    )
    if rows:
        return [
            {
                "id": r.id,
                "state_code": r.state_code,
                "name": r.name,
                "level": r.level,
                "issuer": r.issuer,
                "description": r.description,
                "category": r.category,
                "sort_order": r.sort_order,
            }
            for r in rows
        ]
    # Fall back to pack ladder when catalog not yet seeded
    return [
        {
            "id": None,
            "state_code": code,
            **item,
        }
        for item in (cfg.get("certification_ladders") or [])
    ]
