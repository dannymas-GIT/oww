# WCAG Accessibility Summary

**Target:** WCAG 2.1 Level AA

## Implemented

- Accessible type scale: body `text-lg` (1.125rem), UI controls ≥ `text-base`, captions ≥ `text-sm`
- Touch targets ≥ 44×44px on primary nav and actions
- Semantic landmarks via AppShell + page heroes
- Sortable table headers with sort affordances; filter counts (Filtered vs All)
- Distinct empty states for empty dataset vs no filter matches
- Keyboard-reachable form controls (Radix primitives)
- Playwright + axe-core smoke checks on public landing and admin analytics

## Follow-ups

- Full keyboard audit of map widgets
- Live screen-reader pass before production launch
- Consent banner if GA4 enabled on public host
