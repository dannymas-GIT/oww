
"""One-time passcode generation and verification."""
from __future__ import annotations
import logging
import secrets
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import get_password_hash, verify_password
from app.models.otp_code import OtpCode
from app.services.outbound_service import send_email, send_sms

logger = logging.getLogger(__name__)

def request_otp(db: Session, *, email: str | None = None, phone: str | None = None) -> str:
    if not email and not phone:
        raise ValueError("email or phone required")
    code = f"{secrets.randbelow(1_000_000):06d}"
    destination = (email or phone or "")
    channel = "email" if email else "sms"
    dest = destination.lower() if channel == "email" else destination
    row = OtpCode(
        destination=dest,
        channel=channel,
        code_hash=get_password_hash(code),
        expires_at=datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRE_MINUTES),
        consumed=False,
    )
    db.add(row)
    db.commit()
    msg = f"Your One Water Workforce login code is {code}. It expires in {settings.OTP_EXPIRE_MINUTES} minutes."
    if channel == "email":
        send_email(destination, "OWW login code", msg)
    else:
        send_sms(destination, msg)
    if not settings.EMAIL_ENABLED:
        logger.info("DEV OTP for %s: %s", dest, code)
    return code if not settings.EMAIL_ENABLED else ""

def verify_otp(db: Session, *, code: str, email: str | None = None, phone: str | None = None) -> bool:
    destination = (email or phone or "")
    channel = "email" if email else "sms"
    dest = destination.lower() if channel == "email" else destination
    rows = (
        db.query(OtpCode)
        .filter(
            OtpCode.destination == dest,
            OtpCode.channel == channel,
            OtpCode.consumed.is_(False),
            OtpCode.expires_at > datetime.utcnow(),
        )
        .order_by(OtpCode.id.desc())
        .limit(5)
        .all()
    )
    for row in rows:
        if verify_password(code, row.code_hash):
            row.consumed = True
            db.commit()
            return True
    return False
