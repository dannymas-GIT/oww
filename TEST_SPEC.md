# TEST_SPEC — Utility self-registration + mock Stripe + optional NYSAWWA review

Branch: `feature/utility-self-registration`

## Scope

- Utility admin self-registration at `/register/utility` (stepper → sample Stripe checkout → success)
- Optional Jenny review queue (`/admin/registrations`) controlled by Platform settings toggle
- Suspend / reinstate locks hiring + WW360 entitlement (`account_suspended` / entitlement `canceled`)
- Utility team members invited on **WW360** (existing invite flow) after handoff — no OWW team-invite changes

## Manual checks (local or staging)

### A. Happy path (utility admin)

1. Open `/register/utility` (signed out).
2. Fill utility name, your name, work email, password, optional phone/website/title → **Continue to payment**.
3. Sample checkout (Step 2 of 3) — pay with `4242…` → success page “Your utility account is active”.
4. From success or `/employer`, open **Water Workforce 360** (requires WW360 entitlement configured).
5. In WW360 Users & access → **Invite user** → copy invite URL → accept as a new utility user.

### B. Jenny review queue

1. Sign in as `jenny` / `ChangeMe-OWW!`.
2. Administration → **Utility registrations** — seed rows `utility-pending1` (paid) and `utility-pending2` (unpaid) pending.
3. Dashboard KPI **Registrations awaiting review** links to `?status=pending_review`.
4. **Verify** a pending row; **Suspend** another with a required note; **Reinstate**.
5. As the suspended utility admin: `/employer` shows suspended banner; WW360 button returns `account_suspended`; MembershipGate locked surfaces.

### C. Review optional

1. Jenny → Administration → **Platform settings** → turn off “Review new utility registrations” → Save.
2. Register a new utility → completes payment → registration status `not_required` (not in Pending tab).
3. Turn review back on for demos.

### D. Pay later / resume

1. Register → on sample checkout choose **Pay later — go to your workspace**.
2. Employer dashboard shows **Finish your membership payment** with resume checkout link.
3. Complete payment → membership active.

## API smoke

```bash
curl -sS http://127.0.0.1:8003/health
curl -sS http://127.0.0.1:8003/api/v1/billing/plans | head -c 200
# After login as jenny, GET /api/v1/admin/registrations and /api/v1/admin/settings
```

## Notes

- WW360 caches **active** entitlement answers (~30 min). After suspend, OWW returns `canceled` immediately on entitlement; cached WW360 “active” may lag until TTL.
- Sample Stripe only when `STRIPE_SECRET_KEY` is empty.
- Complimentary membership is **not** auto-granted on register; Jenny can still comp from Users & access.

## Out of scope

- Live Stripe keys / webhooks in production
- Email verification of registrant address
- Employer (non-utility) self-registration
- WW360 repository changes
