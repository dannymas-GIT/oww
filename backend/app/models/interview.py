"""Interview scheduling."""
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
from app.db.base_class import Base

class Interview(Base):
    __tablename__ = "interviews"
    id = Column(Integer, primary_key=True)
    org_id = Column(Integer, nullable=False, index=True)
    job_id = Column(Integer, nullable=True, index=True)
    employer_user_id = Column(Integer, nullable=False, index=True)
    candidate_user_id = Column(Integer, nullable=False, index=True)
    scheduled_at = Column(DateTime, nullable=False)
    location = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String(50), default="scheduled")
    ics_uid = Column(String(255), nullable=True)
    is_sample = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
