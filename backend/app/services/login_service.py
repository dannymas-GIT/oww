"""Record and summarize login events for platform admin dashboards."""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.login_event import LoginEvent
from app.models.user import User


def record_login(
    db: Session,
    *,
    identifier: str,
    success: bool,
    method: str = "password",
    user: Optional[User] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    failure_reason: Optional[str] = None,
) -> LoginEvent:
    ident = (identifier or "").strip()[:255] or "(unknown)"
    ua = (user_agent or "")[:512] or None
    ev = LoginEvent(
        user_id=user.id if user else None,
        identifier=ident,
        success=success,
        method=method,
        ip_address=(ip_address or "")[:64] or None,
        user_agent=ua,
        state_code=(user.state_code if user else None),
        failure_reason=(failure_reason or None) if not success else None,
        created_at=datetime.utcnow(),
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return ev


def _client_meta(request) -> tuple[Optional[str], Optional[str]]:
    if request is None:
        return None, None
    forwarded = request.headers.get("x-forwarded-for")
    ip = (forwarded.split(",")[0].strip() if forwarded else None) or (request.client.host if request.client else None)
    ua = request.headers.get("user-agent")
    return ip, ua


def record_from_request(
    db: Session,
    request,
    *,
    identifier: str,
    success: bool,
    method: str = "password",
    user: Optional[User] = None,
    failure_reason: Optional[str] = None,
) -> LoginEvent:
    ip, ua = _client_meta(request)
    return record_login(
        db,
        identifier=identifier,
        success=success,
        method=method,
        user=user,
        ip_address=ip,
        user_agent=ua,
        failure_reason=failure_reason,
    )


def event_to_dict(ev: LoginEvent, user: Optional[User] = None) -> dict[str, Any]:
    return {
        "id": ev.id,
        "user_id": ev.user_id,
        "identifier": ev.identifier,
        "success": ev.success,
        "method": ev.method,
        "ip_address": ev.ip_address,
        "user_agent": ev.user_agent,
        "state_code": ev.state_code,
        "failure_reason": ev.failure_reason,
        "created_at": ev.created_at.isoformat() if ev.created_at else None,
        "user_name": (user.full_name or user.username) if user else None,
        "user_email": user.email if user else None,
        "user_roles": list(user.roles or []) if user else [],
    }


def login_stats(db: Session, *, state_code: Optional[str] = None, days: int = 30) -> dict[str, Any]:
    since = datetime.utcnow() - timedelta(days=days)
    since_7 = datetime.utcnow() - timedelta(days=7)
    since_1 = datetime.utcnow() - timedelta(days=1)

    def _base(q_since: datetime):
        q = db.query(LoginEvent).filter(LoginEvent.created_at >= q_since)
        if state_code:
            q = q.filter(LoginEvent.state_code == state_code)
        return q

    success_30 = _base(since).filter(LoginEvent.success.is_(True)).count()
    fail_30 = _base(since).filter(LoginEvent.success.is_(False)).count()
    success_7 = _base(since_7).filter(LoginEvent.success.is_(True)).count()
    success_1 = _base(since_1).filter(LoginEvent.success.is_(True)).count()

    unique_q = db.query(func.count(func.distinct(LoginEvent.user_id))).filter(
        LoginEvent.created_at >= since,
        LoginEvent.success.is_(True),
        LoginEvent.user_id.isnot(None),
    )
    if state_code:
        unique_q = unique_q.filter(LoginEvent.state_code == state_code)
    unique_users_30 = unique_q.scalar() or 0

    by_method_rows = (
        db.query(LoginEvent.method, func.count(LoginEvent.id))
        .filter(LoginEvent.created_at >= since, LoginEvent.success.is_(True))
    )
    if state_code:
        by_method_rows = by_method_rows.filter(LoginEvent.state_code == state_code)
    by_method = [{"method": m or "unknown", "count": c} for m, c in by_method_rows.group_by(LoginEvent.method).all()]

    # Daily successful logins (last 14 days)
    day_since = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=13)
    day_q = db.query(LoginEvent).filter(
        LoginEvent.created_at >= day_since,
        LoginEvent.success.is_(True),
    )
    if state_code:
        day_q = day_q.filter(LoginEvent.state_code == state_code)
    day_map: dict[str, int] = {}
    for ev in day_q.all():
        if not ev.created_at:
            continue
        key = ev.created_at.date().isoformat()
        day_map[key] = day_map.get(key, 0) + 1
    by_day = []
    for i in range(13, -1, -1):
        d = (datetime.utcnow().date() - timedelta(days=i)).isoformat()
        by_day.append({"date": d, "count": int(day_map.get(d, 0))})

    return {
        "logins_today": success_1,
        "logins_7d": success_7,
        "logins_30d": success_30,
        "failed_30d": fail_30,
        "unique_users_30d": unique_users_30,
        "by_method": by_method,
        "by_day": by_day,
    }


def list_logins(
    db: Session,
    *,
    state_code: Optional[str] = None,
    success: Optional[bool] = None,
    limit: int = 100,
) -> list[dict[str, Any]]:
    q = db.query(LoginEvent).order_by(LoginEvent.id.desc())
    if state_code:
        q = q.filter(LoginEvent.state_code == state_code)
    if success is not None:
        q = q.filter(LoginEvent.success.is_(success))
    rows = q.limit(min(limit, 500)).all()
    users = {u.id: u for u in db.query(User).filter(User.id.in_([r.user_id for r in rows if r.user_id])).all()} if rows else {}
    return [event_to_dict(r, users.get(r.user_id) if r.user_id else None) for r in rows]
