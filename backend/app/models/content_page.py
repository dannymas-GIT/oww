"""CMS content pages."""

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB

from app.db.base_class import Base


class ContentPage(Base):
    __tablename__ = "content_pages"

    id = Column(Integer, primary_key=True, index=True)
    state_code = Column(String(2), nullable=False, default="NY", index=True)
    slug = Column(String(255), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    # home_landing | pathway_landing | story_feature | simple_page | blog_post
    template = Column(String(50), nullable=False, default="simple_page", index=True)
    pathway = Column(String(50), nullable=True, index=True)
    summary = Column(Text, nullable=True)  # excerpt / teaser for blog cards
    body_html = Column(Text, nullable=True)
    # Structured sections for the chosen template: {"sections": [...]}
    body_json = Column(JSONB, nullable=False, default=dict)
    is_published = Column(Boolean, default=False, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    # Blog-style metadata (optional for landing pages)
    author_name = Column(String(255), nullable=True)
    published_at = Column(DateTime, nullable=True, index=True)
    tags = Column(JSONB, nullable=False, default=list)
    created_by = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
