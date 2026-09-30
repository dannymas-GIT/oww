"""Impersonation sessions and demo persona catalog (View as role)."""

from __future__ import annotations

import uuid

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

from app.db.base_class import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class ImpersonationSession(Base):
    __tablename__ = "impersonation_sessions"

    id = Column(String(36), primary_key=True, default=_uuid)
    actor_user_id = Column(Integer, nullable=False, index=True)
    target_user_id = Column(Integer, nullable=False, index=True)
    persona_key = Column(String(80), nullable=True, index=True)
    mode = Column(String(20), nullable=False, default="preview")  # preview | act
    reason = Column(Text, nullable=True)
    started_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    ip_address = Column(String(64), nullable=True)
    user_agent = Column(String(512), nullable=True)


class ImpersonationEvent(Base):
    __tablename__ = "impersonation_events"

    id = Column(String(36), primary_key=True, default=_uuid)
    session_id = Column(String(36), nullable=False, index=True)
    method = Column(String(16), nullable=False)
    path = Column(String(512), nullable=False)
    status_code = Column(Integer, nullable=False, default=200)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class DemoPersona(Base):
    __tablename__ = "demo_personas"

    persona_key = Column(String(80), primary_key=True)
    user_id = Column(Integer, nullable=False, index=True)
    tier = Column(String(20), nullable=False)  # community | utility | state | national
    label = Column(String(255), nullable=False)
    subtitle = Column(String(512), nullable=True)
    narrative_bullets = Column(JSONB, nullable=False, default=list)
    sort_order = Column(Integer, nullable=False, default=0)
    state_code = Column(String(2), nullable=True, index=True)
    is_active = Column(Boolean, nullable=False, default=True)
