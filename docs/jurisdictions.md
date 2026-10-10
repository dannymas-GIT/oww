# Multi-state jurisdictions

One Water Workforce is a **national product** with per-state microsites at `/{state}` (e.g. `/ny`, `/nj`, `/ct`). Adding a state is **config + content**, not a code rewrite.

## Architecture

| Layer | Role |
|-------|------|
| **Pack** (`backend/app/jurisdictions/packs/{code}.py`) | Versioned defaults: partner, regulators, certification ladder, regions, map bounds, copy tokens |
| **DB** (`jurisdictions` table) | Admin overrides; `ensure_jurisdictions()` fills nulls from packs without clobbering edits |
| **API** | `GET /jurisdictions`, `GET /jurisdictions/{state}`, `GET /jurisdictions/{state}/certifications` |
| **Frontend** | `JurisdictionProvider` + `useJurisdiction()` localize public copy and chrome |

Default jurisdiction when callers omit `state_code`: env `OWW_DEFAULT_JURISDICTION` (default `NY`) via `app.jurisdictions.default_code()`.

## Add a state in 5 steps

1. **Write a pack** — copy `packs/nj.py` → `packs/xx.py`; register in `registry.py` `_PACKS`.
2. **Certification ladder** — list levels in the pack; seed fills `certification_catalog`.
3. **Optional map overlay** — add GeoJSON under `frontend/public/maps/` and set `map.overlay_url` (omit for list-only regions).
4. **Optional CMS home** — `ensure_default_home_page(db, state_code="XX")` runs on seed.
5. **Activate** — pack seed sets `is_active=True`; flip off in Administration → Jurisdictions if needed.

Re-seed: `POSTGRES_HOST=127.0.0.1 POSTGRES_PORT=5435 PYTHONPATH=backend backend/.venv/bin/python backend/scripts/seed_demo.py`

## Nuance matrix (NY · NJ · CT)

| Topic | New York | New Jersey | Connecticut |
|-------|----------|------------|-------------|
| Lead partner | NYSAWWA (contracted) | AWWA NJ (section) | CTAWWA (section) |
| Drinking water regulator | NYSDOH | NJDEP | CT DPH Drinking Water Section |
| Wastewater regulator | NYSDEC (+ NYWEA exams) | NJDEP (same Board) | CT DEEP |
| Cert schema | Grades A–D / IA–IVA; WW 1–4A | T/W/S/C/N classes 1–4 + VSWS | WTP I–IV, DS I–III, SWS; WW I–IV |
| Geography | 62 counties · 10 NYSAWWA economic regions | 21 counties · 3 WIOA regions | **No counties** · 9 COG planning regions (towns) |
| Exam cadence | Scheduled (DOH/DEC) | Continuous (PSI/ABC) | DEEP annual Oct–Sep window |
| Affiliations | NYWEA | NJWEA | CTWEA + New England Work for Water |

## AuthZ notes

- `platform_*` staff see all states.
- `state_admin` is confined to `user.state_code` (`app.core.scoping.scope_state`).
- Public copy never hardcodes NYSAWWA for non-contracted packs — use `{partner_short}` / jurisdiction tokens.

## Out of scope (for now)

- Custom domains per state
- Per-state Stripe price catalogs
- Non-English content
