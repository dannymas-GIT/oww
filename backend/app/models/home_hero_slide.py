"""Home / pathway hero rotator slides (3-tier copy + image + optional CTA)."""

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text

from app.db.base_class import Base


class HomeHeroSlide(Base):
    __tablename__ = "home_hero_slides"

    id = Column(Integer, primary_key=True, index=True)
    state_code = Column(String(2), nullable=False, default="NY", index=True)
    # home | career | hire | educate | ambassador
    scope = Column(String(24), nullable=False, default="home", index=True)
    kicker = Column(String(120), nullable=False, default="")
    title = Column(String(200), nullable=False)
    body = Column(Text, nullable=False, default="")
    image_url = Column(String(500), nullable=False)
    image_alt = Column(String(300), nullable=False, default="")
    cta_label = Column(String(80), nullable=True)
    cta_href = Column(String(300), nullable=True)
    sort_order = Column(Integer, nullable=False, default=100)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
