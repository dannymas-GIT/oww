"""OWW Document Studio service — folders, documents, versions, assets, CMS/social publish."""

from __future__ import annotations

import logging
import re
from datetime import datetime
from typing import Any

from fastapi import HTTPException
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.models.content_page import ContentPage
from app.models.doc_studio import (
    PROGRAM_SCOPE,
    DocAsset,
    DocDocument,
    DocFolder,
    DocVersion,
    is_program_scope,
    is_user_scope,
    program_scope_for_state,
    user_scope,
)
from app.models.user import User
from app.schemas.doc_studio import (
    DocAssetRead,
    DocContentSave,
    DocDocumentCreate,
    DocDocumentDetail,
    DocDocumentRead,
    DocDocumentUpdate,
    DocFolderCreate,
    DocFolderRead,
    DocFolderUpdate,
    DocStudioAccess,
    DocVersionDetail,
    DocVersionRead,
)
from app.services import cms_service, social_service
from app.services.doc_studio_samples import SAMPLE_DOCUMENTS
from app.services.role_catalog_service import PLATFORM_EDITOR_ROLES, PLATFORM_OPS_ROLES

logger = logging.getLogger(__name__)

AUTHOR_ROLES = set(PLATFORM_EDITOR_ROLES) | set(PLATFORM_OPS_ROLES) | {
    "platform_admin",
    "state_admin",
    "platform_manager",
}
ASSET_URL_PREFIX = "/api/v1/doc-studio/assets"
_WORD_RE = re.compile(r"[A-Za-z0-9’'-]+")

SYSTEM_FOLDERS: list[tuple[str, str]] = [
    ("Blog drafts", "In-progress blog posts — edit in Studio, publish to the public site"),
    ("Landing pages", "Public landing / pathway page bodies"),
    ("Social posts", "Social and WW360 share drafts"),
    ("Email and outreach", "Member email and invitation drafts"),
    ("SEO and briefs", "SEO briefs and marketing notes"),
    ("General docs", "Procedures, notes, and other documentation"),
]


def _word_count(markdown: str | None) -> int:
    if not markdown:
        return 0
    return len(_WORD_RE.findall(markdown))


def resolve_scope(user: User, requested: str | None = None, state_code: str = "NY") -> str:
    roles = set(user.roles or [])
    is_author = bool(roles & AUTHOR_ROLES) or user.has_role("platform_admin")
    if requested:
        req = requested.strip()
        if is_user_scope(req):
            if req == user_scope(user.id) or user.has_role("platform_admin"):
                return req
            raise HTTPException(403, "No access to that private library")
        if is_program_scope(req) or req.startswith("program:"):
            if is_author:
                return program_scope_for_state(req.split(":")[-1] if ":" in req else state_code)
            raise HTTPException(403, "No access to program library")
        raise HTTPException(400, "Unknown scope")
    if is_author:
        return program_scope_for_state(state_code)
    return user_scope(user.id)


class DocStudioService:
    def __init__(self, db: Session):
        self.db = db

    def access(self, user: User, scope: str) -> DocStudioAccess:
        roles = set(user.roles or [])
        can_author = bool(roles & AUTHOR_ROLES) or user.has_role("platform_admin")
        label = (
            f"{scope.split(':')[-1]} program library"
            if is_program_scope(scope)
            else "My drafts"
        )
        return DocStudioAccess(
            scope=scope,
            scope_label=label,
            can_view=True,
            can_author=can_author or is_user_scope(scope),
            can_publish=can_author,
            can_manage_folders=can_author or is_user_scope(scope),
            roles=sorted(roles),
        )

    def require_author(self, user: User, scope: str) -> None:
        if not self.access(user, scope).can_author:
            raise HTTPException(403, "Authoring requires an editor or ops role")

    def _dedupe_folders(self, scope: str) -> bool:
        """Keep one folder per (scope, name); merge docs onto the keeper. Returns True if changed."""
        rows = (
            self.db.query(DocFolder)
            .filter(DocFolder.scope == scope)
            .order_by(DocFolder.created_at.asc().nullsfirst(), DocFolder.id.asc())
            .all()
        )
        by_name: dict[str, list[DocFolder]] = {}
        for folder in rows:
            by_name.setdefault(folder.name, []).append(folder)
        changed = False
        for _name, group in by_name.items():
            if len(group) < 2:
                continue
            keeper = group[0]
            for dup in group[1:]:
                self.db.query(DocDocument).filter(DocDocument.folder_id == dup.id).update(
                    {"folder_id": keeper.id}, synchronize_session=False
                )
                self.db.delete(dup)
                changed = True
        return changed

    def ensure_default_folders(self, scope: str, user_id: int | None) -> None:
        """Idempotent system-folder seed (safe under concurrent access)."""
        # Serialize concurrent first-load seeds for this scope (Postgres).
        try:
            from sqlalchemy import text

            lock_key = abs(hash(f"oww-doc-studio:{scope}")) % (2**31)
            self.db.execute(text("SELECT pg_advisory_xact_lock(:k)"), {"k": lock_key})
        except Exception:
            logger.debug("advisory lock unavailable; continuing with dedupe", exc_info=True)

        changed = self._dedupe_folders(scope)
        existing = {
            name
            for (name,) in self.db.query(DocFolder.name).filter(DocFolder.scope == scope).all()
        }
        for idx, (name, desc) in enumerate(SYSTEM_FOLDERS):
            if name in existing:
                continue
            self.db.add(
                DocFolder(
                    scope=scope,
                    name=name,
                    description=desc,
                    sort_order=idx,
                    is_system=True,
                    created_by=user_id,
                )
            )
            existing.add(name)
            changed = True
        if changed:
            self.db.commit()

    def ensure_sample_documents(self, scope: str, user_id: int | None) -> None:
        """Seed scenario sample docs into system folders (idempotent by template_id)."""
        if not SAMPLE_DOCUMENTS:
            return
        folders = {
            f.name: f
            for f in self.db.query(DocFolder).filter(DocFolder.scope == scope).all()
        }
        # Only treat docs tagged "sample" as already seeded (user copies share template_id).
        existing_sample_ids: set[str] = set()
        for doc in (
            self.db.query(DocDocument)
            .filter(
                DocDocument.scope == scope,
                DocDocument.template_id.isnot(None),
                DocDocument.status != "archived",
            )
            .all()
        ):
            tags = doc.tags or []
            if isinstance(tags, list) and "sample" in tags and doc.template_id:
                existing_sample_ids.add(doc.template_id)
        created = False
        for template_id, folder_name, title, summary, body in SAMPLE_DOCUMENTS:
            if template_id in existing_sample_ids:
                continue
            folder = folders.get(folder_name)
            doc = DocDocument(
                scope=scope,
                title=title,
                folder_id=folder.id if folder else None,
                doc_type="document",
                status="draft",
                summary=summary,
                tags=["sample", template_id],
                content_markdown=body,
                template_id=template_id,
                word_count=_word_count(body),
                created_by=user_id,
                updated_by=user_id,
            )
            self.db.add(doc)
            existing_sample_ids.add(template_id)
            created = True
        if created:
            self.db.commit()

    def provision(self, scope: str, user_id: int | None) -> None:
        self.ensure_default_folders(scope, user_id)
        self.ensure_sample_documents(scope, user_id)

    def _folder_read(self, folder: DocFolder) -> DocFolderRead:
        count = (
            self.db.query(func.count(DocDocument.id))
            .filter(DocDocument.folder_id == folder.id, DocDocument.status != "archived")
            .scalar()
            or 0
        )
        return DocFolderRead(
            id=folder.id,
            scope=folder.scope,
            parent_id=folder.parent_id,
            name=folder.name,
            description=folder.description,
            sort_order=folder.sort_order or 0,
            is_system=bool(folder.is_system),
            document_count=int(count),
            created_at=folder.created_at,
        )

    def list_folders(self, scope: str) -> list[DocFolderRead]:
        rows = (
            self.db.query(DocFolder)
            .filter(DocFolder.scope == scope)
            .order_by(DocFolder.sort_order, DocFolder.name)
            .all()
        )
        return [self._folder_read(f) for f in rows]

    def create_folder(self, scope: str, body: DocFolderCreate, user_id: int | None) -> DocFolderRead:
        name = body.name.strip()
        dup = (
            self.db.query(DocFolder)
            .filter(
                DocFolder.scope == scope,
                DocFolder.name == name,
                DocFolder.parent_id == body.parent_id if body.parent_id else DocFolder.parent_id.is_(None),
            )
            .first()
        )
        if dup:
            raise HTTPException(400, f'Folder "{name}" already exists')
        folder = DocFolder(
            scope=scope,
            name=name,
            description=body.description,
            parent_id=body.parent_id,
            created_by=user_id,
        )
        self.db.add(folder)
        self.db.commit()
        self.db.refresh(folder)
        return self._folder_read(folder)

    def update_folder(self, scope: str, folder_id: str, body: DocFolderUpdate) -> DocFolderRead:
        folder = self._get_folder(scope, folder_id)
        if body.name is not None:
            folder.name = body.name.strip()
        if body.description is not None:
            folder.description = body.description
        if body.parent_id is not None:
            folder.parent_id = body.parent_id or None
        if body.sort_order is not None:
            folder.sort_order = body.sort_order
        folder.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(folder)
        return self._folder_read(folder)

    def delete_folder(self, scope: str, folder_id: str) -> None:
        folder = self._get_folder(scope, folder_id)
        if folder.is_system:
            raise HTTPException(400, "Cannot delete a system folder")
        self.db.query(DocDocument).filter(DocDocument.folder_id == folder.id).update(
            {"folder_id": None}, synchronize_session=False
        )
        self.db.delete(folder)
        self.db.commit()

    def _get_folder(self, scope: str, folder_id: str) -> DocFolder:
        folder = (
            self.db.query(DocFolder)
            .filter(DocFolder.id == folder_id, DocFolder.scope == scope)
            .first()
        )
        if not folder:
            raise HTTPException(404, "Folder not found")
        return folder

    def _doc_read(self, doc: DocDocument) -> DocDocumentRead:
        return DocDocumentRead.model_validate(doc)

    def _doc_detail(self, doc: DocDocument) -> DocDocumentDetail:
        return DocDocumentDetail.model_validate(doc)

    def list_documents(
        self,
        scope: str,
        *,
        folder_id: str | None = None,
        q: str | None = None,
        status: str | None = None,
        limit: int = 100,
    ) -> list[DocDocumentRead]:
        query = self.db.query(DocDocument).filter(DocDocument.scope == scope)
        if folder_id == "__unfiled__":
            query = query.filter(DocDocument.folder_id.is_(None))
        elif folder_id:
            query = query.filter(DocDocument.folder_id == folder_id)
        if status:
            query = query.filter(DocDocument.status == status)
        else:
            query = query.filter(DocDocument.status != "archived")
        if q:
            like = f"%{q.strip()}%"
            query = query.filter(
                or_(DocDocument.title.ilike(like), DocDocument.content_markdown.ilike(like))
            )
        rows = (
            query.order_by(DocDocument.updated_at.desc().nullslast(), DocDocument.id.desc())
            .limit(min(limit, 200))
            .all()
        )
        return [self._doc_read(d) for d in rows]

    def get_document(self, scope: str, doc_id: str) -> DocDocumentDetail:
        doc = self._get_doc(scope, doc_id)
        return self._doc_detail(doc)

    def create_document(
        self, scope: str, body: DocDocumentCreate, user_id: int | None
    ) -> DocDocumentDetail:
        doc = DocDocument(
            scope=scope,
            title=(body.title or "Untitled").strip() or "Untitled",
            folder_id=body.folder_id,
            doc_type=body.doc_type or "document",
            content_markdown=body.content_markdown or "",
            content_json=body.content_json,
            template_id=body.template_id,
            tags=body.tags or [],
            summary=body.summary,
            content_page_id=body.content_page_id,
            social_post_id=body.social_post_id,
            word_count=_word_count(body.content_markdown),
            created_by=user_id,
            updated_by=user_id,
        )
        self.db.add(doc)
        self.db.commit()
        self.db.refresh(doc)
        self._cut_version(doc, kind="manual", user_id=user_id, note="Created")
        return self._doc_detail(doc)

    def update_document(
        self, scope: str, doc_id: str, body: DocDocumentUpdate, user_id: int | None
    ) -> DocDocumentDetail:
        doc = self._get_doc(scope, doc_id)
        data = body.model_dump(exclude_unset=True)
        for key, val in data.items():
            setattr(doc, key, val)
        doc.updated_by = user_id
        doc.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(doc)
        return self._doc_detail(doc)

    def save_content(
        self, scope: str, doc_id: str, body: DocContentSave, user_id: int | None
    ) -> DocDocumentDetail:
        doc = self._get_doc(scope, doc_id)
        if body.title is not None:
            doc.title = body.title.strip() or doc.title
        if body.content_markdown is not None:
            doc.content_markdown = body.content_markdown
            doc.word_count = _word_count(body.content_markdown)
        if body.content_json is not None:
            doc.content_json = body.content_json
        kind = (body.kind or "autosave").lower()
        if kind not in ("autosave", "manual", "publish"):
            kind = "autosave"
        doc.updated_by = user_id
        doc.updated_at = datetime.utcnow()
        if kind == "publish":
            doc.status = "published"
            doc.published_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(doc)
        # Cap autosaves: only cut version for manual/publish, or periodic autosave
        if kind != "autosave" or self._should_autosave_version(doc):
            self._cut_version(doc, kind=kind, user_id=user_id, note=body.note)
        return self._doc_detail(doc)

    def _should_autosave_version(self, doc: DocDocument) -> bool:
        last = (
            self.db.query(DocVersion)
            .filter(DocVersion.document_id == doc.id)
            .order_by(DocVersion.version_no.desc())
            .first()
        )
        if not last:
            return True
        # New autosave version at most every ~2 minutes of wall clock for storage sanity
        age = (datetime.utcnow() - (last.created_at or datetime.utcnow())).total_seconds()
        return age > 120 or last.kind != "autosave"

    def _cut_version(
        self, doc: DocDocument, *, kind: str, user_id: int | None, note: str | None = None
    ) -> DocVersion:
        next_no = (doc.version_no or 1) + 1
        doc.version_no = next_no
        ver = DocVersion(
            document_id=doc.id,
            version_no=next_no,
            title=doc.title,
            content_markdown=doc.content_markdown,
            content_json=doc.content_json,
            note=note,
            kind=kind,
            created_by=user_id,
        )
        self.db.add(ver)
        # Cap ~60 versions
        old = (
            self.db.query(DocVersion)
            .filter(DocVersion.document_id == doc.id)
            .order_by(DocVersion.version_no.desc())
            .offset(60)
            .all()
        )
        for o in old:
            self.db.delete(o)
        self.db.commit()
        self.db.refresh(doc)
        return ver

    def list_versions(self, scope: str, doc_id: str) -> list[DocVersionRead]:
        self._get_doc(scope, doc_id)
        rows = (
            self.db.query(DocVersion)
            .filter(DocVersion.document_id == doc_id)
            .order_by(DocVersion.version_no.desc())
            .limit(60)
            .all()
        )
        return [DocVersionRead.model_validate(v) for v in rows]

    def get_version(self, scope: str, doc_id: str, version_id: str) -> DocVersionDetail:
        self._get_doc(scope, doc_id)
        ver = (
            self.db.query(DocVersion)
            .filter(DocVersion.id == version_id, DocVersion.document_id == doc_id)
            .first()
        )
        if not ver:
            raise HTTPException(404, "Version not found")
        return DocVersionDetail.model_validate(ver)

    def restore_version(
        self, scope: str, doc_id: str, version_id: str, user_id: int | None
    ) -> DocDocumentDetail:
        doc = self._get_doc(scope, doc_id)
        ver = (
            self.db.query(DocVersion)
            .filter(DocVersion.id == version_id, DocVersion.document_id == doc_id)
            .first()
        )
        if not ver:
            raise HTTPException(404, "Version not found")
        doc.content_markdown = ver.content_markdown
        doc.content_json = ver.content_json
        if ver.title:
            doc.title = ver.title
        doc.word_count = _word_count(doc.content_markdown)
        doc.updated_by = user_id
        doc.updated_at = datetime.utcnow()
        self.db.commit()
        self._cut_version(doc, kind="restore", user_id=user_id, note=f"Restored v{ver.version_no}")
        self.db.refresh(doc)
        return self._doc_detail(doc)

    def delete_document(self, scope: str, doc_id: str) -> None:
        doc = self._get_doc(scope, doc_id)
        doc.status = "archived"
        doc.updated_at = datetime.utcnow()
        self.db.commit()

    def _get_doc(self, scope: str, doc_id: str) -> DocDocument:
        doc = (
            self.db.query(DocDocument)
            .filter(DocDocument.id == doc_id, DocDocument.scope == scope)
            .first()
        )
        if not doc:
            raise HTTPException(404, "Document not found")
        return doc

    def upload_asset(
        self,
        scope: str,
        *,
        filename: str,
        content_type: str,
        data: bytes,
        document_id: str | None,
        user_id: int | None,
    ) -> DocAssetRead:
        if document_id:
            self._get_doc(scope, document_id)
        if len(data) > 25 * 1024 * 1024:
            raise HTTPException(400, "Asset too large (max 25 MB)")
        asset = DocAsset(
            scope=scope,
            document_id=document_id,
            filename=filename[:300],
            content_type=content_type or "application/octet-stream",
            size_bytes=len(data),
            data=data,
            created_by=user_id,
        )
        self.db.add(asset)
        self.db.commit()
        self.db.refresh(asset)
        return self._asset_read(asset)

    def get_asset(self, asset_id: str) -> DocAsset:
        asset = self.db.query(DocAsset).filter(DocAsset.id == asset_id).first()
        if not asset:
            raise HTTPException(404, "Asset not found")
        return asset

    def list_assets(self, scope: str, document_id: str | None = None) -> list[DocAssetRead]:
        q = self.db.query(DocAsset).filter(DocAsset.scope == scope)
        if document_id:
            q = q.filter(DocAsset.document_id == document_id)
        rows = q.order_by(DocAsset.created_at.desc()).limit(100).all()
        return [self._asset_read(a) for a in rows]

    def _asset_read(self, asset: DocAsset) -> DocAssetRead:
        return DocAssetRead(
            id=asset.id,
            document_id=asset.document_id,
            scope=asset.scope,
            filename=asset.filename,
            content_type=asset.content_type,
            size_bytes=int(asset.size_bytes or 0),
            url=f"{ASSET_URL_PREFIX}/{asset.id}/file",
            created_at=asset.created_at,
        )

    def find_or_create_for_page(
        self, scope: str, page: ContentPage, user_id: int | None
    ) -> DocDocumentDetail:
        existing = (
            self.db.query(DocDocument)
            .filter(
                DocDocument.scope == scope,
                DocDocument.content_page_id == page.id,
                DocDocument.status != "archived",
            )
            .order_by(DocDocument.updated_at.desc())
            .first()
        )
        if existing:
            return self._doc_detail(existing)

        self.ensure_default_folders(scope, user_id)
        folder_name = "Blog drafts" if page.template == cms_service.BLOG_TEMPLATE else "Landing pages"
        folder = (
            self.db.query(DocFolder)
            .filter(DocFolder.scope == scope, DocFolder.name == folder_name)
            .first()
        )
        # Seed body from first rich_text section
        html = ""
        sections = []
        payload = page.body_json if isinstance(page.body_json, dict) else {}
        if isinstance(payload.get("sections"), list):
            sections = payload["sections"]
        for sec in sections:
            if isinstance(sec, dict) and sec.get("type") == "rich_text" and sec.get("html"):
                html = str(sec["html"])
                break
        # Store as HTML wrapped lightly — Studio TipTap can load HTML via markdown plugin with html:true
        md = html or page.body_html or f"# {page.title or 'Untitled'}\n\n"
        return self.create_document(
            scope,
            DocDocumentCreate(
                title=page.title or "Untitled",
                folder_id=folder.id if folder else None,
                content_markdown=md,
                content_page_id=page.id,
                tags=["cms", page.template or "page"],
                summary=page.summary,
            ),
            user_id,
        )

    def publish_to_cms(
        self,
        scope: str,
        doc_id: str,
        *,
        content_page_id: int | None,
        create_blog: bool,
        title: str | None,
        state_code: str,
        publish: bool,
        user_id: int | None,
    ) -> dict[str, Any]:
        doc = self._get_doc(scope, doc_id)
        page: ContentPage | None = None
        pid = content_page_id or doc.content_page_id
        if pid:
            page = self.db.query(ContentPage).filter(ContentPage.id == pid).first()
            if not page:
                raise HTTPException(404, "Content page not found")
        elif create_blog:
            base = _slugify(title or doc.title or "post")
            slug = base
            n = 2
            state = (state_code or "NY").upper()[:2]
            while (
                self.db.query(ContentPage)
                .filter(ContentPage.state_code == state, ContentPage.slug == slug)
                .first()
            ):
                slug = f"{base}-{n}"
                n += 1
            body_html = _markdownish_to_html(doc.content_markdown or "")
            page = ContentPage(
                state_code=state,
                slug=slug,
                title=(title or doc.title or "Untitled").strip(),
                template=cms_service.BLOG_TEMPLATE,
                summary=(doc.summary or "")[:400],
                body_html=body_html,
                body_json={
                    "sections": [
                        {
                            "type": "hero",
                            "eyebrow": "From Document Studio",
                            "headline": title or doc.title or "Untitled",
                            "subhead": doc.summary or "",
                            "media_url": "",
                            "media_type": "image",
                        },
                        {"type": "rich_text", "title": "", "html": body_html},
                    ]
                },
                is_published=bool(publish),
                tags=doc.tags if isinstance(doc.tags, list) else [],
                author_name="OWW",
            )
            if publish:
                cms_service.stamp_publish_dates(page, publishing=True)
            self.db.add(page)
            self.db.commit()
            self.db.refresh(page)
            doc.content_page_id = page.id
        else:
            raise HTTPException(400, "content_page_id or create_blog required")

        assert page is not None
        body_html = _markdownish_to_html(doc.content_markdown or "")
        page.title = (title or doc.title or page.title or "Untitled").strip()
        page.body_html = body_html
        payload = page.body_json if isinstance(page.body_json, dict) else {"sections": []}
        sections = list(payload.get("sections") or [])
        replaced = False
        for i, sec in enumerate(sections):
            if isinstance(sec, dict) and sec.get("type") == "rich_text":
                sections[i] = {**sec, "html": body_html}
                replaced = True
                break
        if not replaced:
            sections.append({"type": "rich_text", "title": "", "html": body_html})
        page.body_json = {**payload, "sections": cms_service.sanitize_sections(sections)}
        if publish:
            page.is_published = True
            cms_service.stamp_publish_dates(page, publishing=True)
        page.updated_at = datetime.utcnow()
        doc.content_page_id = page.id
        doc.status = "published" if publish else doc.status
        doc.updated_by = user_id
        doc.updated_at = datetime.utcnow()
        self.db.commit()
        self._cut_version(doc, kind="publish", user_id=user_id, note="Published to CMS")
        return {
            "document_id": doc.id,
            "content_page_id": page.id,
            "slug": page.slug,
            "published": bool(page.is_published),
            "url": social_service.public_blog_url(page)
            if page.template == cms_service.BLOG_TEMPLATE
            else f"/{(page.state_code or 'ny').lower()}/{page.slug}",
        }

    def publish_to_social(
        self,
        scope: str,
        doc_id: str,
        *,
        platforms: list[str],
        publish: bool,
        link_url: str | None,
        user_id: int | None,
    ) -> dict[str, Any]:
        doc = self._get_doc(scope, doc_id)
        message = (doc.content_markdown or "").strip()
        # Strip simple markdown markers for social plain text
        plain = re.sub(r"[#>*_`]", "", message)
        plain = re.sub(r"\n{3,}", "\n\n", plain).strip()
        post = social_service.create_post(
            self.db,
            message=plain[:4800] or (doc.title or "Update"),
            platforms=platforms or ["linkedin"],
            content_page_id=doc.content_page_id,
            link_url=link_url,
            created_by=user_id,
            status="queued" if publish else "draft",
        )
        doc.social_post_id = post.id
        self.db.commit()
        if publish:
            post = social_service.publish_now(self.db, post)
        return social_service.post_to_dict(post)


def _slugify(text: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", (text or "").lower()).strip("-")
    return (s[:80] or "update")


def _markdownish_to_html(text: str) -> str:
    """Minimal markdown → HTML for CMS rich_text (headings, lists, paragraphs)."""
    if not text:
        return "<p></p>"
    if "<p>" in text or "<h2>" in text or "<ul>" in text:
        return cms_service.sanitize_html(text)
    lines = text.replace("\r\n", "\n").split("\n")
    out: list[str] = []
    in_ul = False
    for raw in lines:
        line = raw.rstrip()
        if line.startswith("### "):
            if in_ul:
                out.append("</ul>")
                in_ul = False
            out.append(f"<h3>{_esc(line[4:])}</h3>")
        elif line.startswith("## "):
            if in_ul:
                out.append("</ul>")
                in_ul = False
            out.append(f"<h2>{_esc(line[3:])}</h2>")
        elif line.startswith("# "):
            if in_ul:
                out.append("</ul>")
                in_ul = False
            out.append(f"<h2>{_esc(line[2:])}</h2>")
        elif line.startswith("- ") or line.startswith("* "):
            if not in_ul:
                out.append("<ul>")
                in_ul = True
            out.append(f"<li>{_esc(line[2:])}</li>")
        elif not line.strip():
            if in_ul:
                out.append("</ul>")
                in_ul = False
        else:
            if in_ul:
                out.append("</ul>")
                in_ul = False
            out.append(f"<p>{_esc(line)}</p>")
    if in_ul:
        out.append("</ul>")
    return cms_service.sanitize_html("".join(out) or "<p></p>")


def _esc(s: str) -> str:
    return (
        s.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )
