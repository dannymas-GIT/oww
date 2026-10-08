# One Water Workforce (OWW)

Public workforce engagement platform for `onewaterworkforce.org` — NYSAWWA One Water Workforce initiative.

- **GitHub:** https://github.com/dannymas-GIT/oww
- **Branches:** `develop` → `staging` → `main`
- **Local path:** `/opt/projects/saas-repos/oww`
- **Stack:** React 18 + Vite + TypeScript + Tailwind | FastAPI + SQLAlchemy + Postgres 15
- **Sibling product:** [Water Workforce 360](https://github.com/dannymas-GIT/ww360) (utility continuity SaaS)

Do not commit `.env` or secrets.

## Quick start

```bash
cp .env.example .env
docker compose up -d --build
# Frontend http://127.0.0.1:8083  Backend http://127.0.0.1:8003  Postgres 5435
docker compose exec backend python scripts/seed_demo.py
```

### Dev without Docker (backend)

```bash
cd backend && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8003
```

### Dev without Docker (frontend)

```bash
cd frontend && npm install && npm run dev -- --port 5174
```

## Demo accounts (after seed)

| Username | Password | Role |
|----------|----------|------|
| `oww-admin` | `ChangeMe-OWW!` | `platform_admin` |
| `jenny` | `ChangeMe-OWW!` | `platform_admin` (NYSAWWA; email `jenny@nysawwa.org`) |
| `utility-admin1` | `ChangeMe-OWW!` | `utility_admin` (active membership — WW360 handoff) |
| OTP login | Use any seeded email; code logged to backend console in dev | individual / employer / educator |

### UI test — Water Workforce 360 handoff

1. Sign in as `utility-admin1` (or self-register at `/register/utility`).
2. Header shows **Workspace / Hiring / …** (role nav) plus **Explore** — not only public Jobs/Companies.
3. Open **Workspace → Dashboard** (`/employer`) → **Water Workforce 360**.
4. Or as Jenny (`jenny`): **Administration → Users & access** → Add user with role `utility_admin` + org, then grant complimentary membership under Memberships if needed.

Self-registration creates org + `utility_admin` + complimentary `utility_annual` membership and lands on `/employer`.

**Landing page + blog CMS (Jenny / platform_admin):** Administration → **Pages & blog** → Landing pages tab for home/pathway templates, or Blog tab for ongoing topics. Edit sections (hero, stats, cards, rich text, media gallery, quotes, CTAs), set author/tags/excerpt on posts, upload media, Publish. Home (`/ny`) and pathway slugs render published CMS pages; blog posts appear at `/ny/blog` and `/ny/blog/{slug}`.

Staging deploy + seed: `bash /opt/projects/workspace/scripts/oww/deploy-staging.sh` (seeds demo data). Integration smoke: `bash /opt/projects/workspace/scripts/oww-ww360/verify-e2e-integration.sh`.

## Ports (avoid WW360 collisions)

| Service | Host port |
|---------|-----------|
| Postgres | 5435 |
| Backend | 8003 |
| Frontend | 8083 |

## Documentation

- [Sitemap](docs/sitemap.md)
- [Functional specification](docs/functional-spec.md)
- [Data model](docs/data-model.md)
- [WCAG accessibility summary](docs/wcag-summary.md)

## Out of scope (follow-ups)

Live Stripe / LinkedIn / Facebook / LMS credentials, staging VM deploy, WW360 SSO handoff, push notifications.
