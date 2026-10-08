"""Auth endpoints."""

from __future__ import annotations

import re
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, reject_if_impersonating
from app.core.security import get_password_hash
from app.db.database import get_db
from app.models.membership import Membership
from app.models.organization import Organization
from app.models.user import User
from app.services import auth_service, otp_service
from app.services import login_service
from app.services.engagement_service import track
from app.services.impersonation_service import user_payload_with_impersonation
from app.services.membership_service import ensure_default_plans

router = APIRouter(prefix="/auth", tags=["auth"])


class OtpRequest(BaseModel):
    email: str | None = None
    phone: str | None = None


class OtpVerify(BaseModel):
    email: str | None = None
    phone: str | None = None
    code: str


class LoginRequest(BaseModel):
    username: str
    password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)
    confirm_password: str


class RegisterUtilityAdminRequest(BaseModel):
    utility_name: str = Field(..., min_length=2, max_length=255)
    full_name: str = Field(..., min_length=1, max_length=255)
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=8, max_length=128)
    state_code: str = Field(default="NY", min_length=2, max_length=2)


def _username_from_email(db: Session, email: str) -> str:
    local = (email or "").split("@")[0].strip().lower() or "utility"
    base = re.sub(r"[^a-z0-9._-]", "", local)[:40] or "utility"
    uname = base
    i = 1
    while db.query(User).filter(User.username == uname).first():
        uname = f"{base}{i}"[:50]
        i += 1
    return uname


@router.post("/register-utility-admin", status_code=status.HTTP_201_CREATED)
def register_utility_admin(
    body: RegisterUtilityAdminRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """Minimal self-registration for a utility administrator (OWW Super Admin path).

    Creates org + utility_admin user and a complimentary utility membership so
    Water Workforce 360 handoff works without Stripe for demos.
    """
    email = str(body.email).strip().lower()
    if "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Enter a valid work email")
    state = (body.state_code or "NY").strip().upper()[:2]
    utility_name = body.utility_name.strip()
    full_name = body.full_name.strip()

    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status.HTTP_409_CONFLICT, detail="An account with this email already exists")

    ensure_default_plans(db)

    org = Organization(
        name=utility_name,
        state_code=state,
        org_type=["public_utility"],
        description=f"{utility_name} on One Water Workforce.",
        is_active=True,
        profile={},
    )
    db.add(org)
    db.flush()

    username = _username_from_email(db, email)
    user = User(
        username=username,
        email=email,
        full_name=full_name,
        roles=["utility_admin"],
        org_id=org.id,
        state_code=state,
        is_active=True,
        contact_prefs={},
    )
    user.hashed_password = get_password_hash(body.password)
    db.add(user)
    db.flush()

    now = datetime.utcnow()
    membership = Membership(
        user_id=user.id,
        org_id=org.id,
        state_code=state,
        plan_code="utility_annual",
        status="complimentary",
        provider="comp",
        current_period_start=now,
        current_period_end=now + timedelta(days=365),
        meta={"source": "self_register_utility_admin", "note": "complimentary demo membership"},
    )
    db.add(membership)
    db.commit()
    db.refresh(user)

    track(
        db,
        event_type="utility_admin_self_registered",
        pipeline_stage="engagement",
        actor_user_id=user.id,
        state_code=state,
    )

    result = auth_service.issue_token(user)
    login_service.record_from_request(
        db,
        request,
        identifier=email,
        success=True,
        method="register",
        user=user,
    )
    return result


@router.post("/otp/request")
def otp_request(body: OtpRequest, db: Session = Depends(get_db)):
    code = otp_service.request_otp(db, email=body.email, phone=body.phone)
    resp = {"ok": True, "message": "Code sent"}
    if code:
        resp["dev_code"] = code
    return resp


@router.post("/otp/verify")
def otp_verify(body: OtpVerify, request: Request, db: Session = Depends(get_db)):
    ident = (body.email or body.phone or "").strip()
    try:
        result = auth_service.login_with_otp(db, code=body.code, email=body.email, phone=body.phone)
        user = db.query(User).filter(User.id == int(result["user"]["id"])).first()
        login_service.record_from_request(
            db,
            request,
            identifier=ident or (user.email if user else "(otp)"),
            success=True,
            method="otp",
            user=user,
        )
        return result
    except HTTPException as exc:
        login_service.record_from_request(
            db,
            request,
            identifier=ident or "(otp)",
            success=False,
            method="otp",
            failure_reason=str(exc.detail)[:100],
        )
        raise


@router.post("/login")
def login(body: LoginRequest, request: Request, db: Session = Depends(get_db)):
    ident = (body.username or "").strip()
    try:
        result = auth_service.login_with_password(db, body.username, body.password)
        user = db.query(User).filter(User.id == int(result["user"]["id"])).first()
        login_service.record_from_request(
            db,
            request,
            identifier=ident,
            success=True,
            method="password",
            user=user,
        )
        return result
    except HTTPException as exc:
        # Resolve user if known so failed attempts still attribute to an account when possible
        known = None
        if ident:
            known = db.query(User).filter(User.username == ident).first()
            if not known and "@" in ident:
                known = db.query(User).filter(User.email == ident.lower()).first()
        login_service.record_from_request(
            db,
            request,
            identifier=ident or "(unknown)",
            success=False,
            method="password",
            user=known,
            failure_reason=str(exc.detail)[:100],
        )
        raise


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    payload = user_payload_with_impersonation(user, getattr(user, "_impersonation", None))
    return payload


@router.post("/change-password")
def change_password(
    body: ChangePasswordRequest,
    db: Session = Depends(get_db),
    user: User = Depends(reject_if_impersonating),
):
    if body.new_password != body.confirm_password:
        raise HTTPException(400, "Passwords do not match")
    auth_service.change_password(db, user, body.current_password, body.new_password)
    return {"ok": True, "message": "Password updated"}
