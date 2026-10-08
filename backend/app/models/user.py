"""OWW user accounts."""

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.dialects.postgresql import JSONB

from app.core.security import get_password_hash
from app.db.base_class import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=True, index=True)
    phone = Column(String(50), nullable=True, index=True)
    hashed_password = Column(String(255), nullable=True)
    full_name = Column(String(255), nullable=True)
    roles = Column(JSONB, nullable=False, default=list)
    state_code = Column(String(2), nullable=False, default="NY", index=True)
    org_id = Column(Integer, nullable=True, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    contact_prefs = Column(JSONB, nullable=False, default=dict)
    sso_provider = Column(String(50), nullable=True, index=True)
    sso_subject = Column(String(255), nullable=True, index=True)
    ww360_user_id = Column(String(64), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def set_password(self, password: str) -> None:
        self.hashed_password = get_password_hash(password)

    def has_role(self, role: str) -> bool:
        return role in (self.roles or [])

    def has_any_role(self, *roles: str) -> bool:
        user_roles = set(self.roles or [])
        return bool(user_roles.intersection(roles))
