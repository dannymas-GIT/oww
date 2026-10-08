"""SQLAlchemy database session for OWW."""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

engine = create_engine(settings.SQLALCHEMY_DATABASE_URI, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    from app.db import base  # noqa: F401
    from sqlalchemy import text

    base.import_models()
    Base.metadata.create_all(bind=engine)

    # Idempotent columns for WW360 handoff + CMS templates.
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS ww360_org_id VARCHAR(64)"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS ww360_user_id VARCHAR(64)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_organizations_ww360_org_id ON organizations (ww360_org_id)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_users_ww360_user_id ON users (ww360_user_id)"))
        conn.execute(text("ALTER TABLE content_pages ADD COLUMN IF NOT EXISTS template VARCHAR(50) DEFAULT 'simple_page'"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_content_pages_template ON content_pages (template)"))
        conn.execute(text("ALTER TABLE content_pages ADD COLUMN IF NOT EXISTS author_name VARCHAR(255)"))
        conn.execute(text("ALTER TABLE content_pages ADD COLUMN IF NOT EXISTS published_at TIMESTAMP"))
        conn.execute(text("ALTER TABLE content_pages ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_content_pages_published_at ON content_pages (published_at)"))

