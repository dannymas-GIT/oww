"""Orders (payment stub)."""
from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from app.db.base_class import Base

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True)
    org_id = Column(Integer, nullable=True, index=True)
    user_id = Column(Integer, nullable=True, index=True)
    amount_cents = Column(Integer, default=0)
    status = Column(String(50), default="stub")
    provider = Column(String(50), default="stub")
    meta = Column(JSONB, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
