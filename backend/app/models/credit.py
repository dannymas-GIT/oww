"""Featured posting credits (payment stub)."""
from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String
from app.db.base_class import Base

class Credit(Base):
    __tablename__ = "credits"
    id = Column(Integer, primary_key=True)
    org_id = Column(Integer, nullable=False, index=True)
    credit_type = Column(String(50), default="feature")
    balance = Column(Integer, default=0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
