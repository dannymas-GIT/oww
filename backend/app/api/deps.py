"""Auth dependencies — JWT user resolution + View as role preview read-only."""

from __future__ import annotations

from typing import Any, Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.database import get_db
from app.models.user import User
from app.services.impersonation_service import impersonation_dict

bearer = HTTPBearer(auto_error=False)

IMPERSONATION_WRITE_ALLOWLIST = {
    ("POST", "/api/v1/impersonation/stop"),
}


def _attach_impersonation(user: User, act_as: dict[str, Any] | None) -> User:
    if act_as and act_as.get("target_user_id"):
        user._impersonation = impersonation_dict(  # type: ignore[attr-defined]
            active=True,
            mode=str(act_as.get("mode") or "preview"),
            persona_key=act_as.get("persona_key"),
            target_username=act_as.get("target_username") or user.username,
            session_id=act_as.get("session_id"),
            actor_username=act_as.get("actor_username"),
        )
        user._impersonation["actor_user_id"] = act_as.get("actor_user_id")  # type: ignore[attr-defined]
    else:
        user._impersonation = impersonation_dict(active=False)  # type: ignore[attr-defined]
    return user


def _enforce_preview_read_only(request: Request, user: User) -> None:
    imp = getattr(user, "_impersonation", None) or {}
    if not imp.get("active") or imp.get("mode") != "preview":
        return
    method = request.method.upper()
    if method in ("GET", "HEAD", "OPTIONS"):
        return
    path = request.url.path.rstrip("/") or "/"
    if (method, path) in IMPERSONATION_WRITE_ALLOWLIST or path.endswith("/impersonation/stop"):
        return
    raise HTTPException(status_code=403, detail="IMPERSONATION_READ_ONLY")


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
    creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
) -> User:
    if not creds:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = decode_access_token(creds.credentials)
        user_id = int(payload.get("sub"))
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User inactive or missing")
    act_as = payload.get("act_as") if isinstance(payload.get("act_as"), dict) else None
    user = _attach_impersonation(user, act_as)
    _enforce_preview_read_only(request, user)
    return user


def get_actor_user(
    request: Request,
    db: Session = Depends(get_db),
    creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
) -> User:
    """Real signed-in admin (ignores View as role target). Used to start impersonation."""
    if not creds:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = decode_access_token(creds.credentials)
        act_as = payload.get("act_as") if isinstance(payload.get("act_as"), dict) else None
        actor_id = int(act_as.get("actor_user_id")) if act_as and act_as.get("actor_user_id") else int(payload.get("sub"))
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).filter(User.id == actor_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User inactive or missing")
    return user


def get_optional_user(
    request: Request,
    db: Session = Depends(get_db),
    creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
) -> Optional[User]:
    if not creds:
        return None
    try:
        return get_current_user(request=request, db=db, creds=creds)
    except HTTPException:
        return None


def require_roles(*roles: str):
    def _dep(user: User = Depends(get_current_user)) -> User:
        if not user.has_any_role(*roles) and not user.has_role("platform_admin"):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user

    return _dep


def reject_if_impersonating(user: User = Depends(get_current_user)) -> User:
    imp = getattr(user, "_impersonation", None) or {}
    if imp.get("active"):
        raise HTTPException(status_code=403, detail="Exit View as role before this action")
    return user
