"""New Jersey jurisdiction pack — AWWA NJ Section + NJWEA, no contracted lead."""

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

# WIOA workforce planning regions (SETC) with constituent counties.
NJ_REGIONS = [
    Region(
        id="north",
        name="North",
        kind="workforce_region",
        color="#2a4fbf",
        counties=[
            "Bergen",
            "Essex",
            "Hudson",
            "Hunterdon",
            "Morris",
            "Passaic",
            "Somerset",
            "Sussex",
            "Union",
            "Warren",
        ],
    ),
    Region(
        id="central",
        name="Central",
        kind="workforce_region",
        color="#2eb0c9",
        counties=["Mercer", "Middlesex", "Monmouth", "Ocean"],
    ),
    Region(
        id="south",
        name="South",
        kind="workforce_region",
        color="#3d9ea8",
        counties=[
            "Atlantic",
            "Burlington",
            "Camden",
            "Cape May",
            "Cumberland",
            "Gloucester",
            "Salem",
        ],
    ),
]


def _nj_ladder(prefix: str, category: str, issuer: str, label: str, start: int) -> list[CertificationLevel]:
    rows = []
    for i, cls in enumerate([1, 2, 3, 4]):
        rows.append(
            CertificationLevel(
                name=f"{label} Class {cls}",
                level=f"{prefix}{cls}",
                issuer=issuer,
                category=category,
                description=f"NJDEP {label} operator license (N.J.A.C. 7:10A).",
                sort_order=start + i,
            )
        )
    return rows


_certs: list[CertificationLevel] = []
_certs += _nj_ladder("T", "drinking_water", "NJDEP", "Public Water Treatment (T)", 10)
_certs += _nj_ladder("W", "drinking_water", "NJDEP", "Public Water Distribution (W)", 20)
_certs += _nj_ladder("S", "wastewater", "NJDEP", "Public Wastewater Treatment (S)", 30)
_certs += _nj_ladder("C", "wastewater", "NJDEP", "Wastewater Collection (C)", 40)
_certs += _nj_ladder("N", "industrial", "NJDEP", "Industrial Wastewater (N)", 50)
_certs.append(
    CertificationLevel(
        name="Very Small Water System (VSWS)",
        level="VSWS",
        issuer="NJDEP",
        category="small_system",
        description="12-hour VSWS course plus six months experience; high-school credential required.",
        sort_order=60,
    )
)

PACK = JurisdictionPack(
    pack_version="1.0.0",
    code="NJ",
    name="New Jersey",
    demonym="New Jerseyans",
    geo_unit_label="County",
    partner=Partner(
        lead_org="AWWA New Jersey Section",
        short="AWWA NJ",
        contact_label="the New Jersey water community",
        url="https://www.njawwa.org/",
        contracted=False,
        training=None,
    ),
    regulators=[
        Regulator(
            id="njdep",
            name="New Jersey Department of Environmental Protection",
            short_name="NJDEP",
            domains=["both"],
            cert_notes=(
                "NJDEP licenses T, W, S, C, N (classes 1–4) and VSWS under N.J.A.C. 7:10A. "
                "Exams via PSI/ABC; continuing education every three-year renewal period."
            ),
            links=[
                RegulatorLink(
                    label="Water & Wastewater Operator Licensing",
                    url="https://dep.nj.gov/watersupply/drinking-water-systems/training-certification/water-wastewater-system-operator-licensing/",
                ),
                RegulatorLink(
                    label="Approved courses (2026–2027)",
                    url="https://dep.nj.gov/wp-content/uploads/watersupply/bwse/water-wastewater-system-operator-licensing/courses/approvedcourselist.pdf",
                ),
            ],
        ),
    ],
    certification_ladders=_certs,
    regions=NJ_REGIONS,
    affiliations=[
        Affiliation(id="njwea", name="New Jersey Water Environment Association", url="https://www.njwea.org/"),
        Affiliation(id="njawwa", name="AWWA New Jersey Section", url="https://www.njawwa.org/"),
    ],
    reciprocity_note=(
        "New Jersey may evaluate out-of-state licenses for reciprocity when education, experience, "
        "and exam content are substantially equivalent. Contact NJDEP Examinations & Licensing."
    ),
    tagline="One Water Workforce",
    copy_tokens={
        "people_served": "Nearly 9 million New Jerseyans",
        "operators_count": "thousands of licensed operators",
        "support_line": (
            "Build a strong, prepared water and wastewater workforce for New Jersey — "
            "in partnership with the water community of New Jersey."
        ),
    },
    map=MapConfig(
        bounds=[[38.85, -75.6], [41.36, -73.85]],
        center=[40.1, -74.6],
        zoom=8,
        overlay_url=None,
        regions_meta_url=None,
    ),
    branding={"primary": "#07111f"},
    hero_defaults={
        "mission_kicker": "In partnership with {partner_short}",
    },
)
