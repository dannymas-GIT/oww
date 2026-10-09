"""View as role — start/stop impersonation and persona catalog."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_actor_user, get_current_user, require_roles
from app.db.database import get_db
from app.models.impersonation import DemoPersona, ImpersonationSession
from app.models.user import User
from app.services import impersonation_service as imp
from app.services.auth_service import issue_token
from app.services.impersonation_service import (
    ensure_default_personas,
    issue_impersonation_token,
    list_personas_for_actor,
    start_impersonation,
    stop_impersonation,
    user_payload_with_impersonation,
)

router = APIRouter(prefix="/impersonation", tags=["impersonation"])


class StartIn(BaseModel):
    persona_key: str | None = None
    target_user_id: int | None = None
    mode: str = Field(default="preview", pattern="^(preview|act)$")
    reason: str | None = None


@router.get("/personas")
def personas(db: Session = Depends(get_db), actor: User = Depends(get_actor_user)):
    """Catalog for View as role. Uses actor (not impersonated target) so the banner can reload tips mid-session."""
    if not actor.has_any_role("platform_admin", "state_admin"):
        raise HTTPException(403, "View as role requires platform or state admin")
    ensure_default_personas(db)
    return list_personas_for_actor(db, actor)


@router.post("/start")
def start(body: StartIn, request: Request, db: Session = Depends(get_db), actor: User = Depends(get_actor_user)):
    if getattr(actor, "_impersonation", None) and actor._impersonation.get("active"):
        raise HTTPException(400, "End the current View as role session first")
    if not actor.has_any_role("platform_admin", "state_admin"):
        raise HTTPException(403, "View as role requires platform or state admin")

    target: User | None = None
    persona_key = body.persona_key
    if body.persona_key:
        ensure_default_personas(db)
        persona = db.query(DemoPersona).filter(DemoPersona.persona_key == body.persona_key, DemoPersona.is_active.is_(True)).first()
        if not persona:
            raise HTTPException(404, "Persona not found")
        target = db.query(User).filter(User.id == persona.user_id).first()
    elif body.target_user_id:
        target = db.query(User).filter(User.id == body.target_user_id).first()
    else:
        raise HTTPException(400, "persona_key or target_user_id required")
    if not target:
        raise HTTPException(404, "Target user not found")

    # Enrich role-specific sample data so View as role always lands in a rich demo world.
    try:
        from app.services.sample_data_service import ensure_persona_sample_world

        ensure_persona_sample_world(db, persona_key)
    except Exception:
        # Never block impersonation start if sample enrichment fails.
        db.rollback()

    session = start_impersonation(
        db,
        actor=actor,
        target=target,
        mode=body.mode,
        reason=body.reason,
        persona_key=persona_key,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    return issue_impersonation_token(
        actor=actor,
        target=target,
        session=session,
        mode=body.mode,
        persona_key=persona_key,
        db=db,
    )


@router.post("/stop")
def stop(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    act_as = getattr(user, "_impersonation", None) or {}
    if not act_as.get("active"):
        raise HTTPException(400, "Not viewing as another role")
    actor_id = act_as.get("actor_user_id")
    if not actor_id:
        raise HTTPException(400, "Missing actor on session")
    stop_impersonation(db, actor_id=int(actor_id), session_id=act_as.get("session_id"))
    actor = db.query(User).filter(User.id == int(actor_id)).first()
    if not actor:
        raise HTTPException(404, "Actor not found")
    data = issue_token(actor)
    data["user"] = user_payload_with_impersonation(actor)
    return data


@router.get("/sessions")
def sessions(limit: int = 50, db: Session = Depends(get_db), user: User = Depends(require_roles("platform_admin"))):
    rows = db.query(ImpersonationSession).order_by(ImpersonationSession.started_at.desc()).limit(min(limit, 200)).all()
    return [
        {
            "id": r.id,
            "actor_user_id": r.actor_user_id,
            "target_user_id": r.target_user_id,
            "persona_key": r.persona_key,
            "mode": r.mode,
            "reason": r.reason,
            "started_at": r.started_at.isoformat() if r.started_at else None,
            "ended_at": r.ended_at.isoformat() if r.ended_at else None,
            "expires_at": r.expires_at.isoformat() if r.expires_at else None,
        }
        for r in rows
    ]
