import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { MembershipStatusPill } from '@/components/oww/MembershipStatusPill';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { cancelMembership, formatPrice, myMembership } from '@/services/billingService';
import { formatDate, titleCase } from '@/lib/format';
import type { BillingEventItem, Membership } from '@/types';

export default function BillingPage() {
  const { user } = useAuth();
  const [membership, setMembership] = useState<Membership | null>(null);
  const [events, setEvents] = useState<BillingEventItem[]>([]);
  const [sampleMode, setSampleMode] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    try {
      const r = await myMembership();
      setMembership(r.membership);
      setEvents(r.events ?? []);
      setSampleMode(r.sample_mode);
    } catch {
      setMembership(null);
    }
  }
  useEffect(() => {
    void load();
  }, []);

  const isOwner = membership?.user_id === user?.id;
  const active = membership && ['active', 'complimentary', 'past_due'].includes(membership.status);

  return (
    <div className="space-y-6">
      <OwwPageHero
        eyebrow="Account"
        title="Billing & membership"
        description="Your current plan, renewal date, and payment history."
        actions={
          <Button variant="outline" className="min-h-[44px] border-white/40 bg-white/10 text-base text-white hover:bg-white/20" asChild>
            <Link to="/profile">Back to profile</Link>
          </Button>
        }
      />
      {msg ? <p className="rounded-lg bg-emerald-50 p-3 text-base text-emerald-900">{msg}</p> : null}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card data-tour="billing-current">
          <CardHeader>
            <CardTitle className="font-display text-xl">Current membership</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-lg">
            {membership ? (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-display text-2xl font-semibold text-oww-navy">{membership.plan_name}</p>
                  <MembershipStatusPill status={membership.status} />
                </div>
                <dl className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm text-slate-500">Price</dt>
                    <dd>{formatPrice(membership.price_cents, 'year')}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-slate-500">{membership.cancel_at_period_end ? 'Access ends' : 'Renews'}</dt>
                    <dd>
                      {formatDate(membership.current_period_end)}
                      {membership.days_left != null && membership.days_left >= 0 ? (
                        <span className="ml-2 text-sm text-slate-500">({membership.days_left} days)</span>
                      ) : null}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-slate-500">Billing provider</dt>
                    <dd>{membership.provider === 'sample' ? 'Stripe (sample mode)' : titleCase(membership.provider)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-slate-500">Member since</dt>
                    <dd>{formatDate(membership.current_period_start || membership.created_at)}</dd>
                  </div>
                </dl>
                {!isOwner ? (
                  <p className="text-sm text-slate-500">This membership is held by your organization.</p>
                ) : null}
                <div className="flex flex-wrap gap-3 pt-2">
                  {!active || membership.status === 'past_due' ? (
                    <Button className="min-h-[44px] bg-oww-cyan text-base text-white hover:bg-sky-700" asChild>
                      <Link to="/pricing">{membership.status === 'past_due' ? 'Update payment' : 'Renew membership'}</Link>
                    </Button>
                  ) : null}
                  {active && !membership.cancel_at_period_end && (membership.price_cents ?? 0) > 0 ? (
                    <Button
                      variant="outline"
                      className="min-h-[44px] text-base"
                      disabled={busy}
                      onClick={async () => {
                        if (!window.confirm('Cancel at the end of the current period? You keep access until then.')) return;
                        setBusy(true);
                        try {
                          await cancelMembership();
                          setMsg('Your membership will end at the close of the current period.');
                          await load();
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      Cancel at period end
                    </Button>
                  ) : null}
                  <Button variant="ghost" className="min-h-[44px] text-base" asChild>
                    <Link to="/pricing">Compare plans</Link>
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-slate-700">You do not have a membership yet.</p>
                <Button className="min-h-[44px] bg-oww-cyan text-base text-white hover:bg-sky-700" asChild>
                  <Link to="/pricing">View plans</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-tour="billing-history">
          <CardHeader>
            <CardTitle className="font-display text-xl">Payment history</CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-base text-slate-600">No billing events yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {events.map(e => (
                  <li key={e.id} className="flex items-center justify-between gap-3 py-3 text-base">
                    <div>
                      <p className="font-medium text-slate-800">{titleCase(e.event_type.replace(/\./g, ' '))}</p>
                      <p className="text-sm text-slate-500">{formatDate(e.created_at)}</p>
                    </div>
                    <span className="font-semibold text-oww-navy">{e.amount_cents != null ? formatPrice(e.amount_cents) : '—'}</span>
                  </li>
                ))}
              </ul>
            )}
            {sampleMode ? <p className="mt-4 text-sm text-slate-500">Sample mode: transactions are simulated; no card is charged.</p> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
