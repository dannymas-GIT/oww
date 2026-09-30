
from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.message import Message
from app.models.note import Note
from app.models.interview import Interview
from app.models.job import Job
from app.services.engagement_service import track

router = APIRouter(prefix="/messaging", tags=["messaging"])

class ThreadIn(BaseModel):
    subject: str
    recipient_user_id: int
    body: str

class MsgIn(BaseModel):
    body: str

class NoteIn(BaseModel):
    individual_id: int
    body: str

class InterviewIn(BaseModel):
    job_id: int | None = None
    individual_id: int
    scheduled_at: str
    location: str | None = None
    notes: str | None = None

@router.get("/threads")
def threads(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    msgs = db.query(Message).filter((Message.from_user_id == user.id) | (Message.to_user_id == user.id)).order_by(Message.id.desc()).limit(200).all()
    # collapse by subject+peer
    seen = {}
    for m in msgs:
        peer = m.to_user_id if m.from_user_id == user.id else m.from_user_id
        key = (m.subject or "Message", peer)
        if key not in seen:
            seen[key] = {
                "id": m.id,
                "subject": m.subject or "Message",
                "participants": [str(peer)],
                "last_message_at": m.created_at.isoformat() if m.created_at else None,
                "unread": 0 if m.read or m.from_user_id == user.id else 1,
            }
    return list(seen.values())

@router.post("/threads")
def create_thread(body: ThreadIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    m = Message(from_user_id=user.id, to_user_id=body.recipient_user_id, subject=body.subject, body=body.body, org_id=user.org_id)
    db.add(m)
    db.commit()
    db.refresh(m)
    track(db, event_type="message", pipeline_stage="interview", actor_user_id=user.id, org_id=user.org_id)
    return {"id": m.id, "subject": m.subject, "participants": [str(body.recipient_user_id)], "last_message_at": m.created_at.isoformat()}

@router.post("/threads/{thread_id}/messages")
def send_message(thread_id: int, body: MsgIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    parent = db.query(Message).filter(Message.id == thread_id).first()
    if not parent:
        raise HTTPException(404)
    peer = parent.to_user_id if parent.from_user_id == user.id else parent.from_user_id
    m = Message(from_user_id=user.id, to_user_id=peer, subject=parent.subject, body=body.body, org_id=user.org_id, job_id=parent.job_id)
    db.add(m)
    db.commit()
    return {"ok": True, "id": m.id}

@router.get("/notes")
def list_notes(individual_id: int | None = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    q = db.query(Note).filter(Note.author_user_id == user.id)
    if individual_id:
        q = q.filter(Note.about_user_id == individual_id)
    return [{"id": n.id, "body": n.body, "created_at": n.created_at.isoformat() if n.created_at else None} for n in q.order_by(Note.id.desc()).all()]

@router.post("/notes")
def create_note(body: NoteIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    n = Note(author_user_id=user.id, about_user_id=body.individual_id, body=body.body)
    db.add(n)
    db.commit()
    db.refresh(n)
    return {"id": n.id, "body": n.body, "created_at": n.created_at.isoformat()}

@router.get("/interviews")
def list_interviews(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    q = db.query(Interview)
    if user.org_id:
        q = q.filter(Interview.org_id == user.org_id)
    else:
        q = q.filter((Interview.candidate_user_id == user.id) | (Interview.employer_user_id == user.id))
    out = []
    for i in q.order_by(Interview.scheduled_at.desc()).all():
        job = db.query(Job).filter(Job.id == i.job_id).first() if i.job_id else None
        cand = db.query(User).filter(User.id == i.candidate_user_id).first()
        out.append({
            "id": i.id,
            "job_title": job.title if job else None,
            "candidate_name": cand.full_name or cand.username if cand else None,
            "scheduled_at": i.scheduled_at.isoformat() if i.scheduled_at else None,
            "status": i.status,
            "location": i.location,
            "notes": i.notes,
        })
    return out

@router.post("/interviews")
def schedule(body: InterviewIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    when = datetime.fromisoformat(body.scheduled_at.replace("Z", "+00:00")).replace(tzinfo=None)
    i = Interview(
        org_id=user.org_id or 0,
        job_id=body.job_id,
        employer_user_id=user.id,
        candidate_user_id=body.individual_id,
        scheduled_at=when,
        location=body.location,
        notes=body.notes,
        status="scheduled",
        ics_uid=f"oww-interview-{user.id}-{int(when.timestamp())}",
    )
    db.add(i)
    db.commit()
    db.refresh(i)
    track(db, event_type="interview_scheduled", pipeline_stage="interview", actor_user_id=user.id, org_id=user.org_id)
    return {"id": i.id, "scheduled_at": i.scheduled_at.isoformat(), "status": i.status, "location": i.location, "notes": i.notes}
