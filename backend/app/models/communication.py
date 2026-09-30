"""Admin communications portal (email campaigns + renewal notices)."""

from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB

from app.db.base_class import Base


class Communication(Base):
    __tablename__ = "communications"

    id = Column(Integer, primary_key=True)
    state_code = Column(String(2), nullable=True, index=True)
    subject = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    channel = Column(String(20), nullable=False, default="email")  # email | sms
    audience = Column(JSONB, nullable=False, default=dict)
    # {"roles": [...], "membership_status": "active|expiring|expired|none|any", "state_code": "NY"}
    status = Column(String(20), nullable=False, default="draft", index=True)  # draft | sent
    recipient_count = Column(Integer, default=0)
    sent_at = Column(DateTime, nullable=True)
    created_by = Column(Integer, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
