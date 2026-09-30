"""CMS resource items."""
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from app.db.base_class import Base

class ResourceItem(Base):
    __tablename__ = "resource_items"
    id = Column(Integer, primary_key=True)
    state_code = Column(String(2), nullable=False, index=True, default="NY")
    pathway = Column(String(50), nullable=True, index=True)
    category = Column(String(100), nullable=True)
    title = Column(String(255), nullable=False)
    body_html = Column(Text, nullable=True)
    url = Column(String(500), nullable=True)
    published = Column(Boolean, default=True)
    meta = Column(JSONB, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
