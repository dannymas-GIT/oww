"""New York jurisdiction pack — NYSAWWA contracted lead."""

from app.jurisdictions.schema import (
    Affiliation,
    CertificationLevel,
    JurisdictionPack,
    MapConfig,
    Partner,
    PartnerTraining,
    Region,
    Regulator,
    RegulatorLink,
)

NY_REGIONS = [
    Region(
        id="north_country",
        name="North Country",
        kind="economic_region",
        color="#2f6b3a",
        counties=["Clinton", "Essex", "Franklin", "Hamilton", "Jefferson", "Lewis", "St. Lawrence"],
    ),
    Region(
        id="western_ny",
        name="Western New York",
        kind="economic_region",
        color="#3d9ea8",
        counties=["Allegany", "Cattaraugus", "Chautauqua", "Erie", "Niagara"],
    ),
    Region(
        id="finger_lakes",
        name="Finger Lakes",
        kind="economic_region",
        color="#6b7a2e",
        counties=[
            "Genesee",
            "Livingston",
            "Monroe",
            "Ontario",
            "Orleans",
            "Seneca",
            "Wayne",
            "Wyoming",
            "Yates",
        ],
    ),
    Region(
        id="southern_tier",
        name="Southern Tier",
        kind="economic_region",
        color="#c47a3a",
        counties=["Broome", "Chemung", "Chenango", "Delaware", "Schuyler", "Steuben", "Tioga", "Tompkins"],
    ),
    Region(
        id="central_ny",
        name="Central New York",
        kind="economic_region",
        color="#8b2e3d",
        counties=["Cayuga", "Cortland", "Madison", "Onondaga", "Oswego"],
    ),
    Region(
        id="mohawk_valley",
        name="Mohawk Valley",
        kind="economic_region",
        color="#6b3d8b",
        counties=["Fulton", "Herkimer", "Montgomery", "Oneida", "Otsego", "Schoharie"],
    ),
    Region(
        id="capital_district",
        name="Capital District",
        kind="economic_region",
        color="#2a4fbf",
        counties=[
            "Albany",
            "Columbia",
            "Greene",
            "Rensselaer",
            "Saratoga",
            "Schenectady",
            "Warren",
            "Washington",
        ],
    ),
    Region(
        id="mid_hudson",
        name="Mid-Hudson",
        kind="economic_region",
        color="#7a7a8a",
        counties=["Dutchess", "Orange", "Putnam", "Rockland", "Sullivan", "Ulster", "Westchester"],
    ),
    Region(
        id="new_york_city",
        name="New York City",
        kind="economic_region",
        color="#d45a7a",
        counties=["Bronx", "Kings", "New York", "Queens", "Richmond"],
    ),
    Region(
        id="long_island",
        name="Long Island",
        kind="economic_region",
        color="#2eb0c9",
        counties=["Nassau", "Suffolk"],
    ),
]

_doh_certs = []
for i, level in enumerate(["A", "B", "C", "D", "IA", "IIA", "IIIA", "IVA"]):
    _doh_certs.append(
        CertificationLevel(
            name=f"Grade {level} Water Treatment / Distribution",
            level=level,
            issuer="NYSDOH",
            category="drinking_water",
            description="New York State Department of Health drinking water operator certification.",
            sort_order=10 + i,
        )
    )

_dec_certs = []
for i, level in enumerate(["1", "1A", "2", "2A", "3", "3A", "4", "4A"]):
    _dec_certs.append(
        CertificationLevel(
            name=f"Wastewater Operator Grade {level}",
            level=level,
            issuer="NYSDEC",
            category="wastewater",
            description="NYSDEC wastewater operator certification (NYWEA administers exams).",
            sort_order=50 + i,
        )
    )

PACK = JurisdictionPack(
    pack_version="1.1.0",
    code="NY",
    name="New York",
    demonym="New Yorkers",
    geo_unit_label="County",
    kind="state",
    default_active=True,  # NYSAWWA contracted flagship — only live public tenant by default
    partner=Partner(
        lead_org="New York Section American Water Works Association (NYSAWWA)",
        short="NYSAWWA",
        contact_label="NYSAWWA",
        url="https://nysawwa.org",
        contracted=True,
        training=PartnerTraining(
            name="OWW Training Center (Barton & Loguidice)",
            short_name="B&L",
            description=(
                "Through the One Water Workforce Training Center partnership with Barton & Loguidice, "
                "New York utilities and aspiring operators can access Gold Standard certification training "
                "and continuing education."
            ),
            locations=["Albany", "Syracuse", "Rochester"],
        ),
    ),
    regulators=[
        Regulator(
            id="nysdoh",
            name="New York State Department of Health",
            short_name="NYSDOH",
            domains=["drinking_water"],
            cert_notes="Drinking water operator grades scheduled by NYSDOH; approved training calendars statewide.",
            links=[
                RegulatorLink(
                    label="NYSDOH operator training calendar",
                    url="https://www.health.ny.gov/environmental/water/drinking/training/",
                )
            ],
        ),
        Regulator(
            id="nysdec",
            name="New York State Department of Environmental Conservation",
            short_name="NYSDEC",
            domains=["wastewater"],
            cert_notes="Wastewater operator grades administered with NYWEA exam support.",
            links=[
                RegulatorLink(label="NYWEA certification", url="https://www.nywea.org/"),
            ],
        ),
    ],
    certification_ladders=_doh_certs + _dec_certs,
    regions=NY_REGIONS,
    affiliations=[
        Affiliation(id="nywea", name="New York Water Environment Association", url="https://www.nywea.org/"),
    ],
    reciprocity_note=(
        "New York may grant drinking-water and wastewater operator reciprocity on a case-by-case basis "
        "when another state's certification is substantially equivalent. Contact NYSDOH or NYSDEC for evaluation."
    ),
    tagline="One Water Workforce",
    copy_tokens={
        "people_served": "More than 19 million New Yorkers",
        "operators_count": "fewer than 10,000 certified operators",
        "support_line": "Build a strong, prepared water and wastewater workforce for New York.",
    },
    map=MapConfig(
        bounds=[[40.4, -79.8], [45.1, -71.8]],
        center=[42.9, -75.5],
        zoom=6,
        overlay_url="/maps/ny-counties-regions.geojson",
        regions_meta_url="/maps/regions.json",
    ),
    branding={"primary": "#07111f"},
    hero_defaults={
        "mission_kicker": "Created by {partner_short}",
    },
)
