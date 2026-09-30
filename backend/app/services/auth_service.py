"""Auth helpers: OTP login, password login (username or email), user serialization."""

from __future__ import annotations

from typing import Any, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.user import User
from app.services import otp_service


def user_to_dict(user: User) -> dict[str, Any]:
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "phone": user.phone,
        "roles": user.roles or [],
        "jurisdiction_code": (user.state_code or "NY").lower(),
        "is_active": user.is_active,
        "org_id": user.org_id,
    }


def issue_token(user: User) -> dict[str, Any]:
    from app.services.impersonation_service import user_payload_with_impersonation

    token = create_access_token(subject=str(user.id), extra_claims={"roles": user.roles or []})
    return {"access_token": token, "token_type": "bearer", "user": user_payload_with_impersonation(user)}


def _username_from_dest(email: Optional[str], phone: Optional[str]) -> str:
    if email:
        return email.lower().split("@")[0][:40]
    return f"user_{(phone or 'unknown')[-8:]}"


def login_with_otp(
    db: Session,
    *,
    code: str,
    email: Optional[str] = None,
    phone: Optional[str] = None,
    default_role: str = "individual",
) -> dict[str, Any]:
    if not otp_service.verify_otp(db, code=code, email=email, phone=phone):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired code")
    user = None
    if email:
        user = db.query(User).filter(User.email == email.lower()).first()
    elif phone:
        user = db.query(User).filter(User.phone == phone).first()
    if not user:
        uname = _username_from_dest(email, phone)
        base = uname
        i = 1
        while db.query(User).filter(User.username == uname).first():
            uname = f"{base}{i}"
            i += 1
        user = User(
            username=uname,
            email=email.lower() if email else None,
            phone=phone,
            roles=[default_role],
            state_code="NY",
            is_active=True,
            contact_prefs={},
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account inactive")
    return issue_token(user)


def login_with_password(db: Session, username: str, password: str) -> dict[str, Any]:
    """Local DB accounts — username or email + password (case-insensitive; bare domains get .com)."""
    ident = (username or "").strip()
    if not ident or not password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    candidates: list[str] = []
    for raw in (ident, ident.lower()):
        if raw and raw not in candidates:
            candidates.append(raw)
    if "@" in ident:
        local, _, domain = ident.partition("@")
        domain = domain.strip().lower()
        local = local.strip()
        if local and domain:
            email = f"{local}@{domain}".lower()
            if email not in candidates:
                candidates.append(email)
            # Users often omit the TLD (e.g. name@omnitech-solutions)
            if "." not in domain:
                for tld in (".us", ".com"):
                    alt = f"{local}@{domain}{tld}".lower()
                    if alt not in candidates:
                        candidates.append(alt)
            # Omnitech accounts are @omnitech-solutions.us — accept .com typo too
            if domain in ("omnitech-solutions.com", "omnitech-solutions.us"):
                other = "us" if domain.endswith(".com") else "com"
                alt = f"{local}@omnitech-solutions.{other}".lower()
                if alt not in candidates:
                    candidates.append(alt)

    user = None
    for cand in candidates:
        user = db.query(User).filter(User.username == cand).first()
        if user:
            break
        if "@" in cand:
            user = db.query(User).filter(User.email == cand.lower()).first()
            if user:
                break
    if not user:
        # Case-insensitive username fallback
        user = db.query(User).filter(User.username.ilike(ident)).first()

    if not user or not user.hashed_password or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account inactive")
    return issue_token(user)


def change_password(db: Session, user: User, current_password: str, new_password: str) -> None:
    if getattr(user, "_impersonation", None) and user._impersonation.get("active"):
        raise HTTPException(status_code=403, detail="Exit View as role before changing password")
    if not user.hashed_password or not verify_password(current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password incorrect")
    user.hashed_password = get_password_hash(new_password)
    prefs = dict(user.contact_prefs or {})
    prefs.pop("must_change_password", None)
    user.contact_prefs = prefs
    db.commit()
