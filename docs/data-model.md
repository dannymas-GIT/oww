# OWW Data Model

Primary entities (Postgres / SQLAlchemy):

- **users** — roles JSONB, state_code, org_id, OTP/password, SSO placeholders
- **jurisdictions** — state_code, branding, regions, features
- **otp_codes** — destination, channel, code_hash, expiry
- **engagement_events** — stage, region, career_stage, payload
- **individual_profiles** — answers JSONB (17 categories), resume opt-in
- **organizations** / **org_members** — employer profiles + multi-user
- **jobs** / **job_templates** / **applications**
- **matches** — match_type, score, explanation
- **favorites** — follow orgs/jobs
- **interest_submissions** / **program_submissions**
- **content_pages** / **resource_items** / **testimonials** / **microvideos**
- **courses** / **events** / **registrations**
- **messages** / **message_templates** / **notes** / **interviews**
- **featured_posts** / **credits** / **orders** (payment stubs)
- **certification_catalog** / **locations**

Taxonomy source of truth: `backend/app/taxonomy/oww_taxonomy.yaml`.
