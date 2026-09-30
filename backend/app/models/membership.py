"""Membership plans, subscriptions, and billing audit (Stripe or sample mode)."""

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB

from app.db.base_class import Base


class MembershipPlan(Base):
    __tablename__ = "membership_plans"

    id = Column(Integer, primary_key=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(120), nullable=False)
    audience = Column(String(30), nullable=False, index=True)  # individual | employer | utility | educator
    description = Column(Text, nullable=True)
    price_cents = Column(Integer, nullable=False, default=0)
    interval = Column(String(10), nullable=False, default="year")  # month | year
    features = Column(JSONB, nullable=False, default=list)
    stripe_price_id = Column(String(120), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class Membership(Base):
    __tablename__ = "memberships"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=True, index=True)
    org_id = Column(Integer, nullable=True, index=True)
    state_code = Column(String(2), nullable=False, default="NY", index=True)
    plan_code = Column(String(50), nullable=False, index=True)
    status = Column(String(30), nullable=False, default="pending", index=True)
    # pending | active | past_due | canceled | expired | complimentary
    provider = Column(String(20), nullable=False, default="sample")  # stripe | sample | comp
    stripe_customer_id = Column(String(120), nullable=True, index=True)
    stripe_subscription_id = Column(String(120), nullable=True, index=True)
    checkout_session_id = Column(String(160), nullable=True, index=True)
    current_period_start = Column(DateTime, nullable=True)
    current_period_end = Column(DateTime, nullable=True, index=True)
    cancel_at_period_end = Column(Boolean, default=False, nullable=False)
    canceled_at = Column(DateTime, nullable=True)
    meta = Column(JSONB, nullable=False, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class BillingEvent(Base):
    __tablename__ = "billing_events"

    id = Column(Integer, primary_key=True)
    membership_id = Column(Integer, nullable=True, index=True)
    user_id = Column(Integer, nullable=True, index=True)
    event_type = Column(String(80), nullable=False, index=True)
    provider = Column(String(20), nullable=False, default="sample")
    amount_cents = Column(Integer, nullable=True)
    payload = Column(JSONB, nullable=False, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
