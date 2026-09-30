"""Login / session access audit for platform monitoring."""

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String

from app.db.base_class import Base


class LoginEvent(Base):
    __tablename__ = "login_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True, index=True)
    identifier = Column(String(255), nullable=False, index=True)  # username/email attempted (never password)
    success = Column(Boolean, nullable=False, default=False, index=True)
    method = Column(String(30), nullable=False, default="password", index=True)  # password | otp
    ip_address = Column(String(64), nullable=True)
    user_agent = Column(String(512), nullable=True)
    state_code = Column(String(2), nullable=True, index=True)
    failure_reason = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
