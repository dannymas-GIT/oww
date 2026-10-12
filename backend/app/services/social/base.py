"""Provider-agnostic social publishing protocol."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Protocol


@dataclass
class PublishResult:
    ok: bool
    provider_post_id: str | None = None
    status: str = "posted"  # posted | partial | failed
    platforms: dict[str, Any] = field(default_factory=dict)
    raw: dict[str, Any] = field(default_factory=dict)
    error: str | None = None


class SocialProvider(Protocol):
    name: str

    def is_configured(self) -> bool: ...

    def connected_platforms(self) -> list[str]: ...

    def publish(
        self,
        *,
        message: str,
        platforms: list[str],
        link_url: str | None = None,
        media_url: str | None = None,
        scheduled_at: datetime | None = None,
    ) -> PublishResult: ...

    def delete(self, provider_post_id: str) -> bool: ...
