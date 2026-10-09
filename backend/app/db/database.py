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
        # Granular public workforce-stats opt-in (district / utility sharing)
        conn.execute(
            text("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS public_share_prefs JSONB DEFAULT '{}'::jsonb")
        )
        conn.execute(text("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS public_share_updated_at TIMESTAMP"))
        conn.execute(text("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS public_share_updated_by INTEGER"))
        conn.execute(text("ALTER TABLE content_pages ADD COLUMN IF NOT EXISTS template VARCHAR(50) DEFAULT 'simple_page'"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_content_pages_template ON content_pages (template)"))
        conn.execute(text("ALTER TABLE content_pages ADD COLUMN IF NOT EXISTS author_name VARCHAR(255)"))
        conn.execute(text("ALTER TABLE content_pages ADD COLUMN IF NOT EXISTS published_at TIMESTAMP"))
        conn.execute(text("ALTER TABLE content_pages ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_content_pages_published_at ON content_pages (published_at)"))
        # Sample-data flags for utility hiring packs
        for table in ("jobs", "messages", "interviews", "matches"):
            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS is_sample BOOLEAN DEFAULT false"))
            conn.execute(text(f"CREATE INDEX IF NOT EXISTS ix_{table}_is_sample ON {table} (is_sample)"))
        # Home hero rotator — per-slide CTA + scope (home | career | hire | educate | ambassador)
        conn.execute(text("ALTER TABLE home_hero_slides ADD COLUMN IF NOT EXISTS cta_label VARCHAR(80)"))
        conn.execute(text("ALTER TABLE home_hero_slides ADD COLUMN IF NOT EXISTS cta_href VARCHAR(300)"))
        conn.execute(
            text(
                "ALTER TABLE home_hero_slides ADD COLUMN IF NOT EXISTS scope VARCHAR(24) NOT NULL DEFAULT 'home'"
            )
        )
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_home_hero_slides_scope ON home_hero_slides (scope)"))

