"""Role catalog — mirrors WW360 tiers so accounts can later federate via SSO.

Tiers:
  national  (locked)  platform_admin
  state     (locked)  state_admin
  utility   (tunable) utility_admin, utility_manager, employer, employer_member
  community           educator, ambassador, student, individual
"""

from __future__ import annotations

from typing import Iterable

ROLE_CATALOG: list[dict] = [
    {"code": "platform_admin", "label": "Platform administrator", "tier": "national", "locked": True,
     "category": "Administration", "description": "Full platform control across every jurisdiction."},
    {"code": "state_admin", "label": "State administrator", "tier": "state", "locked": True,
     "category": "Administration", "description": "Manages a state microsite, CMS, programs, and users."},
    {"code": "utility_admin", "label": "Utility administrator", "tier": "utility", "locked": False,
     "category": "Administration", "description": "Manages a utility’s account, members, billing, and postings."},
    {"code": "utility_manager", "label": "Utility manager", "tier": "utility", "locked": False,
     "category": "Workforce", "description": "Posts jobs, reviews matches, schedules interviews."},
    {"code": "employer", "label": "Employer (hiring)", "tier": "utility", "locked": False,
     "category": "Workforce", "description": "Non-utility employer or consultant hiring through OWW."},
    {"code": "employer_member", "label": "Employer team member", "tier": "utility", "locked": False,
     "category": "Workforce", "description": "Read-only access to organization postings and applicants."},
    {"code": "educator", "label": "Educator / trainer", "tier": "community", "locked": False,
     "category": "Training", "description": "Publishes courses, events, and programs."},
    {"code": "ambassador", "label": "Ambassador", "tier": "community", "locked": False,
     "category": "Outreach", "description": "Champions water careers; receives toolkits and updates."},
    {"code": "student", "label": "Student", "tier": "community", "locked": False,
     "category": "Career", "description": "High school / college learner exploring pathways."},
    {"code": "individual", "label": "Individual / job seeker", "tier": "community", "locked": False,
     "category": "Career", "description": "Candidate profile, matches, and applications."},
]

ROLE_CODES = {r["code"] for r in ROLE_CATALOG}
PROTECTED_ROLES = {r["code"] for r in ROLE_CATALOG if r["locked"]}
UTILITY_ROLES = {r["code"] for r in ROLE_CATALOG if r["tier"] == "utility"}
COMMUNITY_ROLES = {r["code"] for r in ROLE_CATALOG if r["tier"] == "community"}

HIRING_ROLES = ("employer", "employer_admin", "employer_member", "utility_admin", "utility_manager")
ORG_ADMIN_ROLES = ("employer", "employer_admin", "utility_admin")


def catalog() -> list[dict]:
    return ROLE_CATALOG


def assignable_roles_for(actor_roles: Iterable[str]) -> set[str]:
    actor = set(actor_roles)
    if "platform_admin" in actor:
        return set(ROLE_CODES)
    if "state_admin" in actor:
        return ROLE_CODES - {"platform_admin"}
    if "utility_admin" in actor:
        return UTILITY_ROLES | {"individual", "student"}
    return set()


def validate_assignment(actor_roles: Iterable[str], requested: Iterable[str]) -> list[str]:
    """Return rejected roles (empty list when allowed)."""
    allowed = assignable_roles_for(actor_roles)
    return sorted({r for r in requested if r not in allowed})
