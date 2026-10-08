"""Utility self-registration: platform settings, queue, review/suspend."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.membership import Membership, MembershipPlan
from app.models.organization import Organization
from app.models.platform_setting import PlatformSetting
from app.models.user import User
from app.models.utility_registration import UtilityRegistration
from app.services.engagement_service import track
from app.services.membership_service import current_membership_for_user, effective_status
from app.services.outbound_service import send_email

DEFAULT_SETTINGS: dict[str, Any] = {
    "utility_registration_review_required": True,
    "registration_notify_email": "jenny@nysawwa.org",
}

KNOWN_SETTING_KEYS = set(DEFAULT_SETTINGS.keys())

REVIEW_ACTIONS = ("verify", "suspend", "reinstate")
ACTIVE_REVIEW_STATUSES = ("pending_review", "verified", "not_required")


def get_settings(db: Session) -> dict[str, Any]:
    """Return merged platform settings with defaults + update metadata."""
    out = dict(DEFAULT_SETTINGS)
    meta: dict[str, Any] = {"updated_by": None, "updated_at": None, "updated_by_name": None}
    rows = db.query(PlatformSetting).all()
    latest: Optional[PlatformSetting] = None
    for row in rows:
        if row.key in KNOWN_SETTING_KEYS:
            out[row.key] = row.value.get("value") if isinstance(row.value, dict) and "value" in row.value else row.value
        if latest is None or (row.updated_at and (not latest.updated_at or row.updated_at > latest.updated_at)):
            latest = row
    if latest:
        meta["updated_by"] = latest.updated_by
        meta["updated_at"] = latest.updated_at.isoformat() if latest.updated_at else None
        if latest.updated_by:
            admin = db.query(User).filter(User.id == latest.updated_by).first()
            meta["updated_by_name"] = (admin.full_name or admin.username) if admin else None
    return {**out, **meta}


def set_settings(db: Session, updates: dict[str, Any], admin: User) -> dict[str, Any]:
    unknown = sorted(set(updates.keys()) - KNOWN_SETTING_KEYS)
    if unknown:
        raise HTTPException(400, f"Unknown settings: {', '.join(unknown)}")
    now = datetime.utcnow()
    for key, val in updates.items():
        if key == "utility_registration_review_required":
            val = bool(val)
        elif key == "registration_notify_email":
            val = str(val or "").strip().lower()
            if val and "@" not in val:
                raise HTTPException(400, "registration_notify_email must be a valid email")
        row = db.query(PlatformSetting).filter(PlatformSetting.key == key).first()
        if not row:
            row = PlatformSetting(key=key)
            db.add(row)
        row.value = {"value": val}
        row.updated_by = admin.id
        row.updated_at = now
    db.commit()
    return get_settings(db)


def review_required(db: Session) -> bool:
    settings = get_settings(db)
    return bool(settings.get("utility_registration_review_required", True))


def create_utility_registration(
    db: Session,
    *,
    org: Organization,
    user: User,
    utility_name: str,
    contact_name: str,
    contact_email: str,
    phone: str | None = None,
    website: str | None = None,
    job_title: str | None = None,
) -> UtilityRegistration:
    needs_review = review_required(db)
    status = "pending_review" if needs_review else "not_required"
    reg = UtilityRegistration(
        org_id=org.id,
        user_id=user.id,
        state_code=(user.state_code or org.state_code or "NY").upper()[:2],
        utility_name=utility_name,
        contact_name=contact_name,
        contact_email=contact_email.lower(),
        phone=phone,
        website=website,
        job_title=job_title,
        status=status,
        review_required=needs_review,
        meta={},
    )
    db.add(reg)
    db.flush()

    track(
        db,
        event_type="utility_registration_submitted",
        pipeline_stage="engagement",
        actor_user_id=user.id,
        state_code=reg.state_code,
    )

    settings = get_settings(db)
    notify = settings.get("registration_notify_email") or DEFAULT_SETTINGS["registration_notify_email"]
    if needs_review and notify:
        send_email(
            notify,
            f"New utility registration: {utility_name}",
            f"{contact_name} ({contact_email}) registered {utility_name} ({reg.state_code}). "
            f"Review in Administration → Utility registrations.",
        )
    if user.email:
        send_email(
            user.email,
            "Welcome to One Water Workforce",
            f"Hi {contact_name},\n\nYour utility account for {utility_name} is set up. "
            f"Complete membership payment to unlock hiring tools and Water Workforce 360."
            + (
                "\n\nNYSAWWA may review your registration; you can use the platform while that review is in progress."
                if needs_review
                else ""
            ),
        )
    return reg


def org_is_suspended(db: Session, org_id: int | None) -> bool:
    if not org_id:
        return False
    org = db.query(Organization).filter(Organization.id == org_id).first()
    return bool(org and not org.is_active)


def registration_to_dict(
    reg: UtilityRegistration,
    *,
    membership: Membership | None = None,
    plan: MembershipPlan | None = None,
    reviewer: User | None = None,
) -> dict[str, Any]:
    pay_status = None
    if membership:
        pay_status = effective_status(membership)
    return {
        "id": reg.id,
        "org_id": reg.org_id,
        "user_id": reg.user_id,
        "state_code": reg.state_code,
        "utility_name": reg.utility_name,
        "contact_name": reg.contact_name,
        "contact_email": reg.contact_email,
        "phone": reg.phone,
        "website": reg.website,
        "job_title": reg.job_title,
        "status": reg.status,
        "review_required": reg.review_required,
        "reviewed_by": reg.reviewed_by,
        "reviewed_by_name": (reviewer.full_name or reviewer.username) if reviewer else None,
        "reviewed_at": reg.reviewed_at.isoformat() if reg.reviewed_at else None,
        "review_note": reg.review_note,
        "payment_status": pay_status,
        "plan_code": membership.plan_code if membership else None,
        "created_at": reg.created_at.isoformat() if reg.created_at else None,
        "updated_at": reg.updated_at.isoformat() if reg.updated_at else None,
    }


def review(
    db: Session,
    reg: UtilityRegistration,
    *,
    action: str,
    admin: User,
    note: str | None = None,
) -> UtilityRegistration:
    action = (action or "").strip().lower()
    if action not in REVIEW_ACTIONS:
        raise HTTPException(400, f"action must be one of: {', '.join(REVIEW_ACTIONS)}")

    org = db.query(Organization).filter(Organization.id == reg.org_id).first()
    user = db.query(User).filter(User.id == reg.user_id).first()
    now = datetime.utcnow()

    if action == "verify":
        if reg.status == "suspended":
            raise HTTPException(400, "Reinstate a suspended registration before verifying")
        reg.status = "verified"
        if org and not org.is_active:
            org.is_active = True
        event = "utility_registration_verified"
    elif action == "suspend":
        if not (note or "").strip():
            raise HTTPException(400, "A note is required when suspending")
        reg.status = "suspended"
        if org:
            org.is_active = False
        event = "utility_registration_suspended"
        if user and user.email:
            send_email(
                user.email,
                "Your One Water Workforce account was suspended",
                f"Hi {reg.contact_name},\n\nYour utility account for {reg.utility_name} has been "
                f"suspended by NYSAWWA.\n\nReason: {note.strip()}\n\nContact NYSAWWA if you have questions.",
            )
    else:  # reinstate
        if reg.status != "suspended":
            raise HTTPException(400, "Only suspended registrations can be reinstated")
        reg.status = "verified" if reg.review_required else "not_required"
        if org:
            org.is_active = True
        event = "utility_registration_reinstated"
        if user and user.email:
            send_email(
                user.email,
                "Your One Water Workforce account was reinstated",
                f"Hi {reg.contact_name},\n\nYour utility account for {reg.utility_name} has been "
                f"reinstated. You can sign in and continue using hiring tools and Water Workforce 360.",
            )

    reg.reviewed_by = admin.id
    reg.reviewed_at = now
    reg.review_note = (note or "").strip() or reg.review_note
    reg.updated_at = now
    db.commit()
    db.refresh(reg)

    track(
        db,
        event_type=event,
        pipeline_stage="engagement",
        actor_user_id=admin.id,
        state_code=reg.state_code,
    )
    return reg


def list_registrations(
    db: Session,
    *,
    status: str | None = None,
    state_code: str | None = None,
) -> list[dict[str, Any]]:
    q = db.query(UtilityRegistration)
    if state_code:
        q = q.filter(UtilityRegistration.state_code == state_code.upper())
    if status and status != "all":
        q = q.filter(UtilityRegistration.status == status)
    rows = q.order_by(UtilityRegistration.id.desc()).all()
    users = {u.id: u for u in db.query(User).all()}
    out: list[dict[str, Any]] = []
    for reg in rows:
        user = users.get(reg.user_id)
        membership = current_membership_for_user(db, user) if user else None
        if not membership and reg.org_id:
            membership = (
                db.query(Membership)
                .filter(Membership.org_id == reg.org_id)
                .order_by(Membership.id.desc())
                .first()
            )
        reviewer = users.get(reg.reviewed_by) if reg.reviewed_by else None
        out.append(registration_to_dict(reg, membership=membership, reviewer=reviewer))
    return out


def pending_count(db: Session, state_code: str | None = None) -> int:
    q = db.query(UtilityRegistration).filter(UtilityRegistration.status == "pending_review")
    if state_code:
        q = q.filter(UtilityRegistration.state_code == state_code.upper())
    return q.count()
