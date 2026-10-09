"""Utility hiring sample packs + admin People directory sample rows.

Sample rows are labeled plainly (is_sample / meta.is_sample). When a section has
real data, sample rows for that section are hidden. Org-level Clear removes the pack.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.application import Application
from app.models.individual_profile import IndividualProfile
from app.models.interview import Interview
from app.models.job import Job
from app.models.match import Match
from app.models.message import Message
from app.models.organization import Organization
from app.models.user import User

SAMPLE_PACK = "utility_v1"
SAMPLE_META = {"is_sample": True, "sample_pack": SAMPLE_PACK}

SAMPLE_JOBS = [
    {
        "title": "Water Treatment Operator (Sample)",
        "description": "Sample posting — operate treatment processes and record daily readings. Replace with your real openings.",
        "opportunity_type": "full_time",
        "primary_career_area": "operations",
        "region": "Capital Region",
        "city": "Albany",
    },
    {
        "title": "Distribution System Technician (Sample)",
        "description": "Sample posting — maintain mains, valves, and hydrants. Illustrative only.",
        "opportunity_type": "full_time",
        "primary_career_area": "distribution",
        "region": "Capital Region",
        "city": "Troy",
    },
    {
        "title": "Laboratory Analyst Intern (Sample)",
        "description": "Sample internship — water quality sampling and bench analysis. Not a real opening.",
        "opportunity_type": "internship",
        "primary_career_area": "laboratory",
        "region": "Capital Region",
        "city": "Albany",
    },
]

SAMPLE_CANDIDATES = [
    {"username": "sample-cand-alex", "full_name": "Alex Rivera (Sample)", "headline": "Entry-level operator candidate", "region": "Capital Region"},
    {"username": "sample-cand-jordan", "full_name": "Jordan Lee (Sample)", "headline": "Career changer — CDL + mechanical", "region": "Hudson Valley"},
    {"username": "sample-cand-sam", "full_name": "Sam Okonkwo (Sample)", "headline": "Lab tech seeking utility role", "region": "Capital Region"},
    {"username": "sample-cand-casey", "full_name": "Casey Nguyen (Sample)", "headline": "Apprentice distribution interest", "region": "Long Island"},
    {"username": "sample-cand-morgan", "full_name": "Morgan Patel (Sample)", "headline": "Student — water resources", "region": "Central NY"},
]

# Illustrative threads — utility managers should open Messaging and see what outreach looks like.
SAMPLE_MESSAGE_THREADS = [
    {
        "candidate_idx": 0,
        "subject": "Interview interest — Water Treatment Operator",
        "outbound": (
            "Hi Alex,\n\n"
            "Thanks for applying to our Water Treatment Operator opening. Your operators-in-training "
            "background looks like a strong fit for our Albany plant.\n\n"
            "Would you be available for a 30-minute video screen next week? We can also do a brief "
            "plant walk-through if you prefer in person.\n\n"
            "— Hiring team (sample message)"
        ),
        "inbound": (
            "Hi — thank you for reaching out! Tuesday or Thursday after 2pm works for a video screen. "
            "Happy to visit the plant as a next step if that helps.\n\n"
            "(Sample reply — not a real candidate.)"
        ),
    },
    {
        "candidate_idx": 1,
        "subject": "Distribution Technician — next steps",
        "outbound": (
            "Hi Jordan,\n\n"
            "We reviewed your application for Distribution System Technician. Your CDL and mechanical "
            "experience stand out for valve/hydrant work.\n\n"
            "Could you send a short note on overnight / weekend on-call comfort, and confirm you can "
            "start within 30 days if offered?\n\n"
            "— Hiring team (sample message)"
        ),
        "inbound": (
            "Yes on on-call (I’ve done rotating weekends before). I can start within two weeks of an offer. "
            "Happy to talk through the route coverage model on a call.\n\n"
            "(Sample reply — not a real candidate.)"
        ),
    },
    {
        "candidate_idx": 2,
        "subject": "Lab Analyst Intern — availability",
        "outbound": (
            "Hi Sam,\n\n"
            "We’re scheduling intro chats for the Laboratory Analyst Intern role. This sample thread "
            "shows how internship outreach looks in Messaging — subject, unread badge, and a short "
            "back-and-forth before an interview is booked.\n\n"
            "Are you available for a 20-minute phone intro this week?\n\n"
            "— Hiring team (sample message)"
        ),
        "inbound": (
            "Yes — Wednesday morning or Friday afternoon. I can also share my course schedule and "
            "lab methods coursework if helpful.\n\n"
            "(Sample reply — not a real candidate.)"
        ),
    },
]

# Varied interview rows so the schedule page shows status / modality / notes clearly.
SAMPLE_INTERVIEWS = [
    {
        "candidate_idx": 0,
        "days_ahead": 3,
        "status": "scheduled",
        "location": "Video — Teams (sample)",
        "notes": "30-min screen: shift preferences, Grade 2A interest, safety culture. Sample only.",
    },
    {
        "candidate_idx": 1,
        "days_ahead": 7,
        "status": "scheduled",
        "location": "Plant lobby + distribution shop tour (sample)",
        "notes": "On-site: CDL check, tool familiarity, hydrant exercise overview. Sample only.",
    },
    {
        "candidate_idx": 2,
        "days_ahead": -5,
        "status": "completed",
        "location": "Phone screen (sample)",
        "notes": "Completed sample phone intro — strong lab methods talk track. Illustrative only.",
    },
    {
        "candidate_idx": 0,
        "days_ahead": -12,
        "status": "canceled",
        "location": "Video — canceled (sample)",
        "notes": "Candidate reschedule request (sample). Shows canceled status on the schedule.",
    },
]

# Inactive illustrative users for admin People directories when none exist.
ADMIN_SAMPLE_PEOPLE: dict[str, list[dict[str, Any]]] = {
    "candidates": [
        {"username": "sample-dir-cand1", "full_name": "Taylor Brooks (Sample)", "email": "sample-cand1@example.invalid", "roles": ["individual"]},
        {"username": "sample-dir-cand2", "full_name": "Riley Chen (Sample)", "email": "sample-cand2@example.invalid", "roles": ["individual"]},
        {"username": "sample-dir-student1", "full_name": "Avery Kim (Sample Student)", "email": "sample-student1@example.invalid", "roles": ["student"]},
    ],
    "hirers": [
        {"username": "sample-dir-employer1", "full_name": "Pat Morgan (Sample Employer)", "email": "sample-employer1@example.invalid", "roles": ["employer"]},
        {"username": "sample-dir-util1", "full_name": "Chris Vale (Sample Utility)", "email": "sample-util1@example.invalid", "roles": ["utility_admin"]},
    ],
    "ambassadors": [
        {"username": "sample-dir-amb1", "full_name": "Dee Santos (Sample Ambassador)", "email": "sample-amb1@example.invalid", "roles": ["ambassador"]},
        {"username": "sample-dir-amb2", "full_name": "Quinn Hale (Sample Ambassador)", "email": "sample-amb2@example.invalid", "roles": ["ambassador"]},
    ],
    "educators": [
        {"username": "sample-dir-edu1", "full_name": "Dr. Nina Ortiz (Sample Educator)", "email": "sample-edu1@example.invalid", "roles": ["educator"]},
        {"username": "sample-dir-edu2", "full_name": "Lane Foster (Sample Trainer)", "email": "sample-edu2@example.invalid", "roles": ["educator"]},
    ],
}


def _org_profile(org: Organization) -> dict:
    return dict(org.profile or {})


def sample_pack_active(org: Organization) -> bool:
    return bool(_org_profile(org).get("sample_pack_active"))


def set_sample_pack_active(db: Session, org: Organization, active: bool) -> None:
    profile = _org_profile(org)
    profile["sample_pack_active"] = active
    if active:
        profile["sample_pack"] = SAMPLE_PACK
    else:
        profile.pop("sample_pack", None)
    org.profile = profile
    db.add(org)


def _ensure_sample_user(
    db: Session,
    *,
    username: str,
    email: str,
    full_name: str,
    roles: list[str],
    state_code: str = "NY",
    org_id: int | None = None,
) -> User:
    u = db.query(User).filter(User.username == username).first()
    if u:
        return u
    u = User(
        username=username,
        email=email.lower(),
        full_name=full_name,
        roles=roles,
        state_code=state_code,
        org_id=org_id,
        is_active=False,
        contact_prefs={"is_sample": True, "sample_pack": SAMPLE_PACK, "must_change_password": False},
    )
    u.hashed_password = get_password_hash(f"sample-disabled-{username}")
    db.add(u)
    db.flush()
    return u


def _ensure_sample_profile(db: Session, user: User, *, headline: str, region: str) -> IndividualProfile:
    p = db.query(IndividualProfile).filter(IndividualProfile.user_id == user.id).first()
    if p:
        return p
    p = IndividualProfile(
        user_id=user.id,
        state_code=user.state_code or "NY",
        display_name=user.full_name,
        headline=headline,
        bio="Sample candidate profile — illustrative only. Not a real job seeker.",
        region=region,
        answers={"_is_sample": True, "sample_pack": SAMPLE_PACK},
        profile_completeness=70,
        is_public=True,
        share_with_employers="yes",
    )
    db.add(p)
    db.flush()
    return p


def _has_any_sample_engagement(db: Session, org_id: int) -> bool:
    if db.query(Message).filter(Message.org_id == org_id, Message.is_sample.is_(True)).count():
        return True
    if db.query(Interview).filter(Interview.org_id == org_id, Interview.is_sample.is_(True)).count():
        return True
    apps = db.query(Application).filter(Application.org_id == org_id).all()
    return any((a.meta or {}).get("is_sample") for a in apps)


def ensure_utility_sample_pack(
    db: Session,
    org_id: int,
    *,
    actor_user_id: int | None = None,
    force_refresh_engagement: bool = False,
) -> dict[str, Any]:
    """Create labeled sample jobs/apps/messages/interviews for a utility org if none yet."""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        return {"ok": False, "reason": "org_missing"}

    existing_sample_jobs = db.query(Job).filter(Job.org_id == org_id, Job.is_sample.is_(True)).count()
    if (
        existing_sample_jobs
        or sample_pack_active(org)
        or _has_any_sample_engagement(db, org_id)
    ):
        # Still fill / refresh engagement sections (apps / messages / interviews).
        return _ensure_engagement_samples(
            db,
            org,
            actor_user_id=actor_user_id,
            force_refresh=force_refresh_engagement,
        )

    real_jobs = (
        db.query(Job).filter(Job.org_id == org_id, Job.is_sample.is_(False)).order_by(Job.id).all()
    )
    # Brand-new utilities with no jobs get a full sample pack.
    # Orgs that already have real jobs only get sample engagement (apps/messages/interviews)
    # so managers can see those sections — not duplicate sample job postings.
    create_sample_jobs = len(real_jobs) == 0

    state = (org.state_code or "NY").upper()
    employer = None
    if actor_user_id:
        employer = db.query(User).filter(User.id == actor_user_id).first()
    if not employer:
        employer = (
            db.query(User)
            .filter(User.org_id == org_id, User.is_active.is_(True))
            .order_by(User.id)
            .first()
        )
    if not employer:
        return {"ok": False, "reason": "no_org_user"}

    # Org profile fluff if thin
    profile = _org_profile(org)
    if not (org.description or "").strip():
        org.description = (
            f"Sample utility profile for {org.name}. Update this description with your real mission, "
            "service area, and hiring story. This text is illustrative sample data."
        )
    if not org.city:
        org.city = "Albany"
    if not org.website:
        org.website = "https://example.invalid/sample-utility"
    profile["sample_pack_active"] = True
    profile["sample_pack"] = SAMPLE_PACK
    org.profile = profile

    jobs: list[Job] = list(real_jobs)
    if create_sample_jobs:
        for spec in SAMPLE_JOBS:
            job = Job(
                org_id=org_id,
                state_code=state,
                title=spec["title"],
                description=spec["description"],
                opportunity_type=spec["opportunity_type"],
                career_areas=[spec["primary_career_area"]],
                primary_career_area=spec["primary_career_area"],
                region=spec["region"],
                city=spec["city"],
                county="Albany",
                status="open",
                is_featured=False,
                is_sample=True,
                criteria=dict(SAMPLE_META),
                published_at=datetime.utcnow(),
                created_by=employer.id,
            )
            db.add(job)
            jobs.append(job)
        db.flush()
    if not jobs:
        db.commit()
        return {"ok": False, "reason": "no_jobs"}

    profiles: list[IndividualProfile] = []
    for i, c in enumerate(SAMPLE_CANDIDATES):
        u = _ensure_sample_user(
            db,
            username=f"{c['username']}-o{org_id}",
            email=f"{c['username']}-o{org_id}@example.invalid",
            full_name=c["full_name"],
            roles=["individual"],
            state_code=state,
        )
        p = _ensure_sample_profile(db, u, headline=c["headline"], region=c["region"])
        profiles.append(p)
        job = jobs[i % len(jobs)]
        m = Match(
            individual_profile_id=p.id,
            job_id=job.id,
            org_id=org_id,
            state_code=state,
            match_type="sample",
            score=78.0 - i * 3,
            category_scores={"skills": 0.8, "location": 0.7},
            explanation={**SAMPLE_META, "note": "Sample match — illustrative only"},
            is_sample=True,
        )
        db.add(m)

    for i, p in enumerate(profiles[:3]):
        job = jobs[i % len(jobs)]
        app = Application(
            job_id=job.id,
            individual_profile_id=p.id,
            user_id=p.user_id,
            org_id=org_id,
            status="submitted",
            cover_note="Sample application — illustrative only. Not a real candidate.",
            meta=dict(SAMPLE_META),
        )
        db.add(app)

    _add_sample_messages_and_interviews(db, org=org, employer=employer, jobs=jobs, profiles=profiles)

    db.commit()
    return {"ok": True, "org_id": org_id, "jobs": len(jobs), "candidates": len(profiles)}


def _sample_candidate_profiles(
    db: Session, *, org_id: int, state: str, limit: int | None = None
) -> list[IndividualProfile]:
    specs = SAMPLE_CANDIDATES if limit is None else SAMPLE_CANDIDATES[:limit]
    profiles: list[IndividualProfile] = []
    for c in specs:
        u = _ensure_sample_user(
            db,
            username=f"{c['username']}-o{org_id}",
            email=f"{c['username']}-o{org_id}@example.invalid",
            full_name=c["full_name"],
            roles=["individual"],
            state_code=state,
        )
        profiles.append(_ensure_sample_profile(db, u, headline=c["headline"], region=c["region"]))
    return profiles


def _add_sample_messages_and_interviews(
    db: Session,
    *,
    org: Organization,
    employer: User,
    jobs: list[Job],
    profiles: list[IndividualProfile],
    force_refresh: bool = False,
) -> None:
    """Create labeled message threads + interview rows when the org has none yet."""
    org_id = org.id
    has_sample_msgs = (
        db.query(Message).filter(Message.org_id == org_id, Message.is_sample.is_(True)).count() > 0
    )
    has_sample_iv = (
        db.query(Interview).filter(Interview.org_id == org_id, Interview.is_sample.is_(True)).count() > 0
    )
    if force_refresh:
        if has_sample_msgs:
            db.query(Message).filter(Message.org_id == org_id, Message.is_sample.is_(True)).delete(
                synchronize_session=False
            )
            has_sample_msgs = False
        if has_sample_iv:
            db.query(Interview).filter(Interview.org_id == org_id, Interview.is_sample.is_(True)).delete(
                synchronize_session=False
            )
            has_sample_iv = False

    if has_sample_msgs and has_sample_iv:
        return

    if not has_sample_msgs:
        for spec in SAMPLE_MESSAGE_THREADS:
            idx = spec["candidate_idx"]
            if idx >= len(profiles):
                continue
            p = profiles[idx]
            cu = db.query(User).filter(User.id == p.user_id).first()
            if not cu:
                continue
            job = jobs[idx % len(jobs)]
            db.add(
                Message(
                    from_user_id=employer.id,
                    to_user_id=cu.id,
                    org_id=org_id,
                    job_id=job.id,
                    subject=spec["subject"],
                    body=spec["outbound"],
                    read=False,
                    is_sample=True,
                )
            )
            db.add(
                Message(
                    from_user_id=cu.id,
                    to_user_id=employer.id,
                    org_id=org_id,
                    job_id=job.id,
                    subject=spec["subject"],
                    body=spec["inbound"],
                    read=True,
                    is_sample=True,
                )
            )

    if not has_sample_iv:
        for spec in SAMPLE_INTERVIEWS:
            idx = spec["candidate_idx"]
            if idx >= len(profiles):
                continue
            p = profiles[idx]
            cu = db.query(User).filter(User.id == p.user_id).first()
            if not cu:
                continue
            job = jobs[idx % len(jobs)]
            db.add(
                Interview(
                    org_id=org_id,
                    job_id=job.id,
                    employer_user_id=employer.id,
                    candidate_user_id=cu.id,
                    scheduled_at=datetime.utcnow() + timedelta(days=spec["days_ahead"]),
                    location=spec["location"],
                    notes=spec["notes"],
                    status=spec["status"],
                    is_sample=True,
                )
            )


def _ensure_engagement_samples(
    db: Session, org: Organization, *, actor_user_id: int | None = None, force_refresh: bool = False
) -> dict[str, Any]:
    """Fill empty apps/messages/interviews for an org that already has a sample pack."""
    org_id = org.id
    has_sample_apps = (
        db.query(Application)
        .filter(Application.org_id == org_id)
        .all()
    )
    has_sample_apps = any((a.meta or {}).get("is_sample") for a in has_sample_apps)
    has_sample_msgs = (
        db.query(Message).filter(Message.org_id == org_id, Message.is_sample.is_(True)).count() > 0
    )
    has_sample_iv = (
        db.query(Interview).filter(Interview.org_id == org_id, Interview.is_sample.is_(True)).count() > 0
    )
    if has_sample_apps and has_sample_msgs and has_sample_iv and not force_refresh:
        return {"ok": True, "already": True, "org_id": org_id}

    jobs = db.query(Job).filter(Job.org_id == org_id).order_by(Job.id).all()
    if not jobs:
        return {"ok": False, "reason": "no_jobs"}
    employer = None
    if actor_user_id:
        employer = db.query(User).filter(User.id == actor_user_id).first()
    if not employer:
        employer = (
            db.query(User)
            .filter(User.org_id == org_id, User.is_active.is_(True))
            .order_by(User.id)
            .first()
        )
    if not employer:
        return {"ok": False, "reason": "no_org_user"}

    state = (org.state_code or "NY").upper()
    profiles = _sample_candidate_profiles(db, org_id=org_id, state=state, limit=3)

    if not has_sample_apps:
        for i, p in enumerate(profiles):
            job = jobs[i % len(jobs)]
            db.add(
                Application(
                    job_id=job.id,
                    individual_profile_id=p.id,
                    user_id=p.user_id,
                    org_id=org_id,
                    status="submitted",
                    cover_note=(
                        "Sample application — illustrative cover note. Clear sample data when you "
                        "start reviewing real applicants."
                    ),
                    meta=dict(SAMPLE_META),
                )
            )

    _add_sample_messages_and_interviews(
        db,
        org=org,
        employer=employer,
        jobs=jobs,
        profiles=profiles,
        force_refresh=force_refresh,
    )
    set_sample_pack_active(db, org, True)
    db.commit()
    return {"ok": True, "org_id": org_id, "engagement": True}


def clear_utility_sample_pack(db: Session, org_id: int) -> dict[str, Any]:
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        return {"ok": False, "reason": "org_missing"}

    job_ids = [j.id for j in db.query(Job).filter(Job.org_id == org_id, Job.is_sample.is_(True)).all()]
    apps = db.query(Application).filter(Application.org_id == org_id).all()
    app_ids = [a.id for a in apps if (a.meta or {}).get("is_sample") or a.job_id in job_ids]
    deleted = {
        "applications": 0,
        "matches": db.query(Match).filter(Match.org_id == org_id, Match.is_sample.is_(True)).delete(synchronize_session=False),
        "messages": db.query(Message).filter(Message.org_id == org_id, Message.is_sample.is_(True)).delete(synchronize_session=False),
        "interviews": db.query(Interview).filter(Interview.org_id == org_id, Interview.is_sample.is_(True)).delete(synchronize_session=False),
        "jobs": 0,
    }
    if app_ids:
        deleted["applications"] = (
            db.query(Application).filter(Application.id.in_(app_ids)).delete(synchronize_session=False)
        )
    if job_ids:
        deleted["jobs"] = db.query(Job).filter(Job.id.in_(job_ids)).delete(synchronize_session=False)

    # Remove org-scoped sample candidate users created for this pack
    sample_users = (
        db.query(User)
        .filter(User.username.like(f"sample-cand-%-o{org_id}"))
        .all()
    )
    for u in sample_users:
        db.query(IndividualProfile).filter(IndividualProfile.user_id == u.id).delete(synchronize_session=False)
        db.delete(u)
    deleted["sample_users"] = len(sample_users)

    set_sample_pack_active(db, org, False)
    db.commit()
    return {"ok": True, "org_id": org_id, "deleted": deleted}


def filter_sample_section(items: list[Any], *, is_sample_fn) -> tuple[list[Any], bool]:
    """If any real item exists, drop sample; else keep sample. Returns (items, showing_sample)."""
    real = [x for x in items if not is_sample_fn(x)]
    sample = [x for x in items if is_sample_fn(x)]
    if real:
        return real, False
    return sample, bool(sample)


def sample_status_for_org(db: Session, org_id: int) -> dict[str, Any]:
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        return {"sample_pack_active": False}
    jobs = db.query(Job).filter(Job.org_id == org_id).all()
    apps = db.query(Application).filter(Application.org_id == org_id).all()
    msgs = db.query(Message).filter(Message.org_id == org_id).all()
    interviews = db.query(Interview).filter(Interview.org_id == org_id).all()

    def _app_sample(a: Application) -> bool:
        return bool((a.meta or {}).get("is_sample"))

    jobs_f, jobs_sample = filter_sample_section(jobs, is_sample_fn=lambda j: bool(j.is_sample))
    apps_f, apps_sample = filter_sample_section(apps, is_sample_fn=_app_sample)
    msgs_f, msgs_sample = filter_sample_section(msgs, is_sample_fn=lambda m: bool(m.is_sample))
    iv_f, iv_sample = filter_sample_section(interviews, is_sample_fn=lambda i: bool(i.is_sample))
    return {
        "sample_pack_active": sample_pack_active(org),
        "sections": {
            "jobs": {"showing_sample": jobs_sample, "count": len(jobs_f), "has_real": any(not j.is_sample for j in jobs)},
            "applications": {"showing_sample": apps_sample, "count": len(apps_f), "has_real": any(not _app_sample(a) for a in apps)},
            "messages": {"showing_sample": msgs_sample, "count": len(msgs_f), "has_real": any(not m.is_sample for m in msgs)},
            "interviews": {"showing_sample": iv_sample, "count": len(iv_f), "has_real": any(not i.is_sample for i in interviews)},
        },
    }


def ensure_admin_directory_samples(db: Session, audience: str) -> list[User]:
    """Ensure inactive sample users exist for an empty audience directory."""
    specs = ADMIN_SAMPLE_PEOPLE.get(audience) or []
    out = []
    for s in specs:
        out.append(
            _ensure_sample_user(
                db,
                username=s["username"],
                email=s["email"],
                full_name=s["full_name"],
                roles=s["roles"],
            )
        )
    db.commit()
    return out


def user_is_sample(u: User) -> bool:
    prefs = u.contact_prefs or {}
    return bool(prefs.get("is_sample")) or (u.username or "").startswith("sample-")


# ---------------------------------------------------------------------------
# Persona sample worlds (View as role)
# ---------------------------------------------------------------------------

PERSONA_SAMPLE_PACK = "persona_v1"
PERSONA_META = {"is_sample": True, "sample_pack": PERSONA_SAMPLE_PACK}


def ensure_persona_sample_world(db: Session, persona_key: str | None) -> dict[str, Any]:
    """Idempotently enrich the demo world for a View-as-role persona."""
    if not persona_key:
        return {"ok": False, "reason": "no_persona"}
    key = persona_key.strip()
    handlers = {
        "student-explorer": _ensure_student_world,
        "job-seeker": _ensure_job_seeker_world,
        "educator": _ensure_educator_world,
        "ambassador": _ensure_ambassador_world,
        "employer-hiring": _ensure_employer_hiring_world,
        "employer-paywall": _ensure_employer_paywall_world,
        "utility-admin": _ensure_utility_hiring_world,
        "utility-manager": _ensure_utility_hiring_world,
        "state-admin": _ensure_state_admin_world,
    }
    fn = handlers.get(key)
    if not fn:
        return {"ok": False, "reason": "unknown_persona", "persona_key": key}
    try:
        result = fn(db)
        result["persona_key"] = key
        return result
    except Exception as exc:  # noqa: BLE001 — demos must not break impersonation start
        db.rollback()
        return {"ok": False, "reason": "error", "persona_key": key, "error": str(exc)}


def ensure_all_persona_sample_worlds(db: Session) -> dict[str, Any]:
    keys = [
        "student-explorer",
        "job-seeker",
        "educator",
        "ambassador",
        "employer-hiring",
        "employer-paywall",
        "utility-admin",
        "utility-manager",
        "state-admin",
    ]
    out = {}
    for key in keys:
        out[key] = ensure_persona_sample_world(db, key)
    return out


def _user_by_username(db: Session, username: str) -> User | None:
    return db.query(User).filter(User.username == username).first()


def _ensure_candidate_profile(
    db: Session,
    user: User,
    *,
    career_stage: str,
    region: str,
    career: str,
    completeness: int,
) -> IndividualProfile:
    p = db.query(IndividualProfile).filter(IndividualProfile.user_id == user.id).first()
    if not p:
        p = IndividualProfile(user_id=user.id, state_code=user.state_code or "NY")
        db.add(p)
        db.flush()
    p.display_name = user.full_name or user.username
    p.career_stage = career_stage
    p.region = region
    p.headline = p.headline or f"{career_stage} — water workforce pathways"
    p.bio = p.bio or (
        "Sample View-as-role profile illustrating Exact Matching answers. "
        "Replace with real candidate data in production."
    )
    answers = dict(p.answers or {})
    if not answers.get("career_area"):
        answers.update(
            {
                "career_area": [career, "water_distribution"],
                "opportunity_type": ["entry_level", "internship"]
                if career_stage == "Entry-Level"
                else ["experienced"],
                "timing": "within_1_3_months",
                "skills": ["treatment_ops", "sampling", "tools"],
                "professional_experience": "lt_1" if career_stage == "Entry-Level" else "1_3",
                "transferable_industries": ["education"] if career_stage == "Entry-Level" else ["construction"],
                "education": "hs" if career_stage == "Entry-Level" else "associates",
                "licenses": [],
                "location": region,
                "schedule": ["full_time"],
                "work_environment": ["treatment", "outdoor"],
                "travel": "local",
                "outreach": ["share_yes", "email"],
                "_persona_sample": True,
                "sample_pack": PERSONA_SAMPLE_PACK,
            }
        )
    p.answers = answers
    p.profile_completeness = max(int(p.profile_completeness or 0), completeness)
    p.is_public = True
    p.resume_bank_opt_in = True
    p.share_with_employers = "yes"
    db.add(p)
    db.flush()
    return p


def _ensure_interest(
    db: Session,
    *,
    email: str,
    full_name: str,
    pathway: str,
    career_stage: str,
    region: str,
    interests: list[str],
) -> InterestSubmission:
    from app.models.interest_submission import InterestSubmission

    row = (
        db.query(InterestSubmission)
        .filter(
            InterestSubmission.email == email.lower(),
            InterestSubmission.pathway == pathway,
        )
        .first()
    )
    if row:
        return row
    row = InterestSubmission(
        state_code="NY",
        full_name=full_name,
        email=email.lower(),
        phone="585-555-0199",
        pathway=pathway,
        career_stage=career_stage,
        region=region,
        interests=interests,
        permissions={"job_alerts": True, "event_updates": True},
        source="persona_sample",
        notes="Sample interest submission for View as role demos.",
        status="new",
    )
    db.add(row)
    db.flush()
    return row


def _open_jobs(db: Session, *, limit: int = 6) -> list[Job]:
    return (
        db.query(Job)
        .filter(Job.state_code == "NY", Job.status.in_(["open", "active"]))
        .order_by(Job.is_featured.desc(), Job.id)
        .limit(limit)
        .all()
    )


def _ensure_candidate_applications_and_messages(
    db: Session,
    *,
    user: User,
    profile: IndividualProfile,
    jobs: list[Job],
    max_apps: int = 3,
) -> dict[str, int]:
    created_apps = 0
    created_msgs = 0
    if not jobs:
        return {"applications": 0, "messages": 0}

    for i, job in enumerate(jobs[:max_apps]):
        existing = (
            db.query(Application)
            .filter(Application.user_id == user.id, Application.job_id == job.id)
            .first()
        )
        if not existing:
            statuses = ("submitted", "under_review", "interview")
            db.add(
                Application(
                    job_id=job.id,
                    individual_profile_id=profile.id,
                    user_id=user.id,
                    org_id=job.org_id,
                    status=statuses[i % len(statuses)],
                    cover_note=(
                        f"Sample application from {user.full_name or user.username} — illustrative "
                        "View-as-role cover note showing pipeline status."
                    ),
                    meta=dict(PERSONA_META),
                )
            )
            created_apps += 1

        employer = (
            db.query(User)
            .filter(User.org_id == job.org_id, User.is_active.is_(True))
            .order_by(User.id)
            .first()
        )
        if not employer:
            continue
        has_msg = (
            db.query(Message)
            .filter(
                Message.org_id == job.org_id,
                Message.job_id == job.id,
                Message.is_sample.is_(True),
                ((Message.from_user_id == user.id) | (Message.to_user_id == user.id)),
            )
            .first()
        )
        if has_msg:
            continue
        subject = f"Next steps — {job.title}"
        db.add(
            Message(
                from_user_id=employer.id,
                to_user_id=user.id,
                org_id=job.org_id,
                job_id=job.id,
                subject=subject,
                body=(
                    f"Hi {profile.display_name or 'there'},\n\n"
                    f"Thanks for applying to {job.title}. This sample message shows how employers "
                    "reach candidates inside OWW Messaging.\n\n— Hiring team (sample)"
                ),
                read=False,
                is_sample=True,
            )
        )
        db.add(
            Message(
                from_user_id=user.id,
                to_user_id=employer.id,
                org_id=job.org_id,
                job_id=job.id,
                subject=subject,
                body=(
                    "Thank you — I am available for a screen next week. "
                    "(Sample candidate reply for View as role.)"
                ),
                read=True,
                is_sample=True,
            )
        )
        created_msgs += 2

    db.commit()
    return {"applications": created_apps, "messages": created_msgs}


def _ensure_student_world(db: Session) -> dict[str, Any]:
    from app.services.matching_service import refresh_matches_for_profile
    from app.services.membership_service import ensure_default_plans
    from app.models.membership import Membership

    ensure_default_plans(db)
    user = _user_by_username(db, "student1")
    if not user:
        return {"ok": False, "reason": "user_missing"}
    # Students browse matches like individuals
    roles = list(user.roles or [])
    if "individual" not in roles:
        roles.append("individual")
        user.roles = roles
        db.add(user)

    profile = _ensure_candidate_profile(
        db,
        user,
        career_stage="Entry-Level",
        region="Capital Region",
        career="drinking_water_treatment",
        completeness=62,
    )
    _ensure_interest(
        db,
        email=user.email or "student1@school.example.org",
        full_name=user.full_name or "Student Explorer",
        pathway="career",
        career_stage="Entry-Level",
        region="Capital Region",
        interests=["job_board", "certification_prep", "mentoring"],
    )
    # complimentary membership if missing (seed usually creates it)
    if not db.query(Membership).filter(Membership.user_id == user.id).first():
        db.add(
            Membership(
                user_id=user.id,
                state_code="NY",
                plan_code="individual_free",
                status="complimentary",
                provider="comp",
                current_period_start=datetime.utcnow() - timedelta(days=10),
                current_period_end=datetime.utcnow() + timedelta(days=355),
                meta={"seed": True, "persona_sample": True},
            )
        )
    refresh_matches_for_profile(db, profile)
    jobs = _open_jobs(db, limit=2)
    eng = _ensure_candidate_applications_and_messages(
        db, user=user, profile=profile, jobs=jobs, max_apps=1
    )
    db.commit()
    return {"ok": True, "profile_id": profile.id, **eng}


def _ensure_job_seeker_world(db: Session) -> dict[str, Any]:
    from app.services.matching_service import refresh_matches_for_profile

    user = _user_by_username(db, "candidate1")
    if not user:
        return {"ok": False, "reason": "user_missing"}
    profile = _ensure_candidate_profile(
        db,
        user,
        career_stage="Mid-Level",
        region="Western NY",
        career="wastewater_treatment",
        completeness=88,
    )
    refresh_matches_for_profile(db, profile)
    jobs = _open_jobs(db, limit=4)
    eng = _ensure_candidate_applications_and_messages(
        db, user=user, profile=profile, jobs=jobs, max_apps=3
    )
    return {"ok": True, "profile_id": profile.id, **eng}


def _ensure_educator_world(db: Session) -> dict[str, Any]:
    from app.models.course import Course
    from app.models.event import Event
    from app.models.program_submission import ProgramSubmission

    user = _user_by_username(db, "educator1")
    if not user:
        return {"ok": False, "reason": "user_missing"}

    course_titles = [
        ("Intro to Water Treatment", "Career awareness module for CTE classrooms."),
        ("Operator Pathways Bootcamp", "Pre-certification overview — Grade 2A / WW operator tracks."),
        ("Safety & Confined Space Awareness", "Utility site safety orientation for apprentices."),
    ]
    for title, desc in course_titles:
        if not db.query(Course).filter(Course.educator_user_id == user.id, Course.title == title).first():
            db.add(
                Course(
                    state_code="NY",
                    educator_user_id=user.id,
                    title=title,
                    description=desc,
                    educators=[user.full_name or "CTE Educator"],
                    region="Capital Region",
                    published=True,
                )
            )

    event_specs = [
        ("Water Career Fair", 21, "Albany BOCES — Main Gym"),
        ("Treatment Plant Field Trip (Sample)", 45, "Albany Water Board — Visitor Center"),
    ]
    for title, days, loc in event_specs:
        if not db.query(Event).filter(Event.organizer_user_id == user.id, Event.title == title).first():
            db.add(
                Event(
                    state_code="NY",
                    organizer_user_id=user.id,
                    title=title,
                    description="Sample educator event for View as role demos.",
                    starts_at=datetime.utcnow() + timedelta(days=days),
                    location=loc,
                    region="Capital Region",
                    published=True,
                )
            )

    if not db.query(ProgramSubmission).filter(
        ProgramSubmission.contact_email == (user.email or "").lower()
    ).first():
        db.add(
            ProgramSubmission(
                state_code="NY",
                program_name="Capital Region Water Career Academy (Sample)",
                organization_name="BOCES Capital Region CTE",
                contact_name=user.full_name or "CTE Educator",
                contact_email=user.email or "educator@boces.example.org",
                contact_phone="518-555-0142",
                program_type="cte_pathway",
                region="Capital Region",
                description=(
                    "Sample program submission illustrating educator → NYSAWWA review workflow. "
                    "Includes classroom modules, plant tours, and employer guest speakers."
                ),
                tags=["sample", "cte", "operator_pathway"],
                payload={"is_sample": True, "sample_pack": PERSONA_SAMPLE_PACK},
                status="pending",
            )
        )
    db.commit()
    courses = db.query(Course).filter(Course.educator_user_id == user.id).count()
    events = db.query(Event).filter(Event.organizer_user_id == user.id).count()
    return {"ok": True, "courses": courses, "events": events}


def _ensure_ambassador_world(db: Session) -> dict[str, Any]:
    from app.models.resource_item import ResourceItem
    from app.services.engagement_service import track

    user = _user_by_username(db, "ambassador1")
    if not user:
        return {"ok": False, "reason": "user_missing"}

    _ensure_interest(
        db,
        email=user.email or "ambassador@example.org",
        full_name=user.full_name or "Workforce Ambassador",
        pathway="ambassador",
        career_stage="Ambassador",
        region="Hudson Valley",
        interests=["mentoring", "membership_information", "outreach"],
    )

    toolkit_titles = [
        ("Ambassador outreach toolkit", "/ny/ambassador"),
        ("Classroom water careers one-pager (Sample)", "/ny/ambassador"),
        ("Legislative talking points — NY workforce (Sample)", "/ny/ambassador"),
    ]
    for title, url in toolkit_titles:
        if not db.query(ResourceItem).filter(
            ResourceItem.pathway == "ambassador", ResourceItem.title == title
        ).first():
            db.add(
                ResourceItem(
                    state_code="NY",
                    pathway="ambassador",
                    category="toolkit",
                    title=title,
                    url=url,
                )
            )

    # Sample outreach engagement (idempotent by event_type + actor)
    from app.models.engagement_event import EngagementEvent

    for etype, stage, note in [
        ("ambassador_outreach", "engagement", "Sample school visit — 28 students reached"),
        ("ambassador_civic", "engagement", "Sample rotary club briefing on operator shortage"),
        ("ambassador_referral", "interest", "Sample referral into Pathways Interest form"),
    ]:
        exists = (
            db.query(EngagementEvent)
            .filter(
                EngagementEvent.actor_user_id == user.id,
                EngagementEvent.event_type == etype,
                EngagementEvent.source == "persona_sample",
            )
            .first()
        )
        if not exists:
            track(
                db,
                event_type=etype,
                pipeline_stage=stage,
                actor_user_id=user.id,
                region="Hudson Valley",
                career_stage="Ambassador",
                state_code="NY",
                source="persona_sample",
                meta={"is_sample": True, "note": note},
            )
    db.commit()
    return {"ok": True}


def _ensure_employer_hiring_world(db: Session) -> dict[str, Any]:
    user = _user_by_username(db, "employer2")
    if not user or not user.org_id:
        return {"ok": False, "reason": "user_or_org_missing"}
    return ensure_utility_sample_pack(
        db, user.org_id, actor_user_id=user.id, force_refresh_engagement=False
    )


def _ensure_employer_paywall_world(db: Session) -> dict[str, Any]:
    """Lapsed employer still sees teaser sample jobs/candidates behind MembershipGate."""
    user = _user_by_username(db, "employer9")
    if not user or not user.org_id:
        return {"ok": False, "reason": "user_or_org_missing"}
    org = db.query(Organization).filter(Organization.id == user.org_id).first()
    if not org:
        return {"ok": False, "reason": "org_missing"}

    # Ensure sample jobs exist even when real seed jobs are present — teasers for the gate.
    state = (org.state_code or "NY").upper()
    existing_sample = db.query(Job).filter(Job.org_id == org.id, Job.is_sample.is_(True)).count()
    if not existing_sample:
        for spec in SAMPLE_JOBS:
            db.add(
                Job(
                    org_id=org.id,
                    state_code=state,
                    title=spec["title"],
                    description=(
                        spec["description"]
                        + " Visible as a teaser when membership is expired — renew to unlock hiring tools."
                    ),
                    opportunity_type=spec["opportunity_type"],
                    career_areas=[spec["primary_career_area"]],
                    primary_career_area=spec["primary_career_area"],
                    region=spec["region"],
                    city=spec["city"],
                    county="Onondaga",
                    status="open",
                    is_featured=False,
                    is_sample=True,
                    criteria=dict(SAMPLE_META),
                    published_at=datetime.utcnow(),
                    created_by=user.id,
                )
            )
        db.flush()

    return ensure_utility_sample_pack(
        db, org.id, actor_user_id=user.id, force_refresh_engagement=False
    )


def _ensure_utility_hiring_world(db: Session) -> dict[str, Any]:
    user = _user_by_username(db, "utility-admin1")
    if not user or not user.org_id:
        return {"ok": False, "reason": "user_or_org_missing"}
    result = ensure_utility_sample_pack(
        db, user.org_id, actor_user_id=user.id, force_refresh_engagement=False
    )
    # Feature one sample (or first) job so the dashboard feels alive
    job = (
        db.query(Job)
        .filter(Job.org_id == user.org_id, Job.status.in_(["open", "active"]))
        .order_by(Job.is_sample.desc(), Job.id)
        .first()
    )
    if job and not job.is_featured:
        job.is_featured = True
        db.add(job)
        db.commit()
    return result


def _ensure_state_admin_world(db: Session) -> dict[str, Any]:
    from app.models.content_page import ContentPage
    from app.models.communication import Communication
    from app.services.engagement_service import track
    from app.models.engagement_event import EngagementEvent

    user = _user_by_username(db, "state-admin-ny")
    if not user:
        return {"ok": False, "reason": "user_missing"}

    draft = (
        db.query(ContentPage)
        .filter(
            ContentPage.state_code == "NY",
            ContentPage.slug == "ny-workforce-spotlight-draft",
        )
        .first()
    )
    if not draft:
        db.add(
            ContentPage(
                state_code="NY",
                slug="ny-workforce-spotlight-draft",
                title="NY Workforce Spotlight (Draft — Sample)",
                template="story_feature",
                pathway=None,
                summary="Sample CMS draft for state admin View as role — publish after review.",
                body_html=(
                    "<p>This draft story illustrates how state partners edit NY microsite content "
                    "before publish. Sample only.</p>"
                ),
                body_json={"sections": [], "is_sample": True},
                is_published=False,
                sort_order=90,
                author_name=user.full_name or "NY State Admin",
                tags=["sample", "draft", "persona"],
                created_by=user.id,
            )
        )

    if not db.query(Communication).filter(
        Communication.subject == "State partner outreach — sample draft"
    ).first():
        db.add(
            Communication(
                state_code="NY",
                subject="State partner outreach — sample draft",
                body=(
                    "Hi {{name}}, this sample draft shows the Communications portal for state admins — "
                    "audience by role and membership state."
                ),
                channel="email",
                audience={"roles": ["utility_admin", "employer"], "membership_status": "expiring", "expiring_days": 30},
                status="draft",
                recipient_count=0,
                created_by=user.id,
            )
        )

    for stage in ("interest", "engagement", "training", "interview", "employment"):
        exists = (
            db.query(EngagementEvent)
            .filter(
                EngagementEvent.event_type == f"state_demo_{stage}",
                EngagementEvent.source == "persona_sample",
            )
            .first()
        )
        if not exists:
            track(
                db,
                event_type=f"state_demo_{stage}",
                pipeline_stage=stage,
                actor_user_id=user.id,
                region="Capital Region",
                career_stage="Entry-Level",
                state_code="NY",
                source="persona_sample",
                meta={"is_sample": True},
            )

    for audience in ("candidates", "hirers", "ambassadors", "educators"):
        ensure_admin_directory_samples(db, audience)

    db.commit()
    return {"ok": True}
