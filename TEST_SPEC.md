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

---

# Social syndication (blog → LinkedIn aggregator + widgets)

Branch: `feature/social-syndication`

## Scope

- Admin **Social posts** (`/admin/social`): compose once, publish via Ayrshare (or stub when `AYRSHARE_API_KEY` empty)
- Blog editor **Share to social** after publish; optional auto-share toggle in Platform settings
- Public JSON blog list includes canonical `url`; RSS at `/api/v1/public/blog/{state}/feed.rss`
- WW360 / AquaSafe dashboard widgets consume the public blog JSON (separate repos)

## Manual checks

1. Sign in as Jenny → Administration → **Social posts**.
2. Status shows provider `stub` (or `ayrshare` live when key is set).
3. Pick a published blog post (or free-form), confirm LinkedIn checked, **Publish now** → history shows `posted`.
4. Open a blog post in the CMS editor → **Publish** → **Share to social** opens composer with message prefilled.
5. Platform settings → enable **Auto-share blog posts on publish** → publish a new blog → confirm a social history row appears.
6. `curl -sS http://127.0.0.1:8003/api/v1/public/blog/NY | head` — items include `url`.
7. `curl -sS http://127.0.0.1:8003/api/v1/public/blog/NY/feed.rss | head` — RSS channel XML.

## Automated

```bash
cd backend && pytest tests/test_social.py -q
```

## Notes

- Real LinkedIn posting requires an Ayrshare account with the NYSAWWA/OWW LinkedIn page connected and `AYRSHARE_API_KEY` in host `.env`.
- Default platform is LinkedIn; Jenny can toggle others that are connected on the provider.
- Config UI: **Platform settings → Social publishing** and **Communications → Social posts** show stub vs live and setup steps when the key is missing.

---

# Communications studio — marketing, TipTap, templates

Branch: `feature/comms-marketing-studio`

## Scope

- Communications hub links: Member messages, Marketing & SEO, Social, Blog
- TipTap editor for email bodies and CMS rich-text / blog sections
- Templates for email, SMS, blog, social, SEO briefs
- Marketing efforts board (SEO keywords, channel, send method, status)

## Manual checks

1. Admin → Communications → compose with TipTap; apply “Welcome — new utility” template → Send/draft.
2. Admin → Marketing & SEO → create an SEO brief from template → Activate.
3. Admin → Pages & blog → open a blog post → apply blog template → TipTap body → Publish / Share to social.
4. Platform settings → Social publishing shows optional Ayrshare setup card while stub.
