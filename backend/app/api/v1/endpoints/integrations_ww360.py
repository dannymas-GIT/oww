"""Water Workforce 360 handoff + entitlement APIs."""

from __future__ import annotations

import hashlib
import hmac
import json
import logging
from datetime import datetime, timezone
from typing import Any

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.core.config import settings
from app.db.database import get_db
from app.models.membership import Membership
from app.models.organization import Organization
from app.models.user import User
from app.services.membership_service import effective_status
from app.core.scoping import coerce_state

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/integrations/ww360", tags=["integrations-ww360"])

BILLING_ADMIN_ROLES = ("utility_admin", "employer", "employer_admin", "platform_admin")


class AccessOut(BaseModel):
    redirect_url: str
    ww360_org_id: str
    ww360_user_id: str
    expires_in: int


class EntitlementOut(BaseModel):
    oww_org_id: str
    status: str
    stripe_customer_id: str | None = None
    checked_at: str


def _require_oww_api_key(authorization: str | None) -> None:
    key = settings.OWW_WW360_API_KEY
    if not key:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, detail="WW360 API key not configured")
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    provided = authorization.split(" ", 1)[1].strip()
    if not hmac.compare_digest(provided, key):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid API key")


def _org_membership(db: Session, org_id: int) -> Membership | None:
    return (
        db.query(Membership)
        .filter(Membership.org_id == org_id)
        .order_by(Membership.id.desc())
        .first()
    )


def _subscription_status_for_org(db: Session, org_id: int | None) -> tuple[str, str | None]:
    if not org_id:
        return "none", None
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if org and not org.is_active:
        # Jenny suspended the utility — WW360 must treat as non-active
        m = _org_membership(db, org_id)
        return "canceled", m.stripe_customer_id if m else None
    m = _org_membership(db, org_id)
    if not m:
        return "none", None
    return effective_status(m), m.stripe_customer_id


class AccessIn(BaseModel):
    """Optional deep-link after WW360 redeem (e.g. /admin/users?invite=1)."""

    next: str | None = Field(default=None, max_length=255)


def _ww360_configured() -> tuple[str, str]:
    base = (settings.WW360_BASE_URL or "").rstrip("/")
    token = settings.WW360_SERVICE_TOKEN
    if not base or not token:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Water Workforce 360 integration is not configured",
        )
    return base, token


def _post_ww360_handoff(payload: dict[str, Any]) -> dict[str, Any]:
    base, token = _ww360_configured()
    url = f"{base}/api/v1/integrations/oww/handoff"
    try:
        with httpx.Client(timeout=30.0) as client:
            resp = client.post(
                url,
                json=payload,
                headers={"Authorization": f"Bearer {token}"},
            )
    except Exception as exc:
        logger.warning("WW360 handoff call failed: %s", exc)
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, detail="Could not reach Water Workforce 360") from exc

    if resp.status_code == 403:
        detail: Any
        try:
            detail = resp.json().get("detail") or {"code": "payment_required"}
        except Exception:
            detail = {"code": "payment_required"}
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail=detail)

    if resp.status_code >= 400:
        logger.warning("WW360 handoff rejected: %s %s", resp.status_code, resp.text[:300])
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, detail="Water Workforce 360 rejected handoff")
    return resp.json()


@router.post("/access", response_model=AccessOut)
def access_water_workforce_360(
    body: AccessIn | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*BILLING_ADMIN_ROLES)),
):
    """Server-side handoff into Water Workforce 360.

    - platform_admin (Jenny): opens WW360 as platform_admin — no utility org required
    - utility_admin / employer: opens WW360 as utility org administrator
    """
    next_path = (body.next if body else None) or None

    # Jenny / OWW platform staff — always open WW360 as platform_admin
    if user.has_role("platform_admin"):
        data = _post_ww360_handoff(
            {
                "handoff_kind": "platform_admin",
                "oww_user_id": str(user.id),
                "email": user.email or f"{user.username}@example.invalid",
                "full_name": user.full_name or user.username,
                "is_billing_admin": True,
                "subscription_status": "active",
                "state_code": coerce_state(user.state_code),
                "next": next_path or "/admin/users",
            }
        )
        user.ww360_user_id = str(data.get("ww360_user_id") or "")
        user.sso_provider = "ww360"
        user.sso_subject = user.ww360_user_id
        db.commit()
        return AccessOut(
            redirect_url=data["redirect_url"],
            ww360_org_id=str(data.get("ww360_org_id") or "PLATFORM"),
            ww360_user_id=str(data["ww360_user_id"]),
            expires_in=int(data.get("expires_in") or 90),
        )

    if not user.org_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="User has no organization")

    org = db.query(Organization).filter(Organization.id == user.org_id).first()
    if not org:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Organization not found")

    if not org.is_active:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail={
                "code": "account_suspended",
                "message": "This utility account has been suspended. Contact the platform team for your jurisdiction.",
            },
        )

    sub_status, stripe_cus = _subscription_status_for_org(db, org.id)
    # complimentary counts as active for WW360
    if sub_status == "complimentary":
        sub_status = "active"

    payload = {
        "handoff_kind": "utility",
        "oww_org_id": str(org.id),
        "oww_user_id": str(user.id),
        "email": user.email or f"{user.username}@example.invalid",
        "full_name": user.full_name or user.username,
        "utility_name": org.name,
        "is_billing_admin": True,
        "subscription_status": sub_status,
        "stripe_customer_id": stripe_cus,
        "state_code": coerce_state(user.state_code or org.state_code),
        "next": next_path or "/dashboard",
    }

    data = _post_ww360_handoff(payload)
    org.ww360_org_id = str(data.get("ww360_org_id") or "")
    user.ww360_user_id = str(data.get("ww360_user_id") or "")
    user.sso_provider = "ww360"
    user.sso_subject = user.ww360_user_id
    db.commit()

    return AccessOut(
        redirect_url=data["redirect_url"],
        ww360_org_id=str(data["ww360_org_id"]),
        ww360_user_id=str(data["ww360_user_id"]),
        expires_in=int(data.get("expires_in") or 90),
    )


@router.get("/entitlement", response_model=EntitlementOut)
def entitlement(
    oww_org_id: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    """WW360 asks whether this OWW organization may use Water Workforce 360."""
    _require_oww_api_key(authorization)
    try:
        org_id = int(oww_org_id)
    except ValueError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="oww_org_id must be numeric")

    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        return EntitlementOut(
            oww_org_id=str(oww_org_id),
            status="none",
            checked_at=datetime.now(timezone.utc).isoformat(),
        )

    status_val, stripe_cus = _subscription_status_for_org(db, org.id)
    if status_val == "complimentary":
        status_val = "active"
    # Map expired → canceled for WW360 vocabulary
    if status_val == "expired":
        status_val = "canceled"

    return EntitlementOut(
        oww_org_id=str(org.id),
        status=status_val,
        stripe_customer_id=stripe_cus,
        checked_at=datetime.now(timezone.utc).isoformat(),
    )


@router.get("/employer-needs")
def pull_employer_needs(
    region: str | None = Query(None),
    oww_org_id: str | None = Query(None),
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("platform_admin", "state_admin", "utility_admin")),
):
    """Pull WW360 employer-needs feed (HMAC) for analytics / matching."""
    _ = db
    base = (settings.WW360_BASE_URL or "").rstrip("/")
    secret = settings.WW360_HMAC_SECRET
    if not base or not secret:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, detail="WW360 HMAC not configured")

    probe = {"region": region, "oww_org_id": oww_org_id or (str(user.org_id) if user.org_id else None)}
    raw = json.dumps(probe, sort_keys=True).encode()
    signature = hmac.new(secret.encode(), raw, hashlib.sha256).hexdigest()
    params = {k: v for k, v in probe.items() if v is not None}
    url = f"{base}/api/v1/integrations/oww/employer-needs"
    try:
        with httpx.Client(timeout=30.0) as client:
            resp = client.get(url, params=params, headers={"X-OWW-Signature": signature})
            resp.raise_for_status()
            return resp.json()
    except Exception as exc:
        logger.warning("employer-needs pull failed: %s", exc)
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, detail="Could not load employer needs") from exc


class ReferralAckBody(BaseModel):
    oww_referral_id: str = Field(..., min_length=1, max_length=64)
    oww_org_id: str = Field(..., min_length=1, max_length=64)
    district_code: str | None = None
    candidate_label: str | None = None
    job_title: str | None = None
    status: str = "received"


@router.post("/referrals/ack")
def ack_referral(
    body: ReferralAckBody,
    user: User = Depends(require_roles(*BILLING_ADMIN_ROLES, "platform_admin", "state_admin")),
):
    """Forward a referral acknowledgement to WW360."""
    _ = user
    base = (settings.WW360_BASE_URL or "").rstrip("/")
    token = settings.WW360_SERVICE_TOKEN
    if not base or not token:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, detail="WW360 integration not configured")
    url = f"{base}/api/v1/integrations/oww/referrals"
    try:
        with httpx.Client(timeout=30.0) as client:
            resp = client.post(
                url,
                json=body.model_dump(),
                headers={"Authorization": f"Bearer {token}"},
            )
            resp.raise_for_status()
            return resp.json()
    except Exception as exc:
        logger.warning("referral ack failed: %s", exc)
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, detail="Could not acknowledge referral") from exc
