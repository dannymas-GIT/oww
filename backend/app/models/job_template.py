"""Reusable job templates."""

from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB

from app.db.base_class import Base


class JobTemplate(Base):
    __tablename__ = "job_templates"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, nullable=True, index=True)
    state_code = Column(String(2), nullable=False, default="NY", index=True)
    name = Column(String(255), nullable=False)
    title = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    opportunity_type = Column(String(100), nullable=True)
    career_areas = Column(JSONB, nullable=False, default=list)
    criteria = Column(JSONB, nullable=False, default=dict)
    created_by = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
