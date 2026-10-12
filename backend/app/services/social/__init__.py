"""Social publishing providers (aggregator adapters)."""

from app.services.social.base import PublishResult, SocialProvider
from app.services.social.ayrshare_provider import AyrshareProvider
from app.services.social.stub_provider import StubProvider

__all__ = [
    "PublishResult",
    "SocialProvider",
    "AyrshareProvider",
    "StubProvider",
]
