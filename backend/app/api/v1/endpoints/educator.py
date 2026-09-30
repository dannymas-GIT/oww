
from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.api.deps import require_roles
from app.models.user import User
from app.models.course import Course
from app.models.event import Event

router = APIRouter(prefix="/educator", tags=["educator"])

class CourseIn(BaseModel):
    title: str
    provider: str | None = None
    modality: str | None = None
    start_date: str | None = None
    description: str | None = None

class EventIn(BaseModel):
    title: str
    starts_at: str
    location: str | None = None
    capacity: int | None = None
    description: str | None = None

@router.get("/courses")
def list_courses(db: Session = Depends(get_db), user: User = Depends(require_roles("educator", "platform_admin", "state_admin"))):
    q = db.query(Course)
    if not user.has_any_role("platform_admin", "state_admin"):
        q = q.filter(Course.educator_user_id == user.id)
    return [{"id": c.id, "title": c.title, "provider": (c.educators or [None])[0] if c.educators else None, "modality": None, "start_date": None} for c in q.all()]

@router.post("/courses")
def create_course(body: CourseIn, db: Session = Depends(get_db), user: User = Depends(require_roles("educator", "platform_admin"))):
    c = Course(state_code=user.state_code or "NY", educator_user_id=user.id, title=body.title, description=body.description, educators=[body.provider] if body.provider else [])
    db.add(c)
    db.commit()
    db.refresh(c)
    return {"id": c.id, "title": c.title, "provider": body.provider}

@router.get("/events")
def list_events(db: Session = Depends(get_db), user: User = Depends(require_roles("educator", "platform_admin", "state_admin"))):
    q = db.query(Event)
    if not user.has_any_role("platform_admin", "state_admin"):
        q = q.filter(Event.organizer_user_id == user.id)
    return [{"id": e.id, "title": e.title, "starts_at": e.starts_at.isoformat() if e.starts_at else "", "location": e.location, "capacity": None} for e in q.all()]

@router.post("/events")
def create_event(body: EventIn, db: Session = Depends(get_db), user: User = Depends(require_roles("educator", "platform_admin"))):
    when = datetime.fromisoformat(body.starts_at.replace("Z", "+00:00")).replace(tzinfo=None)
    e = Event(state_code=user.state_code or "NY", organizer_user_id=user.id, title=body.title, description=body.description, starts_at=when, location=body.location)
    db.add(e)
    db.commit()
    db.refresh(e)
    return {"id": e.id, "title": e.title, "starts_at": e.starts_at.isoformat(), "location": e.location}
