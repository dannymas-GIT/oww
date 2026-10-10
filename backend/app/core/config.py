"""OWW application settings."""

from __future__ import annotations

from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="ignore")

    PROJECT_NAME: str = "One Water Workforce"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False

    POSTGRES_HOST: str = "db"
    POSTGRES_PORT: str = "5432"
    POSTGRES_USER: str = "oww"
    POSTGRES_PASSWORD: str = "oww"
    POSTGRES_DB: str = "oww"

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    JWT_SECRET_KEY: str = "change-me-oww-dev-secret"
    JWT_ALGORITHM: str = "HS256"
    SECRET_KEY: str = ""
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    APP_DOMAIN: str = "onewaterworkforce.org"
    EXTRA_CORS_ORIGINS: str = ""
    EXTRA_TRUSTED_HOSTS: str = ""

    EMAIL_ENABLED: bool = False
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "noreply@onewaterworkforce.org"
    SMTP_FROM_NAME: str = "One Water Workforce"

    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_FROM_NUMBER: str = ""

    CRM_WEBHOOK_URL: str = ""
    OWW_SEED_ADMIN_PASSWORD: str = "ChangeMe-OWW!"
    # Default state microsite when callers omit state_code (env OWW_DEFAULT_JURISDICTION).
    DEFAULT_JURISDICTION: str = "NY"

    # Stripe — leave STRIPE_SECRET_KEY empty for in-app sample checkout
    STRIPE_SECRET_KEY: str = ""
    STRIPE_PUBLISHABLE_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""

    OTP_EXPIRE_MINUTES: int = 15
    MATCH_REFRESH_ENABLED: bool = True
    DIGEST_ENABLED: bool = True

    # Water Workforce 360 integration
    WW360_BASE_URL: str = "http://127.0.0.1:8002"
    WW360_SERVICE_TOKEN: str = ""
    WW360_HMAC_SECRET: str = ""
    OWW_WW360_API_KEY: str = ""

    # CMS media uploads (images, video, audio, PDF, etc.)
    MEDIA_ROOT: str = "/app/media"
    MEDIA_MAX_BYTES: int = 80 * 1024 * 1024  # 80 MB

    @property
    def cors_origins(self) -> List[str]:
        base = [
            f"https://{self.APP_DOMAIN}",
            f"http://{self.APP_DOMAIN}",
            "http://localhost:8083",
            "http://127.0.0.1:8083",
            "http://localhost:5174",
            "http://127.0.0.1:5174",
        ]
        if self.EXTRA_CORS_ORIGINS:
            base.extend(x.strip() for x in self.EXTRA_CORS_ORIGINS.split(",") if x.strip())
        return list(dict.fromkeys(base))

    @property
    def trusted_hosts(self) -> List[str]:
        base = [self.APP_DOMAIN, "localhost", "127.0.0.1", "testserver", "*"]
        if self.EXTRA_TRUSTED_HOSTS:
            base.extend(x.strip() for x in self.EXTRA_TRUSTED_HOSTS.split(",") if x.strip())
        return list(dict.fromkeys(base))


settings = Settings()


def jwt_signing_key() -> str:
    return settings.JWT_SECRET_KEY or settings.SECRET_KEY or "change-me-oww-dev-secret"
