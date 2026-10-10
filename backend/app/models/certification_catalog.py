"""Multi-state certification catalog."""
from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String, Text
from app.db.base_class import Base

class CertificationCatalog(Base):
    __tablename__ = "certification_catalog"
    id = Column(Integer, primary_key=True)
    state_code = Column(String(2), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    level = Column(String(100), nullable=True)
    issuer = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    category = Column(String(40), nullable=True, index=True)
    sort_order = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
