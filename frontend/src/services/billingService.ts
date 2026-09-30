import { api } from '@/lib/api';
import type { BillingEventItem, CheckoutResult, Membership, MembershipPlan } from '@/types';

export async function listPlans() {
  const { data } = await api.get('/billing/plans');
  return data as { plans: MembershipPlan[]; sample_mode: boolean; publishable_key: string | null };
}

export async function myMembership() {
  const { data } = await api.get('/billing/me');
  return data as { membership: Membership | null; events?: BillingEventItem[]; sample_mode: boolean };
}

export async function startCheckout(plan_code: string) {
  const { data } = await api.post('/billing/checkout', { plan_code });
  return data as CheckoutResult;
}

export async function sampleSession(session_id: string) {
  const { data } = await api.get(`/billing/sample-session/${encodeURIComponent(session_id)}`);
  return data as { membership: Membership; plan: MembershipPlan | null };
}

export async function completeSampleCheckout(session_id: string, card_last4: string) {
  const { data } = await api.post('/billing/sample/complete', { session_id, card_last4 });
  return data as { membership: Membership };
}

export async function cancelMembership() {
  const { data } = await api.post('/billing/cancel');
  return data as { membership: Membership };
}

export function formatPrice(cents?: number | null, interval?: string) {
  if (cents == null) return '—';
  if (cents === 0) return 'Free';
  const dollars = (cents / 100).toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  return interval ? `${dollars} / ${interval}` : dollars;
}

/** True when an API error is the 402 paywall response. */
export function isMembershipRequired(err: unknown): boolean {
  const e = err as { response?: { status?: number; data?: { detail?: { code?: string } } } };
  return e?.response?.status === 402 || e?.response?.data?.detail?.code === 'membership_required';
}
