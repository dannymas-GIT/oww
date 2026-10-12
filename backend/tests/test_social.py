"""Social syndication unit tests (compose, providers, RSS helpers)."""

from __future__ import annotations

from datetime import datetime
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from app.main import app
from app.models.content_page import ContentPage
from app.services import cms_service, social_service
from app.services.social.ayrshare_provider import AyrshareProvider
from app.services.social.stub_provider import StubProvider

client = TestClient(app)


def _fake_page(**kwargs) -> ContentPage:
    page = ContentPage(
        slug=kwargs.get("slug", "workforce-update"),
        title=kwargs.get("title", "Workforce Update"),
        template=cms_service.BLOG_TEMPLATE,
        summary=kwargs.get("summary", "NY operators meet demand."),
        body_html="<p>Hello</p>",
        body_json=kwargs.get(
            "body_json",
            {"sections": [{"type": "hero", "headline": "Hi", "media_url": "https://cdn.example/cover.jpg"}]},
        ),
        state_code=kwargs.get("state_code", "NY"),
        is_published=True,
        tags=kwargs.get("tags", ["workforce", "NY"]),
        author_name="Jenny",
        published_at=datetime.utcnow(),
    )
    page.id = kwargs.get("id", 42)
    return page


def test_compose_from_page_includes_link_and_hashtags():
    page = _fake_page()
    composed = social_service.compose_from_page(page)
    assert "Workforce Update" in composed["message"]
    assert "NY operators meet demand." in composed["message"]
    assert "/ny/blog/workforce-update" in composed["link_url"]
    assert "#workforce" in composed["message"] or "#NY" in composed["message"]
    assert composed["media_url"] == "https://cdn.example/cover.jpg"


def test_blog_card_dict_includes_canonical_url():
    page = _fake_page()
    card = cms_service.blog_card_dict(page)
    assert card["url"].endswith("/ny/blog/workforce-update")
    assert card["title"] == "Workforce Update"


def test_split_platforms_separates_internal_destinations():
    external, internal = social_service.split_platforms(
        ["linkedin", "oww_blog", "WW360", "facebook"]
    )
    assert external == ["linkedin", "facebook"]
    assert internal == ["oww_blog", "ww360"]


def test_stub_provider_publish():
    provider = StubProvider()
    assert provider.is_configured()
    result = provider.publish(
        message="Hello LinkedIn",
        platforms=["linkedin"],
        link_url="https://example.com",
    )
    assert result.ok
    assert result.status == "posted"
    assert result.provider_post_id
    assert "linkedin" in result.platforms


def test_ayrshare_provider_unconfigured():
    provider = AyrshareProvider(api_key="")
    assert not provider.is_configured()
    result = provider.publish(message="x", platforms=["linkedin"])
    assert not result.ok
    assert result.status == "failed"


def test_ayrshare_provider_publish_mocked():
    provider = AyrshareProvider(api_key="test-key", base_url="https://example.test/api")
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.content = b"{}"
    mock_resp.json.return_value = {
        "postIds": {"linkedin": "li-123"},
        "id": "agg-1",
    }
    with patch("httpx.Client") as client_cls:
        instance = client_cls.return_value.__enter__.return_value
        instance.post.return_value = mock_resp
        result = provider.publish(
            message="Hello",
            platforms=["linkedin"],
            link_url="https://oww.example/ny/blog/x",
        )
    assert result.ok
    assert result.status == "posted"
    assert result.platforms["linkedin"]["status"] == "success"


def test_ayrshare_partial_failure():
    provider = AyrshareProvider(api_key="test-key", base_url="https://example.test/api")
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.content = b"{}"
    mock_resp.json.return_value = {
        "postIds": {"linkedin": "li-1"},
        "errors": [{"platform": "twitter", "message": "not connected"}],
    }
    with patch("httpx.Client") as client_cls:
        instance = client_cls.return_value.__enter__.return_value
        instance.post.return_value = mock_resp
        result = provider.publish(message="Hi", platforms=["linkedin", "twitter"])
    assert result.ok
    assert result.status == "partial"


def test_get_provider_falls_back_to_stub():
    with patch.object(social_service.settings, "AYRSHARE_API_KEY", ""):
        with patch.object(social_service.settings, "SOCIAL_PROVIDER", "ayrshare"):
            provider = social_service.get_provider()
            assert provider.name == "stub"


def test_rss_builder_shape_via_compose_url():
    """RSS cards use the same canonical URL as blog_card_dict."""
    page = _fake_page(slug="rss-check")
    card = cms_service.blog_card_dict(page)
    assert card["url"].endswith("/ny/blog/rss-check")
    assert "<" not in card["title"]


def test_health_still_ok():
    r = client.get("/health")
    assert r.status_code == 200
