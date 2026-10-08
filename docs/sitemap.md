# OWW Sitemap

Default jurisdiction: **NY** (`/` → `/ny`).

## Public

| Path | Purpose |
|------|---------|
| `/:state` | Homepage — pathways, testimonials, microvideo |
| `/:state/career` | I Want a Career in Water |
| `/:state/hire` | I Want to Hire |
| `/:state/educate` | I Want to Educate |
| `/:state/ambassador` | I Want to Be an Ambassador |
| `/:state/interest` | Pathways Interest & Access form |
| `/:state/programs/submit` | Workforce program submission |
| `/:state/jobs` | Job board (search + map) |
| `/:state/jobs/:id` | Job detail |
| `/:state/companies` | Company search |
| `/:state/companies/:id` | Company profile |
| `/:state/regional/:category` | State/region category pages |

## Accounts

| Path | Roles |
|------|-------|
| `/login` | Public (OTP + admin password) |
| `/register/utility` | Public — utility admin self-registration → sample Stripe |
| `/profile` | Authenticated |
| `/pricing` `/billing` `/billing/sample-checkout` `/billing/success` | Membership checkout |
| `/candidate` `/candidate/profile` `/candidate/matches` | individual |
| `/employer` `/employer/org` `/employer/jobs` `/employer/candidates` `/employer/applications` `/employer/messages` `/employer/interviews` `/employer/team` | hiring roles |
| `/educator` | educator |
| `/admin/*` | state_admin / platform_admin |

## Admin

Dashboard, Memberships, Communications, Login activity, Analytics, Users & access, **Utility registrations** (`/admin/registrations`), **Platform settings** (`/admin/settings`), Pages & blog, Programs, Featured posts, Certifications, Locations, Jurisdictions, National map.
