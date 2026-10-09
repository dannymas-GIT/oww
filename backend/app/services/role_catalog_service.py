"""OWW role catalog — marketplace / pathways accounts only.

OWW owns hiring, candidate, educator, ambassador, and platform microsite roles.
Water Workforce 360 owns district / CEU / operator / plant roles (district_admin,
ceu_*, workforce_*, etc.). Do not put WW360 plant-ops roles in this catalog.

Shared bridge identities (not shared role codes):
  - OWW ``utility_admin`` hands off to WW360 as ``district_admin``
  - OWW ``platform_admin`` / ``state_admin`` may also exist on WW360 for program partners
"""

from __future__ import annotations

from typing import Iterable

ROLE_CATALOG: list[dict] = [
    {
        "code": "platform_admin",
        "label": "Platform administrator",
        "tier": "platform",
        "locked": True,
        "category": "Administration",
        "description": "Full OWW platform control across every jurisdiction. May assign all OWW roles.",
    },
    {
        "code": "platform_editor",
        "label": "Platform editor",
        "tier": "platform",
        "locked": False,
        "category": "Content",
        "description": "CMS, programs, featured posts, certifications, and locations.",
    },
    {
        "code": "platform_ops",
        "label": "Platform operations",
        "tier": "platform",
        "locked": False,
        "category": "Operations",
        "description": "Memberships, utility registrations, communications, logins, and analytics.",
    },
    {
        "code": "platform_manager",
        "label": "Platform manager",
        "tier": "platform",
        "locked": False,
        "category": "People",
        "description": "Ops surfaces plus People directories. No user create, settings, or jurisdictions.",
    },
    {
        "code": "state_admin",
        "label": "State administrator",
        "tier": "state",
        "locked": True,
        "category": "Administration",
        "description": "Manages a state microsite, CMS, programs, and users.",
    },
    {
        "code": "utility_admin",
        "label": "Utility administrator (OWW hiring)",
        "tier": "hiring",
        "locked": False,
        "category": "Administration",
        "description": (
            "OWW utility org owner: membership, billing, and job postings. "
            "Plant staff / CEU / operators are invited in Water Workforce 360 after handoff."
        ),
    },
    {
        "code": "utility_manager",
        "label": "Utility hiring manager",
        "tier": "hiring",
        "locked": False,
        "category": "Workforce",
        "description": (
            "Posts jobs and reviews matches under the utility’s OWW membership. "
            "Not a WW360 plant-ops role (use district_manager / operators there)."
        ),
    },
    {
        "code": "employer",
        "label": "Employer (hiring)",
        "tier": "hiring",
        "locked": False,
        "category": "Workforce",
        "description": "Non-utility employer or consultant hiring through OWW.",
    },
    {
        "code": "employer_admin",
        "label": "Employer administrator",
        "tier": "hiring",
        "locked": False,
        "category": "Administration",
        "description": "Manages an employer organization’s team and billing on OWW.",
    },
    {
        "code": "employer_member",
        "label": "Employer team member",
        "tier": "hiring",
        "locked": False,
        "category": "Workforce",
        "description": "Read-only access to organization postings and applicants.",
    },
    {
        "code": "educator",
        "label": "Educator / trainer",
        "tier": "community",
        "locked": False,
        "category": "Training",
        "description": "Publishes courses, events, and programs.",
    },
    {
        "code": "ambassador",
        "label": "Ambassador",
        "tier": "community",
        "locked": False,
        "category": "Outreach",
        "description": "Champions water careers; receives toolkits and updates.",
    },
    {
        "code": "student",
        "label": "Student",
        "tier": "community",
        "locked": False,
        "category": "Career",
        "description": "High school / college learner exploring pathways.",
    },
    {
        "code": "individual",
        "label": "Individual / job seeker",
        "tier": "community",
        "locked": False,
        "category": "Career",
        "description": "Candidate profile, matches, and applications.",
    },
]

ROLE_CODES = {r["code"] for r in ROLE_CATALOG}
PROTECTED_ROLES = {r["code"] for r in ROLE_CATALOG if r["locked"]}
HIRING_ORG_ROLES = {r["code"] for r in ROLE_CATALOG if r["tier"] == "hiring"}
# Back-compat alias used by assignable_roles_for / older callers.
UTILITY_ROLES = HIRING_ORG_ROLES
COMMUNITY_ROLES = {r["code"] for r in ROLE_CATALOG if r["tier"] == "community"}
PLATFORM_STAFF_ROLES = frozenset(
    {"platform_admin", "platform_editor", "platform_ops", "platform_manager"}
)

# Capability groups for AuthZ / nav (platform_admin always included by callers).
PLATFORM_OPS_ROLES = ("platform_admin", "platform_ops", "platform_manager", "state_admin")
PLATFORM_EDITOR_ROLES = ("platform_admin", "platform_editor", "state_admin")
PLATFORM_PEOPLE_ROLES = ("platform_admin", "platform_manager", "state_admin")
PLATFORM_STAFF_VIEW_ROLES = (
    "platform_admin",
    "platform_editor",
    "platform_ops",
    "platform_manager",
    "state_admin",
)

HIRING_ROLES = (
    "employer",
    "employer_admin",
    "employer_member",
    "utility_admin",
    "utility_manager",
)
ORG_ADMIN_ROLES = ("employer", "employer_admin", "utility_admin")


def catalog() -> list[dict]:
    return ROLE_CATALOG


def is_platform_staff(roles: Iterable[str]) -> bool:
    return bool(set(roles or []) & PLATFORM_STAFF_ROLES)


def assignable_roles_for(actor_roles: Iterable[str]) -> set[str]:
    actor = set(actor_roles)
    if "platform_admin" in actor:
        return set(ROLE_CODES)
    if "state_admin" in actor:
        # State admins cannot assign platform staff or elevate to platform_admin.
        return ROLE_CODES - PLATFORM_STAFF_ROLES
    if "utility_admin" in actor:
        # Utility plant staff are invited in WW360; OWW utility_admin may only
        # assign OWW hiring helpers + community seekers under their org flows.
        return {"utility_manager", "individual", "student"}
    if "employer" in actor or "employer_admin" in actor:
        return {"employer_member", "employer_admin", "individual", "student"}
    return set()


def validate_assignment(actor_roles: Iterable[str], requested: Iterable[str]) -> list[str]:
    """Return rejected roles (empty list when allowed)."""
    allowed = assignable_roles_for(actor_roles)
    return sorted({r for r in requested if r not in allowed})
