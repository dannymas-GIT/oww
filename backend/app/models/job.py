"""Job postings."""

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB

from app.db.base_class import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, nullable=False, index=True)
    state_code = Column(String(2), nullable=False, default="NY", index=True)
    title = Column(String(255), nullable=False, index=True)
    slug = Column(String(255), nullable=True, index=True)
    description = Column(Text, nullable=True)
    opportunity_type = Column(String(100), nullable=True, index=True)
    career_areas = Column(JSONB, nullable=False, default=list)
    primary_career_area = Column(String(100), nullable=True, index=True)
    region = Column(String(100), nullable=True, index=True)
    county = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    address = Column(String(500), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    criteria = Column(JSONB, nullable=False, default=dict)
    status = Column(String(50), nullable=False, default="open", index=True)
    is_featured = Column(Boolean, default=False, nullable=False)
    views = Column(Integer, default=0, nullable=False)
    referral_stats = Column(JSONB, nullable=False, default=dict)
    published_at = Column(DateTime, nullable=True)
    closes_at = Column(DateTime, nullable=True)
    created_by = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
