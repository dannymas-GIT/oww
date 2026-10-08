"""Persist and classify CMS media uploads."""

from __future__ import annotations

import re
import secrets
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.media_asset import MediaAsset

ALLOWED_PREFIXES = (
    "image/",
    "video/",
    "audio/",
    "application/pdf",
    "application/msword",
    "application/vnd.",
    "text/plain",
    "text/csv",
)


def _kind_for(content_type: str) -> str:
    ct = (content_type or "").lower()
    if ct.startswith("image/"):
        return "image"
    if ct.startswith("video/"):
        return "video"
    if ct.startswith("audio/"):
        return "audio"
    if ct in ("application/pdf",) or ct.startswith("application/msword") or "document" in ct or "presentation" in ct:
        return "document"
    return "file"


def _safe_ext(name: str) -> str:
    ext = Path(name or "").suffix.lower()
    if not ext or len(ext) > 12:
        return ""
    if not re.match(r"^\.[a-z0-9.]+$", ext):
        return ""
    return ext


def ensure_media_root() -> Path:
    root = Path(settings.MEDIA_ROOT)
    root.mkdir(parents=True, exist_ok=True)
    return root


async def save_upload(
    db: Session,
    *,
    upload: UploadFile,
    uploaded_by: int | None,
    state_code: str | None = None,
) -> MediaAsset:
    content_type = (upload.content_type or "application/octet-stream").split(";")[0].strip().lower()
    if not any(content_type.startswith(p) or content_type == p for p in ALLOWED_PREFIXES):
        raise HTTPException(
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported media type: {content_type}",
        )

    data = await upload.read()
    if not data:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Empty file")
    if len(data) > settings.MEDIA_MAX_BYTES:
        raise HTTPException(
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds {settings.MEDIA_MAX_BYTES // (1024 * 1024)} MB limit",
        )

    root = ensure_media_root()
    ext = _safe_ext(upload.filename or "")
    stored = f"{secrets.token_urlsafe(16)}{ext}"
    path = root / stored
    path.write_bytes(data)

    asset = MediaAsset(
        filename=stored,
        original_name=(upload.filename or stored)[:255],
        content_type=content_type,
        kind=_kind_for(content_type),
        size_bytes=len(data),
        storage_path=str(path),
        public_url=f"{settings.API_V1_STR}/public/media/{stored}",
        uploaded_by=uploaded_by,
        state_code=(state_code or "NY").upper()[:2] if state_code else None,
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset


def asset_to_dict(asset: MediaAsset) -> dict:
    return {
        "id": asset.id,
        "filename": asset.filename,
        "original_name": asset.original_name,
        "content_type": asset.content_type,
        "kind": asset.kind,
        "size_bytes": asset.size_bytes,
        "url": asset.public_url,
        "created_at": asset.created_at.isoformat() if asset.created_at else None,
    }


def resolve_stored_file(filename: str) -> Path:
    safe = Path(filename).name
    if safe != filename or ".." in filename:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Invalid filename")
    path = ensure_media_root() / safe
    if not path.is_file():
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Media not found")
    return path
