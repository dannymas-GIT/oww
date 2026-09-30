"""Private notes."""
from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, Text
from app.db.base_class import Base

class Note(Base):
    __tablename__ = "notes"
    id = Column(Integer, primary_key=True)
    author_user_id = Column(Integer, nullable=False, index=True)
    about_user_id = Column(Integer, nullable=True, index=True)
    about_job_id = Column(Integer, nullable=True, index=True)
    about_org_id = Column(Integer, nullable=True, index=True)
    body = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
