"""Stripe Checkout + webhooks with a built-in sample mode.

Sample mode (no STRIPE_SECRET_KEY): checkout returns an in-app URL where the user
"pays" with a test card; completion activates the membership. Swap to live Stripe
by setting STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET and optional plan stripe_price_id.
"""

from __future__ import annotations

import logging
import secrets
from datetime import datetime, timedelta
from typing import Any, Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.membership import Membership, MembershipPlan
from app.models.user import User
from app.services.membership_service import log_event, membership_to_dict

logger = logging.getLogger(__name__)


def sample_mode() -> bool:
    return not bool(settings.STRIPE_SECRET_KEY)


def _stripe():
    import stripe  # lazy import so sample mode never needs the SDK configured

    stripe.api_key = settings.STRIPE_SECRET_KEY
    return stripe


def _period_end(plan: MembershipPlan, start: datetime) -> datetime:
    return start + (timedelta(days=365) if plan.interval == "year" else timedelta(days=30))


def create_checkout(db: Session, user: User, plan: MembershipPlan, *, success_url: str, cancel_url: str) -> dict[str, Any]:
    if not plan.is_active:
        raise HTTPException(400, "Plan is not available")

    org_id = user.org_id if plan.audience in ("employer", "utility") else None
    membership = Membership(
        user_id=user.id,
        org_id=org_id,
        state_code=user.state_code or "NY",
        plan_code=plan.code,
        status="pending",
        provider="sample" if sample_mode() else "stripe",
        meta={"success_url": success_url, "cancel_url": cancel_url},
    )
    db.add(membership)
    db.commit()
    db.refresh(membership)

    if plan.price_cents == 0:
        activate(db, membership, plan, provider="comp")
        return {"mode": "free", "url": success_url, "membership": membership_to_dict(membership, plan, user)}

    if sample_mode():
        session_id = f"cs_sample_{secrets.token_urlsafe(12)}"
        membership.checkout_session_id = session_id
        db.commit()
        log_event(db, membership=membership, user_id=user.id, event_type="checkout.created", provider="sample", amount_cents=plan.price_cents, payload={"session_id": session_id})
        return {
            "mode": "sample",
            "session_id": session_id,
            "url": f"/billing/sample-checkout?session_id={session_id}",
            "membership": membership_to_dict(membership, plan, user),
        }

    stripe = _stripe()
    line_item: dict[str, Any] = {"quantity": 1}
    if plan.stripe_price_id:
        line_item["price"] = plan.stripe_price_id
    else:
        line_item["price_data"] = {
            "currency": "usd",
            "unit_amount": plan.price_cents,
            "recurring": {"interval": plan.interval},
            "product_data": {"name": f"One Water Workforce — {plan.name}"},
        }
    session = stripe.checkout.Session.create(
        mode="subscription",
        line_items=[line_item],
        customer_email=user.email,
        client_reference_id=str(membership.id),
        success_url=success_url + "?session_id={CHECKOUT_SESSION_ID}",
        cancel_url=cancel_url,
        metadata={"membership_id": str(membership.id), "user_id": str(user.id), "plan_code": plan.code},
    )
    membership.checkout_session_id = session.id
    db.commit()
    log_event(db, membership=membership, user_id=user.id, event_type="checkout.created", provider="stripe", amount_cents=plan.price_cents, payload={"session_id": session.id})
    return {"mode": "stripe", "session_id": session.id, "url": session.url, "membership": membership_to_dict(membership, plan, user)}


def activate(db: Session, membership: Membership, plan: MembershipPlan, *, provider: str, stripe_customer_id: Optional[str] = None, stripe_subscription_id: Optional[str] = None, period_end: Optional[datetime] = None) -> Membership:
    now = datetime.utcnow()
    membership.status = "complimentary" if provider == "comp" and plan.price_cents == 0 else "active"
    membership.provider = provider
    membership.current_period_start = now
    membership.current_period_end = period_end or _period_end(plan, now)
    membership.cancel_at_period_end = False
    membership.canceled_at = None
    if stripe_customer_id:
        membership.stripe_customer_id = stripe_customer_id
    if stripe_subscription_id:
        membership.stripe_subscription_id = stripe_subscription_id
    # Supersede older memberships for the same user/org
    others = db.query(Membership).filter(Membership.id != membership.id, Membership.status.in_(("active", "pending", "past_due", "complimentary")))
    if membership.org_id:
        others = others.filter((Membership.org_id == membership.org_id) | (Membership.user_id == membership.user_id))
    else:
        others = others.filter(Membership.user_id == membership.user_id)
    for o in others.all():
        o.status = "canceled" if o.status != "pending" else "expired"
        o.canceled_at = now
    db.commit()
    log_event(db, membership=membership, user_id=membership.user_id, event_type="membership.activated", provider=provider, amount_cents=plan.price_cents)
    # New utility memberships get a labeled hiring sample pack until they clear it / post real jobs.
    if membership.org_id and (membership.plan_code or "").startswith("utility"):
        try:
            from app.models.organization import Organization
            from app.services import sample_data_service

            org = db.query(Organization).filter(Organization.id == membership.org_id).first()
            if org and "public_utility" in (org.org_type or []):
                sample_data_service.ensure_utility_sample_pack(
                    db, membership.org_id, actor_user_id=membership.user_id
                )
        except Exception:  # pragma: no cover
            logger.exception("utility sample pack ensure failed org_id=%s", membership.org_id)
    return membership


def complete_sample_checkout(db: Session, session_id: str, *, card_last4: str = "4242") -> Membership:
    if not sample_mode():
        raise HTTPException(400, "Sample checkout disabled when Stripe is configured")
    membership = db.query(Membership).filter(Membership.checkout_session_id == session_id).first()
    if not membership:
        raise HTTPException(404, "Checkout session not found")
    plan = db.query(MembershipPlan).filter(MembershipPlan.code == membership.plan_code).first()
    if not plan:
        raise HTTPException(400, "Plan missing")
    if membership.status == "active":
        return membership
    activate(db, membership, plan, provider="sample", stripe_customer_id=f"cus_sample_{membership.user_id}", stripe_subscription_id=f"sub_sample_{membership.id}")
    log_event(db, membership=membership, user_id=membership.user_id, event_type="invoice.paid", provider="sample", amount_cents=plan.price_cents, payload={"card_last4": card_last4})
    return membership


def cancel(db: Session, membership: Membership) -> Membership:
    if membership.provider == "stripe" and membership.stripe_subscription_id and not sample_mode():
        try:
            _stripe().Subscription.modify(membership.stripe_subscription_id, cancel_at_period_end=True)
        except Exception as exc:  # pragma: no cover
            logger.warning("stripe cancel failed: %s", exc)
    membership.cancel_at_period_end = True
    membership.canceled_at = datetime.utcnow()
    db.commit()
    log_event(db, membership=membership, user_id=membership.user_id, event_type="membership.cancel_requested", provider=membership.provider)
    return membership


def handle_webhook(db: Session, payload: bytes, signature: Optional[str]) -> dict[str, Any]:
    if sample_mode():
        raise HTTPException(400, "Webhook disabled in sample mode")
    stripe = _stripe()
    try:
        if settings.STRIPE_WEBHOOK_SECRET:
            event = stripe.Webhook.construct_event(payload, signature, settings.STRIPE_WEBHOOK_SECRET)
        else:
            import json

            event = json.loads(payload)
    except Exception as exc:
        raise HTTPException(400, f"Invalid webhook: {exc}")

    etype = event["type"]
    obj = event["data"]["object"]
    if etype == "checkout.session.completed":
        membership = db.query(Membership).filter(Membership.checkout_session_id == obj["id"]).first()
        if membership:
            plan = db.query(MembershipPlan).filter(MembershipPlan.code == membership.plan_code).first()
            if plan:
                activate(db, membership, plan, provider="stripe", stripe_customer_id=obj.get("customer"), stripe_subscription_id=obj.get("subscription"))
    elif etype in ("invoice.paid", "invoice.payment_succeeded"):
        sub_id = obj.get("subscription")
        membership = db.query(Membership).filter(Membership.stripe_subscription_id == sub_id).first()
        if membership:
            period_end = obj.get("lines", {}).get("data", [{}])[0].get("period", {}).get("end")
            if period_end:
                membership.current_period_end = datetime.utcfromtimestamp(period_end)
            membership.status = "active"
            db.commit()
            log_event(db, membership=membership, user_id=membership.user_id, event_type=etype, provider="stripe", amount_cents=obj.get("amount_paid"))
    elif etype == "invoice.payment_failed":
        membership = db.query(Membership).filter(Membership.stripe_subscription_id == obj.get("subscription")).first()
        if membership:
            membership.status = "past_due"
            db.commit()
            log_event(db, membership=membership, user_id=membership.user_id, event_type=etype, provider="stripe")
    elif etype == "customer.subscription.deleted":
        membership = db.query(Membership).filter(Membership.stripe_subscription_id == obj.get("id")).first()
        if membership:
            membership.status = "canceled"
            membership.canceled_at = datetime.utcnow()
            db.commit()
            log_event(db, membership=membership, user_id=membership.user_id, event_type=etype, provider="stripe")
    return {"received": True, "type": etype}
