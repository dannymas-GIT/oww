"""Jurisdiction / state microsite config."""

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB

from app.db.base_class import Base


class Jurisdiction(Base):
    __tablename__ = "jurisdictions"

    id = Column(Integer, primary_key=True, index=True)
    state_code = Column(String(2), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    partner_name = Column(String(255), nullable=True)
    tagline = Column(Text, nullable=True)
    branding = Column(JSONB, nullable=False, default=dict)
    enabled_features = Column(JSONB, nullable=False, default=dict)
    regions = Column(JSONB, nullable=False, default=list)
    # Pack-aligned extensions (DB overrides of in-code packs; null/empty = use pack).
    demonym = Column(String(120), nullable=True)
    geo_unit_label = Column(String(40), nullable=True)
    regulators = Column(JSONB, nullable=True)
    certifications = Column(JSONB, nullable=True)
    copy_tokens = Column(JSONB, nullable=True)
    map = Column(JSONB, nullable=True)
    partner = Column(JSONB, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
