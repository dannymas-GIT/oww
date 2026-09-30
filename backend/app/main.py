
"""One Water Workforce FastAPI application."""
from __future__ import annotations
import logging
from contextlib import asynccontextmanager
from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from app.api.api import api_router
from app.core.config import settings
from app.db.database import SessionLocal, init_db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
_scheduler: BackgroundScheduler | None = None

def _run_match_refresh() -> None:
    if not settings.MATCH_REFRESH_ENABLED:
        return
    db = SessionLocal()
    try:
        from app.services.matching_service import refresh_all_matches
        n = refresh_all_matches(db)
        logger.info("Nightly match refresh: %s pairs", n)
    except Exception as exc:
        logger.warning("Match refresh failed: %s", exc)
    finally:
        db.close()

def _run_digests() -> None:
    if not settings.DIGEST_ENABLED:
        return
    db = SessionLocal()
    try:
        from app.services.digest_service import send_candidate_digests, send_employer_digests
        from app.services.featured_post_service import expire_due
        send_candidate_digests(db)
        send_employer_digests(db)
        expire_due(db)
    except Exception as exc:
        logger.warning("Digest job failed: %s", exc)
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    global _scheduler
    logger.info("OWW backend starting")
    try:
        init_db()
    except Exception as exc:
        logger.warning("DB init skipped or failed: %s", exc)
    _scheduler = BackgroundScheduler()
    _scheduler.add_job(_run_match_refresh, "cron", hour=2, minute=15, id="match_refresh")
    _scheduler.add_job(_run_digests, "cron", day_of_week="mon", hour=13, minute=0, id="weekly_digests")
    _scheduler.start()
    yield
    if _scheduler:
        _scheduler.shutdown(wait=False)
    logger.info("OWW backend stopped")

app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.trusted_hosts)
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health")
def health():
    return {"status": "ok", "service": "oww"}
