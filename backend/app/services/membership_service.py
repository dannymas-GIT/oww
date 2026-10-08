"""Membership state, paywall dependency, admin summaries."""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Optional

from fastapi import Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.membership import BillingEvent, Membership, MembershipPlan
from app.models.user import User

ACTIVE_STATUSES = ("active", "complimentary", "past_due")

# Placeholder pricing for sample/demo mode.
# NYSAWWA sets real prices in the Stripe Dashboard; these seed defaults are for the sample paywall.
DEFAULT_PLANS: list[dict[str, Any]] = [
    {"code": "individual_free", "name": "Individual", "audience": "individual", "price_cents": 0, "interval": "year",
     "description": "Job seekers, students, and career changers.",
     "features": ["Profile + matching questionnaire", "Job board & alerts", "Apply to openings", "Resume bank opt-in"], "sort_order": 1},
    {"code": "educator_free", "name": "Educator", "audience": "educator", "price_cents": 0, "interval": "year",
     "description": "Schools, BOCES, and training providers.",
     "features": ["Publish courses & events", "Submit workforce programs", "Outreach toolkits"], "sort_order": 2},
    {"code": "employer_annual", "name": "Employer", "audience": "employer", "price_cents": 49900, "interval": "year",
     "description": "Consultants, contractors, labs, and industry partners.",
     "features": ["Unlimited job postings", "Candidate search & resume bank", "Applicant tracking", "Messaging & interviews", "Match digests"], "sort_order": 3},
    {"code": "utility_annual", "name": "Utility", "audience": "utility", "price_cents": 79900, "interval": "year",
     "description": "Municipal and private water / wastewater utilities.",
     "features": ["Everything in Employer", "Utility admin + manager seats", "Team member accounts", "Priority featured postings", "Workforce outcome reporting"], "sort_order": 4},
]


def ensure_default_plans(db: Session) -> None:
    existing = {p.code for p in db.query(MembershipPlan).all()}
    for spec in DEFAULT_PLANS:
        if spec["code"] not in existing:
            db.add(MembershipPlan(**spec))
    db.commit()


def plan_to_dict(p: MembershipPlan) -> dict[str, Any]:
    return {
        "id": p.id,
        "code": p.code,
        "name": p.name,
        "audience": p.audience,
        "description": p.description,
        "price_cents": p.price_cents,
        "interval": p.interval,
        "features": p.features or [],
        "is_active": p.is_active,
        "stripe_price_id": p.stripe_price_id,
        "sample_pricing": True,
    }


def membership_to_dict(m: Membership, plan: Optional[MembershipPlan] = None, user: Optional[User] = None) -> dict[str, Any]:
    now = datetime.utcnow()
    days_left = None
    if m.current_period_end:
        days_left = (m.current_period_end - now).days
    return {
        "id": m.id,
        "user_id": m.user_id,
        "org_id": m.org_id,
        "state_code": m.state_code,
        "plan_code": m.plan_code,
        "plan_name": plan.name if plan else m.plan_code,
        "price_cents": plan.price_cents if plan else None,
        "status": effective_status(m),
        "provider": m.provider,
        "current_period_start": m.current_period_start.isoformat() if m.current_period_start else None,
        "current_period_end": m.current_period_end.isoformat() if m.current_period_end else None,
        "days_left": days_left,
        "cancel_at_period_end": m.cancel_at_period_end,
        "canceled_at": m.canceled_at.isoformat() if m.canceled_at else None,
        "member_name": (user.full_name or user.username) if user else None,
        "member_email": user.email if user else None,
        "created_at": m.created_at.isoformat() if m.created_at else None,
    }


def effective_status(m: Membership) -> str:
    if m.status in ("active", "complimentary", "past_due") and m.current_period_end and m.current_period_end < datetime.utcnow():
        return "expired"
    return m.status


def current_membership_for_user(db: Session, user: User) -> Optional[Membership]:
    q = db.query(Membership).filter(
        or_(Membership.user_id == user.id, Membership.org_id == (user.org_id or -1))
    ).order_by(Membership.id.desc())
    rows = q.all()
    active = [m for m in rows if effective_status(m) in ACTIVE_STATUSES]
    if active:
        return active[0]
    return rows[0] if rows else None


def has_active_membership(db: Session, user: User, audiences: tuple[str, ...] | None = None) -> bool:
    if user.has_role("platform_admin") or user.has_role("state_admin"):
        return True
    # Suspended utilities (Jenny review) lose paid entitlements until reinstated
    if user.org_id:
        from app.models.organization import Organization

        org = db.query(Organization).filter(Organization.id == user.org_id).first()
        if org and not org.is_active:
            return False
    m = current_membership_for_user(db, user)
    if not m or effective_status(m) not in ACTIVE_STATUSES:
        return False
    if audiences:
        plan = db.query(MembershipPlan).filter(MembershipPlan.code == m.plan_code).first()
        return bool(plan and plan.audience in audiences)
    return True


def require_membership(*audiences: str):
    """FastAPI dependency: 402 with plan hints when the caller lacks an active membership."""

    def _dep(db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> User:
        if has_active_membership(db, user, audiences or None):
            return user
        plans = db.query(MembershipPlan).filter(MembershipPlan.is_active.is_(True))
        if audiences:
            plans = plans.filter(MembershipPlan.audience.in_(audiences))
        raise HTTPException(
            status_code=402,
            detail={
                "code": "membership_required",
                "message": "An active membership is required for this feature.",
                "plans": [p.code for p in plans.all()],
            },
        )

    return _dep


def log_event(db: Session, *, membership: Optional[Membership], user_id: Optional[int], event_type: str, provider: str, amount_cents: Optional[int] = None, payload: Optional[dict] = None) -> None:
    db.add(BillingEvent(
        membership_id=membership.id if membership else None,
        user_id=user_id,
        event_type=event_type,
        provider=provider,
        amount_cents=amount_cents,
        payload=payload or {},
    ))
    db.commit()


def expiring_within(db: Session, days: int, state: Optional[str] = None) -> list[Membership]:
    now = datetime.utcnow()
    horizon = now + timedelta(days=days)
    q = db.query(Membership).filter(
        Membership.status.in_(ACTIVE_STATUSES),
        Membership.current_period_end.isnot(None),
        Membership.current_period_end >= now,
        Membership.current_period_end <= horizon,
    )
    if state:
        q = q.filter(Membership.state_code == state)
    return q.order_by(Membership.current_period_end).all()


def summary(db: Session, state: Optional[str] = None) -> dict[str, Any]:
    q = db.query(Membership)
    if state:
        q = q.filter(Membership.state_code == state)
    rows = q.all()
    plans = {p.code: p for p in db.query(MembershipPlan).all()}
    now = datetime.utcnow()
    counts = {"active": 0, "complimentary": 0, "past_due": 0, "pending": 0, "canceled": 0, "expired": 0}
    arr_cents = 0
    by_plan: dict[str, int] = {}
    for m in rows:
        st = effective_status(m)
        counts[st] = counts.get(st, 0) + 1
        if st in ("active", "past_due"):
            plan = plans.get(m.plan_code)
            if plan:
                arr_cents += plan.price_cents if plan.interval == "year" else plan.price_cents * 12
        if st in ACTIVE_STATUSES:
            by_plan[m.plan_code] = by_plan.get(m.plan_code, 0) + 1
    exp30 = len(expiring_within(db, 30, state))
    exp60 = len(expiring_within(db, 60, state))
    recent_expired = [m for m in rows if effective_status(m) == "expired" and m.current_period_end and (now - m.current_period_end).days <= 90]
    return {
        "counts": counts,
        "active_total": counts["active"] + counts["complimentary"] + counts["past_due"],
        "expiring_30": exp30,
        "expiring_60": exp60,
        "recently_expired_90": len(recent_expired),
        "arr_cents": arr_cents,
        "by_plan": [{"plan_code": k, "plan_name": plans[k].name if k in plans else k, "count": v} for k, v in sorted(by_plan.items())],
        "sample_pricing": True,
    }
