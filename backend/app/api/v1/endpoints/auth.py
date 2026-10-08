"""Auth endpoints."""

from __future__ import annotations

import re

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, reject_if_impersonating
from app.core.config import settings
from app.core.security import get_password_hash
from app.db.database import get_db
from app.models.membership import MembershipPlan
from app.models.organization import Organization
from app.models.user import User
from app.services import auth_service, otp_service
from app.services import login_service
from app.services import registration_service
from app.services import stripe_service
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
    phone: str | None = Field(default=None, max_length=50)
    website: str | None = Field(default=None, max_length=500)
    job_title: str | None = Field(default=None, max_length=120)


def _username_from_email(db: Session, email: str) -> str:
    local = (email or "").split("@")[0].strip().lower() or "utility"
    base = re.sub(r"[^a-z0-9._-]", "", local)[:40] or "utility"
    uname = base
    i = 1
    while db.query(User).filter(User.username == uname).first():
        uname = f"{base}{i}"[:50]
        i += 1
    return uname


def _app_base() -> str:
    scheme = "http" if settings.APP_DOMAIN.startswith(("localhost", "127.")) else "https"
    return f"{scheme}://{settings.APP_DOMAIN}"


@router.post("/register-utility-admin", status_code=status.HTTP_201_CREATED)
def register_utility_admin(
    body: RegisterUtilityAdminRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """Self-registration for a utility administrator.

    Creates org + utility_admin user + registration queue row, then starts
    Utility plan checkout (sample Stripe when no live key). Membership is active
    after payment — Jenny's optional review is post-hoc (verify/suspend).
    """
    email = str(body.email).strip().lower()
    if "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Enter a valid work email")
    state = (body.state_code or "NY").strip().upper()[:2]
    utility_name = body.utility_name.strip()
    full_name = body.full_name.strip()
    phone = (body.phone or "").strip() or None
    website = (body.website or "").strip() or None
    job_title = (body.job_title or "").strip() or None

    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status.HTTP_409_CONFLICT, detail="An account with this email already exists")

    ensure_default_plans(db)
    plan = db.query(MembershipPlan).filter(MembershipPlan.code == "utility_annual", MembershipPlan.is_active.is_(True)).first()
    if not plan:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Utility plan is not configured")

    org = Organization(
        name=utility_name,
        state_code=state,
        org_type=["public_utility"],
        description=f"{utility_name} on One Water Workforce.",
        website=website,
        is_active=True,
        profile={"job_title": job_title, "source": "self_register"},
    )
    db.add(org)
    db.flush()

    username = _username_from_email(db, email)
    user = User(
        username=username,
        email=email,
        phone=phone,
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

    reg = registration_service.create_utility_registration(
        db,
        org=org,
        user=user,
        utility_name=utility_name,
        contact_name=full_name,
        contact_email=email,
        phone=phone,
        website=website,
        job_title=job_title,
    )
    db.commit()
    db.refresh(user)

    track(
        db,
        event_type="utility_admin_self_registered",
        pipeline_stage="engagement",
        actor_user_id=user.id,
        state_code=state,
    )

    base = _app_base()
    checkout = stripe_service.create_checkout(
        db,
        user,
        plan,
        success_url=f"{base}/billing/success?flow=register",
        cancel_url=f"{base}/employer",
    )
    # Prefer in-app sample checkout path with flow=register for the stepper UX
    if checkout.get("mode") == "sample" and checkout.get("session_id"):
        checkout = {
            **checkout,
            "url": f"/billing/sample-checkout?session_id={checkout['session_id']}&flow=register",
        }

    result = auth_service.issue_token(user)
    login_service.record_from_request(
        db,
        request,
        identifier=email,
        success=True,
        method="register",
        user=user,
    )
    return {
        **result,
        "checkout": {
            "mode": checkout.get("mode"),
            "url": checkout.get("url"),
            "session_id": checkout.get("session_id"),
        },
        "review_required": reg.review_required,
        "registration_id": reg.id,
    }


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
