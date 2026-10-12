"""OWW Document Studio — folders, documents, versions, assets."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    LargeBinary,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from app.db.base_class import Base

PROGRAM_SCOPE = "program:NY"


def _uuid() -> str:
    return str(uuid.uuid4())


def program_scope_for_state(state_code: str) -> str:
    return f"program:{(state_code or 'NY').upper()[:2]}"


def user_scope(user_id: int) -> str:
    return f"user:{int(user_id)}"


def is_program_scope(scope: str) -> bool:
    return scope == "program" or (scope or "").startswith("program:")


def is_user_scope(scope: str) -> bool:
    return (scope or "").startswith("user:")


class DocFolder(Base):
    __tablename__ = "doc_folders"

    id = Column(String(36), primary_key=True, default=_uuid)
    scope = Column(String(64), nullable=False, index=True, default=PROGRAM_SCOPE)
    parent_id = Column(
        String(36), ForeignKey("doc_folders.id", ondelete="CASCADE"), nullable=True, index=True
    )
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    sort_order = Column(Integer, nullable=False, default=0)
    is_system = Column(Boolean, nullable=False, default=False)
    created_by = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    documents = relationship("DocDocument", back_populates="folder")


class DocDocument(Base):
    __tablename__ = "doc_documents"

    id = Column(String(36), primary_key=True, default=_uuid)
    title = Column(String(500), nullable=True)
    scope = Column(String(64), nullable=False, index=True, default=PROGRAM_SCOPE)
    folder_id = Column(
        String(36), ForeignKey("doc_folders.id", ondelete="SET NULL"), nullable=True, index=True
    )
    doc_type = Column(String(32), nullable=False, default="document")
    status = Column(String(32), nullable=False, default="draft")
    summary = Column(Text, nullable=True)
    tags = Column(JSONB, nullable=True)
    content_markdown = Column(Text, nullable=True)
    content_json = Column(JSONB, nullable=True)
    template_id = Column(String(64), nullable=True)
    version_no = Column(Integer, nullable=False, default=1)
    word_count = Column(Integer, nullable=False, default=0)
    sort_order = Column(Integer, nullable=False, default=0)
    # Link to OWW CMS page / social post when authored for those surfaces
    content_page_id = Column(Integer, ForeignKey("content_pages.id"), nullable=True, index=True)
    social_post_id = Column(Integer, ForeignKey("social_posts.id"), nullable=True, index=True)
    created_by = Column(Integer, nullable=True)
    updated_by = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    published_at = Column(DateTime, nullable=True)

    folder = relationship("DocFolder", back_populates="documents")
    versions = relationship(
        "DocVersion",
        back_populates="document",
        cascade="all, delete-orphan",
        order_by="DocVersion.version_no.desc()",
    )
    assets = relationship("DocAsset", back_populates="document", cascade="all, delete-orphan")


class DocVersion(Base):
    __tablename__ = "doc_versions"

    id = Column(String(36), primary_key=True, default=_uuid)
    document_id = Column(
        String(36), ForeignKey("doc_documents.id", ondelete="CASCADE"), nullable=False, index=True
    )
    version_no = Column(Integer, nullable=False)
    title = Column(String(500), nullable=True)
    content_markdown = Column(Text, nullable=True)
    content_json = Column(JSONB, nullable=True)
    note = Column(String(300), nullable=True)
    kind = Column(String(32), nullable=False, default="autosave")  # autosave | manual | publish | restore
    created_by = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    document = relationship("DocDocument", back_populates="versions")


class DocAsset(Base):
    __tablename__ = "doc_assets"

    id = Column(String(36), primary_key=True, default=_uuid)
    document_id = Column(
        String(36), ForeignKey("doc_documents.id", ondelete="CASCADE"), nullable=True, index=True
    )
    scope = Column(String(64), nullable=False, index=True, default=PROGRAM_SCOPE)
    filename = Column(String(300), nullable=False)
    content_type = Column(String(120), nullable=False, default="application/octet-stream")
    size_bytes = Column(BigInteger, nullable=False, default=0)
    data = Column(LargeBinary, nullable=False)
    created_by = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    document = relationship("DocDocument", back_populates="assets")
