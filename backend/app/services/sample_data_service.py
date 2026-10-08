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
