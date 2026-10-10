"""Connecticut jurisdiction pack — CTAWWA + CTWEA; COG planning regions (no counties)."""

from app.jurisdictions.schema import (
    Affiliation,
    CertificationLevel,
    JurisdictionPack,
    MapConfig,
    Partner,
    Region,
    Regulator,
    RegulatorLink,
)

# Census-approved COG planning regions (county equivalents since 2022).
CT_REGIONS = [
    Region(id="capitol", name="Capitol", kind="planning_region", color="#2a4fbf"),
    Region(id="greater_bridgeport", name="Greater Bridgeport", kind="planning_region", color="#2eb0c9"),
    Region(
        id="lower_ct_river_valley",
        name="Lower Connecticut River Valley",
        kind="planning_region",
        color="#3d9ea8",
    ),
    Region(id="naugatuck_valley", name="Naugatuck Valley", kind="planning_region", color="#6b7a2e"),
    Region(
        id="northeastern_ct",
        name="Northeastern Connecticut",
        kind="planning_region",
        color="#c47a3a",
    ),
    Region(id="northwest_hills", name="Northwest Hills", kind="planning_region", color="#8b2e3d"),
    Region(
        id="south_central_ct",
        name="South Central Connecticut",
        kind="planning_region",
        color="#6b3d8b",
    ),
    Region(
        id="southeastern_ct",
        name="Southeastern Connecticut",
        kind="planning_region",
        color="#d45a7a",
    ),
    Region(id="western_ct", name="Western Connecticut", kind="planning_region", color="#2f6b3a"),
]

_certs: list[CertificationLevel] = []
for i, cls in enumerate(["I", "II", "III", "IV"]):
    _certs.append(
        CertificationLevel(
            name=f"Water Treatment Plant Operator Class {cls}",
            level=f"WTP-{cls}",
            issuer="CT DPH",
            category="drinking_water",
            description="CT DPH Drinking Water Section WTP certification (RCSA 25-32).",
            sort_order=10 + i,
        )
    )
for i, cls in enumerate(["I", "II", "III"]):
    _certs.append(
        CertificationLevel(
            name=f"Distribution System Operator Class {cls}",
            level=f"DS-{cls}",
            issuer="CT DPH",
            category="drinking_water",
            description="CT DPH distribution system operator certification.",
            sort_order=20 + i,
        )
    )
_certs.append(
    CertificationLevel(
        name="Small Water System Operator",
        level="SWS",
        issuer="CT DPH",
        category="small_system",
        description="CT DPH small water system operator certification.",
        sort_order=30,
    )
)
for i, cls in enumerate(["I", "II", "III", "IV"]):
    _certs.append(
        CertificationLevel(
            name=f"Wastewater Treatment Operator Class {cls}",
            level=f"WW-{cls}",
            issuer="CT DEEP",
            category="wastewater",
            description="CT DEEP municipal wastewater operator certification (Classes I–IV).",
            sort_order=40 + i,
        )
    )

PACK = JurisdictionPack(
    pack_version="1.1.0",
    code="CT",
    name="Connecticut",
    demonym="Connecticut residents",
    geo_unit_label="Town",
    kind="state",
    default_active=False,  # Prefer New England region tenant over thin CT-only site
    partner=Partner(
        lead_org="Connecticut Section American Water Works Association (CTAWWA)",
        short="CTAWWA",
        contact_label="the Connecticut water community",
        url="https://www.ctawwa.org/",
        contracted=False,
        training=None,
    ),
    regulators=[
        Regulator(
            id="ct_dph",
            name="Connecticut Department of Public Health — Drinking Water Section",
            short_name="CT DPH",
            domains=["drinking_water"],
            cert_notes=(
                "WTP Classes I–IV, Distribution Classes I–III, Small Water System, and Operator-in-Training tracks. "
                "Exams aligned to Water Professional International (WPI) need-to-know criteria."
            ),
            links=[
                RegulatorLink(
                    label="Operator Certification Program",
                    url="https://portal.ct.gov/dph/drinking-water/dws/operator-certification-program",
                ),
                RegulatorLink(
                    label="Exam dates & applications",
                    url="https://portal.ct.gov/dph/drinking-water/dws/operator-certification-examination-dates-applications-and-reference--materials",
                ),
            ],
        ),
        Regulator(
            id="ct_deep",
            name="Connecticut Department of Energy and Environmental Protection",
            short_name="CT DEEP",
            domains=["wastewater"],
            cert_notes=(
                "Municipal wastewater Classes I–IV. Applications accepted on an annual Oct–Sep window "
                "for computer-based exams through the testing center’s last operating day of the year."
            ),
            links=[
                RegulatorLink(
                    label="Wastewater operator certification",
                    url="https://portal.ct.gov/deep/municipal-wastewater/operator-certification-for-municipal-wastewater-treatment-facilities",
                ),
            ],
        ),
    ],
    certification_ladders=_certs,
    regions=CT_REGIONS,
    affiliations=[
        Affiliation(id="ctwea", name="Connecticut Water Environment Association", url="https://www.ctwea.org/"),
        Affiliation(id="ctawwa", name="CTAWWA", url="https://www.ctawwa.org/"),
        Affiliation(
            id="new_england_work_for_water",
            name="New England Work for Water Collaborative",
            url="https://www.newea.org/work-for-water/",
        ),
    ],
    reciprocity_note=(
        "Connecticut DPH and DEEP may grant reciprocity when another state's certification is substantially "
        "equivalent. Contact the Drinking Water Section or Municipal Wastewater section for evaluation."
    ),
    tagline="One Water Workforce",
    copy_tokens={
        "people_served": "About 3.6 million Connecticut residents",
        "operators_count": "hundreds of certified operators across small town utilities",
        "support_line": (
            "Build a strong, prepared water and wastewater workforce for Connecticut — "
            "in partnership with the water community of Connecticut."
        ),
    },
    map=MapConfig(
        bounds=[[40.95, -73.75], [42.05, -71.75]],
        center=[41.6, -72.7],
        zoom=8,
        overlay_url=None,
        regions_meta_url=None,
    ),
    branding={"primary": "#07111f"},
    hero_defaults={
        "mission_kicker": "In partnership with {partner_short}",
    },
)
