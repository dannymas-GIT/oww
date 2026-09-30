"""Favorites / follows (jobs or organizations)."""

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String

from app.db.base_class import Base


class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    entity_type = Column(String(50), nullable=False, index=True)  # job | organization
    entity_id = Column(Integer, nullable=False, index=True)
    alerts_enabled = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
