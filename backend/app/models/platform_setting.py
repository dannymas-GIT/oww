"""Key/value platform settings (Jenny / platform admin toggles)."""

from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.dialects.postgresql import JSONB

from app.db.base_class import Base


class PlatformSetting(Base):
    __tablename__ = "platform_settings"

    key = Column(String(80), primary_key=True)
    value = Column(JSONB, nullable=False, default=dict)
    updated_by = Column(Integer, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
