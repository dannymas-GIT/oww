"""OWW Document Studio API — /api/v1/doc-studio."""

from __future__ import annotations

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_roles
from app.models.content_page import ContentPage
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
    PublishToCmsRequest,
    PublishToSocialRequest,
)
from app.services.doc_studio_service import AUTHOR_ROLES, DocStudioService, resolve_scope
from app.services.role_catalog_service import PLATFORM_EDITOR_ROLES, PLATFORM_OPS_ROLES

router = APIRouter(prefix="/doc-studio", tags=["doc-studio"])

ACCESS = tuple(sorted(AUTHOR_ROLES | set(PLATFORM_EDITOR_ROLES) | set(PLATFORM_OPS_ROLES)))


def _svc(db: Session = Depends(get_db)) -> DocStudioService:
    return DocStudioService(db)


def _scope(
    scope: str | None = Query(None),
    state_code: str = Query("NY"),
    user: User = Depends(require_roles(*ACCESS)),
) -> tuple[User, str]:
    return user, resolve_scope(user, scope, state_code=state_code)


@router.get("/access", response_model=DocStudioAccess)
def get_access(pair=Depends(_scope), db: Session = Depends(get_db)):
    user, scope = pair
    svc = DocStudioService(db)
    svc.provision(scope, user.id)
    return svc.access(user, scope)


@router.get("/folders", response_model=list[DocFolderRead])
def list_folders(pair=Depends(_scope), db: Session = Depends(get_db)):
    """List folders. Provisioning runs on /access only to avoid duplicate seeds."""
    _, scope = pair
    return DocStudioService(db).list_folders(scope)


@router.post("/folders", response_model=DocFolderRead, status_code=201)
def create_folder(body: DocFolderCreate, pair=Depends(_scope), db: Session = Depends(get_db)):
    user, scope = pair
    svc = DocStudioService(db)
    svc.require_author(user, scope)
    return svc.create_folder(scope, body, user.id)


@router.patch("/folders/{folder_id}", response_model=DocFolderRead)
def patch_folder(
    folder_id: str, body: DocFolderUpdate, pair=Depends(_scope), db: Session = Depends(get_db)
):
    user, scope = pair
    svc = DocStudioService(db)
    svc.require_author(user, scope)
    return svc.update_folder(scope, folder_id, body)


@router.delete("/folders/{folder_id}")
def delete_folder(folder_id: str, pair=Depends(_scope), db: Session = Depends(get_db)):
    user, scope = pair
    svc = DocStudioService(db)
    svc.require_author(user, scope)
    svc.delete_folder(scope, folder_id)
    return {"ok": True}


@router.get("/documents", response_model=list[DocDocumentRead])
def list_documents(
    folder_id: str | None = None,
    q: str | None = None,
    status: str | None = None,
    pair=Depends(_scope),
    db: Session = Depends(get_db),
):
    _, scope = pair
    return DocStudioService(db).list_documents(scope, folder_id=folder_id, q=q, status=status)


@router.post("/documents", response_model=DocDocumentDetail, status_code=201)
def create_document(body: DocDocumentCreate, pair=Depends(_scope), db: Session = Depends(get_db)):
    user, scope = pair
    svc = DocStudioService(db)
    svc.require_author(user, scope)
    svc.provision(scope, user.id)
    return svc.create_document(scope, body, user.id)


@router.get("/documents/{doc_id}", response_model=DocDocumentDetail)
def get_document(doc_id: str, pair=Depends(_scope), db: Session = Depends(get_db)):
    _, scope = pair
    return DocStudioService(db).get_document(scope, doc_id)


@router.patch("/documents/{doc_id}", response_model=DocDocumentDetail)
def patch_document(
    doc_id: str, body: DocDocumentUpdate, pair=Depends(_scope), db: Session = Depends(get_db)
):
    user, scope = pair
    svc = DocStudioService(db)
    svc.require_author(user, scope)
    return svc.update_document(scope, doc_id, body, user.id)


@router.put("/documents/{doc_id}/content", response_model=DocDocumentDetail)
def save_content(
    doc_id: str, body: DocContentSave, pair=Depends(_scope), db: Session = Depends(get_db)
):
    user, scope = pair
    svc = DocStudioService(db)
    svc.require_author(user, scope)
    return svc.save_content(scope, doc_id, body, user.id)


@router.delete("/documents/{doc_id}")
def delete_document(doc_id: str, pair=Depends(_scope), db: Session = Depends(get_db)):
    user, scope = pair
    svc = DocStudioService(db)
    svc.require_author(user, scope)
    svc.delete_document(scope, doc_id)
    return {"ok": True}


@router.get("/documents/{doc_id}/versions", response_model=list[DocVersionRead])
def list_versions(doc_id: str, pair=Depends(_scope), db: Session = Depends(get_db)):
    _, scope = pair
    return DocStudioService(db).list_versions(scope, doc_id)


@router.get("/documents/{doc_id}/versions/{version_id}", response_model=DocVersionDetail)
def get_version(doc_id: str, version_id: str, pair=Depends(_scope), db: Session = Depends(get_db)):
    _, scope = pair
    return DocStudioService(db).get_version(scope, doc_id, version_id)


@router.post("/documents/{doc_id}/versions/{version_id}/restore", response_model=DocDocumentDetail)
def restore_version(
    doc_id: str, version_id: str, pair=Depends(_scope), db: Session = Depends(get_db)
):
    user, scope = pair
    svc = DocStudioService(db)
    svc.require_author(user, scope)
    return svc.restore_version(scope, doc_id, version_id, user.id)


@router.get("/assets", response_model=list[DocAssetRead])
def list_assets(
    document_id: str | None = None, pair=Depends(_scope), db: Session = Depends(get_db)
):
    _, scope = pair
    return DocStudioService(db).list_assets(scope, document_id=document_id)


@router.post("/assets", response_model=DocAssetRead, status_code=201)
async def upload_asset(
    file: UploadFile = File(...),
    document_id: str | None = Form(None),
    pair=Depends(_scope),
    db: Session = Depends(get_db),
):
    user, scope = pair
    svc = DocStudioService(db)
    svc.require_author(user, scope)
    data = await file.read()
    return svc.upload_asset(
        scope,
        filename=file.filename or "upload.bin",
        content_type=file.content_type or "application/octet-stream",
        data=data,
        document_id=document_id,
        user_id=user.id,
    )


@router.get("/assets/{asset_id}/file")
def serve_asset(asset_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _ = user
    asset = DocStudioService(db).get_asset(asset_id)
    return Response(
        content=bytes(asset.data),
        media_type=asset.content_type or "application/octet-stream",
        headers={"Cache-Control": "private, max-age=3600"},
    )


@router.post("/from-page/{page_id}", response_model=DocDocumentDetail)
def from_cms_page(page_id: int, pair=Depends(_scope), db: Session = Depends(get_db)):
    user, scope = pair
    svc = DocStudioService(db)
    svc.require_author(user, scope)
    page = db.query(ContentPage).filter(ContentPage.id == page_id).first()
    if not page:
        raise HTTPException(404, "Page not found")
    svc.provision(scope, user.id)
    return svc.find_or_create_for_page(scope, page, user.id)


@router.post("/documents/{doc_id}/publish-cms")
def publish_cms(
    doc_id: str, body: PublishToCmsRequest, pair=Depends(_scope), db: Session = Depends(get_db)
):
    user, scope = pair
    svc = DocStudioService(db)
    svc.require_author(user, scope)
    return svc.publish_to_cms(
        scope,
        doc_id,
        content_page_id=body.content_page_id,
        create_blog=body.create_blog,
        title=body.title,
        state_code=body.state_code,
        publish=body.publish,
        user_id=user.id,
    )


@router.post("/documents/{doc_id}/publish-social")
def publish_social(
    doc_id: str, body: PublishToSocialRequest, pair=Depends(_scope), db: Session = Depends(get_db)
):
    user, scope = pair
    svc = DocStudioService(db)
    svc.require_author(user, scope)
    return svc.publish_to_social(
        scope,
        doc_id,
        platforms=body.platforms,
        publish=body.publish,
        link_url=body.link_url,
        user_id=user.id,
    )
