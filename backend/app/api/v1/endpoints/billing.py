"""Public plans, member billing, checkout, Stripe webhook."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, reject_if_impersonating
from app.core.config import settings
from app.db.database import get_db
from app.models.membership import BillingEvent, Membership, MembershipPlan
from app.models.user import User
from app.services import stripe_service
from app.services.membership_service import current_membership_for_user, ensure_default_plans, membership_to_dict, plan_to_dict

router = APIRouter(prefix="/billing", tags=["billing"])


class CheckoutIn(BaseModel):
    plan_code: str


class SampleCompleteIn(BaseModel):
    session_id: str
    card_last4: str = "4242"


def _app_base() -> str:
    scheme = "http" if settings.APP_DOMAIN.startswith(("localhost", "127.")) else "https"
    return f"{scheme}://{settings.APP_DOMAIN}"


@router.get("/plans")
def plans(db: Session = Depends(get_db)):
    ensure_default_plans(db)
    rows = db.query(MembershipPlan).filter(MembershipPlan.is_active.is_(True)).order_by(MembershipPlan.sort_order).all()
    return {"plans": [plan_to_dict(p) for p in rows], "sample_mode": stripe_service.sample_mode(), "publishable_key": settings.STRIPE_PUBLISHABLE_KEY or None}


@router.get("/me")
def my_membership(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    m = current_membership_for_user(db, user)
    if not m:
        return {"membership": None, "sample_mode": stripe_service.sample_mode()}
    plan = db.query(MembershipPlan).filter(MembershipPlan.code == m.plan_code).first()
    events = db.query(BillingEvent).filter(BillingEvent.membership_id == m.id).order_by(BillingEvent.id.desc()).limit(10).all()
    return {
        "membership": membership_to_dict(m, plan, user),
        "events": [{"id": e.id, "event_type": e.event_type, "amount_cents": e.amount_cents, "created_at": e.created_at.isoformat() if e.created_at else None} for e in events],
        "sample_mode": stripe_service.sample_mode(),
    }


@router.post("/checkout")
def checkout(body: CheckoutIn, db: Session = Depends(get_db), user: User = Depends(reject_if_impersonating)):
    ensure_default_plans(db)
    plan = db.query(MembershipPlan).filter(MembershipPlan.code == body.plan_code, MembershipPlan.is_active.is_(True)).first()
    if not plan:
        raise HTTPException(404, "Plan not found")
    base = _app_base()
    return stripe_service.create_checkout(db, user, plan, success_url=f"{base}/billing/success", cancel_url=f"{base}/pricing")


@router.get("/sample-session/{session_id}")
def sample_session(session_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    m = db.query(Membership).filter(Membership.checkout_session_id == session_id).first()
    if not m or (m.user_id != user.id and not user.has_role("platform_admin")):
        raise HTTPException(404, "Session not found")
    plan = db.query(MembershipPlan).filter(MembershipPlan.code == m.plan_code).first()
    return {"membership": membership_to_dict(m, plan, user), "plan": plan_to_dict(plan) if plan else None}


@router.post("/sample/complete")
def sample_complete(body: SampleCompleteIn, db: Session = Depends(get_db), user: User = Depends(reject_if_impersonating)):
    m = db.query(Membership).filter(Membership.checkout_session_id == body.session_id).first()
    if not m or (m.user_id != user.id and not user.has_role("platform_admin")):
        raise HTTPException(404, "Session not found")
    m = stripe_service.complete_sample_checkout(db, body.session_id, card_last4=body.card_last4[-4:])
    plan = db.query(MembershipPlan).filter(MembershipPlan.code == m.plan_code).first()
    return {"membership": membership_to_dict(m, plan, user)}


@router.post("/cancel")
def cancel(db: Session = Depends(get_db), user: User = Depends(reject_if_impersonating)):
    m = current_membership_for_user(db, user)
    if not m:
        raise HTTPException(404, "No membership")
    if m.user_id != user.id and not user.has_any_role("utility_admin", "employer", "employer_admin", "platform_admin"):
        raise HTTPException(403, "Only the account owner or an organization admin can cancel")
    m = stripe_service.cancel(db, m)
    plan = db.query(MembershipPlan).filter(MembershipPlan.code == m.plan_code).first()
    return {"membership": membership_to_dict(m, plan, user)}


@router.post("/webhook")
async def webhook(request: Request, db: Session = Depends(get_db), stripe_signature: str | None = Header(default=None, alias="Stripe-Signature")):
    payload = await request.body()
    return stripe_service.handle_webhook(db, payload, stripe_signature)
