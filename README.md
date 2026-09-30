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
| `ny-state-admin` | `ChangeMe-OWW!` | `state_admin` |
| OTP login | Use any seeded email; code logged to backend console in dev | individual / employer / educator |

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
