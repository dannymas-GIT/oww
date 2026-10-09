"""CRUD + seed defaults for home hero rotator slides."""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.models.home_hero_slide import HomeHeroSlide

# Product slides first so the public rotator opens on OWW / WW360.
DEFAULT_SLIDES: list[dict[str, Any]] = [
    {
        "kicker": "One Water Workforce",
        "title": "From GED to PhD: careers that keep water safe",
        "body": (
            "OWW connects seekers, educators, ambassadors, and hiring utilities so New York "
            "can recruit and train the next generation of water professionals."
        ),
        "image_url": "/home/stage/oww-careers.jpg",
        "image_alt": "Workforce participants touring a water treatment plant control room",
        "cta_label": "Express interest",
        "cta_href": "/{state}/interest",
        "sort_order": 10,
    },
    {
        "kicker": "Water Workforce 360",
        "title": "Utility staffing, CEU, and succession in one place",
        "body": (
            "WW360 helps utilities document operators, training, and upcoming vacancies—"
            "so OWW outreach and candidate development start before gaps become emergencies."
        ),
        "image_url": "/home/stage/ww360.jpg",
        "image_alt": "Utility manager reviewing workforce and training dashboards",
        "cta_label": "For utilities",
        "cta_href": "/{state}/hire",
        "sort_order": 20,
    },
    {
        "kicker": "Drinking water quality",
        "title": "Lab testing protects every tap",
        "body": (
            "Operators and analysts verify turbidity, chlorine residual, and contaminants "
            "so communities can trust the water that reaches their homes."
        ),
        "image_url": "/home/stage/lab-testing.jpg",
        "image_alt": "Water quality analyst testing drinking water samples in a treatment plant laboratory",
        "cta_label": "Browse jobs",
        "cta_href": "/{state}/jobs",
        "sort_order": 30,
    },
    {
        "kicker": "Treatment & filtration",
        "title": "Clean water starts at the plant",
        "body": (
            "Clarifiers, filters, and distribution systems turn source water into safe drinking water—"
            "work that depends on skilled people at every step."
        ),
        "image_url": "/home/stage/treatment-plant.jpg",
        "image_alt": "Municipal drinking water treatment plant filtration and clarifying basins",
        "cta_label": "Start a career",
        "cta_href": "/{state}/career",
        "sort_order": 40,
    },
    {
        "kicker": "Source water protection",
        "title": "Monitoring lakes, rivers, and reservoirs",
        "body": (
            "Field sampling and watershed oversight catch quality issues early—"
            "before they become public-health emergencies."
        ),
        "image_url": "/home/stage/source-sampling.jpg",
        "image_alt": "Operator sampling clear reservoir water for quality monitoring",
        "cta_label": "Educators",
        "cta_href": "/{state}/educate",
        "sort_order": 50,
    },
    {
        "kicker": "Wastewater & environment",
        "title": "Protecting rivers after use",
        "body": (
            "Wastewater operators return treated water to the environment, "
            "safeguarding fishable, swimmable waters across New York."
        ),
        "image_url": "/home/stage/wastewater.jpg",
        "image_alt": "Wastewater treatment aeration basin protecting receiving waters",
        "cta_label": "Become an ambassador",
        "cta_href": "/{state}/ambassador",
        "sort_order": 60,
    },
]

PRODUCT_SLIDE_TITLES = frozenset(
    {
        "From GED to PhD: careers that keep water safe",
        "Utility staffing, CEU, and succession in one place",
    }
)


def slide_to_dict(row: HomeHeroSlide) -> dict[str, Any]:
    return {
        "id": row.id,
        "state_code": row.state_code,
        "kicker": row.kicker,
        "title": row.title,
        "body": row.body,
        "image_url": row.image_url,
        "image_alt": row.image_alt,
        "cta_label": row.cta_label,
        "cta_href": row.cta_href,
        "sort_order": row.sort_order,
        "is_active": bool(row.is_active),
    }


def _row_from_spec(state: str, spec: dict[str, Any]) -> HomeHeroSlide:
    return HomeHeroSlide(
        state_code=state,
        kicker=spec["kicker"],
        title=spec["title"],
        body=spec["body"],
        image_url=spec["image_url"],
        image_alt=spec["image_alt"],
        cta_label=spec.get("cta_label"),
        cta_href=spec.get("cta_href"),
        sort_order=spec["sort_order"],
        is_active=True,
    )


def list_public_slides(db: Session, *, state_code: str = "NY") -> list[dict[str, Any]]:
    state = (state_code or "NY").upper()[:2]
    ensure_default_slides(db, state_code=state)
    ensure_product_slides(db, state_code=state)
    rows = (
        db.query(HomeHeroSlide)
        .filter(HomeHeroSlide.state_code == state, HomeHeroSlide.is_active.is_(True))
        .order_by(HomeHeroSlide.sort_order, HomeHeroSlide.id)
        .all()
    )
    return [slide_to_dict(r) for r in rows]


def list_admin_slides(db: Session, *, state_code: str | None = None) -> list[dict[str, Any]]:
    if state_code:
        state = state_code.upper()[:2]
        ensure_default_slides(db, state_code=state)
        ensure_product_slides(db, state_code=state)
    q = db.query(HomeHeroSlide)
    if state_code:
        q = q.filter(HomeHeroSlide.state_code == state_code.upper()[:2])
    rows = q.order_by(HomeHeroSlide.state_code, HomeHeroSlide.sort_order, HomeHeroSlide.id).all()
    return [slide_to_dict(r) for r in rows]


def ensure_default_slides(db: Session, *, state_code: str = "NY") -> None:
    state = (state_code or "NY").upper()[:2]
    existing = db.query(HomeHeroSlide).filter(HomeHeroSlide.state_code == state).count()
    if existing:
        return
    for spec in DEFAULT_SLIDES:
        db.add(_row_from_spec(state, spec))
    db.commit()


def ensure_product_slides(db: Session, *, state_code: str = "NY") -> None:
    """Insert OWW + WW360 slides if missing; promote to front; backfill empty CTAs.

    Does not overwrite admin-edited kicker/title/body/image — only sort order for
    product titles, empty CTA fields, and non-product slides colliding at 10/20.
    """
    state = (state_code or "NY").upper()[:2]
    product_specs = [s for s in DEFAULT_SLIDES if s["title"] in PRODUCT_SLIDE_TITLES]
    changed = False
    for spec in product_specs:
        found = (
            db.query(HomeHeroSlide)
            .filter(HomeHeroSlide.state_code == state, HomeHeroSlide.title == spec["title"])
            .first()
        )
        if not found:
            db.add(_row_from_spec(state, spec))
            changed = True
            continue
        if found.sort_order != spec["sort_order"]:
            found.sort_order = int(spec["sort_order"])
            changed = True
        if not (found.cta_label or "").strip() and spec.get("cta_label"):
            found.cta_label = spec["cta_label"]
            changed = True
        if not (found.cta_href or "").strip() and spec.get("cta_href"):
            found.cta_href = spec["cta_href"]
            changed = True

    # Free sort slots 10/20 when older defaults still occupy them.
    others = (
        db.query(HomeHeroSlide)
        .filter(
            HomeHeroSlide.state_code == state,
            ~HomeHeroSlide.title.in_(list(PRODUCT_SLIDE_TITLES)),
        )
        .order_by(HomeHeroSlide.sort_order, HomeHeroSlide.id)
        .all()
    )
    if any(int(row.sort_order or 0) in (10, 20) for row in others):
        for i, row in enumerate(others):
            target = 30 + i * 10
            if int(row.sort_order or 0) != target:
                row.sort_order = target
                changed = True

    # Backfill empty CTAs on known default slides (new columns on existing rows).
    defaults_by_title = {s["title"]: s for s in DEFAULT_SLIDES}
    for row in db.query(HomeHeroSlide).filter(HomeHeroSlide.state_code == state).all():
        spec = defaults_by_title.get(row.title or "")
        if not spec:
            continue
        if not (row.cta_label or "").strip() and spec.get("cta_label"):
            row.cta_label = spec["cta_label"]
            changed = True
        if not (row.cta_href or "").strip() and spec.get("cta_href"):
            row.cta_href = spec["cta_href"]
            changed = True

    if changed:
        db.commit()


def create_slide(db: Session, data: dict[str, Any]) -> HomeHeroSlide:
    row = HomeHeroSlide(
        state_code=(data.get("state_code") or "NY").upper()[:2],
        kicker=(data.get("kicker") or "").strip()[:120],
        title=(data.get("title") or "").strip()[:200],
        body=(data.get("body") or "").strip(),
        image_url=(data.get("image_url") or "").strip()[:500],
        image_alt=(data.get("image_alt") or "").strip()[:300],
        cta_label=((data.get("cta_label") or "").strip()[:80] or None),
        cta_href=((data.get("cta_href") or "").strip()[:300] or None),
        sort_order=int(data.get("sort_order") or 100),
        is_active=bool(data.get("is_active", True)),
    )
    if not row.title or not row.image_url:
        raise ValueError("title and image_url are required")
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def update_slide(db: Session, slide_id: int, data: dict[str, Any]) -> HomeHeroSlide | None:
    row = db.query(HomeHeroSlide).filter(HomeHeroSlide.id == slide_id).first()
    if not row:
        return None
    if "state_code" in data and data["state_code"]:
        row.state_code = str(data["state_code"]).upper()[:2]
    if "kicker" in data and data["kicker"] is not None:
        row.kicker = str(data["kicker"]).strip()[:120]
    if "title" in data and data["title"] is not None:
        row.title = str(data["title"]).strip()[:200]
    if "body" in data and data["body"] is not None:
        row.body = str(data["body"]).strip()
    if "image_url" in data and data["image_url"] is not None:
        row.image_url = str(data["image_url"]).strip()[:500]
    if "image_alt" in data and data["image_alt"] is not None:
        row.image_alt = str(data["image_alt"]).strip()[:300]
    if "cta_label" in data:
        raw = data["cta_label"]
        row.cta_label = (str(raw).strip()[:80] or None) if raw is not None else None
    if "cta_href" in data:
        raw = data["cta_href"]
        row.cta_href = (str(raw).strip()[:300] or None) if raw is not None else None
    if "sort_order" in data and data["sort_order"] is not None:
        row.sort_order = int(data["sort_order"])
    if "is_active" in data and data["is_active"] is not None:
        row.is_active = bool(data["is_active"])
    db.commit()
    db.refresh(row)
    return row


def delete_slide(db: Session, slide_id: int) -> bool:
    row = db.query(HomeHeroSlide).filter(HomeHeroSlide.id == slide_id).first()
    if not row:
        return False
    db.delete(row)
    db.commit()
    return True
