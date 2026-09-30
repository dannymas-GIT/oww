"""Educator courses."""
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from app.db.base_class import Base

class Course(Base):
    __tablename__ = "courses"
    id = Column(Integer, primary_key=True)
    state_code = Column(String(2), nullable=False, index=True, default="NY")
    educator_user_id = Column(Integer, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    educators = Column(JSONB, default=list)
    region = Column(String(100), nullable=True)
    price_cents = Column(Integer, default=0)
    lms_url = Column(String(500), nullable=True)
    published = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
