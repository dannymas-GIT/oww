"""Communications portal: audience resolution + send via outbound stubs."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.models.communication import Communication
from app.models.membership import Membership
from app.models.user import User
from app.services.membership_service import ACTIVE_STATUSES, effective_status, expiring_within
from app.services.outbound_service import send_email, send_sms


def resolve_audience(db: Session, audience: dict[str, Any], state: Optional[str] = None) -> list[User]:
    q = db.query(User).filter(User.is_active.is_(True))
    state_code = (audience.get("state_code") or state or "").upper()
    if state_code:
        q = q.filter(User.state_code == state_code)
    users = q.all()
    roles = set(audience.get("roles") or [])
    if roles:
        users = [u for u in users if set(u.roles or []) & roles]

    status_filter = audience.get("membership_status") or "any"
    if status_filter != "any":
        memberships = db.query(Membership).all()
        by_user: dict[int, Membership] = {}
        by_org: dict[int, Membership] = {}
        for m in memberships:
            if m.user_id and m.user_id not in by_user:
                by_user[m.user_id] = m
            if m.org_id and m.org_id not in by_org:
                by_org[m.org_id] = m
        expiring_ids = {m.user_id for m in expiring_within(db, int(audience.get("expiring_days") or 30), state_code or None)} | {m.org_id for m in expiring_within(db, int(audience.get("expiring_days") or 30), state_code or None)}

        def matches(u: User) -> bool:
            m = by_user.get(u.id) or (by_org.get(u.org_id) if u.org_id else None)
            st = effective_status(m) if m else "none"
            if status_filter == "none":
                return m is None
            if status_filter == "active":
                return st in ACTIVE_STATUSES
            if status_filter == "expired":
                return st in ("expired", "canceled")
            if status_filter == "expiring":
                return st in ACTIVE_STATUSES and (u.id in expiring_ids or (u.org_id and u.org_id in expiring_ids))
            return True

        users = [u for u in users if matches(u)]
    return users


def to_dict(c: Communication) -> dict[str, Any]:
    return {
        "id": c.id,
        "subject": c.subject,
        "body": c.body,
        "channel": c.channel,
        "audience": c.audience or {},
        "status": c.status,
        "recipient_count": c.recipient_count or 0,
        "sent_at": c.sent_at.isoformat() if c.sent_at else None,
        "created_at": c.created_at.isoformat() if c.created_at else None,
        "state_code": c.state_code,
    }


def send(db: Session, comm: Communication, state: Optional[str] = None) -> Communication:
    recipients = resolve_audience(db, comm.audience or {}, state)
    sent = 0
    for u in recipients:
        body = comm.body.replace("{{name}}", u.full_name or u.username)
        if comm.channel == "sms" and u.phone:
            if send_sms(u.phone, body):
                sent += 1
        elif u.email:
            if send_email(u.email, comm.subject, body):
                sent += 1
    comm.status = "sent"
    comm.sent_at = datetime.utcnow()
    comm.recipient_count = sent
    db.commit()
    return comm


RENEWAL_TEMPLATE = (
    "Hi {{name}},\n\nYour One Water Workforce membership renews soon. "
    "Keep uninterrupted access to postings, matching, and reporting by confirming your renewal in Billing.\n\n"
    "— {partner_short} One Water Workforce"
)
