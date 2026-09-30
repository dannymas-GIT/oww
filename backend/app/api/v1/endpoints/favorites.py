
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.favorite import Favorite

router = APIRouter(prefix="/favorites", tags=["favorites"])

@router.get("")
def list_favorites(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.query(Favorite).filter(Favorite.user_id == user.id, Favorite.entity_type == "organization").all()
    return [{"id": f.id, "org_id": f.entity_id} for f in rows]

@router.post("/{org_id}")
def follow(org_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    existing = (
        db.query(Favorite)
        .filter(Favorite.user_id == user.id, Favorite.entity_type == "organization", Favorite.entity_id == org_id)
        .first()
    )
    if existing:
        return {"ok": True, "id": existing.id}
    f = Favorite(user_id=user.id, entity_type="organization", entity_id=org_id)
    db.add(f)
    db.commit()
    db.refresh(f)
    return {"ok": True, "id": f.id}

@router.delete("/{org_id}")
def unfollow(org_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    row = (
        db.query(Favorite)
        .filter(Favorite.user_id == user.id, Favorite.entity_type == "organization", Favorite.entity_id == org_id)
        .first()
    )
    if row:
        db.delete(row)
        db.commit()
    return {"ok": True}
