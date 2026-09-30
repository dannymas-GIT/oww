"""Pathways Interest & Access form submissions."""

from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB

from app.db.base_class import Base


class InterestSubmission(Base):
    __tablename__ = "interest_submissions"

    id = Column(Integer, primary_key=True, index=True)
    state_code = Column(String(2), nullable=False, default="NY", index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(50), nullable=True)
    pathway = Column(String(50), nullable=True, index=True)
    career_stage = Column(String(100), nullable=True, index=True)
    region = Column(String(100), nullable=True, index=True)
    interests = Column(JSONB, nullable=False, default=list)
    permissions = Column(JSONB, nullable=False, default=dict)
    source = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default="new", index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
