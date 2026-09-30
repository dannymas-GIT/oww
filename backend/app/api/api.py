
"""Aggregate API router."""
from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    taxonomy,
    jurisdictions,
    public,
    profiles,
    orgs,
    jobs,
    matches,
    favorites,
    messaging,
    educator,
    admin,
    admin_platform,
    billing,
    impersonation,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(taxonomy.router)
api_router.include_router(jurisdictions.router)
api_router.include_router(public.router)
api_router.include_router(profiles.router)
api_router.include_router(orgs.router)
api_router.include_router(jobs.router)
api_router.include_router(matches.router)
api_router.include_router(favorites.router)
api_router.include_router(messaging.router)
api_router.include_router(educator.router)
api_router.include_router(admin.router)
api_router.include_router(admin_platform.router)
api_router.include_router(billing.router)
api_router.include_router(impersonation.router)
