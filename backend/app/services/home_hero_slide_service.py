"""CRUD + seed defaults for home and pathway hero rotator slides."""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.core.scoping import coerce_state
from app.jurisdictions.registry import get_pack
from app.jurisdictions.schema import render_tokens
from app.models.home_hero_slide import HomeHeroSlide

SLIDE_SCOPES = frozenset({"home", "career", "hire", "educate", "ambassador"})
PATHWAY_SCOPES = frozenset({"career", "hire", "educate", "ambassador"})

# Product slides first so the public rotator opens on OWW / WW360.
DEFAULT_SLIDES: list[dict[str, Any]] = [
    {
        "scope": "home",
        "kicker": "One Water Workforce",
        "title": "From GED to PhD: careers that keep water safe",
        "body": (
            "OWW connects seekers, educators, ambassadors, and hiring utilities so {state_name} "
            "can recruit and train the next generation of water professionals."
        ),
        "image_url": "/home/stage/oww-careers.jpg",
        "image_alt": "Workforce participants touring a water treatment plant control room",
        "cta_label": "Express interest",
        "cta_href": "/{state}/interest",
        "sort_order": 10,
    },
    {
        "scope": "home",
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
        "scope": "home",
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
        "scope": "home",
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
        "scope": "home",
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
        "scope": "home",
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

PATHWAY_DEFAULT_SLIDES: dict[str, list[dict[str, Any]]] = {
    "career": [
        {
            "scope": "career",
            "kicker": "Explore careers",
            "title": "Six career areas, one statewide job board",
            "body": (
                "Treatment, distribution, lab, engineering, technology, and leadership—"
                "browse openings that keep New York’s water systems running."
            ),
            "image_url": "/pathways/stage/career-1.jpg",
            "image_alt": "Utility field crew in high-visibility vests working at a distribution hydrant",
            "cta_label": "Browse jobs",
            "cta_href": "/{state}/jobs",
            "sort_order": 10,
        },
        {
            "scope": "career",
            "kicker": "Get matched",
            "title": "Tell us your skills; see Ready now and transferable matches",
            "body": (
                "Complete the matching questionnaire so employers see career changers "
                "and Ready now talent on the same taxonomy."
            ),
            "image_url": "/pathways/stage/career-2.jpg",
            "image_alt": "Career changer at a laptop in a treatment plant control room",
            "cta_label": "Express interest",
            "cta_href": "/{state}/interest?pathway=career",
            "sort_order": 20,
        },
        {
            "scope": "career",
            "kicker": "Train and certify",
            "title": "Gold Standard operator training from GED to PhD",
            "body": (
                "Connect to OWW/B&L training, NYSDOH-approved courses, and certification prep "
                "so you can move from interest to licensed work."
            ),
            "image_url": "/pathways/stage/career-3.jpg",
            "image_alt": "Instructor and students in a hands-on operator training lab",
            "cta_label": "Create account",
            "cta_href": "/login",
            "sort_order": 30,
        },
    ],
    "hire": [
        {
            "scope": "hire",
            "kicker": "Recruit on the shared taxonomy",
            "title": "Post openings that surface exact and transferable matches",
            "body": (
                "Describe required vs trainable credentials so Ready now and Strong transferable "
                "candidates find your roles—not keyword noise."
            ),
            "image_url": "/pathways/stage/hire-1.jpg",
            "image_alt": "Utility HR manager reviewing candidate profiles on a monitor",
            "cta_label": "Register as utility admin",
            "cta_href": "/register/utility",
            "sort_order": 10,
        },
        {
            "scope": "hire",
            "kicker": "Plan the bench",
            "title": "See 30-day to 3-year staffing needs before vacancies hit",
            "body": (
                "Pair WW360 succession planning with OWW recruiting so mentoring and "
                "hiring start before gaps become emergencies."
            ),
            "image_url": "/pathways/stage/hire-2.jpg",
            "image_alt": "Supervisor and senior operator walking a treatment plant gallery",
            "cta_label": "Express interest",
            "cta_href": "/{state}/interest?pathway=hire",
            "sort_order": 20,
        },
        {
            "scope": "hire",
            "kicker": "Close the loop",
            "title": "Report hires that feed statewide workforce analytics",
            "body": (
                "Track applicants, interviews, and hiring outcomes that roll into NYSAWWA "
                "engagement reporting for grants, boards, and legislators."
            ),
            "image_url": "/pathways/stage/hire-3.jpg",
            "image_alt": "New operator receiving a handshake and badge at a plant gate",
            "cta_label": "Employer sign-in",
            "cta_href": "/login",
            "sort_order": 30,
        },
    ],
    "educate": [
        {
            "scope": "educate",
            "kicker": "List courses and events",
            "title": "Put training where candidates and utilities already look",
            "body": (
                "Publish courses and events on your educator dashboard so learners discover "
                "them inside OWW—not only on scattered calendars."
            ),
            "image_url": "/pathways/stage/educate-1.jpg",
            "image_alt": "Community college instructor teaching hydraulics at a whiteboard",
            "cta_label": "Submit a program",
            "cta_href": "/{state}/programs/submit",
            "sort_order": 10,
        },
        {
            "scope": "educate",
            "kicker": "Training Center partnership",
            "title": "Gold Standard certification and CEUs from Albany, Syracuse, Rochester",
            "body": (
                "Point cohorts to OWW/B&L Gold Standard operator pathways and continuing "
                "education that utilities trust."
            ),
            "image_url": "/pathways/stage/educate-2.jpg",
            "image_alt": "Hands-on operator training room with bench-scale treatment units",
            "cta_label": "Regional training",
            "cta_href": "/{state}/regional/training",
            "sort_order": 20,
        },
        {
            "scope": "educate",
            "kicker": "From cohort to hire",
            "title": "Send learners toward jobs and employer matches",
            "body": (
                "Align programs to certification needs and help graduates move from interest "
                "to training to employment across New York."
            ),
            "image_url": "/pathways/stage/educate-3.jpg",
            "image_alt": "Students on a plant tour with a guide pointing at a clarifier",
            "cta_label": "Express interest",
            "cta_href": "/{state}/interest?pathway=educate",
            "sort_order": 30,
        },
    ],
    "ambassador": [
        {
            "scope": "ambassador",
            "kicker": "Make the case",
            "title": "Credible NY workforce facts for schools, boards, and legislators",
            "body": (
                "Use statewide statistics—millions served, thousands of operators, aging workforce—"
                "to show why staffing capacity is as critical as capital investment."
            ),
            "image_url": "/pathways/stage/ambassador-1.jpg",
            "image_alt": "Speaker presenting to a town board in a community meeting room",
            "cta_label": "Express interest",
            "cta_href": "/{state}/interest?pathway=ambassador",
            "sort_order": 10,
        },
        {
            "scope": "ambassador",
            "kicker": "Open doors",
            "title": "Share microvideos and pathway links with your network",
            "body": (
                "Host career conversations and point people to Career, Hire, and Educate doorways "
                "with toolkits that stay current."
            ),
            "image_url": "/pathways/stage/ambassador-2.jpg",
            "image_alt": "Retired operator mentoring a teen at a career fair table",
            "cta_label": "Share career pathway",
            "cta_href": "/{state}/career",
            "sort_order": 20,
        },
        {
            "scope": "ambassador",
            "kicker": "Connect partners",
            "title": "Loop in NYSAWWA when a school or utility wants more",
            "body": (
                "Introduce utilities, schools, and local officials when a deeper partnership "
                "is needed—ambassadors multiply OWW’s reach."
            ),
            "image_url": "/pathways/stage/ambassador-3.jpg",
            "image_alt": "Partners meeting at a reservoir overlook during a watershed visit",
            "cta_label": "Create account",
            "cta_href": "/login",
            "sort_order": 30,
        },
    ],
}

PRODUCT_SLIDE_TITLES = frozenset(
    {
        "From GED to PhD: careers that keep water safe",
        "Utility staffing, CEU, and succession in one place",
    }
)


def normalize_scope(scope: str | None) -> str:
    value = (scope or "home").strip().lower()
    if value not in SLIDE_SCOPES:
        raise ValueError(f"scope must be one of: {', '.join(sorted(SLIDE_SCOPES))}")
    return value


def slide_to_dict(row: HomeHeroSlide) -> dict[str, Any]:
    return {
        "id": row.id,
        "state_code": row.state_code,
        "scope": row.scope or "home",
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


def _tokens_for_state(state: str) -> dict[str, str]:
    pack = get_pack(state)
    if pack:
        return pack.token_map()
    return {
        "state_code": state,
        "state_name": state,
        "demonym": f"{state} residents",
        "partner_short": "One Water Workforce",
        "partner_lead": "One Water Workforce",
        "partner_contact": "the platform team",
        "geo_unit": "County",
        "tagline": "One Water Workforce",
    }


def _row_from_spec(state: str, spec: dict[str, Any]) -> HomeHeroSlide:
    tokens = _tokens_for_state(state)
    return HomeHeroSlide(
        state_code=state,
        scope=normalize_scope(spec.get("scope") or "home"),
        kicker=render_tokens(spec["kicker"], tokens),
        title=render_tokens(spec["title"], tokens),
        body=render_tokens(spec["body"], tokens),
        image_url=spec["image_url"],
        image_alt=render_tokens(spec["image_alt"], tokens),
        cta_label=render_tokens(spec["cta_label"], tokens) if spec.get("cta_label") else None,
        cta_href=spec.get("cta_href"),
        sort_order=spec["sort_order"],
        is_active=True,
    )


def list_public_slides(
    db: Session, *, state_code: str = "NY", scope: str = "home"
) -> list[dict[str, Any]]:
    state = coerce_state(state_code)
    sc = normalize_scope(scope)
    if sc == "home":
        ensure_default_slides(db, state_code=state)
        ensure_product_slides(db, state_code=state)
    else:
        ensure_pathway_slides(db, state_code=state, scope=sc)
    rows = (
        db.query(HomeHeroSlide)
        .filter(
            HomeHeroSlide.state_code == state,
            HomeHeroSlide.scope == sc,
            HomeHeroSlide.is_active.is_(True),
        )
        .order_by(HomeHeroSlide.sort_order, HomeHeroSlide.id)
        .all()
    )
    return [slide_to_dict(r) for r in rows]


def list_admin_slides(
    db: Session, *, state_code: str | None = None, scope: str | None = None
) -> list[dict[str, Any]]:
    sc = normalize_scope(scope) if scope else None
    if state_code:
        state = state_code.upper()[:2]
        if sc is None or sc == "home":
            ensure_default_slides(db, state_code=state)
            ensure_product_slides(db, state_code=state)
        if sc is None:
            ensure_pathway_slides(db, state_code=state)
        elif sc in PATHWAY_SCOPES:
            ensure_pathway_slides(db, state_code=state, scope=sc)
    q = db.query(HomeHeroSlide)
    if state_code:
        q = q.filter(HomeHeroSlide.state_code == state_code.upper()[:2])
    if sc:
        q = q.filter(HomeHeroSlide.scope == sc)
    rows = q.order_by(
        HomeHeroSlide.state_code, HomeHeroSlide.scope, HomeHeroSlide.sort_order, HomeHeroSlide.id
    ).all()
    return [slide_to_dict(r) for r in rows]


def ensure_default_slides(db: Session, *, state_code: str = "NY") -> None:
    state = coerce_state(state_code)
    existing = (
        db.query(HomeHeroSlide)
        .filter(HomeHeroSlide.state_code == state, HomeHeroSlide.scope == "home")
        .count()
    )
    if existing:
        return
    for spec in DEFAULT_SLIDES:
        db.add(_row_from_spec(state, spec))
    db.commit()


def ensure_product_slides(db: Session, *, state_code: str = "NY") -> None:
    """Insert OWW + WW360 home slides if missing; promote to front; backfill empty CTAs."""
    state = coerce_state(state_code)
    product_specs = [s for s in DEFAULT_SLIDES if s["title"] in PRODUCT_SLIDE_TITLES]
    changed = False
    for spec in product_specs:
        found = (
            db.query(HomeHeroSlide)
            .filter(
                HomeHeroSlide.state_code == state,
                HomeHeroSlide.scope == "home",
                HomeHeroSlide.title == spec["title"],
            )
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

    others = (
        db.query(HomeHeroSlide)
        .filter(
            HomeHeroSlide.state_code == state,
            HomeHeroSlide.scope == "home",
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

    defaults_by_title = {s["title"]: s for s in DEFAULT_SLIDES}
    for row in (
        db.query(HomeHeroSlide)
        .filter(HomeHeroSlide.state_code == state, HomeHeroSlide.scope == "home")
        .all()
    ):
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


def ensure_pathway_slides(
    db: Session, *, state_code: str = "NY", scope: str | None = None
) -> None:
    """Insert pathway slides by (scope, title) when missing. Does not overwrite admin edits."""
    state = coerce_state(state_code)
    scopes = [normalize_scope(scope)] if scope else sorted(PATHWAY_SCOPES)
    added = False
    for sc in scopes:
        if sc not in PATHWAY_SCOPES:
            continue
        for spec in PATHWAY_DEFAULT_SLIDES.get(sc, []):
            found = (
                db.query(HomeHeroSlide)
                .filter(
                    HomeHeroSlide.state_code == state,
                    HomeHeroSlide.scope == sc,
                    HomeHeroSlide.title == spec["title"],
                )
                .first()
            )
            if found:
                continue
            db.add(_row_from_spec(state, spec))
            added = True
    if added:
        db.commit()


def create_slide(db: Session, data: dict[str, Any]) -> HomeHeroSlide:
    row = HomeHeroSlide(
        state_code=coerce_state(data.get("state_code")),
        scope=normalize_scope(data.get("scope") or "home"),
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
    if "scope" in data and data["scope"] is not None:
        row.scope = normalize_scope(str(data["scope"]))
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
