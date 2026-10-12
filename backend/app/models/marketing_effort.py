"""Marketing / SEO efforts tracked in the Communications hub."""

from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB

from app.db.base_class import Base


class MarketingEffort(Base):
    __tablename__ = "marketing_efforts"

    id = Column(Integer, primary_key=True, index=True)
    state_code = Column(String(2), nullable=False, default="NY", index=True)
    title = Column(String(255), nullable=False)
    # seo | campaign | content | social | event | other
    kind = Column(String(50), nullable=False, default="campaign", index=True)
    # planned | active | completed | archived
    status = Column(String(50), nullable=False, default="planned", index=True)
    channel = Column(String(80), nullable=True)  # email, linkedin, blog, web, paid, etc.
    description = Column(Text, nullable=True)
    seo_keywords = Column(JSONB, nullable=False, default=list)
    target_url = Column(String(1024), nullable=True)
    template_id = Column(String(80), nullable=True)
    send_method = Column(String(40), nullable=True)  # email|sms|blog_publish|social_share|manual
    content_page_id = Column(Integer, ForeignKey("content_pages.id"), nullable=True)
    communication_id = Column(Integer, ForeignKey("communications.id"), nullable=True)
    social_post_id = Column(Integer, ForeignKey("social_posts.id"), nullable=True)
    metrics = Column(JSONB, nullable=False, default=dict)
    starts_at = Column(DateTime, nullable=True)
    ends_at = Column(DateTime, nullable=True)
    created_by = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
