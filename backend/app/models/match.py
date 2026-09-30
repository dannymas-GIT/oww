"""Materialized candidate–job matches."""

from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String
from sqlalchemy.dialects.postgresql import JSONB

from app.db.base_class import Base


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    individual_profile_id = Column(Integer, nullable=False, index=True)
    job_id = Column(Integer, nullable=False, index=True)
    org_id = Column(Integer, nullable=False, index=True)
    state_code = Column(String(2), nullable=False, default="NY", index=True)
    match_type = Column(String(50), nullable=False, index=True)
    score = Column(Float, nullable=False, default=0.0)
    category_scores = Column(JSONB, nullable=False, default=dict)
    explanation = Column(JSONB, nullable=False, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
