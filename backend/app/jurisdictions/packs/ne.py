"""New England region tenant — Work for Water Collaborative (NEWEA/NEWWA).

Prefer one regional microsite over six thin state sites. Scaffolding only until
a Collaborative / section MOU activates the tenant.
"""

from app.jurisdictions.schema import (
    Affiliation,
    JurisdictionPack,
    MapConfig,
    Partner,
    Region,
    Regulator,
    RegulatorLink,
)

# Six New England states as regions of one tenant (not separate public microsites).
NE_MEMBER_STATES = [
    Region(id="ct", name="Connecticut", kind="workforce_region", color="#2a4fbf"),
    Region(id="ma", name="Massachusetts", kind="workforce_region", color="#2eb0c9"),
    Region(id="me", name="Maine", kind="workforce_region", color="#3d9ea8"),
    Region(id="nh", name="New Hampshire", kind="workforce_region", color="#6b7a2e"),
    Region(id="ri", name="Rhode Island", kind="workforce_region", color="#c47a3a"),
    Region(id="vt", name="Vermont", kind="workforce_region", color="#8b2e3d"),
]

PACK = JurisdictionPack(
    pack_version="1.0.0",
    code="NE",
    name="New England",
    demonym="New Englanders",
    geo_unit_label="State",
    kind="region",
    default_active=False,
    member_state_codes=["CT", "MA", "ME", "NH", "RI", "VT"],
    partner=Partner(
        lead_org="New England Work for Water Collaborative (NEWEA / NEWWA)",
        short="NE Work for Water",
        contact_label="the New England Work for Water Collaborative",
        url="https://www.newea.org/work-for-water/",
        contracted=False,
        training=None,
    ),
    regulators=[
        Regulator(
            id="ne_multi",
            name="Member-state drinking water and clean water agencies",
            short_name="State agencies",
            domains=["both"],
            cert_notes=(
                "Certification remains state-specific (e.g. CT DPH/DEEP, MA Board of Certification). "
                "The regional tenant surfaces shared recruitment and training strategy; each member "
                "state keeps its own exam and license ladder when activated as a child pack."
            ),
            links=[
                RegulatorLink(
                    label="New England Work for Water",
                    url="https://www.newea.org/work-for-water/",
                ),
            ],
        ),
    ],
    certification_ladders=[],  # No single NE ladder — member states own certs
    regions=NE_MEMBER_STATES,
    affiliations=[
        Affiliation(id="newea", name="NEWEA", url="https://www.newea.org/"),
        Affiliation(id="newwa", name="NEWWA", url="https://www.newwa.org/"),
        Affiliation(id="ctawwa", name="CTAWWA", url="https://www.ctawwa.org/"),
        Affiliation(id="ctwea", name="CTWEA", url="https://www.ctwea.org/"),
    ],
    reciprocity_note=(
        "Operator reciprocity is evaluated by each New England state's certifying agency. "
        "The Collaborative coordinates workforce strategy; it does not issue licenses."
    ),
    tagline="One Water Workforce",
    copy_tokens={
        "people_served": "Millions of New England residents",
        "operators_count": "operators across six states of mostly small town utilities",
        "support_line": (
            "Build a strong, prepared water and wastewater workforce across New England — "
            "in partnership with the New England Work for Water Collaborative."
        ),
    },
    map=MapConfig(
        bounds=[[40.95, -73.75], [47.5, -66.9]],
        center=[43.5, -71.0],
        zoom=6,
        overlay_url=None,
        regions_meta_url=None,
    ),
    branding={"primary": "#07111f"},
    hero_defaults={
        "mission_kicker": "In partnership with {partner_short}",
    },
)
