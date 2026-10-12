"""Pydantic schemas for OWW Document Studio."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class DocStudioAccess(BaseModel):
    scope: str
    scope_label: str
    can_view: bool = True
    can_author: bool = False
    can_publish: bool = False
    can_manage_folders: bool = False
    roles: list[str] = Field(default_factory=list)


class DocFolderCreate(BaseModel):
    name: str
    description: str | None = None
    parent_id: str | None = None


class DocFolderUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    parent_id: str | None = None
    sort_order: int | None = None


class DocFolderRead(BaseModel):
    id: str
    scope: str
    parent_id: str | None = None
    name: str
    description: str | None = None
    sort_order: int = 0
    is_system: bool = False
    document_count: int = 0
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class DocDocumentCreate(BaseModel):
    title: str | None = "Untitled"
    folder_id: str | None = None
    doc_type: str = "document"
    content_markdown: str | None = ""
    content_json: dict[str, Any] | None = None
    template_id: str | None = None
    tags: list[str] | None = None
    summary: str | None = None
    content_page_id: int | None = None
    social_post_id: int | None = None


class DocDocumentUpdate(BaseModel):
    title: str | None = None
    folder_id: str | None = None
    status: str | None = None
    summary: str | None = None
    tags: list[str] | None = None
    template_id: str | None = None
    content_page_id: int | None = None
    social_post_id: int | None = None


class DocContentSave(BaseModel):
    title: str | None = None
    content_markdown: str | None = None
    content_json: dict[str, Any] | None = None
    kind: str = "autosave"  # autosave | manual | publish
    note: str | None = None


class DocDocumentRead(BaseModel):
    id: str
    title: str | None = None
    scope: str
    folder_id: str | None = None
    doc_type: str = "document"
    status: str = "draft"
    summary: str | None = None
    tags: list[str] | None = None
    template_id: str | None = None
    version_no: int = 1
    word_count: int = 0
    sort_order: int = 0
    content_page_id: int | None = None
    social_post_id: int | None = None
    created_by: int | None = None
    updated_by: int | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    published_at: datetime | None = None

    model_config = {"from_attributes": True}


class DocDocumentDetail(DocDocumentRead):
    content_markdown: str | None = None
    content_json: dict[str, Any] | None = None


class DocVersionRead(BaseModel):
    id: str
    document_id: str
    version_no: int
    title: str | None = None
    note: str | None = None
    kind: str
    created_by: int | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class DocVersionDetail(DocVersionRead):
    content_markdown: str | None = None
    content_json: dict[str, Any] | None = None


class DocAssetRead(BaseModel):
    id: str
    document_id: str | None = None
    scope: str
    filename: str
    content_type: str
    size_bytes: int
    url: str
    created_at: datetime | None = None


class PublishToCmsRequest(BaseModel):
    content_page_id: int | None = None
    create_blog: bool = False
    title: str | None = None
    state_code: str = "NY"
    publish: bool = True


class PublishToSocialRequest(BaseModel):
    platforms: list[str] = Field(default_factory=lambda: ["linkedin"])
    publish: bool = True
    link_url: str | None = None
