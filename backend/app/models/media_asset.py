"""Uploaded media for CMS and public pages."""

from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String

from app.db.base_class import Base


class MediaAsset(Base):
    __tablename__ = "media_assets"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    content_type = Column(String(120), nullable=False, default="application/octet-stream")
    kind = Column(String(30), nullable=False, default="file")  # image | video | audio | document | file
    size_bytes = Column(Integer, nullable=False, default=0)
    storage_path = Column(String(500), nullable=False)
    public_url = Column(String(500), nullable=False)
    uploaded_by = Column(Integer, nullable=True)
    state_code = Column(String(2), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
