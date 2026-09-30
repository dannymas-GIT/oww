
"""Email / SMS / webhook outbound (logs when credentials missing)."""
from __future__ import annotations
import logging
from typing import Any, Optional
import requests
from app.core.config import settings

logger = logging.getLogger(__name__)

def send_email(to: str, subject: str, body: str) -> bool:
    if not settings.EMAIL_ENABLED or not settings.SMTP_HOST:
        logger.info("[email stub] to=%s subject=%s body=%s", to, subject, body[:200])
        return True
    try:
        import smtplib
        from email.message import EmailMessage
        msg = EmailMessage()
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        msg["To"] = to
        msg["Subject"] = subject
        msg.set_content(body)
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as s:
            s.starttls()
            if settings.SMTP_USER:
                s.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            s.send_message(msg)
        return True
    except Exception as exc:
        logger.warning("email failed: %s", exc)
        return False

def send_sms(to: str, body: str) -> bool:
    if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
        logger.info("[sms stub] to=%s body=%s", to, body[:200])
        return True
    try:
        from twilio.rest import Client
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        client.messages.create(to=to, from_=settings.TWILIO_FROM_NUMBER, body=body)
        return True
    except Exception as exc:
        logger.warning("sms failed: %s", exc)
        return False

def post_webhook(payload: dict[str, Any], url: Optional[str] = None) -> bool:
    target = url or settings.CRM_WEBHOOK_URL
    if not target:
        logger.info("[webhook stub] %s", payload)
        return True
    try:
        requests.post(target, json=payload, timeout=10).raise_for_status()
        return True
    except Exception as exc:
        logger.warning("webhook failed: %s", exc)
        return False
