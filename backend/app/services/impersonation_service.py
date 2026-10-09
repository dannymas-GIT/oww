"""View-as-role / impersonation for platform and state admins."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.security import create_access_token
from app.models.impersonation import DemoPersona, ImpersonationEvent, ImpersonationSession
from app.models.user import User
from app.services.auth_service import user_to_dict

IMPERSONATION_TTL_MINUTES = 60
PREVIEW_ROLES = {"platform_admin", "state_admin"}
ACT_ROLES = {"platform_admin"}
BLOCKED_TARGET_ROLES = {"platform_admin"}


def impersonation_dict(
    *,
    active: bool,
    mode: str | None = None,
    persona_key: str | None = None,
    target_username: str | None = None,
    session_id: str | None = None,
    expires_at: datetime | None = None,
    actor_username: str | None = None,
    persona_label: str | None = None,
    narrative_bullets: list[str] | None = None,
) -> dict[str, Any]:
    return {
        "active": active,
        "mode": mode,
        "persona_key": persona_key,
        "target_username": target_username,
        "session_id": session_id,
        "expires_at": expires_at.isoformat() if expires_at else None,
        "actor_username": actor_username,
        "persona_label": persona_label,
        "narrative_bullets": narrative_bullets or [],
    }


def user_payload_with_impersonation(user: User, impersonation: dict[str, Any] | None = None) -> dict[str, Any]:
    out = user_to_dict(user)
    out["impersonation"] = impersonation or impersonation_dict(active=False)
    return out


def issue_impersonation_token(
    *,
    actor: User,
    target: User,
    session: ImpersonationSession,
    mode: str,
    persona_key: str | None,
    db: Session | None = None,
) -> dict[str, Any]:
    """JWT sub = target (viewed) user; act_as carries actor + session for AuthZ."""
    token = create_access_token(
        subject=str(target.id),
        expires_delta=timedelta(minutes=IMPERSONATION_TTL_MINUTES),
        extra_claims={
            "roles": target.roles or [],
            "act_as": {
                "session_id": session.id,
                "mode": mode,
                "persona_key": persona_key,
                "actor_user_id": actor.id,
                "actor_username": actor.username,
                "target_user_id": target.id,
                "target_username": target.username,
            },
        },
    )
    persona_label = None
    narrative_bullets: list[str] = []
    if persona_key:
        from sqlalchemy.orm import object_session

        sess = db or object_session(session)
        if sess:
            row = sess.query(DemoPersona).filter(DemoPersona.persona_key == persona_key).first()
            if row:
                persona_label = row.label
                narrative_bullets = list(row.narrative_bullets or [])

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_payload_with_impersonation(
            target,
            impersonation_dict(
                active=True,
                mode=mode,
                persona_key=persona_key,
                target_username=target.username,
                session_id=session.id,
                expires_at=session.expires_at,
                actor_username=actor.username,
                persona_label=persona_label,
                narrative_bullets=narrative_bullets,
            ),
        ),
    }


def _can_start(db: Session, actor: User, target: User, mode: str) -> None:
    actor_roles = set(actor.roles or [])
    target_roles = set(target.roles or [])
    if not target.is_active:
        raise HTTPException(400, "Target user is inactive")
    if actor.id == target.id:
        raise HTTPException(400, "Cannot view as yourself")
    if target_roles & BLOCKED_TARGET_ROLES:
        raise HTTPException(403, "Cannot impersonate platform administrators")
    if mode == "act":
        if not (actor_roles & ACT_ROLES):
            raise HTTPException(403, "Act-as mode requires platform_admin")
        return
    if not (actor_roles & PREVIEW_ROLES):
        raise HTTPException(403, "Preview requires platform or state admin")
    if "state_admin" in actor_roles and "platform_admin" not in actor_roles:
        if (target.state_code or "").upper() != (actor.state_code or "").upper():
            raise HTTPException(403, "Target is outside your state scope")


def start_impersonation(
    db: Session,
    *,
    actor: User,
    target: User,
    mode: str,
    reason: str | None,
    persona_key: str | None,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> ImpersonationSession:
    if mode not in ("preview", "act"):
        raise HTTPException(400, "mode must be preview or act")
    if mode == "act" and not (reason or "").strip():
        raise HTTPException(400, "reason is required for act-as mode")
    _can_start(db, actor, target, mode)

    now = datetime.now(timezone.utc)
    existing = (
        db.query(ImpersonationSession)
        .filter(ImpersonationSession.actor_user_id == actor.id, ImpersonationSession.ended_at.is_(None))
        .all()
    )
    for row in existing:
        row.ended_at = now

    session = ImpersonationSession(
        actor_user_id=actor.id,
        target_user_id=target.id,
        persona_key=persona_key,
        mode=mode,
        reason=(reason or "").strip() or None,
        started_at=now,
        expires_at=now + timedelta(minutes=IMPERSONATION_TTL_MINUTES),
        ip_address=ip_address,
        user_agent=(user_agent or "")[:512] or None,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def stop_impersonation(db: Session, *, actor_id: int, session_id: str | None = None) -> None:
    q = db.query(ImpersonationSession).filter(
        ImpersonationSession.actor_user_id == actor_id,
        ImpersonationSession.ended_at.is_(None),
    )
    if session_id:
        q = q.filter(ImpersonationSession.id == session_id)
    row = q.order_by(ImpersonationSession.started_at.desc()).first()
    if row:
        row.ended_at = datetime.now(timezone.utc)
        db.commit()


def log_event(db: Session, *, session_id: str, method: str, path: str, status_code: int) -> None:
    db.add(ImpersonationEvent(session_id=session_id, method=method.upper(), path=path[:512], status_code=status_code))
    db.commit()


def list_personas_for_actor(db: Session, actor: User) -> list[dict[str, Any]]:
    is_platform = actor.has_role("platform_admin")
    is_state = actor.has_role("state_admin")
    if not is_platform and not is_state:
        return []
    q = (
        db.query(DemoPersona, User)
        .join(User, User.id == DemoPersona.user_id)
        .filter(DemoPersona.is_active.is_(True), User.is_active.is_(True))
        .order_by(DemoPersona.sort_order, DemoPersona.label)
    )
    out: list[dict[str, Any]] = []
    for persona, user in q.all():
        if user.has_role("platform_admin"):
            continue
        if not is_platform and is_state:
            if (persona.state_code or user.state_code or "").upper() != (actor.state_code or "").upper():
                continue
            if persona.tier == "national":
                continue
        out.append(
            {
                "persona_key": persona.persona_key,
                "tier": persona.tier,
                "label": persona.label,
                "subtitle": persona.subtitle,
                "narrative_bullets": persona.narrative_bullets or [],
                "target_user_id": user.id,
                "username": user.username,
                "roles": user.roles or [],
                "state_code": persona.state_code or user.state_code,
                "org_id": user.org_id,
            }
        )
    return out


def ensure_default_personas(db: Session) -> None:
    """Map seeded demo users to View as role personas."""
    specs = [
        (
            "student-explorer",
            "student1",
            "community",
            "Student explorer",
            "High school / college learner",
            [
                "Open Dashboard → profile completeness + free Individual membership",
                "My matches → Exact Matching scores against NY openings",
                "Pathways Interest form + career checklist (no hiring tools)",
            ],
            10,
        ),
        (
            "job-seeker",
            "candidate1",
            "community",
            "Job seeker",
            "Individual with matching profile",
            [
                "My profile → 17-category questionnaire already filled",
                "My matches → ranked Ready now / Near-term / Future scores",
                "Sample applications + employer messages in the pipeline",
            ],
            20,
        ),
        (
            "educator",
            "educator1",
            "community",
            "Educator / trainer",
            "CTE / BOCES publisher",
            [
                "Dashboard → published courses and upcoming events",
                "Program submission awaiting NYSAWWA review",
                "Free Educator membership (no hiring paywall)",
            ],
            30,
        ),
        (
            "ambassador",
            "ambassador1",
            "community",
            "Ambassador",
            "Workforce champion",
            [
                "Ambassador desk (/ambassador) — private outreach workspace",
                "Talking points, toolkits, and sample engagement touchpoints",
                "Interest form on file; Public pathway stays available to share",
            ],
            40,
        ),
        (
            "employer-hiring",
            "employer2",
            "utility",
            "Employer (active member)",
            "Consultant / industry HR with paid plan",
            [
                "Hiring → Jobs, Candidates, Applications with live membership",
                "Collaborate → sample message threads and interview schedule",
                "Billing → active Employer annual plan",
            ],
            50,
        ),
        (
            "employer-paywall",
            "employer9",
            "utility",
            "Employer (lapsed membership)",
            "Sees the paywall on hiring tools",
            [
                "Open Jobs or Candidates → MembershipGate with teaser sample data",
                "Renew from /pricing → sample Stripe checkout (no card charged)",
                "Compare with Employer (active member) to see unlocked hiring",
            ],
            55,
        ),
        (
            "utility-admin",
            "utility-admin1",
            "utility",
            "Utility administrator",
            "Manages org seats and membership",
            [
                "Workspace → Utility profile + Water Workforce 360 launch",
                "Hiring pipeline → ranked candidates, apps, messages, interviews",
                "Invite plant/CEU staff in WW360 — not via OWW Users & access",
            ],
            60,
        ),
        (
            "utility-manager",
            "utility-manager1",
            "utility",
            "Utility hiring manager",
            "Posts jobs under utility membership",
            [
                "Same Hudson Falls hiring pack as the utility admin",
                "Post and manage jobs covered by org membership",
                "OWW hiring only — WW360 plant ops use district_manager / operators",
            ],
            70,
        ),
        (
            "state-admin",
            "state-admin-ny",
            "state",
            "State administrator",
            "NY microsite + CMS (state scoped)",
            [
                "Operations → memberships, pending utility registrations, pipeline KPIs",
                "People → directories; Content → CMS draft + communications",
                "Platform/state roles stay locked; WW360 has its own district catalog",
            ],
            80,
        ),
    ]
    for key, username, tier, label, subtitle, bullets, order in specs:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            continue
        row = db.query(DemoPersona).filter(DemoPersona.persona_key == key).first()
        if not row:
            row = DemoPersona(persona_key=key)
            db.add(row)
        row.user_id = user.id
        row.tier = tier
        row.label = label
        row.subtitle = subtitle
        row.narrative_bullets = bullets
        row.sort_order = order
        row.state_code = user.state_code or "NY"
        row.is_active = True
    db.commit()
