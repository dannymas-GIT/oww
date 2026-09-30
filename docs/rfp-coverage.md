# OWW requirements coverage

**Standard practice:** The **PDF** is the shippable deliverable for NY RFP / RFQ responses. Use the **HTML** twin for team review and in-Cursor preview. Canvas is the working draft while assembling evidence.

- **Team review URL:** https://oww.aquasafe-solutions.us/oww-rfp-coverage.html (IP-whitelisted staging)
- **PDF (share/attach):** [`docs/oww-rfp-coverage.pdf`](./oww-rfp-coverage.pdf) — open with a system PDF viewer (`xdg-open docs/oww-rfp-coverage.pdf`)
- **HTML (repo):** [`docs/oww-rfp-coverage.html`](./oww-rfp-coverage.html) — mirrored to `frontend/public/` on deploy
- Regenerate both: `scripts/generate_rfp_coverage_pdf.py`
- **Rule:** `rfp-response-evidence.mdc` (OWW / WW360 / Mission Control workspace)
- **Agent:** `/opt/projects/agents/rfp-response-evidence.json`

Brand lockup: official droplet logo + **From GED to PhD: A Job for Everyone**.

**Shippable PDF:** [`docs/oww-rfp-coverage.pdf`](./oww-rfp-coverage.pdf) (regenerate after evidence changes).

Evidence PNGs (staging captures, 2026-09-30): `docs/oww-rfp-evidence/` (mirrored to `frontend/public/oww-rfp-evidence/` on generate).

Staging: https://oww.aquasafe-solutions.us (IP-whitelisted)

Status legend: **Provided** · **Partial** · **Gap** · **Later**

Brand tokens in app: navy `#002050`, accent `#005df8`, logo at `/brand/oww-logo.png`.

## Site synopsis

One Water Workforce is a NYSAWWA-branded multi-pathway workforce platform: public New York microsite, authenticated hiring and candidate workspaces, membership paywall (sample Stripe), and a platform administration suite. Brand lockup uses the official droplet logo, tagline “From GED to PhD: A Job for Everyone,” navy `#002050` and accent `#005df8`. Primary audiences: job seekers/students, employers/utilities, educators, ambassadors, state partners, and platform operators.

### What visitors get

- State home (`/ny`) with pathways flyout, jobs, companies, interest form, programs
- Four deepened pathways (Career / Hire / Educate / Ambassador) with checklists and next steps
- Public job board and company directory (client-side filter + sort)
- Membership pricing + sample checkout to unlock hiring tools
- Local password sign-in (email or username); OTP optional for community
- Page-aware in-app tours that highlight the current route

### What operators get

- Platform dashboard: memberships, expiring/expired, sample ARR, accounts by role
- Memberships inventory + communications portal (audience by role + membership state)
- Users & access with WW360-aligned role tiers (national/state locked)
- View as role (preview / act-as) for support walkthroughs
- Analytics, CMS, programs, featured posts, certifications, locations, national map
- Employer/utility hiring workspace (jobs, candidates, team, billing)

## Evidence gallery (requirement → screenshot)

| # | Cluster | RFP / source | File |
|---|---|---|---|
| 01 | Public landing + pathways | RFP 4.3 | `01-home.png` |
| 02 | Career pathway | RFP 4.3 Career | `02-career-pathway.png` |
| 03 | Hire pathway | RFP 4.3 Employer | `03-hire-pathway.png` |
| 04 | Educate pathway | RFP 4.3 Educator | `04-educate-pathway.png` |
| 05 | Ambassador pathway | RFP 4.3 Ambassador | `05-ambassador-pathway.png` |
| 06 | Public job board | RFP 4.3 / Phase I | `06-jobs-board.png` |
| 07 | Pathways Interest & Access | RFP 4.2 | `07-interest-form.png` |
| 08 | Membership / paywall | RFP 4.3 / Phase I | `08-pricing.png` |
| 09 | Local account sign-in | Phase I | `09-login.png` |
| 10 | Mobile responsive | RFP Tech | `10-mobile-home.png` |
| 11 | Platform admin dashboard | Phase I | `11-admin-dashboard.png` |
| 12 | Memberships inventory | Phase I | `12-admin-memberships.png` |
| 13 | Communications portal | Phase I | `13-admin-communications.png` |
| 14 | Users & access | Phase I / AquaSafe | `14-admin-users.png` |
| 15 | Roles & permissions | Phase I / security-by-default | `15-admin-roles.png` |
| 16 | Pipeline analytics | RFP 4.1 | `16-admin-analytics.png` |
| 17 | View as role | SaaS standard | `17-view-as-role.png` |
| 18 | Employer hiring workspace | RFP 4.3 / Phase I | `18-employer-workspace.png` |
| 19 | Job posting (gated) | Phase I | `19-employer-jobs.png` |
| 20 | Candidate / matching | Matching / Phase I | `20-candidate-dashboard.png` |

## Membership, roles, and platform administration

**Sample pricing:** seeded plans are **placeholders flagged `sample_pricing`**: Individual $0, Educator $0, Employer $499/yr, Utility $799/yr. NYSAWWA sets real prices in the Stripe Dashboard (`MembershipPlan.stripe_price_id`).

| Capability | Where | Notes |
|---|---|---|
| Sample Stripe checkout | `/pricing` → `POST /billing/checkout` → `/billing/sample-checkout` → `/billing/success` | Runs in sample mode when `STRIPE_SECRET_KEY` is empty; real Stripe Checkout + webhook (`POST /billing/webhook`) when keys are set |
| Paywall | `require_membership("employer","utility")` on job create/duplicate/feature and candidate search | Returns **402 `membership_required`**; frontend `MembershipGate` shows plan card. Org-level memberships cover all users in that org |
| Member billing | `/billing` | Plan, renewal date, provider, payment history, cancel at period end |
| Role catalog | `role_catalog_service.py`, `GET /admin/roles/catalog` | National (`platform_admin`) and State (`state_admin`) locked; Utility tier `utility_admin`, `utility_manager`, `employer`, `employer_member`; Community `educator`, `ambassador`, `student`, `individual`. Same vocabulary as WW360 for later SSO federation |
| Users & access | `/admin/users` (platform/state), `/employer/team` (utility/employer admins) | Add user with temp password, tier-grouped bordered role checkboxes, edit roles, deactivate/reactivate, reset password, comp membership; Users \| Roles & permissions tabs. Utility admins are forced to their own `org_id` (IDOR-safe) and cannot assign protected roles |
| Platform dashboard | `/admin` | Active / expiring 30d / expired 90d / sample ARR, accounts by role, expiring-soon table, recent communications |
| Memberships | `/admin/memberships` | Status tabs (All, Active, Expiring ≤60d, Past due, Canceling, Expired, Complimentary), sortable + filterable, extend / grant access (platform admin) |
| Communications portal | `/admin/communications` | Compose email/SMS, audience by role + membership state (any/active/expiring/expired/none), live recipient count, drafts + history, one-click 30-day renewal notices |
| View as role | `/api/v1/impersonation/*`, header `PersonaSwitcher` | Preview (read-only) + act-as (audited); exit banner; blocks password/billing while impersonating |
| Audit | `billing_events` table; engagement events `user_created`, `user_roles_changed`, `communication_sent` | Who/when/what for grants, extensions, checkouts, webhooks |

Demo accounts (password from `OWW_SEED_ADMIN_PASSWORD`): `oww-admin`, `dmas` / `dmas@lsit-inc.com` (platform_admin), `ny-state-admin`, `utility-admin1..3`, `utility-manager1..3`, `employer1..12` (mixed active / expiring / expired / past-due / canceled / none), `student1..3`, `educator1`.

## Gaps to prioritize

- Licensed photography / authentic OWW microvideo
- Live CRM + production email/SMS
- CEU tracking depth + training map UX
- Formal WCAG audit
- Additional state microsites beyond NY (**Later:** WW360 SSO federation)

## Playbook — next NY RFP

1. Pull RFP sections and appendices into one requirement inventory.
2. Clone the coverage canvas structure; status vocabulary: Provided / Partial / Gap / Later.
3. Stage a branded build behind IP whitelist; seed demo personas for RFP audiences.
4. Capture evidence screenshots per requirement cluster into `*-rfp-evidence/`.
5. Write the one-page site synopsis (visitor vs operator) before the matrix.
6. Regenerate the coverage **PDF** and attach it to the response package.
7. Dual-sync durable rules/memory for any new SaaS capability.
8. Ship via git/PR into develop (no dirty-tree rsync as the primary path).
