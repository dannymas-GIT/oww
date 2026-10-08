"""Self-registration queue for utility administrators (optional NYSAWWA review)."""

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB

from app.db.base_class import Base


class UtilityRegistration(Base):
    __tablename__ = "utility_registrations"

    id = Column(Integer, primary_key=True)
    org_id = Column(Integer, nullable=False, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    state_code = Column(String(2), nullable=False, default="NY", index=True)
    utility_name = Column(String(255), nullable=False)
    contact_name = Column(String(255), nullable=False)
    contact_email = Column(String(255), nullable=False, index=True)
    phone = Column(String(50), nullable=True)
    website = Column(String(500), nullable=True)
    job_title = Column(String(120), nullable=True)
    # pending_review | verified | not_required | suspended
    status = Column(String(30), nullable=False, default="pending_review", index=True)
    review_required = Column(Boolean, default=True, nullable=False)
    reviewed_by = Column(Integer, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    review_note = Column(Text, nullable=True)
    meta = Column(JSONB, nullable=False, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
