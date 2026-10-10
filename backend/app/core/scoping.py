"""Tenant / jurisdiction scoping helpers."""

from __future__ import annotations

from typing import Optional

from fastapi import HTTPException

from app.jurisdictions.registry import default_code, normalize_code
from app.models.user import User
from app.services import role_catalog_service as roles


def scope_state(user: User) -> Optional[str]:
    """
    National platform staff see all states (None).
    state_admin (and other non-platform actors) stay in-state.
    """
    if user.has_any_role(*tuple(roles.PLATFORM_STAFF_ROLES)):
        return None
    return normalize_code(user.state_code)


def require_state_access(user: User, state_code: Optional[str]) -> str:
    """Return normalized state or raise 403 if state_admin tries another state."""
    target = normalize_code(state_code or user.state_code or default_code())
    scoped = scope_state(user)
    if scoped is not None and scoped != target:
        raise HTTPException(403, "Cannot access another jurisdiction")
    return target


def coerce_state(value: Optional[str], *, fallback: Optional[str] = None) -> str:
    return normalize_code(value or fallback or default_code())
