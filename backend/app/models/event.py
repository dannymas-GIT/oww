"""Events."""
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
from app.db.base_class import Base

class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True)
    state_code = Column(String(2), nullable=False, index=True, default="NY")
    organizer_user_id = Column(Integer, nullable=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    starts_at = Column(DateTime, nullable=True)
    ends_at = Column(DateTime, nullable=True)
    location = Column(String(255), nullable=True)
    region = Column(String(100), nullable=True)
    price_cents = Column(Integer, default=0)
    published = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
