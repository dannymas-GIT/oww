"""Featured social postings queue."""
from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String
from app.db.base_class import Base

class FeaturedPost(Base):
    __tablename__ = "featured_posts"
    id = Column(Integer, primary_key=True)
    job_id = Column(Integer, nullable=True, index=True)
    event_id = Column(Integer, nullable=True, index=True)
    channel = Column(String(50), nullable=False)  # linkedin|facebook
    status = Column(String(50), default="queued")  # queued|posted|expired
    posted_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
