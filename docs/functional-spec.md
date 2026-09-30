# OWW Functional Specification (Phase 1 + Phase 2 core)

## Goals

Workforce engagement platform for NYSAWWA One Water Workforce: pathways navigation, interest capture, job board + matching, employer/educator dashboards, pipeline analytics, multi-state architecture.

## Auth

- OTP email/SMS for individuals, employers, educators, ambassadors (dev codes logged when `EMAIL_ENABLED=false`).
- Password login for `platform_admin` / `state_admin`.
- JWT bearer tokens; `sso_provider` / `sso_subject` reserved for WW360 SSO later.

## Matching

Seventeen taxonomy categories (YAML) drive individual + employer questionnaires. Scorer applies hard-ish location filters and required-credential checks, then weighted category scores → `ready_now` | `strong_transferable` | `developing` | `future`. Matches materialize in `matches` and refresh on profile/job change and nightly.

## Pipeline stages

`interest` → `engagement` → `training` → `interview` → `employment` via `engagement_events`.

## Phase 2 included

Regional category pages, favorites/follows, messaging/notes/interviews, educator courses/events, featured posting queue (stub adapters), multi-jurisdiction + national map, program submission approval, certifications & locations catalogs, CRM webhook export.
