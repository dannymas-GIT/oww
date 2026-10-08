"""Role catalog — mirrors WW360 tiers so accounts can later federate via SSO.

Tiers:
  national  (locked admin)  platform_admin; delegate-able platform_editor/ops/manager
  state     (locked)        state_admin
  utility   (tunable)       utility_admin, utility_manager, employer, employer_member
  community                 educator, ambassador, student, individual
"""

from __future__ import annotations

from typing import Iterable

ROLE_CATALOG: list[dict] = [
    {
        "code": "platform_admin",
        "label": "Platform administrator",
        "tier": "national",
        "locked": True,
        "category": "Administration",
        "description": "Full platform control across every jurisdiction. May assign all roles.",
    },
    {
        "code": "platform_editor",
        "label": "Platform editor",
        "tier": "national",
        "locked": False,
        "category": "Content",
        "description": "CMS, programs, featured posts, certifications, and locations.",
    },
    {
        "code": "platform_ops",
        "label": "Platform operations",
        "tier": "national",
        "locked": False,
        "category": "Operations",
        "description": "Memberships, utility registrations, communications, logins, and analytics.",
    },
    {
        "code": "platform_manager",
        "label": "Platform manager",
        "tier": "national",
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
        "label": "Utility administrator",
        "tier": "utility",
        "locked": False,
        "category": "Administration",
        "description": "Manages a utility’s account, members, billing, and postings.",
    },
    {
        "code": "utility_manager",
        "label": "Utility manager",
        "tier": "utility",
        "locked": False,
        "category": "Workforce",
        "description": "Posts jobs, reviews matches, schedules interviews.",
    },
    {
        "code": "employer",
        "label": "Employer (hiring)",
        "tier": "utility",
        "locked": False,
        "category": "Workforce",
        "description": "Non-utility employer or consultant hiring through OWW.",
    },
    {
        "code": "employer_member",
        "label": "Employer team member",
        "tier": "utility",
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
UTILITY_ROLES = {r["code"] for r in ROLE_CATALOG if r["tier"] == "utility"}
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

HIRING_ROLES = ("employer", "employer_admin", "employer_member", "utility_admin", "utility_manager")
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
        return UTILITY_ROLES | {"individual", "student"}
    return set()


def validate_assignment(actor_roles: Iterable[str], requested: Iterable[str]) -> list[str]:
    """Return rejected roles (empty list when allowed)."""
    allowed = assignable_roles_for(actor_roles)
    return sorted({r for r in requested if r not in allowed})
