"""Jurisdiction pack registry + DB override merge."""

from __future__ import annotations

from typing import Any, Optional

from sqlalchemy.orm import Session

from app.core.config import settings
from app.jurisdictions.packs import ct as pack_ct
from app.jurisdictions.packs import ne as pack_ne
from app.jurisdictions.packs import nj as pack_nj
from app.jurisdictions.packs import ny as pack_ny
from app.jurisdictions.schema import JurisdictionPack, render_tokens

_PACKS: dict[str, JurisdictionPack] = {
    "NY": pack_ny.PACK,
    "NJ": pack_nj.PACK,
    "CT": pack_ct.PACK,
    "NE": pack_ne.PACK,  # New England region tenant (scaffold; not six thin state sites)
}


def default_code() -> str:
    """Configured default jurisdiction (env OWW_DEFAULT_JURISDICTION)."""
    code = (settings.DEFAULT_JURISDICTION or "NY").strip().upper()[:2]
    return code or "NY"


def normalize_code(value: Optional[str]) -> str:
    raw = (value or default_code()).strip().upper()[:2]
    return raw or default_code()


def get_pack(code: str) -> Optional[JurisdictionPack]:
    return _PACKS.get(normalize_code(code))


def all_packs() -> list[JurisdictionPack]:
    return list(_PACKS.values())


def list_pack_codes() -> list[str]:
    return sorted(_PACKS.keys())


def _deep_merge_dict(base: dict[str, Any], override: dict[str, Any] | None) -> dict[str, Any]:
    out = dict(base or {})
    if not override:
        return out
    for key, value in override.items():
        if isinstance(value, dict) and isinstance(out.get(key), dict):
            out[key] = _deep_merge_dict(out[key], value)
        elif value is not None:
            out[key] = value
    return out


def pack_to_dict(pack: JurisdictionPack) -> dict[str, Any]:
    return pack.model_dump()


def effective(db: Session, code: str) -> Optional[dict[str, Any]]:
    """Merge in-code pack with DB Jurisdiction row overrides (DB wins when set)."""
    from app.models.jurisdiction import Jurisdiction

    state = normalize_code(code)
    pack = get_pack(state)
    row = db.query(Jurisdiction).filter(Jurisdiction.state_code == state).first()

    if not pack and not row:
        return None

    if pack:
        data = pack_to_dict(pack)
    else:
        # DB-only jurisdiction (future admin-created without a pack)
        data = {
            "pack_version": "db",
            "code": state,
            "name": row.name if row else state,
            "demonym": getattr(row, "demonym", None) or f"{row.name} residents" if row else state,
            "geo_unit_label": getattr(row, "geo_unit_label", None) or "County",
            "kind": "state",
            "default_active": False,
            "member_state_codes": [],
            "partner": getattr(row, "partner", None)
            or {
                "lead_org": (row.partner_name if row else None) or state,
                "short": (row.partner_name if row else None) or state,
                "contact_label": (row.partner_name if row else None) or "the platform team",
                "contracted": False,
            },
            "regulators": getattr(row, "regulators", None) or [],
            "certification_ladders": getattr(row, "certifications", None) or [],
            "regions": (row.regions if row else None) or [],
            "affiliations": [],
            "reciprocity_note": "",
            "tagline": (row.tagline if row else None) or "One Water Workforce",
            "copy_tokens": getattr(row, "copy_tokens", None) or {},
            "map": getattr(row, "map", None) or {},
            "branding": (row.branding if row else None) or {},
            "default_features": (row.enabled_features if row else None) or {},
            "hero_defaults": {},
        }

    if row:
        if row.name:
            data["name"] = row.name
        if row.tagline:
            data["tagline"] = row.tagline
        if row.partner_name and not (getattr(row, "partner", None) or {}).get("short"):
            data.setdefault("partner", {})
            if isinstance(data["partner"], dict):
                data["partner"]["short"] = row.partner_name
                data["partner"]["lead_org"] = data["partner"].get("lead_org") or row.partner_name
                data["partner"]["contact_label"] = data["partner"].get("contact_label") or row.partner_name
        if getattr(row, "demonym", None):
            data["demonym"] = row.demonym
        if getattr(row, "geo_unit_label", None):
            data["geo_unit_label"] = row.geo_unit_label
        if row.regions:
            data["regions"] = row.regions
        if row.branding:
            data["branding"] = _deep_merge_dict(data.get("branding") or {}, row.branding)
        if row.enabled_features:
            data["default_features"] = _deep_merge_dict(
                data.get("default_features") or {}, row.enabled_features
            )
        if getattr(row, "regulators", None):
            data["regulators"] = row.regulators
        if getattr(row, "certifications", None):
            data["certification_ladders"] = row.certifications
        if getattr(row, "copy_tokens", None):
            data["copy_tokens"] = _deep_merge_dict(data.get("copy_tokens") or {}, row.copy_tokens)
        if getattr(row, "map", None):
            data["map"] = _deep_merge_dict(data.get("map") or {}, row.map)
        if getattr(row, "partner", None):
            data["partner"] = _deep_merge_dict(data.get("partner") or {}, row.partner)
        data["is_active"] = bool(row.is_active)
        data["id"] = row.id
    else:
        data["is_active"] = True
        data["id"] = None

    data["code"] = state.lower()
    data["state_code"] = state
    # Flatten tokens for clients
    tokens = {
        "state_code": state,
        "state_name": data.get("name") or state,
        "demonym": data.get("demonym") or "",
        "partner_short": (data.get("partner") or {}).get("short") or "",
        "partner_lead": (data.get("partner") or {}).get("lead_org") or "",
        "partner_contact": (data.get("partner") or {}).get("contact_label") or "",
        "geo_unit": data.get("geo_unit_label") or "County",
        "tagline": data.get("tagline") or "",
    }
    tokens.update(data.get("copy_tokens") or {})
    data["tokens"] = tokens
    return data


def partner_short_for(db: Session, state_code: Optional[str]) -> str:
    cfg = effective(db, normalize_code(state_code))
    if not cfg:
        return "One Water Workforce"
    return (cfg.get("partner") or {}).get("short") or "One Water Workforce"


def format_for_state(db: Session, state_code: Optional[str], text: str) -> str:
    cfg = effective(db, normalize_code(state_code))
    tokens = (cfg or {}).get("tokens") or {"partner_short": "One Water Workforce", "state_name": normalize_code(state_code)}
    return render_tokens(text, tokens)


def ensure_jurisdictions(db: Session) -> list[str]:
    """Upsert pack rows into DB without clobbering admin-edited non-null fields.

    Public activation: only packs with ``should_activate_public`` (contracted or
    ``default_active``) are live. Scaffold packs (NJ, CT, NE, …) stay inactive
    until a partner MOU — admin can flip ``is_active`` when ready.
    """
    from app.models.jurisdiction import Jurisdiction

    created: list[str] = []
    for pack in all_packs():
        row = db.query(Jurisdiction).filter(Jurisdiction.state_code == pack.code).first()
        activate = pack.should_activate_public
        if not row:
            row = Jurisdiction(
                state_code=pack.code,
                name=pack.name,
                partner_name=pack.partner.short,
                tagline=pack.tagline,
                branding=pack.branding or {"primary": "#07111f"},
                enabled_features=pack.default_features or {"jobs": True, "matching": True},
                regions=[r.model_dump() for r in pack.regions],
                is_active=activate,
                demonym=pack.demonym,
                geo_unit_label=pack.geo_unit_label,
                regulators=[r.model_dump() for r in pack.regulators],
                certifications=[c.model_dump() for c in pack.certification_ladders],
                copy_tokens=pack.copy_tokens or {},
                map=pack.map.model_dump() if pack.map else {},
                partner=pack.partner.model_dump(),
            )
            db.add(row)
            created.append(pack.code)
            continue

        # Fill nulls / empty only
        if not row.name:
            row.name = pack.name
        if not row.partner_name:
            row.partner_name = pack.partner.short
        if not row.tagline:
            row.tagline = pack.tagline
        if not row.regions:
            row.regions = [r.model_dump() for r in pack.regions]
        if not row.branding:
            row.branding = pack.branding or {"primary": "#07111f"}
        if not row.enabled_features:
            row.enabled_features = pack.default_features or {"jobs": True, "matching": True}
        if getattr(row, "demonym", None) in (None, ""):
            row.demonym = pack.demonym
        if getattr(row, "geo_unit_label", None) in (None, ""):
            row.geo_unit_label = pack.geo_unit_label
        if not getattr(row, "regulators", None):
            row.regulators = [r.model_dump() for r in pack.regulators]
        if not getattr(row, "certifications", None):
            row.certifications = [c.model_dump() for c in pack.certification_ladders]
        if not getattr(row, "copy_tokens", None):
            row.copy_tokens = pack.copy_tokens or {}
        if not getattr(row, "map", None):
            row.map = pack.map.model_dump() if pack.map else {}
        if not getattr(row, "partner", None):
            row.partner = pack.partner.model_dump()

        # Course correction: deactivate scaffold packs that were briefly demo-activated.
        # Never auto-deactivate a contracted flagship (NY). Never auto-activate scaffolds.
        if not activate and row.is_active:
            row.is_active = False
        elif activate and not row.is_active and pack.partner.contracted:
            row.is_active = True

    db.commit()
    return created


def deactivate_scaffold_tenants(db: Session) -> list[str]:
    """Force-inactivate non-contracted packs (idempotent seed helper)."""
    from app.models.jurisdiction import Jurisdiction

    changed: list[str] = []
    for pack in all_packs():
        if pack.should_activate_public:
            continue
        row = db.query(Jurisdiction).filter(Jurisdiction.state_code == pack.code).first()
        if row and row.is_active:
            row.is_active = False
            changed.append(pack.code)
    if changed:
        db.commit()
    return changed
