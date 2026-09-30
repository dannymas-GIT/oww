"""Pipeline / engagement tracking events."""

from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB

from app.db.base_class import Base


class EngagementEvent(Base):
    __tablename__ = "engagement_events"

    id = Column(Integer, primary_key=True, index=True)
    actor_user_id = Column(Integer, nullable=True, index=True)
    actor_type = Column(String(50), nullable=True)
    event_type = Column(String(100), nullable=False, index=True)
    stage = Column(String(50), nullable=True, index=True)
    region = Column(String(100), nullable=True, index=True)
    career_stage = Column(String(100), nullable=True, index=True)
    state_code = Column(String(2), nullable=False, default="NY", index=True)
    source = Column(String(100), nullable=True)
    entity_type = Column(String(50), nullable=True)
    entity_id = Column(Integer, nullable=True)
    payload = Column(JSONB, nullable=False, default=dict)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
