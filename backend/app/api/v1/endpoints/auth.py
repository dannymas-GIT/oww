"""Auth endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, reject_if_impersonating
from app.db.database import get_db
from app.models.user import User
from app.services import auth_service, otp_service
from app.services import login_service
from app.services.impersonation_service import user_payload_with_impersonation

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
