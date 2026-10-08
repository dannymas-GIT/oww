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
| `/:state/jobs` | Job board (search + map; togglable NYSAWWA 10-region overlay) |
| `/:state/jobs/:id` | Job detail |
| `/:state/companies` | Company search |
| `/:state/companies/:id` | Company profile |
| `/:state/regional/:category` | State/region category pages |

## Accounts

| Path | Roles |
|------|-------|
| `/login` | Public (OTP + admin password) |
| `/profile` | Authenticated |
| `/candidate` `/candidate/profile` `/candidate/matches` | individual |
| `/employer` `/employer/org` `/employer/jobs` `/employer/candidates` `/employer/applications` `/employer/messages` `/employer/interviews` | employer |
| `/educator` | educator |
| `/admin/*` | state_admin / platform_admin |

## Admin

Users, Jurisdictions, CMS, Programs, Featured posts, Analytics (+ CSV), Certifications, Locations, National map (togglable NYSAWWA regions).

## Geography reference

- [NYSAWWA NY 10 regions](./ny-regions/README.md) — artwork, county mapping, GeoJSON overlay used by Leaflet maps.
