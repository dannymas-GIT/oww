"""Outbound social posts (blog syndication via aggregator provider)."""

from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB

from app.db.base_class import Base


class SocialPost(Base):
    __tablename__ = "social_posts"

    id = Column(Integer, primary_key=True, index=True)
    content_page_id = Column(Integer, ForeignKey("content_pages.id"), nullable=True, index=True)
    state_code = Column(String(2), nullable=False, default="NY", index=True)
    provider = Column(String(50), nullable=False, default="ayrshare")
    platforms = Column(JSONB, nullable=False, default=list)  # ["linkedin", ...]
    message = Column(Text, nullable=False, default="")
    link_url = Column(String(1024), nullable=True)
    media_url = Column(String(1024), nullable=True)
    # draft|scheduled|queued|posted|partial|failed
    status = Column(String(50), nullable=False, default="draft", index=True)
    scheduled_at = Column(DateTime, nullable=True, index=True)
    posted_at = Column(DateTime, nullable=True)
    provider_post_id = Column(String(255), nullable=True)
    provider_response = Column(JSONB, nullable=False, default=dict)
    error = Column(Text, nullable=True)
    attempts = Column(Integer, nullable=False, default=0)
    created_by = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
