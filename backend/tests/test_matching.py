
from app.models.individual_profile import IndividualProfile
from app.models.job import Job
from app.services.matching_service import score_pair

def test_ready_now_score():
    profile = IndividualProfile(
        id=1, user_id=1, state_code="NY", region="Capital Region",
        answers={
            "career_area": ["drinking_water_treatment"],
            "opportunity_type": ["entry_level"],
            "skills": ["treatment_ops", "infrastructure"],
            "location": "Capital Region",
            "schedule": ["full_time"],
            "work_environment": ["treatment"],
            "licenses": ["dw_operator"],
            "professional_experience": "1_3",
        },
    )
    job = Job(
        id=1, org_id=1, state_code="NY", title="Operator", region="Capital Region",
        primary_career_area="drinking_water_treatment",
        career_areas=["drinking_water_treatment"],
        opportunity_type="entry_level",
        criteria={
            "career_area": ["drinking_water_treatment"],
            "opportunity_type": ["entry_level"],
            "skills": ["treatment_ops"],
            "location": "Capital Region",
            "schedule": ["full_time"],
            "work_environment": ["treatment"],
            "licenses": {"dw_operator": "required"},
            "professional_experience": "1_3",
        },
    )
    mt, score, expl = score_pair(profile, job)
    assert score > 0.5
    assert mt in {"ready_now", "strong_transferable", "developing", "future"}
    assert "category_scores" in expl
