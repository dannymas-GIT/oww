"""Individual / candidate profile (17-category questionnaire in JSONB)."""

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB

from app.db.base_class import Base


class IndividualProfile(Base):
    __tablename__ = "individual_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, unique=True, index=True)
    state_code = Column(String(2), nullable=False, default="NY", index=True)
    display_name = Column(String(255), nullable=True)
    headline = Column(String(255), nullable=True)
    bio = Column(Text, nullable=True)
    career_stage = Column(String(100), nullable=True, index=True)
    region = Column(String(100), nullable=True, index=True)
    answers = Column(JSONB, nullable=False, default=dict)
    resume_url = Column(String(500), nullable=True)
    resume_bank_opt_in = Column(Boolean, default=False, nullable=False)
    share_with_employers = Column(String(50), nullable=True)
    contact_channels = Column(JSONB, nullable=False, default=list)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    profile_completeness = Column(Integer, default=0, nullable=False)
    is_public = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
