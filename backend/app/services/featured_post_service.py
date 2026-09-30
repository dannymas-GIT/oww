
"""Featured social posting stubs (LinkedIn/Facebook adapters)."""
from __future__ import annotations
import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.featured_post import FeaturedPost

logger = logging.getLogger(__name__)

def queue_post(db: Session, *, job_id: int | None = None, event_id: int | None = None, channel: str = "linkedin") -> FeaturedPost:
    post = FeaturedPost(
        job_id=job_id,
        event_id=event_id,
        channel=channel,
        status="queued",
        expires_at=datetime.utcnow() + timedelta(days=30),
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post

def mark_posted(db: Session, post_id: int) -> FeaturedPost:
    post = db.query(FeaturedPost).filter(FeaturedPost.id == post_id).first()
    if not post:
        raise ValueError("not found")
    post.status = "posted"
    post.posted_at = datetime.utcnow()
    if not post.expires_at:
        post.expires_at = datetime.utcnow() + timedelta(days=30)
    db.commit()
    db.refresh(post)
    logger.info("featured post %s marked posted on %s (stub adapter)", post.id, post.channel)
    return post

def expire_due(db: Session) -> int:
    now = datetime.utcnow()
    rows = db.query(FeaturedPost).filter(
        FeaturedPost.status == "posted",
        FeaturedPost.expires_at.isnot(None),
        FeaturedPost.expires_at < now,
    ).all()
    for r in rows:
        r.status = "expired"
    db.commit()
    return len(rows)
