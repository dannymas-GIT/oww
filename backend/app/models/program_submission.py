"""Public program submission portal."""

from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB

from app.db.base_class import Base


class ProgramSubmission(Base):
    __tablename__ = "program_submissions"

    id = Column(Integer, primary_key=True, index=True)
    state_code = Column(String(2), nullable=False, default="NY", index=True)
    program_name = Column(String(255), nullable=False)
    organization_name = Column(String(255), nullable=True)
    contact_name = Column(String(255), nullable=True)
    contact_email = Column(String(255), nullable=True, index=True)
    contact_phone = Column(String(50), nullable=True)
    program_type = Column(String(100), nullable=True, index=True)
    region = Column(String(100), nullable=True, index=True)
    description = Column(Text, nullable=True)
    tags = Column(JSONB, nullable=False, default=list)
    payload = Column(JSONB, nullable=False, default=dict)
    status = Column(String(50), nullable=False, default="pending", index=True)
    reviewed_by = Column(Integer, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
