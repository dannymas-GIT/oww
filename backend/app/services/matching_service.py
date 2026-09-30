
"""Deterministic individual↔job matching (4 match types)."""
from __future__ import annotations
from typing import Any
from sqlalchemy.orm import Session
from app.models.individual_profile import IndividualProfile
from app.models.job import Job
from app.models.match import Match
from app.models.organization import Organization

WEIGHTS = {
    "career_area": 0.22,
    "opportunity_type": 0.12,
    "skills": 0.18,
    "professional_experience": 0.1,
    "location": 0.12,
    "schedule": 0.08,
    "work_environment": 0.08,
    "licenses": 0.1,
}

def _as_set(val: Any) -> set[str]:
    if val is None:
        return set()
    if isinstance(val, list):
        return {str(x) for x in val if x is not None}
    if isinstance(val, str):
        return {val} if val else set()
    if isinstance(val, dict):
        return {str(k) for k, v in val.items() if v}
    return {str(val)}

def _overlap(a: Any, b: Any) -> float:
    sa, sb = _as_set(a), _as_set(b)
    if not sa or not sb:
        return 0.0
    return len(sa & sb) / max(len(sa | sb), 1)

def score_pair(profile: IndividualProfile, job: Job) -> tuple[str, float, dict]:
    answers = profile.answers or {}
    criteria = job.criteria or {}
    cat_scores: dict[str, float] = {}

    # Hard-ish filters: location / schedule / environment soft-fail reduce score
    loc_ok = True
    ind_loc = answers.get("location") or profile.region
    job_loc = criteria.get("location") or job.region
    if ind_loc and job_loc and _overlap(ind_loc, job_loc) == 0 and str(ind_loc) != str(job_loc):
        loc_ok = False

    # Required credentials at hire
    required_creds = set()
    lic_crit = criteria.get("licenses") or {}
    if isinstance(lic_crit, dict):
        required_creds = {k for k, v in lic_crit.items() if v in ("required", "required_at_hire", True)}
    elif isinstance(lic_crit, list):
        required_creds = set(map(str, lic_crit))
    ind_creds = _as_set(answers.get("licenses"))
    missing_required = required_creds - ind_creds

    career_a = answers.get("career_area") or []
    career_b = criteria.get("career_area") or job.career_areas or ([job.primary_career_area] if job.primary_career_area else [])
    cat_scores["career_area"] = _overlap(career_a, career_b)
    if job.primary_career_area and job.primary_career_area in _as_set(career_a):
        cat_scores["career_area"] = max(cat_scores["career_area"], 0.85)

    cat_scores["opportunity_type"] = _overlap(answers.get("opportunity_type"), criteria.get("opportunity_type") or job.opportunity_type)
    cat_scores["skills"] = _overlap(answers.get("skills"), criteria.get("skills"))
    cat_scores["professional_experience"] = 1.0 if answers.get("professional_experience") and criteria.get("professional_experience") else _overlap(answers.get("professional_experience"), criteria.get("professional_experience"))
    cat_scores["location"] = _overlap(ind_loc, job_loc) if ind_loc and job_loc else (0.5 if not ind_loc or not job_loc else 0.0)
    cat_scores["schedule"] = _overlap(answers.get("schedule"), criteria.get("schedule"))
    cat_scores["work_environment"] = _overlap(answers.get("work_environment"), criteria.get("work_environment"))
    cat_scores["licenses"] = _overlap(ind_creds, required_creds) if required_creds else _overlap(ind_creds, criteria.get("licenses"))

    score = sum(WEIGHTS[k] * cat_scores.get(k, 0.0) for k in WEIGHTS)
    if not loc_ok:
        score *= 0.55

    timing = str(answers.get("timing") or answers.get("seeking_status") or "")
    job_timing = str(criteria.get("timing") or "")
    transferable = cat_scores.get("skills", 0) >= 0.3 or _overlap(answers.get("transferable_industries"), criteria.get("transferable_industries")) >= 0.2
    developing = bool(missing_required) or cat_scores.get("licenses", 0) < 0.5 and bool(criteria.get("licenses"))

    if score >= 0.72 and not missing_required and loc_ok:
        match_type = "ready_now"
    elif score >= 0.45 and transferable and not missing_required:
        match_type = "strong_transferable"
    elif developing or (0.25 <= score < 0.45):
        match_type = "developing"
    else:
        match_type = "future"
        if "future" in timing or "exploring" in timing or job_timing in ("future", "within_1_3_years"):
            match_type = "future"

    explanation = {
        "category_scores": cat_scores,
        "missing_required_credentials": sorted(missing_required),
        "location_aligned": loc_ok,
        "summary": f"{match_type} (score={score:.2f})",
    }
    return match_type, round(score, 4), explanation

def refresh_matches_for_profile(db: Session, profile: IndividualProfile) -> int:
    jobs = db.query(Job).filter(Job.status.in_(["open", "active"]), Job.state_code == profile.state_code).all()
    count = 0
    for job in jobs:
        mt, score, expl = score_pair(profile, job)
        existing = (
            db.query(Match)
            .filter(Match.individual_profile_id == profile.id, Match.job_id == job.id)
            .first()
        )
        if existing:
            existing.match_type = mt
            existing.score = score
            existing.explanation = expl
            existing.category_scores = expl.get("category_scores", {})
            existing.org_id = job.org_id
        else:
            db.add(Match(
                individual_profile_id=profile.id,
                job_id=job.id,
                org_id=job.org_id,
                state_code=profile.state_code,
                match_type=mt,
                score=score,
                category_scores=expl.get("category_scores", {}),
                explanation=expl,
            ))
        count += 1
    db.commit()
    return count

def refresh_matches_for_job(db: Session, job: Job) -> int:
    profiles = db.query(IndividualProfile).filter(IndividualProfile.state_code == job.state_code).all()
    count = 0
    for profile in profiles:
        mt, score, expl = score_pair(profile, job)
        existing = (
            db.query(Match)
            .filter(Match.individual_profile_id == profile.id, Match.job_id == job.id)
            .first()
        )
        if existing:
            existing.match_type = mt
            existing.score = score
            existing.explanation = expl
            existing.category_scores = expl.get("category_scores", {})
        else:
            db.add(Match(
                individual_profile_id=profile.id,
                job_id=job.id,
                org_id=job.org_id,
                state_code=job.state_code,
                match_type=mt,
                score=score,
                category_scores=expl.get("category_scores", {}),
                explanation=expl,
            ))
        count += 1
    db.commit()
    return count

def refresh_all_matches(db: Session) -> int:
    total = 0
    for profile in db.query(IndividualProfile).all():
        total += refresh_matches_for_profile(db, profile)
    return total
