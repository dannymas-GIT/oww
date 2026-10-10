# Jurisdictions (multi-tenant scaffolding)

One Water Workforce is a **NYSAWWA-sponsored New York program** first. The same stack is built as a **multi-tenant platform** so other state sections or regional collaboratives can adopt it later — not so NYSAWWA “owns” a national brand.

**Do not confuse with** [workforwater.org](https://workforwater.org) (AWWA + WEF national awareness portal). OWW’s gap is an operating system: pathways, hiring, membership, CMS microsites, cert ladders, WW360 handoff.

## Positioning

| Claim | Status |
|-------|--------|
| NY microsite (`/ny`) live under NYSAWWA | **Yes** — contracted flagship |
| Empty or partner-vacuum state sites under OWW | **No** — scaffold packs stay `is_active=false` |
| Rebrand OWW as national Work for Water | **No** — collides with AWWA/WEF |
| Platform + federation (sections/collaboratives as tenants) | **Target** when MOU / paying partner exists |

## Architecture

| Layer | Role |
|-------|------|
| **Pack** (`backend/app/jurisdictions/packs/{code}.py`) | Versioned defaults: partner, regulators, certification ladder, regions, map, copy tokens, `kind` (state\|region), `default_active` |
| **DB** (`jurisdictions` table) | Admin overrides; `ensure_jurisdictions()` fills nulls; scaffold tenants are deactivated on seed |
| **API** | `GET /jurisdictions` (active only), `GET /jurisdictions/{state}` (404 if inactive), certifications |
| **Frontend** | `JurisdictionProvider` — invalid/inactive `:state` redirects to `/ny` |

Default when callers omit `state_code`: env `OWW_DEFAULT_JURISDICTION` (default `NY`).

### Activation rule

A pack is **public** only when `partner.contracted` **or** `default_active` is true (and DB `is_active`). Today only **NY** qualifies. NJ, CT, and **NE** (New England region) are scaffolding for demos and future MOUs — Administration → Jurisdictions can flip Active when a partner is real.

### Prefer region tenants over thin states

New England runs a **six-state Collaborative** (NEWEA/NEWWA). Prefer one **`NE` region pack** (`kind=region`, `member_state_codes`) over six empty state microsites. CT pack remains for cert/regulator detail if CT ever needs a child site under an MOU.

## Add a tenant (when a partner is real)

1. Write or update a pack (`packs/xx.py`); register in `registry.py`.
2. Set `default_active=True` **only** with contracted/`partner.contracted` or an explicit MOU decision.
3. Certification ladder + optional map overlay + CMS home via seed.
4. Admin: confirm Active; seed personas / sample orgs as needed.

Re-seed: `POSTGRES_HOST=127.0.0.1 POSTGRES_PORT=5435 PYTHONPATH=backend backend/.venv/bin/python backend/scripts/seed_demo.py`

## Pack inventory

| Code | Kind | Public by default | Partner posture |
|------|------|-------------------|-----------------|
| NY | state | Yes | NYSAWWA contracted |
| NJ | state | No | AWWA NJ section — pilot candidate |
| CT | state | No | Prefer NE region; CT cert detail only |
| NE | region | No | New England Work for Water Collaborative |

## Nuance matrix (reference)

| Topic | New York | New Jersey | Connecticut | New England (region) |
|-------|----------|------------|-------------|----------------------|
| Lead partner | NYSAWWA (contracted) | AWWA NJ | CTAWWA | NEWEA/NEWWA Collaborative |
| DW / WW regulators | NYSDOH / NYSDEC | NJDEP (both) | CT DPH / CT DEEP | Member-state agencies |
| Cert schema | Grades A–D, IA–IVA; WW 1–4A | T/W/S/C/N 1–4 + VSWS | WTP I–IV, DS I–III, SWS; WW I–IV | Per-member (no single ladder) |
| Geography | 10 economic regions | 3 WIOA regions | 9 COG planning regions | 6 states as “regions” |
| Public site | `/ny` | scaffold | scaffold | scaffold `/ne` when activated |

## AuthZ

- `platform_*` staff see all tenants (including inactive) in admin.
- `state_admin` confined to `user.state_code`.
- Public copy uses `{partner_short}` — never claim NYSAWWA for non-NY tenants.

## Out of scope (for now)

- Custom domains per tenant
- Per-tenant Stripe catalogs
- 50-state microsites without partners
- Non-English content

See also: [docs/pilot-partners.md](pilot-partners.md).
