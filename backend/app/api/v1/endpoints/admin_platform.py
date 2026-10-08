"""Platform admin: dashboard, memberships, communications, role catalog, user lifecycle."""

from __future__ import annotations

import secrets
from datetime import datetime, timedelta
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.core.security import get_password_hash
from app.db.database import get_db
from app.models.communication import Communication
from app.models.engagement_event import EngagementEvent
from app.models.membership import BillingEvent, Membership, MembershipPlan
from app.models.organization import Organization
from app.models.user import User
from app.models.utility_registration import UtilityRegistration
from app.services import communication_service as comms
from app.services import login_service
from app.services import registration_service
from app.services import role_catalog_service as roles
from app.services.auth_service import user_to_dict
from app.services.engagement_service import track
from app.services.membership_service import effective_status, ensure_default_plans, expiring_within, log_event, membership_to_dict, plan_to_dict, summary

router = APIRouter(prefix="/admin", tags=["admin-platform"])

ADMIN_ROLES = ("platform_admin", "state_admin")
ORG_ADMIN_ROLES = ("platform_admin", "state_admin", "utility_admin")


def _scope_state(user: User) -> Optional[str]:
    return None if user.has_role("platform_admin") else user.state_code


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    full_name: str | None = None
    roles: list[str]
    org_id: int | None = None
    state_code: str | None = None
    phone: str | None = None
    temporary_password: str | None = None


class RolesIn(BaseModel):
    roles: list[str]


class CompIn(BaseModel):
    plan_code: str | None = None
    days: int = 365
    note: str | None = None


class CommunicationIn(BaseModel):
    subject: str
    body: str
    channel: str = "email"
    audience: dict[str, Any] = {}


class SettingsIn(BaseModel):
    utility_registration_review_required: bool | None = None
    registration_notify_email: str | None = None


class RegistrationReviewIn(BaseModel):
    action: str  # verify | suspend | reinstate
    note: str | None = None


# ---------- Dashboard ----------

@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db), user: User = Depends(require_roles(*ADMIN_ROLES))):
    state = _scope_state(user)
    ensure_default_plans(db)
    users_q = db.query(User)
    if state:
        users_q = users_q.filter(User.state_code == state)
    users = users_q.all()
    by_role: dict[str, int] = {}
    for u in users:
        for r in u.roles or []:
            by_role[r] = by_role.get(r, 0) + 1
    since = datetime.utcnow() - timedelta(days=30)
    new_users_30 = len([u for u in users if u.created_at and u.created_at >= since])
    orgs = db.query(Organization).filter(Organization.is_active.is_(True))
    if state:
        orgs = orgs.filter(Organization.state_code == state)
    events_30 = db.query(EngagementEvent).filter(EngagementEvent.created_at >= since)
    if state:
        events_30 = events_30.filter(EngagementEvent.state_code == state)
    recent_comms = db.query(Communication).order_by(Communication.id.desc()).limit(5).all()
    plans = {p.code: p for p in db.query(MembershipPlan).all()}
    expiring = expiring_within(db, 30, state)
    users_by_id = {u.id: u for u in users}
    logins = login_service.login_stats(db, state_code=state, days=30)
    recent_logins = login_service.list_logins(db, state_code=state, limit=12)
    settings = registration_service.get_settings(db)
    return {
        "users_total": len(users),
        "users_active": len([u for u in users if u.is_active]),
        "users_new_30": new_users_30,
        "users_by_role": [{"role": k, "count": v} for k, v in sorted(by_role.items(), key=lambda kv: -kv[1])],
        "organizations": orgs.count(),
        "engagement_events_30": events_30.count(),
        "memberships": summary(db, state),
        "expiring_soon": [membership_to_dict(m, plans.get(m.plan_code), users_by_id.get(m.user_id)) for m in expiring[:8]],
        "recent_communications": [comms.to_dict(c) for c in recent_comms],
        "logins": logins,
        "recent_logins": recent_logins,
        "sample_mode": True,
        "registrations_pending": registration_service.pending_count(db, state),
        "utility_registration_review_required": bool(settings.get("utility_registration_review_required", True)),
    }


@router.get("/logins")
def list_login_events(
    success: bool | None = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*ADMIN_ROLES)),
):
    """Login activity feed for platform / state admins."""
    state = _scope_state(user)
    return {
        "stats": login_service.login_stats(db, state_code=state, days=30),
        "events": login_service.list_logins(db, state_code=state, success=success, limit=limit),
    }


# ---------- Memberships ----------

@router.get("/memberships")
def list_memberships(status: str | None = None, expiring_days: int | None = None, db: Session = Depends(get_db), user: User = Depends(require_roles(*ADMIN_ROLES))):
    state = _scope_state(user)
    ensure_default_plans(db)
    if expiring_days:
        rows = expiring_within(db, expiring_days, state)
    else:
        q = db.query(Membership)
        if state:
            q = q.filter(Membership.state_code == state)
        rows = q.order_by(Membership.id.desc()).all()
    plans = {p.code: p for p in db.query(MembershipPlan).all()}
    users = {u.id: u for u in db.query(User).all()}
    out = [membership_to_dict(m, plans.get(m.plan_code), users.get(m.user_id)) for m in rows]
    if status:
        out = [m for m in out if m["status"] == status]
    return out


@router.get("/memberships/summary")
def memberships_summary(db: Session = Depends(get_db), user: User = Depends(require_roles(*ADMIN_ROLES))):
    ensure_default_plans(db)
    return summary(db, _scope_state(user))


@router.get("/memberships/plans")
def admin_plans(db: Session = Depends(get_db), user: User = Depends(require_roles(*ADMIN_ROLES))):
    ensure_default_plans(db)
    return [plan_to_dict(p) for p in db.query(MembershipPlan).order_by(MembershipPlan.sort_order).all()]


@router.post("/memberships/{membership_id}/extend")
def extend_membership(membership_id: int, body: CompIn, db: Session = Depends(get_db), admin: User = Depends(require_roles("platform_admin"))):
    m = db.query(Membership).filter(Membership.id == membership_id).first()
    if not m:
        raise HTTPException(404)
    base = m.current_period_end if m.current_period_end and m.current_period_end > datetime.utcnow() else datetime.utcnow()
    m.current_period_end = base + timedelta(days=body.days)
    if effective_status(m) not in ("active", "complimentary"):
        m.status = "complimentary"
    m.meta = {**(m.meta or {}), "extended_by": admin.id, "note": body.note}
    db.commit()
    log_event(db, membership=m, user_id=m.user_id, event_type="membership.extended", provider="comp", payload={"days": body.days, "by": admin.id, "note": body.note})
    plan = db.query(MembershipPlan).filter(MembershipPlan.code == m.plan_code).first()
    return membership_to_dict(m, plan, db.query(User).filter(User.id == m.user_id).first())


@router.post("/users/{user_id}/comp-membership")
def comp_membership(user_id: int, body: CompIn, db: Session = Depends(get_db), admin: User = Depends(require_roles("platform_admin"))):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(404)
    ensure_default_plans(db)
    plan_code = body.plan_code or ("utility_annual" if u.has_any_role("utility_admin", "utility_manager") else "employer_annual")
    plan = db.query(MembershipPlan).filter(MembershipPlan.code == plan_code).first()
    if not plan:
        raise HTTPException(404, "Plan not found")
    now = datetime.utcnow()
    m = Membership(user_id=u.id, org_id=u.org_id if plan.audience in ("employer", "utility") else None, state_code=u.state_code, plan_code=plan.code, status="complimentary", provider="comp", current_period_start=now, current_period_end=now + timedelta(days=body.days), meta={"granted_by": admin.id, "note": body.note})
    db.add(m)
    db.commit()
    db.refresh(m)
    log_event(db, membership=m, user_id=u.id, event_type="membership.comp_granted", provider="comp", payload={"days": body.days, "by": admin.id})
    return membership_to_dict(m, plan, u)


@router.get("/billing-events")
def billing_events(limit: int = 50, db: Session = Depends(get_db), user: User = Depends(require_roles("platform_admin"))):
    rows = db.query(BillingEvent).order_by(BillingEvent.id.desc()).limit(limit).all()
    return [{"id": e.id, "membership_id": e.membership_id, "user_id": e.user_id, "event_type": e.event_type, "provider": e.provider, "amount_cents": e.amount_cents, "created_at": e.created_at.isoformat() if e.created_at else None} for e in rows]


# ---------- Communications ----------

@router.get("/communications")
def list_comms(db: Session = Depends(get_db), user: User = Depends(require_roles(*ADMIN_ROLES))):
    q = db.query(Communication)
    state = _scope_state(user)
    if state:
        q = q.filter((Communication.state_code == state) | (Communication.state_code.is_(None)))
    return [comms.to_dict(c) for c in q.order_by(Communication.id.desc()).all()]


@router.post("/communications/preview")
def preview_audience(body: CommunicationIn, db: Session = Depends(get_db), user: User = Depends(require_roles(*ADMIN_ROLES))):
    recipients = comms.resolve_audience(db, body.audience, _scope_state(user))
    return {"count": len(recipients), "sample": [{"name": r.full_name or r.username, "email": r.email} for r in recipients[:5]]}


@router.post("/communications")
def create_comm(body: CommunicationIn, db: Session = Depends(get_db), user: User = Depends(require_roles(*ADMIN_ROLES))):
    c = Communication(subject=body.subject, body=body.body, channel=body.channel, audience=body.audience, state_code=_scope_state(user), created_by=user.id)
    db.add(c)
    db.commit()
    db.refresh(c)
    return comms.to_dict(c)


@router.post("/communications/{comm_id}/send")
def send_comm(comm_id: int, db: Session = Depends(get_db), user: User = Depends(require_roles(*ADMIN_ROLES))):
    c = db.query(Communication).filter(Communication.id == comm_id).first()
    if not c:
        raise HTTPException(404)
    if c.status == "sent":
        raise HTTPException(400, "Already sent")
    c = comms.send(db, c, _scope_state(user))
    track(db, event_type="communication_sent", pipeline_stage="engagement", actor_user_id=user.id, state_code=c.state_code or "NY")
    return comms.to_dict(c)


@router.post("/communications/renewal-notices")
def renewal_notices(days: int = 30, db: Session = Depends(get_db), user: User = Depends(require_roles(*ADMIN_ROLES))):
    c = Communication(subject="Your One Water Workforce membership renews soon", body=comms.RENEWAL_TEMPLATE, channel="email", audience={"membership_status": "expiring", "expiring_days": days}, state_code=_scope_state(user), created_by=user.id)
    db.add(c)
    db.commit()
    db.refresh(c)
    c = comms.send(db, c, _scope_state(user))
    return comms.to_dict(c)


# ---------- Roles + user lifecycle ----------

@router.get("/roles/catalog")
def role_catalog(user: User = Depends(get_current_user)):
    return {"roles": roles.catalog(), "assignable": sorted(roles.assignable_roles_for(user.roles or []))}


@router.post("/users", status_code=201)
def create_user(body: UserCreate, db: Session = Depends(get_db), admin: User = Depends(require_roles(*ORG_ADMIN_ROLES))):
    rejected = roles.validate_assignment(admin.roles or [], body.roles)
    if rejected:
        raise HTTPException(403, f"You cannot assign: {', '.join(rejected)}")
    if db.query(User).filter((User.username == body.username) | (User.email == body.email.lower())).first():
        raise HTTPException(409, "Username or email already exists")
    org_id = body.org_id
    if admin.has_role("utility_admin") and not admin.has_any_role(*ADMIN_ROLES):
        org_id = admin.org_id  # IDOR-safe: utility admins only create within their own org
    temp = body.temporary_password or secrets.token_urlsafe(10)
    u = User(username=body.username, email=body.email.lower(), full_name=body.full_name, roles=body.roles, org_id=org_id, phone=body.phone, state_code=(body.state_code or admin.state_code or "NY").upper(), is_active=True, contact_prefs={"must_change_password": True})
    u.hashed_password = get_password_hash(temp)
    db.add(u)
    db.commit()
    db.refresh(u)
    track(db, event_type="user_created", pipeline_stage="engagement", actor_user_id=admin.id, state_code=u.state_code)
    return {**user_to_dict(u), "temporary_password": temp}


@router.put("/users/{user_id}/roles")
def set_roles(user_id: int, body: RolesIn, db: Session = Depends(get_db), admin: User = Depends(require_roles(*ORG_ADMIN_ROLES))):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(404)
    if admin.has_role("utility_admin") and not admin.has_any_role(*ADMIN_ROLES) and u.org_id != admin.org_id:
        raise HTTPException(403, "Outside your organization")
    current_protected = set(u.roles or []) & roles.PROTECTED_ROLES
    rejected = roles.validate_assignment(admin.roles or [], set(body.roles) - current_protected)
    if rejected:
        raise HTTPException(403, f"You cannot assign: {', '.join(rejected)}")
    if current_protected and not admin.has_role("platform_admin") and not current_protected.issubset(set(body.roles)):
        raise HTTPException(403, "Cannot remove protected roles")
    u.roles = sorted(set(body.roles))
    db.commit()
    track(db, event_type="user_roles_changed", pipeline_stage="engagement", actor_user_id=admin.id, state_code=u.state_code)
    return user_to_dict(u)


@router.get("/org-users")
def org_users(db: Session = Depends(get_db), admin: User = Depends(require_roles("utility_admin", "employer", "employer_admin"))):
    if not admin.org_id:
        return []
    return [user_to_dict(u) for u in db.query(User).filter(User.org_id == admin.org_id).order_by(User.id).all()]


@router.get("/organizations")
def organizations(db: Session = Depends(get_db), user: User = Depends(require_roles(*ADMIN_ROLES))):
    q = db.query(Organization).filter(Organization.is_active.is_(True))
    state = _scope_state(user)
    if state:
        q = q.filter(Organization.state_code == state)
    return [{"id": o.id, "name": o.name, "state_code": o.state_code, "region": o.region} for o in q.order_by(Organization.name).all()]


# ---------- Platform settings ----------

@router.get("/settings")
def get_platform_settings(db: Session = Depends(get_db), user: User = Depends(require_roles(*ADMIN_ROLES))):
    return registration_service.get_settings(db)


@router.put("/settings")
def put_platform_settings(body: SettingsIn, db: Session = Depends(get_db), admin: User = Depends(require_roles("platform_admin"))):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(400, "No settings to update")
    return registration_service.set_settings(db, updates, admin)


# ---------- Utility registrations (Jenny review queue) ----------

@router.get("/registrations")
def list_utility_registrations(
    status: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*ADMIN_ROLES)),
):
    return registration_service.list_registrations(db, status=status, state_code=_scope_state(user))


@router.post("/registrations/{registration_id}/review")
def review_utility_registration(
    registration_id: int,
    body: RegistrationReviewIn,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles(*ADMIN_ROLES)),
):
    reg = db.query(UtilityRegistration).filter(UtilityRegistration.id == registration_id).first()
    if not reg:
        raise HTTPException(404, "Registration not found")
    state = _scope_state(admin)
    if state and reg.state_code != state:
        raise HTTPException(403, "Outside your state")
    reg = registration_service.review(db, reg, action=body.action, admin=admin, note=body.note)
    user = db.query(User).filter(User.id == reg.user_id).first()
    membership = None
    if user:
        from app.services.membership_service import current_membership_for_user

        membership = current_membership_for_user(db, user)
    return registration_service.registration_to_dict(reg, membership=membership, reviewer=admin)
