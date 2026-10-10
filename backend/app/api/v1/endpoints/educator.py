
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.database import get_db
from app.models.course import Course
from app.models.event import Event
from app.models.program_submission import ProgramSubmission
from app.models.user import User
from app.core.scoping import coerce_state

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


def _course_dict(c: Course) -> dict:
    return {
        "id": c.id,
        "title": c.title,
        "description": c.description,
        "provider": (c.educators or [None])[0] if c.educators else None,
        "modality": None,
        "region": c.region,
        "published": bool(c.published),
        "start_date": None,
        "created_at": c.created_at.isoformat() if c.created_at else None,
    }


def _event_dict(e: Event) -> dict:
    return {
        "id": e.id,
        "title": e.title,
        "description": e.description,
        "starts_at": e.starts_at.isoformat() if e.starts_at else "",
        "location": e.location,
        "region": e.region,
        "capacity": None,
        "published": bool(e.published),
    }


@router.get("/courses")
def list_courses(db: Session = Depends(get_db), user: User = Depends(require_roles("educator", "platform_admin", "state_admin"))):
    q = db.query(Course)
    if not user.has_any_role("platform_admin", "state_admin"):
        q = q.filter(Course.educator_user_id == user.id)
    return [_course_dict(c) for c in q.order_by(Course.id.desc()).all()]


@router.post("/courses")
def create_course(body: CourseIn, db: Session = Depends(get_db), user: User = Depends(require_roles("educator", "platform_admin"))):
    c = Course(
        state_code=coerce_state(user.state_code),
        educator_user_id=user.id,
        title=body.title,
        description=body.description,
        educators=[body.provider] if body.provider else [],
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return _course_dict(c)


@router.get("/events")
def list_events(db: Session = Depends(get_db), user: User = Depends(require_roles("educator", "platform_admin", "state_admin"))):
    q = db.query(Event)
    if not user.has_any_role("platform_admin", "state_admin"):
        q = q.filter(Event.organizer_user_id == user.id)
    return [_event_dict(e) for e in q.order_by(Event.starts_at.asc().nullslast(), Event.id.desc()).all()]


@router.post("/events")
def create_event(body: EventIn, db: Session = Depends(get_db), user: User = Depends(require_roles("educator", "platform_admin"))):
    when = datetime.fromisoformat(body.starts_at.replace("Z", "+00:00")).replace(tzinfo=None)
    e = Event(
        state_code=coerce_state(user.state_code),
        organizer_user_id=user.id,
        title=body.title,
        description=body.description,
        starts_at=when,
        location=body.location,
    )
    db.add(e)
    db.commit()
    db.refresh(e)
    return _event_dict(e)


@router.get("/programs")
def list_my_programs(
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("educator", "platform_admin", "state_admin")),
):
    """Program submissions tied to this educator's contact email (demo + real)."""
    q = db.query(ProgramSubmission)
    if not user.has_any_role("platform_admin", "state_admin"):
        email = (user.email or "").lower()
        if not email:
            return []
        q = q.filter(ProgramSubmission.contact_email == email)
    rows = q.order_by(ProgramSubmission.id.desc()).limit(50).all()
    return [
        {
            "id": p.id,
            "program_name": p.program_name,
            "organization_name": p.organization_name,
            "program_type": p.program_type,
            "region": p.region,
            "status": p.status,
            "description": p.description,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in rows
    ]
