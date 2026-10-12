"""
Curated Document Studio data catalog — safe fields from existing services.
No arbitrary SQL.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.models.content_page import ContentPage
from app.models.job import Job
from app.models.organization import Organization
from app.models.program_submission import ProgramSubmission
from app.services import analytics_service, cms_service


def build_data_catalog(db: Session, state_code: str = "NY") -> dict[str, Any]:
    state = (state_code or "NY").upper()
    analytics = analytics_service.summary(db, state_code=state)

    jobs_q = db.query(Job).filter(Job.status == "open")
    if hasattr(Job, "state_code"):
        jobs_q = jobs_q.filter(Job.state_code == state)
    open_jobs = jobs_q.order_by(Job.id.desc()).limit(8).all()

    programs = db.query(ProgramSubmission).order_by(ProgramSubmission.id.desc()).limit(8).all()

    blogs = (
        db.query(ContentPage)
        .filter(ContentPage.template == cms_service.BLOG_TEMPLATE)
        .order_by(ContentPage.id.desc())
        .limit(6)
        .all()
    )

    orgs = db.query(Organization).order_by(Organization.id.desc()).limit(6).all()

    vars_map: dict[str, str | int] = {
        "state_code": state,
        "metric_individuals": int(analytics.get("individuals") or 0),
        "metric_employers": int(analytics.get("employers") or 0),
        "metric_open_jobs": int(analytics.get("jobs") or 0),
        "metric_applications": int(analytics.get("applications") or 0),
        "metric_matches": int(analytics.get("matches") or 0),
        "metric_interest": int(analytics.get("interest_submissions") or 0),
    }

    analytics_items = [
        {
            "key": "metric_individuals",
            "label": "Individuals (candidates)",
            "description": "Users with individual role",
            "value": vars_map["metric_individuals"],
            "kind": "scalar",
        },
        {
            "key": "metric_employers",
            "label": "Employer organizations",
            "value": vars_map["metric_employers"],
            "kind": "scalar",
        },
        {
            "key": "metric_open_jobs",
            "label": "Jobs in catalog",
            "value": vars_map["metric_open_jobs"],
            "kind": "scalar",
        },
        {
            "key": "metric_applications",
            "label": "Applications",
            "value": vars_map["metric_applications"],
            "kind": "scalar",
        },
        {
            "key": "metric_matches",
            "label": "Matches",
            "value": vars_map["metric_matches"],
            "kind": "scalar",
        },
        {
            "key": "metric_interest",
            "label": "Interest submissions",
            "value": vars_map["metric_interest"],
            "kind": "scalar",
        },
        {
            "key": "kpi_row_html",
            "label": "KPI strip (3 metrics HTML)",
            "description": "Insert a styled 3-column stats row",
            "kind": "table",
            "html": (
                '<div class="studio-kpi-row">'
                f'<div class="studio-kpi"><strong>{vars_map["metric_open_jobs"]}</strong><span>Jobs</span></div>'
                f'<div class="studio-kpi"><strong>{vars_map["metric_individuals"]}</strong><span>Candidates</span></div>'
                f'<div class="studio-kpi"><strong>{vars_map["metric_employers"]}</strong><span>Employers</span></div>'
                "</div>"
            ),
            "value": None,
        },
    ]

    job_rows = "".join(
        f"<tr><td>{(j.title or 'Role')}</td>"
        f"<td>{(j.city or j.region or '')}</td>"
        f"<td>{(j.state_code or state)}</td></tr>"
        for j in open_jobs
    )
    jobs_table = (
        "<table><thead><tr><th>Role</th><th>Location</th><th>State</th></tr></thead>"
        f"<tbody>{job_rows or '<tr><td colspan=\"3\">No open jobs</td></tr>'}</tbody></table>"
    )
    job_items = [
        {
            "key": "open_jobs_table",
            "label": "Open jobs table",
            "description": "Latest open roles as an HTML table",
            "kind": "table",
            "html": jobs_table,
            "value": len(open_jobs),
        }
    ]
    for idx, j in enumerate(open_jobs[:5], start=1):
        key = f"job_{idx}_title"
        vars_map[key] = j.title or "Role"
        job_items.append(
            {
                "key": key,
                "label": f"Job {idx}: {j.title or 'Untitled'}",
                "value": j.title,
                "kind": "scalar",
            }
        )

    program_items = []
    for idx, p in enumerate(programs[:5], start=1):
        key = f"program_{idx}_name"
        name = p.program_name or f"Program {idx}"
        vars_map[key] = name
        program_items.append({"key": key, "label": name, "value": name, "kind": "scalar"})

    blog_items = []
    for idx, b in enumerate(blogs[:5], start=1):
        key = f"blog_{idx}_title"
        vars_map[key] = b.title or "Post"
        slug = b.slug or ""
        url = f"/{(b.state_code or state).lower()}/blog/{slug}"
        vars_map[f"blog_{idx}_url"] = url
        blog_items.append(
            {
                "key": key,
                "label": b.title or f"Blog {idx}",
                "value": b.title,
                "description": url,
                "kind": "scalar",
            }
        )

    org_items = []
    for idx, o in enumerate(orgs[:5], start=1):
        key = f"org_{idx}_name"
        name = o.name or f"Organization {idx}"
        vars_map[key] = name
        org_items.append({"key": key, "label": name, "value": name, "kind": "scalar"})

    context_items = [
        {
            "key": "state_code",
            "label": "State code",
            "value": state,
            "kind": "scalar",
        },
        {
            "key": "contact_name",
            "label": "Contact name (placeholder)",
            "value": "{{contact_name}}",
            "description": "Left as token until filled from context",
            "kind": "scalar",
        },
        {
            "key": "utility_name",
            "label": "Utility name (placeholder)",
            "value": "{{utility_name}}",
            "kind": "scalar",
        },
    ]

    engagement = analytics.get("engagement_by_day") or []
    funnel = analytics.get("funnel") or []
    charts = [
        {
            "id": "engagement_by_day",
            "label": "Engagement (30 days)",
            "chart_type": "line",
            "labels": [str(r.get("date") or "") for r in engagement],
            "values": [int(r.get("count") or 0) for r in engagement],
        },
        {
            "id": "funnel",
            "label": "Funnel by stage",
            "chart_type": "bar",
            "labels": [str(r.get("stage") or "unknown") for r in funnel],
            "values": [int(r.get("count") or 0) for r in funnel],
        },
        {
            "id": "kpi_snapshot",
            "label": "KPI snapshot (jobs / candidates / employers)",
            "chart_type": "bar",
            "labels": ["Jobs", "Candidates", "Employers"],
            "values": [
                int(vars_map["metric_open_jobs"]),
                int(vars_map["metric_individuals"]),
                int(vars_map["metric_employers"]),
            ],
        },
    ]

    return {
        "groups": [
            {"id": "analytics", "label": "Analytics KPIs", "items": analytics_items},
            {"id": "jobs", "label": "Jobs", "items": job_items},
            {"id": "programs", "label": "Programs", "items": program_items},
            {"id": "blog", "label": "Blog / CMS", "items": blog_items},
            {"id": "orgs", "label": "Organizations", "items": org_items},
            {"id": "context", "label": "Context", "items": context_items},
        ],
        "charts": charts,
        "vars": vars_map,
    }


def resolve_placeholder_vars(db: Session, state_code: str = "NY") -> dict[str, str | int]:
    return build_data_catalog(db, state_code=state_code)["vars"]
