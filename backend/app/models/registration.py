"""Course/event registrations."""
from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String
from app.db.base_class import Base

class Registration(Base):
    __tablename__ = "registrations"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False, index=True)
    course_id = Column(Integer, nullable=True, index=True)
    event_id = Column(Integer, nullable=True, index=True)
    payment_status = Column(String(50), default="stub_pending")
    created_at = Column(DateTime, default=datetime.utcnow)
