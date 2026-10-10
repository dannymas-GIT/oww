# Pilot partner shortlist (post-NY)

Realistic next tenants for the OWW **platform** — not candidates for NYSAWWA to brand as “national OWW.” Activate a pack only with MOU / funding / operational owner.

## Priority order

| Rank | Partner | Tenant shape | Why | Pack fields already encoded | Gaps before go-live |
|------|---------|--------------|-----|----------------------------|---------------------|
| 1 | **New England Work for Water Collaborative** (NEWEA / NEWWA + state associations) | **Region** `NE` | Matches how they organize; one site beats six thin states; CT already points here | `packs/ne.py`: partner, 6 member states as regions, affiliations, map bounds, copy tokens | Charter/MOU; who pays Stripe/membership; per-state cert deep-links; content owner; whether CT pack stays nested-only |
| 2 | **AWWA New Jersey Section** (+ NJWEA) | **State** `NJ` | Adjacent to NY; dense utilities; single NJDEP regulator simplifies cert UX | `packs/nj.py`: NJDEP, T/W/S/C/N+VSWS ladder, North/Central/South regions | Section board buy-in; Jenny/NYSAWWA intro path; sample utilities vs real PWS list; no contracted training partner yet |
| 3 | **BAYWORK** (SF Bay) or **IEWorks** (Inland Empire) | **Region** (new pack, e.g. `BA` / `IE`) | National model for utility collaboratives; CA High Road / CMUA adjacency | *Not packed yet* — reuse region `kind`, multi-utility org model, WW360 handoff | New pack + CA cert schema; collaborative governance; likely separate from AWWA section politics |
| 4 | **CMUA** statewide workforce program (CA) | **State** `CA` or multi-region | Funding + playbook already exist; scale beyond one metro | Needs new pack | Large geography; energy/water mix; don’t start here without BAYWORK/IEWorks learning |
| — | **TAWWA SETH** (TX) / **FSAWWA** pipelines (FL) | State | Strong HS→operator stories | Needs new packs | Section-owned programs; good *content* partners before full tenant |

## Explicit non-goals

- Pitching OWW as a replacement for **workforwater.org**
- Activating NJ/CT/NE public URLs without a named partner owner
- NYSAWWA as the brand for non-NY tenants

## Activation checklist (any pilot)

1. Named org + contact (section ED, collaborative chair, or utility collaborative staff)
2. MOU or paid pilot scope (content, membership, support)
3. Pack: `default_active` / `partner.contracted` + Admin **Active**
4. Cert ladder + regulator links reviewed by partner
5. Seed/demo personas for their `state_admin` (or region admin)
6. Public copy reviewed — no NYSAWWA lockup leakage
7. Optional: WW360 district handoff story for their utilities

## Mapping to product surfaces

| Pack field | Partner conversation |
|------------|----------------------|
| `partner.*` | Logo, short name, contact label, contracted flag |
| `regulators[]` | Who licenses operators; exam calendar links |
| `certification_ladders[]` | Exact class/grade names for Career/Educate |
| `regions[]` / `kind` | Economic vs WIOA vs COG vs member-states |
| `member_state_codes` | Region tenants only (NE) |
| `copy_tokens` / CMS | Mission stats, support line — partner-owned facts |
| `map` | Bounds; GeoJSON only if they care about choropleth |

## Suggested next conversation (Jenny)

1. Confirm NY stays flagship positioning in any external deck.
2. Ask whether **New England Collaborative** or **AWWA NJ** is the warmer intro for a 2026–27 pilot.
3. Keep `/nj` `/ct` `/ne` **off** public until that answer has a written owner.
