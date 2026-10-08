
#!/usr/bin/env python3
"""Seed NY demo data for One Water Workforce."""
from __future__ import annotations
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import settings
from app.core.security import get_password_hash
from app.db.database import SessionLocal, init_db
from app.models.jurisdiction import Jurisdiction
from app.models.user import User
from app.models.organization import Organization
from app.models.individual_profile import IndividualProfile
from app.models.job import Job
from app.models.testimonial import Testimonial
from app.models.microvideo import Microvideo
from app.models.resource_item import ResourceItem
from app.models.course import Course
from app.models.event import Event
from app.models.interest_submission import InterestSubmission
from app.models.certification_catalog import CertificationCatalog
from app.models.location import Location
from app.models.content_page import ContentPage
from app.models.membership import Membership, BillingEvent
from app.models.communication import Communication
from app.models.platform_setting import PlatformSetting
from app.models.utility_registration import UtilityRegistration
from app.services.matching_service import refresh_all_matches
from app.services.engagement_service import track
from app.services.membership_service import ensure_default_plans, DEFAULT_PLANS
from app.services.impersonation_service import ensure_default_personas
from app.services.registration_service import DEFAULT_SETTINGS, set_settings


def upsert_membership(db, user, plan_code, status, *, days_left=None, days_ago_ended=None, provider="sample", org_id=None):
    plan = next(p for p in DEFAULT_PLANS if p["code"] == plan_code)
    m = db.query(Membership).filter(Membership.user_id == user.id).first()
    if not m:
        m = Membership(user_id=user.id, state_code="NY")
        db.add(m)
    now = datetime.utcnow()
    m.org_id = org_id or user.org_id
    m.plan_code = plan_code
    m.status = status
    m.provider = provider
    if status in ("active", "past_due"):
        end = now + timedelta(days=days_left if days_left is not None else 300)
        m.current_period_start = end - timedelta(days=365)
        m.current_period_end = end
        m.canceled_at = None
    elif status == "expired":
        end = now - timedelta(days=days_ago_ended or 10)
        m.current_period_start = end - timedelta(days=365)
        m.current_period_end = end
    elif status == "canceled":
        end = now + timedelta(days=days_left or 20)
        m.current_period_start = end - timedelta(days=365)
        m.current_period_end = end
        m.cancel_at_period_end = True
        m.canceled_at = now - timedelta(days=3)
    elif status == "complimentary":
        m.current_period_start = now - timedelta(days=30)
        m.current_period_end = now + timedelta(days=335)
    m.meta = {"seed": True, "card_last4": "4242"}
    db.commit()
    db.refresh(m)
    if plan["price_cents"] and not db.query(BillingEvent).filter(BillingEvent.membership_id == m.id).first():
        db.add(BillingEvent(membership_id=m.id, user_id=user.id, event_type="sample.checkout.completed", provider=provider,
                            amount_cents=plan["price_cents"], payload={"seed": True, "plan_code": plan_code},
                            created_at=m.current_period_start or now))
        db.commit()
    return m

PASSWORD = os.getenv("OWW_SEED_ADMIN_PASSWORD", settings.OWW_SEED_ADMIN_PASSWORD)

REGIONS = ["Capital Region", "Western NY", "Hudson Valley", "Central NY", "Long Island", "NYC Metro"]
CAREERS = ["drinking_water_treatment", "wastewater_treatment", "engineering", "laboratory", "water_distribution", "construction"]
FIRST = ["Alex", "Jordan", "Sam", "Taylor", "Casey", "Riley", "Morgan", "Quinn", "Avery", "Jamie"]
LAST = ["Rivera", "Chen", "Patel", "Nguyen", "Brooks", "Garcia", "Lee", "Murphy", "Khan", "Walsh"]

ORGS = [
    ("Hudson Falls Water Department", "public_utility", "Hudson Valley", 43.3, -73.58),
    ("Monroe County Water Authority", "public_utility", "Western NY", 43.16, -77.61),
    ("Albany Water Board", "public_utility", "Capital Region", 42.65, -73.75),
    ("Suffolk County Water Authority", "public_utility", "Long Island", 40.82, -73.0),
    ("NYC DEP", "government", "NYC Metro", 40.71, -74.0),
    ("GHD Engineering", "consulting", "Western NY", 43.0, -78.8),
    ("CDM Smith", "consulting", "Capital Region", 42.7, -73.8),
    ("Core & Main", "manufacturer", "Central NY", 43.05, -76.15),
    ("Onondaga County WEP", "public_utility", "Central NY", 43.05, -76.14),
    ("Dutchess County Water & Wastewater", "government", "Hudson Valley", 41.7, -73.9),
    ("Erie County Water Authority", "public_utility", "Western NY", 42.9, -78.85),
    ("BOCES Capital Region CTE", "education", "Capital Region", 42.7, -73.85),
]

def upsert_user(db, username, email, roles, full_name, password=None, org_id=None, phone=None, state="NY"):
    u = db.query(User).filter(User.username == username).first()
    if not u:
        u = User(username=username, email=email)
        db.add(u)
    u.email = email
    u.full_name = full_name
    u.roles = roles
    u.state_code = state
    u.is_active = True
    u.org_id = org_id
    u.phone = phone
    if password:
        u.hashed_password = get_password_hash(password)
    db.commit()
    db.refresh(u)
    return u

def main():
    init_db()
    db = SessionLocal()
    try:
        j = db.query(Jurisdiction).filter(Jurisdiction.state_code == "NY").first()
        if not j:
            j = Jurisdiction(state_code="NY", name="New York", partner_name="NYSAWWA", tagline="One Water Workforce", regions=REGIONS, branding={"primary": "#07111f"}, enabled_features={"jobs": True, "matching": True})
            db.add(j)
            db.commit()

        ensure_default_plans(db)
        admin = upsert_user(db, "oww-admin", "admin@onewaterworkforce.org", ["platform_admin"], "OWW Platform Admin", PASSWORD)
        if db.query(PlatformSetting).count() == 0:
            set_settings(
                db,
                {
                    "utility_registration_review_required": True,
                    "registration_notify_email": DEFAULT_SETTINGS["registration_notify_email"],
                },
                admin,
            )

        # Platform operator account (local password — preferred over OTP for admins)
        upsert_user(db, "dmas", "dmas@lsit-inc.com", ["platform_admin"], "Dan Mas", PASSWORD)
        # Omnitech Solutions platform admins (View as role via platform_admin)
        upsert_user(db, "smosquea", "smosquea@omnitech-solutions.us", ["platform_admin"], "S. Mosquea", PASSWORD)
        upsert_user(db, "jnolan", "jnolan@omnitech-solutions.us", ["platform_admin"], "J. Nolan", PASSWORD)
        upsert_user(db, "tmcknight", "tmcknight@omnitech-solutions.us", ["platform_admin"], "T. McKnight", PASSWORD)
        # Jenny (NYSAWWA): platform_admin so she can create utility admins for WW360 demos.
        # Migrate legacy username ny-state-admin → jenny (same email).
        legacy_jenny = db.query(User).filter(User.username == "ny-state-admin").first()
        if legacy_jenny and not db.query(User).filter(User.username == "jenny").first():
            legacy_jenny.username = "jenny"
            db.commit()
        jenny = upsert_user(
            db,
            "jenny",
            "jenny@nysawwa.org",
            ["platform_admin"],
            "Jenny",
            PASSWORD,
        )
        # Keep state_admin alias username pointing at same mailbox only if still present
        _ = jenny

        # Delegate-able platform staff (jenny/platform_admin can assign these)
        upsert_user(db, "oww-editor", "editor@onewaterworkforce.org", ["platform_editor"], "OWW Platform Editor", PASSWORD)
        upsert_user(db, "oww-ops", "ops@onewaterworkforce.org", ["platform_ops"], "OWW Platform Ops", PASSWORD)
        upsert_user(db, "oww-manager", "manager@onewaterworkforce.org", ["platform_manager"], "OWW Platform Manager", PASSWORD)

        org_ids = []
        for i, (name, otype, region, lat, lng) in enumerate(ORGS):
            org = db.query(Organization).filter(Organization.name == name).first()
            if not org:
                org = Organization(name=name, state_code="NY")
                db.add(org)
            org.org_type = [otype]
            org.region = region
            org.city = name.split()[0]
            org.latitude = lat
            org.longitude = lng
            org.description = f"{name} partners with One Water Workforce."
            org.hiring_projections = {"next_12_months": 3 + (i % 5)}
            org.profile = {"career_area": [CAREERS[i % len(CAREERS)]], "opportunity_type": ["entry_level", "experienced"], "location": region}
            org.is_active = True
            db.commit()
            db.refresh(org)
            org_ids.append(org.id)
            emp = upsert_user(db, f"employer{i+1}", f"hr{i+1}@example.org", ["employer"], f"HR Contact {i+1}", PASSWORD, org_id=org.id)
            # Membership mix so the admin dashboard has active / expiring / expired / canceled rows
            if i % 6 == 0:
                upsert_membership(db, emp, "employer_annual", "active", days_left=14 + i)          # expiring soon
            elif i % 6 == 1:
                upsert_membership(db, emp, "employer_annual", "active", days_left=200 + i)
            elif i % 6 == 2:
                upsert_membership(db, emp, "employer_annual", "expired", days_ago_ended=5 + i)
            elif i % 6 == 3:
                upsert_membership(db, emp, "employer_annual", "past_due", days_left=3)
            elif i % 6 == 4:
                upsert_membership(db, emp, "employer_annual", "canceled", days_left=25)
            # i % 6 == 5 → no membership yet (paywall demo)
            if otype == "public_utility" and i < 6:
                ua = upsert_user(db, f"utility-admin{i+1}", f"utility.admin{i+1}@example.org", ["utility_admin"], f"Utility Admin {i+1}", PASSWORD, org_id=org.id)
                upsert_user(db, f"utility-manager{i+1}", f"utility.manager{i+1}@example.org", ["utility_manager"], f"Utility Manager {i+1}", PASSWORD, org_id=org.id)
                upsert_membership(db, ua, "utility_annual", "active" if i % 2 == 0 else "expired", days_left=45, days_ago_ended=20)
                # Seeded utilities are already verified by Jenny
                existing_reg = db.query(UtilityRegistration).filter(UtilityRegistration.user_id == ua.id).first()
                if not existing_reg:
                    db.add(
                        UtilityRegistration(
                            org_id=org.id,
                            user_id=ua.id,
                            state_code="NY",
                            utility_name=name,
                            contact_name=ua.full_name or ua.username,
                            contact_email=ua.email or f"utility.admin{i+1}@example.org",
                            phone=ua.phone,
                            website=org.website,
                            status="verified",
                            review_required=True,
                            reviewed_by=jenny.id,
                            reviewed_at=datetime.utcnow() - timedelta(days=30 + i),
                            review_note="Seeded demo utility — verified",
                        )
                    )
                    db.commit()
            # jobs
            for k in range(2):
                title = f"{CAREERS[(i+k) % len(CAREERS)].replace('_', ' ').title()} Specialist"
                existing = db.query(Job).filter(Job.org_id == org.id, Job.title == title).first()
                if not existing:
                    job = Job(
                        org_id=org.id,
                        state_code="NY",
                        title=title,
                        description=f"Join {name} supporting water workforce pathways.",
                        opportunity_type="entry_level" if k == 0 else "experienced",
                        primary_career_area=CAREERS[(i + k) % len(CAREERS)],
                        career_areas=[CAREERS[(i + k) % len(CAREERS)]],
                        region=region,
                        city=org.city,
                        latitude=lat,
                        longitude=lng,
                        criteria={
                            "career_area": [CAREERS[(i + k) % len(CAREERS)]],
                            "opportunity_type": ["entry_level", "experienced"],
                            "skills": ["treatment_ops", "infrastructure"],
                            "location": region,
                            "schedule": ["full_time"],
                            "work_environment": ["treatment", "outdoor"],
                            "timing": "within_30_days",
                        },
                        status="open",
                        is_featured=(i % 4 == 0 and k == 0),
                        published_at=datetime.utcnow() - timedelta(days=i),
                        created_by=emp.id,
                    )
                    db.add(job)
            db.commit()

        # individuals
        for i in range(40):
            uname = f"candidate{i+1}"
            email = f"candidate{i+1}@example.org"
            u = upsert_user(db, uname, email, ["individual"], f"{FIRST[i % 10]} {LAST[i % 10]}", phone=f"585555{i:04d}")
            p = db.query(IndividualProfile).filter(IndividualProfile.user_id == u.id).first()
            if not p:
                p = IndividualProfile(user_id=u.id, state_code="NY")
                db.add(p)
            career = CAREERS[i % len(CAREERS)]
            region = REGIONS[i % len(REGIONS)]
            p.display_name = u.full_name
            p.career_stage = ["Entry-Level", "Mid-Level", "Senior Professional"][i % 3]
            p.region = region
            p.answers = {
                "career_area": [career, CAREERS[(i + 1) % len(CAREERS)]],
                "opportunity_type": ["entry_level", "internship"] if i % 3 == 0 else ["experienced"],
                "timing": "within_1_3_months",
                "skills": ["treatment_ops", "sampling", "tools"][0:1 + (i % 3)],
                "professional_experience": ["lt_1", "1_3", "4_9"][i % 3],
                "transferable_industries": ["military", "construction", "manufacturing"][i % 3 : i % 3 + 1],
                "education": ["hs", "associates", "bachelors"][i % 3],
                "licenses": ["dw_operator"] if i % 5 == 0 else [],
                "location": region,
                "schedule": ["full_time"],
                "work_environment": ["treatment", "outdoor"],
                "travel": "local",
                "outreach": ["share_yes", "email"],
            }
            p.resume_bank_opt_in = i % 2 == 0
            p.profile_completeness = 70 + (i % 30)
            p.is_public = True
            db.commit()

        educator = upsert_user(db, "educator1", "educator@boces.example.org", ["educator"], "CTE Educator")
        if not db.query(Course).filter(Course.educator_user_id == educator.id).first():
            db.add(Course(state_code="NY", educator_user_id=educator.id, title="Intro to Water Treatment", description="Career awareness module", educators=["CTE Educator"], region="Capital Region"))
            db.add(Event(state_code="NY", organizer_user_id=educator.id, title="Water Career Fair", starts_at=datetime.utcnow() + timedelta(days=21), location="Albany, NY", region="Capital Region"))
            db.commit()

        upsert_user(db, "ambassador1", "ambassador@example.org", ["ambassador"], "Workforce Ambassador")
        upsert_membership(db, educator, "educator_free", "complimentary")
        for i in range(3):
            stu = upsert_user(db, f"student{i+1}", f"student{i+1}@school.example.org", ["student"], f"{FIRST[(i+3) % 10]} {LAST[(i+5) % 10]}", PASSWORD)
            upsert_membership(db, stu, "individual_free", "complimentary")

        if db.query(Communication).count() == 0:
            db.add_all([
                Communication(state_code="NY", subject="Welcome to One Water Workforce", body="Hi {{name}}, thanks for joining OWW. Explore jobs, training and mentoring at oww.aquasafe-solutions.us.",
                              channel="email", audience={"roles": ["employer", "utility_admin"], "membership_status": "active"}, status="sent", recipient_count=6,
                              sent_at=datetime.utcnow() - timedelta(days=12), created_by=admin.id),
                Communication(state_code="NY", subject="Membership renewal reminder", body="Hi {{name}}, your OWW employer membership renews soon. Keep posting jobs and searching candidates without interruption.",
                              channel="email", audience={"membership_status": "expiring", "expiring_days": 30}, status="draft", recipient_count=0, created_by=admin.id),
            ])
            db.commit()

        if db.query(Testimonial).count() == 0:
            db.add_all([
                Testimonial(state_code="NY", quote="OWW helped me find an operator apprenticeship.", author_name="Alex Rivera", author_title="Operator trainee", pathway="career"),
                Testimonial(state_code="NY", quote="We hired two strong transferable candidates through matching.", author_name="Jordan Chen", author_title="Utility HR", pathway="hire"),
                Testimonial(state_code="NY", quote="Lesson plans and toolkits made classroom outreach easy.", author_name="Sam Patel", author_title="CTE Teacher", pathway="educate"),
            ])
        # Placeholder embeds (including the original demo clip) are not public content.
        db.query(Microvideo).filter(Microvideo.youtube_url.contains("dQw4w9WgXcQ")).delete(synchronize_session=False)
        if db.query(ResourceItem).count() == 0:
            db.add_all([
                ResourceItem(state_code="NY", pathway="career", category="checklist", title="Career checklist", url="/ny/career"),
                ResourceItem(state_code="NY", pathway="hire", category="toolkit", title="Employer hiring toolkit", url="/ny/hire"),
                ResourceItem(state_code="NY", pathway="educate", category="lesson_plan", title="Middle school water careers lesson", url="/ny/educate"),
                ResourceItem(state_code="NY", pathway="ambassador", category="toolkit", title="Ambassador outreach toolkit", url="/ny/ambassador"),
            ])
        from app.services.cms_service import ensure_default_home_page

        ensure_default_home_page(db, state_code="NY")
        if db.query(CertificationCatalog).count() == 0:
            db.add_all([
                CertificationCatalog(state_code="NY", name="Grade 2A Water Treatment", level="2A", issuer="NYSDOH"),
                CertificationCatalog(state_code="NY", name="Wastewater Operator Grade 2", level="2", issuer="NYSDEC"),
            ])
        if db.query(Location).count() == 0:
            for region, city, lat, lng in [
                ("Capital Region", "Albany", 42.65, -73.75),
                ("Western NY", "Rochester", 43.16, -77.61),
                ("Hudson Valley", "Poughkeepsie", 41.7, -73.92),
                ("Long Island", "Hauppauge", 40.82, -73.2),
            ]:
                db.add(Location(state_code="NY", city=city, region=region, lat=lat, lng=lng, zip_code="10001"))
        if db.query(InterestSubmission).count() == 0:
            db.add(InterestSubmission(state_code="NY", full_name="Demo Seeker", email="seeker@example.org", pathway="career", career_stage="Entry-Level", region="Capital Region", interests=["job_board", "mentoring"], permissions={"job_alerts": True}))
        db.commit()

        for stage in ["interest", "engagement", "training", "interview", "employment"]:
            track(db, event_type=f"demo_{stage}", pipeline_stage=stage, state_code="NY", region="Capital Region", career_stage="Entry-Level", source="seed")

        # Do not seed fake login history — real sign-ins populate Login activity.

        # Pending-review demo registrations for Jenny's queue (one paid, one unpaid)
        if not db.query(UtilityRegistration).filter(UtilityRegistration.status == "pending_review").first():
            pending_specs = [
                ("Finger Lakes Water Authority", "utility-pending1", "pending.paid@example.org", True),
                ("Catskill Mountain Utilities", "utility-pending2", "pending.unpaid@example.org", False),
            ]
            for pname, puname, pemail, paid in pending_specs:
                porg = db.query(Organization).filter(Organization.name == pname).first()
                if not porg:
                    porg = Organization(
                        name=pname,
                        state_code="NY",
                        org_type=["public_utility"],
                        region="Central NY",
                        city=pname.split()[0],
                        description=f"{pname} awaiting NYSAWWA review.",
                        website=f"https://example.org/{puname}",
                        is_active=True,
                        profile={"source": "seed_pending"},
                    )
                    db.add(porg)
                    db.commit()
                    db.refresh(porg)
                pua = upsert_user(db, puname, pemail, ["utility_admin"], f"Pending Admin ({pname.split()[0]})", PASSWORD, org_id=porg.id)
                if paid:
                    upsert_membership(db, pua, "utility_annual", "active", days_left=360)
                else:
                    m = db.query(Membership).filter(Membership.user_id == pua.id).first()
                    if not m:
                        m = Membership(
                            user_id=pua.id,
                            org_id=porg.id,
                            state_code="NY",
                            plan_code="utility_annual",
                            status="pending",
                            provider="sample",
                            checkout_session_id=f"cs_sample_seed_{puname}",
                            meta={"seed": True, "success_url": "/billing/success?flow=register"},
                        )
                        db.add(m)
                        db.commit()
                if not db.query(UtilityRegistration).filter(UtilityRegistration.user_id == pua.id).first():
                    db.add(
                        UtilityRegistration(
                            org_id=porg.id,
                            user_id=pua.id,
                            state_code="NY",
                            utility_name=pname,
                            contact_name=pua.full_name or pua.username,
                            contact_email=pemail,
                            phone="555-0100",
                            website=porg.website,
                            job_title="Utility Superintendent",
                            status="pending_review",
                            review_required=True,
                        )
                    )
                    db.commit()

        ensure_default_personas(db)
        n = refresh_all_matches(db)

        from app.services import sample_data_service

        # Utility hiring packs: sample apps / messages / interviews (and jobs when empty).
        for i, org_id in enumerate(org_ids):
            if ORGS[i][1] == "public_utility" and i < 6:
                ua = db.query(User).filter(User.username == f"utility-admin{i+1}").first()
                sample_data_service.ensure_utility_sample_pack(
                    db, org_id, actor_user_id=ua.id if ua else None
                )
        for audience in ("candidates", "hirers", "ambassadors", "educators"):
            sample_data_service.ensure_admin_directory_samples(db, audience)

        print(f"Seed complete. Admin={admin.username} Jenny={jenny.username} matches_refreshed={n}")
        print(f"Password for admin accounts (oww-admin, jenny, dmas, smosquea, jnolan, tmcknight, oww-editor, oww-ops, oww-manager): {PASSWORD}")
        print("Pending review demos: utility-pending1 (paid), utility-pending2 (unpaid)")
    finally:
        db.close()

if __name__ == "__main__":
    main()
