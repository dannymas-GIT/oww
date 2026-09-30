"""One-time login codes."""

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String

from app.db.base_class import Base


class OtpCode(Base):
    __tablename__ = "otp_codes"

    id = Column(Integer, primary_key=True, index=True)
    destination = Column(String(255), nullable=False, index=True)
    channel = Column(String(20), nullable=False, default="email")  # email | sms
    code_hash = Column(String(255), nullable=False)
    purpose = Column(String(50), nullable=False, default="login")
    expires_at = Column(DateTime, nullable=False)
    consumed = Column(Boolean, default=False, nullable=False)
    attempts = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
