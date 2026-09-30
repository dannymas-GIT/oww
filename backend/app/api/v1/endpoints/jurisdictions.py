
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.jurisdiction import Jurisdiction

router = APIRouter(prefix="/jurisdictions", tags=["jurisdictions"])

def _ser(j: Jurisdiction) -> dict:
    return {
        "id": j.id,
        "code": j.state_code.lower(),
        "name": j.name,
        "is_active": j.is_active,
        "partner_name": j.partner_name,
        "tagline": j.tagline,
        "regions": j.regions or [],
        "branding": j.branding or {},
    }

@router.get("")
def list_jurisdictions(db: Session = Depends(get_db)):
    rows = db.query(Jurisdiction).filter(Jurisdiction.is_active.is_(True)).all()
    return [_ser(j) for j in rows]

@router.get("/{state}")
def get_jurisdiction(state: str, db: Session = Depends(get_db)):
    j = db.query(Jurisdiction).filter(Jurisdiction.state_code == state.upper()).first()
    if not j:
        from fastapi import HTTPException
        raise HTTPException(404, "Not found")
    return _ser(j)
