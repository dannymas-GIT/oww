"""Landing-page CMS: templates, sections, and serialization."""

from __future__ import annotations

import re
from copy import deepcopy
from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from app.models.content_page import ContentPage

BLOG_TEMPLATE = "blog_post"

# Section types Jenny can drop into any template.
SECTION_TYPES = [
    {
        "type": "hero",
        "label": "Hero",
        "description": "Headline, supporting text, CTAs, and optional media.",
        "fields": ["eyebrow", "headline", "subhead", "cta_label", "cta_href", "cta2_label", "cta2_href", "media_url", "media_type"],
    },
    {
        "type": "stats",
        "label": "Stat strip",
        "description": "Three or four impact numbers.",
        "fields": ["title", "items"],
    },
    {
        "type": "rich_text",
        "label": "Rich text",
        "description": "Title plus HTML body (links, lists, embeds).",
        "fields": ["title", "html"],
    },
    {
        "type": "cards",
        "label": "Card grid",
        "description": "Title cards with optional links (pathways, resources).",
        "fields": ["title", "description", "items"],
    },
    {
        "type": "media_gallery",
        "label": "Media gallery",
        "description": "Images, video, or audio with captions.",
        "fields": ["title", "description", "items"],
    },
    {
        "type": "cta_band",
        "label": "Call to action",
        "description": "Closing band with button.",
        "fields": ["title", "body", "cta_label", "cta_href"],
    },
    {
        "type": "quote",
        "label": "Quote / testimonial",
        "description": "Pull quote with attribution.",
        "fields": ["quote", "author", "role", "organization"],
    },
]

TEMPLATES: dict[str, dict[str, Any]] = {
    "home_landing": {
        "id": "home_landing",
        "label": "Home landing",
        "description": "Full state home: hero, mission stats, pathway cards, media, and CTA.",
        "when_to_use": "Use once per state for the main public home (usually slug “home” → /ny). Start here for the NYSAWWA front door.",
        "example_url": "/ny",
        "suggested_slug": "home",
        "section_types": [s["type"] for s in SECTION_TYPES],
    },
    "pathway_landing": {
        "id": "pathway_landing",
        "label": "Pathway landing",
        "description": "Career / Hire / Educate / Ambassador doorway pages.",
        "when_to_use": "Use for each pathway people choose from the home page. Slugs should match the nav: career, hire, educate, or ambassador.",
        "example_url": "/ny/career",
        "suggested_slug": "career",
        "section_types": [s["type"] for s in SECTION_TYPES],
    },
    "story_feature": {
        "id": "story_feature",
        "label": "Story / feature",
        "description": "Narrative page with hero media, rich body, gallery, and quote.",
        "when_to_use": "Use for a one-off campaign, success story, or featured spotlight that is not a pathway and not an ongoing series.",
        "example_url": "/ny/story",
        "suggested_slug": "story",
        "section_types": ["hero", "rich_text", "media_gallery", "quote", "cta_band"],
    },
    "simple_page": {
        "id": "simple_page",
        "label": "Simple page",
        "description": "Lightweight page: optional hero, rich text, media, and CTA.",
        "when_to_use": "Use for short static content—FAQ, about NYSAWWA, partner blurb—when you do not need pathway cards or a blog feed.",
        "example_url": "/ny/about",
        "suggested_slug": "page",
        "section_types": ["hero", "rich_text", "media_gallery", "cta_band"],
    },
    "blog_post": {
        "id": "blog_post",
        "label": "Blog post",
        "description": "Dated post with author and tags, listed on the public blog index.",
        "when_to_use": "Use for running topics and ongoing updates (grant news, workforce tips, event recaps). Create these from the Blog tab—not Landing pages.",
        "example_url": "/ny/blog/my-topic",
        "suggested_slug": "my-topic",
        "section_types": ["hero", "rich_text", "media_gallery", "quote", "cta_band"],
        "kind": "blog",
    },
}


def _blank_section(section_type: str) -> dict[str, Any]:
    if section_type == "hero":
        return {
            "type": "hero",
            "eyebrow": "",
            "headline": "",
            "subhead": "",
            "cta_label": "",
            "cta_href": "",
            "cta2_label": "",
            "cta2_href": "",
            "media_url": "",
            "media_type": "image",
        }
    if section_type == "stats":
        return {
            "type": "stats",
            "title": "",
            "items": [{"value": "", "label": "", "detail": ""}],
        }
    if section_type == "rich_text":
        return {"type": "rich_text", "title": "", "html": "<p></p>"}
    if section_type == "cards":
        return {
            "type": "cards",
            "title": "",
            "description": "",
            "items": [{"title": "", "body": "", "href": ""}],
        }
    if section_type == "media_gallery":
        return {
            "type": "media_gallery",
            "title": "",
            "description": "",
            "items": [{"url": "", "caption": "", "media_type": "image"}],
        }
    if section_type == "cta_band":
        return {"type": "cta_band", "title": "", "body": "", "cta_label": "", "cta_href": ""}
    if section_type == "quote":
        return {"type": "quote", "quote": "", "author": "", "role": "", "organization": ""}
    return {"type": section_type}


def default_sections_for_template(template_id: str) -> list[dict[str, Any]]:
    if template_id == "home_landing":
        return [
            {
                "type": "hero",
                "eyebrow": "New York Section AWWA",
                "headline": "From GED to PhD: A Job for Everyone",
                "subhead": (
                    "One Water Workforce is the statewide hub for water and wastewater career awareness, "
                    "recruitment, training, and hiring."
                ),
                "cta_label": "Express interest",
                "cta_href": "/{state}/interest",
                "cta2_label": "Browse jobs",
                "cta2_href": "/{state}/jobs",
                "media_url": "",
                "media_type": "image",
            },
            {
                "type": "stats",
                "title": "Why One Water Workforce",
                "items": [
                    {"value": "19M+", "label": "New Yorkers served", "detail": "Rely on safe water every day."},
                    {"value": "<10K", "label": "Certified operators", "detail": "Statewide licensed professionals."},
                    {"value": "3", "label": "Training hubs", "detail": "Albany, Syracuse, and Rochester."},
                    {"value": "4", "label": "Career doorways", "detail": "Career, Hire, Educate, Ambassador."},
                ],
            },
            {
                "type": "cards",
                "title": "Choose your pathway",
                "description": "Four doors into water careers—each opens into tools, checklists, and next steps.",
                "items": [
                    {
                        "title": "I Want a Career",
                        "body": "Explore water careers and build your profile.",
                        "href": "/{state}/career",
                    },
                    {
                        "title": "I Want to Hire",
                        "body": "Post opportunities and match with candidates.",
                        "href": "/{state}/hire",
                    },
                    {
                        "title": "I Want to Educate",
                        "body": "Share courses, events, and pathways.",
                        "href": "/{state}/educate",
                    },
                    {
                        "title": "I Want to Be an Ambassador",
                        "body": "Champion the one-water workforce.",
                        "href": "/{state}/ambassador",
                    },
                ],
            },
            {
                "type": "rich_text",
                "title": "OWW Training Center",
                "html": (
                    "<p>Through the One Water Workforce Training Center partnership with Barton &amp; Loguidice, "
                    "New York utilities and aspiring operators can access Gold Standard certification training "
                    "and continuing education.</p>"
                ),
            },
            {
                "type": "quote",
                "quote": (
                    "Workforce development is no longer a future challenge—it is a current operational necessity. "
                    "Communities need qualified operators, supervisors, and utility leaders."
                ),
                "author": "Jenny Ingrao-Aman",
                "role": "Executive Director",
                "organization": "NYSAWWA / One Water Workforce",
            },
            {
                "type": "cta_band",
                "title": "Ready when you are",
                "body": "Express interest, create an account, or jump straight into jobs and employers.",
                "cta_label": "Start a career pathway",
                "cta_href": "/{state}/career",
            },
        ]
    if template_id == "pathway_landing":
        return [
            {
                "type": "hero",
                "eyebrow": "Pathway",
                "headline": "Pathway title",
                "subhead": "Describe who this pathway serves and what they can do next.",
                "cta_label": "Get started",
                "cta_href": "/{state}/interest",
                "cta2_label": "",
                "cta2_href": "",
                "media_url": "",
                "media_type": "image",
            },
            {
                "type": "cards",
                "title": "What you can do here",
                "description": "",
                "items": [
                    {"title": "Step one", "body": "Describe the first action.", "href": ""},
                    {"title": "Step two", "body": "Describe the next action.", "href": ""},
                ],
            },
            {"type": "rich_text", "title": "Why this pathway exists", "html": "<p></p>"},
            {
                "type": "cta_band",
                "title": "Take the next step",
                "body": "",
                "cta_label": "Express interest",
                "cta_href": "/{state}/interest",
            },
        ]
    if template_id == "story_feature":
        return [
            {
                "type": "hero",
                "eyebrow": "Feature",
                "headline": "Story headline",
                "subhead": "Short lead for the feature.",
                "cta_label": "",
                "cta_href": "",
                "cta2_label": "",
                "cta2_href": "",
                "media_url": "",
                "media_type": "image",
            },
            {"type": "rich_text", "title": "", "html": "<p>Tell the story here.</p>"},
            {
                "type": "media_gallery",
                "title": "Gallery",
                "description": "",
                "items": [{"url": "", "caption": "", "media_type": "image"}],
            },
            {"type": "cta_band", "title": "Learn more", "body": "", "cta_label": "Contact us", "cta_href": "/{state}/interest"},
        ]
    if template_id == BLOG_TEMPLATE:
        return [
            {
                "type": "hero",
                "eyebrow": "From the field",
                "headline": "Post title",
                "subhead": "One-sentence lead that appears under the title.",
                "cta_label": "",
                "cta_href": "",
                "cta2_label": "",
                "cta2_href": "",
                "media_url": "",
                "media_type": "image",
            },
            {
                "type": "rich_text",
                "title": "",
                "html": "<p>Write your update here. Keep topics running over time—hiring tips, training news, partner spotlights, and more.</p>",
            },
            {
                "type": "media_gallery",
                "title": "Photos & media",
                "description": "Optional images, video, or documents for this post.",
                "items": [{"url": "", "caption": "", "media_type": "image"}],
            },
            {
                "type": "cta_band",
                "title": "Keep exploring",
                "body": "Browse more updates or express interest in a pathway.",
                "cta_label": "All posts",
                "cta_href": "/{state}/blog",
            },
        ]
    return [
        {
            "type": "hero",
            "eyebrow": "",
            "headline": "Page title",
            "subhead": "",
            "cta_label": "",
            "cta_href": "",
            "cta2_label": "",
            "cta2_href": "",
            "media_url": "",
            "media_type": "image",
        },
        {"type": "rich_text", "title": "", "html": "<p></p>"},
    ]


_SCRIPT_RE = re.compile(r"<\s*script[^>]*>.*?<\s*/\s*script\s*>", re.I | re.S)
_EVENT_RE = re.compile(r"\son\w+\s*=\s*([\"']).*?\1", re.I | re.S)
_JS_URL_RE = re.compile(r"javascript:", re.I)


def sanitize_html(html: str | None) -> str:
    if not html:
        return ""
    cleaned = _SCRIPT_RE.sub("", html)
    cleaned = _EVENT_RE.sub("", cleaned)
    cleaned = _JS_URL_RE.sub("", cleaned)
    return cleaned


def sanitize_sections(sections: list[dict[str, Any]] | None) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for raw in sections or []:
        if not isinstance(raw, dict):
            continue
        sec = deepcopy(raw)
        st = str(sec.get("type") or "")
        if st == "rich_text" and "html" in sec:
            sec["html"] = sanitize_html(str(sec.get("html") or ""))
        out.append(sec)
    return out


def _normalize_tags(tags: Any) -> list[str]:
    if not tags:
        return []
    if isinstance(tags, str):
        parts = re.split(r"[,#]", tags)
        return [p.strip().lower() for p in parts if p.strip()]
    if isinstance(tags, list):
        out: list[str] = []
        for t in tags:
            s = str(t).strip().lower()
            if s and s not in out:
                out.append(s)
        return out
    return []


def cover_image_from_sections(sections: list[dict[str, Any]]) -> str | None:
    for sec in sections:
        if not isinstance(sec, dict):
            continue
        if sec.get("type") == "hero" and sec.get("media_url"):
            return str(sec["media_url"])
        if sec.get("type") == "media_gallery":
            for item in sec.get("items") or []:
                if isinstance(item, dict) and item.get("url"):
                    return str(item["url"])
    return None


def page_to_dict(page: ContentPage, *, include_draft: bool = True) -> dict[str, Any]:
    payload = page.body_json if isinstance(page.body_json, dict) else {}
    sections = payload.get("sections")
    if not isinstance(sections, list):
        sections = []
    clean_sections = sections if include_draft else sanitize_sections(sections)
    template = page.template or "simple_page"
    return {
        "id": page.id,
        "slug": page.slug,
        "title": page.title,
        "template": template,
        "kind": "blog" if template == BLOG_TEMPLATE else "page",
        "pathway": page.pathway,
        "summary": page.summary,
        "excerpt": page.summary,
        "body": page.body_html or "",
        "sections": clean_sections,
        "state_code": page.state_code,
        "published": bool(page.is_published),
        "sort_order": page.sort_order or 0,
        "author_name": page.author_name,
        "published_at": page.published_at.isoformat() if page.published_at else None,
        "tags": _normalize_tags(page.tags),
        "cover_image_url": cover_image_from_sections(clean_sections if isinstance(clean_sections, list) else []),
        "updated_at": page.updated_at.isoformat() if page.updated_at else None,
        "created_at": page.created_at.isoformat() if page.created_at else None,
    }


def blog_card_dict(page: ContentPage) -> dict[str, Any]:
    full = page_to_dict(page, include_draft=True)
    return {
        "id": full["id"],
        "slug": full["slug"],
        "title": full["title"],
        "excerpt": full.get("excerpt") or full.get("summary"),
        "author_name": full.get("author_name"),
        "published_at": full.get("published_at") or full.get("updated_at"),
        "tags": full.get("tags") or [],
        "cover_image_url": full.get("cover_image_url"),
        "state_code": full.get("state_code"),
    }


def list_published_blog_posts(
    db: Session,
    *,
    state_code: str,
    tag: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[ContentPage], int]:
    state = (state_code or "NY").upper()[:2]
    q = db.query(ContentPage).filter(
        ContentPage.state_code == state,
        ContentPage.template == BLOG_TEMPLATE,
        ContentPage.is_published.is_(True),
    )
    if tag:
        needle = tag.strip().lower()
        # JSONB contains as array element — fallback scan for portability
        rows = q.order_by(ContentPage.published_at.desc().nullslast(), ContentPage.id.desc()).all()
        filtered = [p for p in rows if needle in _normalize_tags(p.tags)]
        total = len(filtered)
        return filtered[offset : offset + limit], total
    total = q.count()
    pages = (
        q.order_by(ContentPage.published_at.desc().nullslast(), ContentPage.id.desc())
        .offset(max(0, offset))
        .limit(min(100, max(1, limit)))
        .all()
    )
    return pages, total


def catalog() -> dict[str, Any]:
    return {"templates": list(TEMPLATES.values()), "section_types": SECTION_TYPES}


def stamp_publish_dates(page: ContentPage, *, publishing: bool) -> None:
    """When first publishing a blog post, set published_at if missing."""
    if publishing and page.template == BLOG_TEMPLATE and not page.published_at:
        page.published_at = datetime.utcnow()


def ensure_default_home_page(db: Session, *, state_code: str = "NY") -> ContentPage:
    state = (state_code or "NY").upper()[:2]
    page = (
        db.query(ContentPage)
        .filter(ContentPage.state_code == state, ContentPage.slug == "home")
        .first()
    )
    if page:
        if not page.template:
            page.template = "home_landing"
        payload = page.body_json if isinstance(page.body_json, dict) else {}
        if not payload.get("sections"):
            page.body_json = {"sections": default_sections_for_template("home_landing")}
            page.template = "home_landing"
            db.commit()
            db.refresh(page)
        return page

    page = ContentPage(
        state_code=state,
        slug="home",
        title="Welcome to One Water Workforce",
        template="home_landing",
        pathway="home",
        summary="State home landing page",
        body_html="",
        body_json={"sections": default_sections_for_template("home_landing")},
        is_published=True,
        sort_order=0,
    )
    db.add(page)
    db.commit()
    db.refresh(page)
    return page
