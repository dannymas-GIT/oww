"""Typed jurisdiction pack schema — config, not code, for each state."""

from __future__ import annotations

from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


RegionKind = Literal["economic_region", "workforce_region", "planning_region"]
RegulatorDomain = Literal["drinking_water", "wastewater", "both"]


class RegulatorLink(BaseModel):
    label: str
    url: str


class Regulator(BaseModel):
    id: str
    name: str
    short_name: str
    domains: list[RegulatorDomain]
    cert_notes: str = ""
    links: list[RegulatorLink] = Field(default_factory=list)


class CertificationLevel(BaseModel):
    name: str
    level: str
    issuer: str
    category: str  # drinking_water | wastewater | industrial | small_system | other
    description: str = ""
    sort_order: int = 0


class Region(BaseModel):
    id: str
    name: str
    kind: RegionKind
    color: Optional[str] = None
    counties: list[str] = Field(default_factory=list)
    towns: list[str] = Field(default_factory=list)


class PartnerTraining(BaseModel):
    name: str
    short_name: str = ""
    description: str = ""
    locations: list[str] = Field(default_factory=list)
    url: Optional[str] = None


class Partner(BaseModel):
    lead_org: str
    short: str
    contact_label: str
    url: Optional[str] = None
    contracted: bool = False
    training: Optional[PartnerTraining] = None


class Affiliation(BaseModel):
    id: str
    name: str
    url: Optional[str] = None


class MapConfig(BaseModel):
    bounds: list[list[float]] = Field(default_factory=list)  # [[south, west], [north, east]]
    center: list[float] = Field(default_factory=list)  # [lat, lng]
    zoom: int = 7
    overlay_url: Optional[str] = None
    regions_meta_url: Optional[str] = None


class JurisdictionPack(BaseModel):
    """Versioned in-code defaults for a state microsite."""

    pack_version: str = "1.0.0"
    code: str  # NY, NJ, CT
    name: str
    demonym: str  # New Yorkers, New Jerseyans, Connecticut residents
    geo_unit_label: str  # County | Town
    partner: Partner
    regulators: list[Regulator] = Field(default_factory=list)
    certification_ladders: list[CertificationLevel] = Field(default_factory=list)
    regions: list[Region] = Field(default_factory=list)
    affiliations: list[Affiliation] = Field(default_factory=list)
    reciprocity_note: str = ""
    tagline: str = "One Water Workforce"
    copy_tokens: dict[str, str] = Field(default_factory=dict)
    map: MapConfig = Field(default_factory=MapConfig)
    branding: dict[str, Any] = Field(default_factory=dict)
    default_features: dict[str, bool] = Field(
        default_factory=lambda: {"jobs": True, "matching": True, "workforce_stats": True}
    )
    hero_defaults: dict[str, str] = Field(default_factory=dict)

    def token_map(self) -> dict[str, str]:
        """Flat token dict for string formatting."""
        base = {
            "state_code": self.code,
            "state_name": self.name,
            "demonym": self.demonym,
            "partner_short": self.partner.short,
            "partner_lead": self.partner.lead_org,
            "partner_contact": self.partner.contact_label,
            "geo_unit": self.geo_unit_label,
            "tagline": self.tagline,
        }
        base.update(self.copy_tokens or {})
        return base


def render_tokens(text: str, tokens: dict[str, str]) -> str:
    """Replace {token} placeholders; leave unknown braces alone."""
    out = text
    for key, value in tokens.items():
        out = out.replace("{" + key + "}", value)
    return out
