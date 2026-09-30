"""Microvideos (YouTube)."""
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
from app.db.base_class import Base

class Microvideo(Base):
    __tablename__ = "microvideos"
    id = Column(Integer, primary_key=True)
    state_code = Column(String(2), nullable=False, index=True, default="NY")
    title = Column(String(255), nullable=False)
    youtube_url = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    pathway = Column(String(50), nullable=True)
    published = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
