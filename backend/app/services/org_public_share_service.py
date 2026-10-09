"""Granular opt-in public workforce stats for hiring utilities (districts)."""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.models.job import Job
from app.models.organization import Organization

SHARE_KEYS: tuple[str, ...] = (
    "open_jobs",
    "hires_12mo",
    "applicants_contacted",
    "hiring_projection",
    "workforce_size",
    "show_region",
)

SHARE_LABELS: dict[str, str] = {
    "open_jobs": "Open job count",
    "hires_12mo": "Hires reported (12 mo)",
    "applicants_contacted": "Applicants contacted",
    "hiring_projection": "Hiring projection (next 12 mo)",
    "workforce_size": "Approximate workforce size",
    "show_region": "Region / county on public stats",
}

# Numeric keys that roll up on the statewide page.
NUMERIC_SHARE_KEYS: tuple[str, ...] = (
    "open_jobs",
    "hires_12mo",
    "applicants_contacted",
    "hiring_projection",
    "workforce_size",
)


def default_prefs() -> dict[str, bool]:
    return {k: False for k in SHARE_KEYS}


def normalize_prefs(raw: dict[str, Any] | None) -> dict[str, bool]:
    """Return a full prefs map; unknown keys ignored; missing keys default False."""
    out = default_prefs()
    if not isinstance(raw, dict):
        return out
    for key in SHARE_KEYS:
        if key in raw:
            out[key] = bool(raw[key])
    return out


def has_any_share(prefs: dict[str, bool] | None) -> bool:
    p = normalize_prefs(prefs)
    return any(p.values())


def _stat_int(stats: dict[str, Any] | None, key: str, fallback: int) -> int:
    if not isinstance(stats, dict):
        return fallback
    val = stats.get(key)
    try:
        return int(val)
    except (TypeError, ValueError):
        return fallback


def _open_job_count(db: Session, org_id: int) -> int:
    return (
        db.query(Job)
        .filter(
            Job.org_id == org_id,
            Job.status.in_(("open", "active")),
        )
        .count()
    )


def compute_share_payload(db: Session, org: Organization) -> dict[str, Any] | None:
    """Filtered public stats for one org. None when nothing is opted in."""
    prefs = normalize_prefs(org.public_share_prefs)
    if not has_any_share(prefs):
        return None

    stats = org.statistics if isinstance(org.statistics, dict) else {}
    projections = org.hiring_projections if isinstance(org.hiring_projections, dict) else {}
    payload: dict[str, Any] = {"org_id": org.id, "name": org.name}

    if prefs["open_jobs"]:
        live = _open_job_count(db, org.id)
        payload["open_jobs"] = live if live > 0 else _stat_int(stats, "open_jobs", 2)

    if prefs["hires_12mo"]:
        payload["hires_12mo"] = _stat_int(stats, "hires_12mo", 1)

    if prefs["applicants_contacted"]:
        payload["applicants_contacted"] = _stat_int(stats, "applicants_contacted", 4)

    if prefs["hiring_projection"]:
        try:
            payload["hiring_projection"] = int(projections.get("next_12_months") or stats.get("hiring_projection") or 3)
        except (TypeError, ValueError):
            payload["hiring_projection"] = 3

    if prefs["workforce_size"]:
        payload["workforce_size"] = _stat_int(stats, "workforce_size", 25)

    if prefs["show_region"]:
        payload["region"] = org.region or None
        payload["county"] = org.county or None
        payload["city"] = org.city or None

    payload["shared_keys"] = [k for k in SHARE_KEYS if prefs[k]]
    return payload


def list_sharing_orgs(db: Session, *, state_code: str = "NY") -> list[Organization]:
    state = (state_code or "NY").upper()[:2]
    rows = (
        db.query(Organization)
        .filter(Organization.state_code == state, Organization.is_active.is_(True))
        .order_by(Organization.name)
        .all()
    )
    return [o for o in rows if has_any_share(o.public_share_prefs)]


def statewide_workforce_stats(db: Session, *, state_code: str = "NY") -> dict[str, Any]:
    orgs = list_sharing_orgs(db, state_code=state_code)
    contributors: list[dict[str, Any]] = []
    totals: dict[str, int] = {k: 0 for k in NUMERIC_SHARE_KEYS}
    keys_present: set[str] = set()

    for org in orgs:
        payload = compute_share_payload(db, org)
        if not payload:
            continue
        contributors.append(payload)
        for key in NUMERIC_SHARE_KEYS:
            if key in payload and isinstance(payload[key], (int, float)):
                totals[key] += int(payload[key])
                keys_present.add(key)
        if "show_region" in (payload.get("shared_keys") or []):
            keys_present.add("show_region")

    summary = {k: totals[k] for k in NUMERIC_SHARE_KEYS if k in keys_present}
    return {
        "state_code": (state_code or "NY").upper()[:2],
        "org_count": len(contributors),
        "summary": summary,
        "keys_present": sorted(keys_present),
        "organizations": contributors,
        "share_labels": SHARE_LABELS,
    }
