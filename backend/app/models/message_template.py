"""Message templates."""
from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String, Text
from app.db.base_class import Base

class MessageTemplate(Base):
    __tablename__ = "message_templates"
    id = Column(Integer, primary_key=True)
    org_id = Column(Integer, nullable=True, index=True)
    name = Column(String(255), nullable=False)
    subject = Column(String(255), nullable=True)
    body = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
