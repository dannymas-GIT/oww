
from fastapi import APIRouter
from app.services.taxonomy_service import get_taxonomy

router = APIRouter(tags=["taxonomy"])

@router.get("/taxonomy")
def taxonomy():
    return get_taxonomy()
