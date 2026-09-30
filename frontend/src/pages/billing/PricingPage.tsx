import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Info } from 'lucide-react';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { formatPrice, listPlans, myMembership, startCheckout } from '@/services/billingService';
import type { Membership, MembershipPlan } from '@/types';
import { cn } from '@/lib/utils';

const AUDIENCE_EYEBROW: Record<string, string> = {
  individual: 'Job seekers & students',
  educator: 'Schools & trainers',
  employer: 'Consultants & industry',
  utility: 'Water & wastewater utilities',
};

export default function PricingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, activeStateCode } = useAuth();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [sampleMode, setSampleMode] = useState(true);
  const [current, setCurrent] = useState<Membership | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listPlans()
      .then(r => {
        setPlans(r.plans);
        setSampleMode(r.sample_mode);
      })
      .catch(() => setPlans([]));
    if (isAuthenticated) {
      myMembership().then(r => setCurrent(r.membership)).catch(() => setCurrent(null));
    }
  }, [isAuthenticated]);

  async function choose(plan: MembershipPlan) {
    setError(null);
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/pricing' } });
      return;
    }
    setBusy(plan.code);
    try {
      const res = await startCheckout(plan.code);
      if (res.mode === 'stripe' && res.url) {
        window.location.assign(res.url);
        return;
      }
      if (res.mode === 'free') {
        navigate('/billing/success?plan=' + plan.code);
        return;
      }
      navigate(res.url || `/billing/sample-checkout?session_id=${res.session_id}`);
    } catch {
      setError('We could not start checkout. Please try again.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-8">
      <OwwPageHero
        eyebrow="Membership"
        title="Choose the membership that fits your role"
        description="Job seekers, students and educators join free. Employer and Utility memberships fund the platform and unlock hiring tools."
        actions={
          <Button variant="outline" className="min-h-[44px] border-white/40 bg-white/10 text-base text-white hover:bg-white/20" asChild>
            <Link to={`/${activeStateCode}/hire`}>Back to I Want to Hire</Link>
          </Button>
        }
      />

      {sampleMode ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-base text-amber-900" data-tour="pricing-sample">
          <Info className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <p>
            <strong>Sample pricing.</strong> These amounts are placeholders for demonstration. Checkout runs in sample mode — no card is
            charged. NYSAWWA sets live rates in the Stripe Dashboard when going into production.
          </p>
        </div>
      ) : null}

      {error ? <p className="rounded-lg bg-rose-50 p-3 text-base text-rose-800">{error}</p> : null}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4" data-tour="pricing-plans">
        {plans.map((plan, idx) => {
          const isCurrent = current?.plan_code === plan.code && ['active', 'complimentary', 'past_due'].includes(current.status);
          const highlight = plan.audience === 'utility';
          return (
            <article
              key={plan.code}
              className={cn(
                'oww-rise flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',
                highlight ? 'border-oww-cyan ring-2 ring-oww-cyan/30' : 'border-slate-200'
              )}
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <p className="text-sm font-semibold uppercase tracking-wide text-oww-cyan">{AUDIENCE_EYEBROW[plan.audience] ?? plan.audience}</p>
              <h2 className="mt-1 font-display text-2xl font-semibold text-oww-navy">{plan.name}</h2>
              <p className="mt-2 min-h-[3rem] text-base text-slate-600">{plan.description}</p>
              <p className="mt-4 font-display text-4xl font-semibold text-oww-navy">
                {plan.price_cents === 0 ? 'Free' : formatPrice(plan.price_cents)}
                {plan.price_cents > 0 ? <span className="ml-1 text-lg font-normal text-slate-500">/ {plan.interval}</span> : null}
              </p>
              {plan.sample_pricing && plan.price_cents > 0 ? <p className="text-sm text-amber-700">Sample price</p> : null}
              <ul className="mt-5 flex-1 space-y-2">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-base text-slate-700">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                type="button"
                disabled={busy === plan.code || isCurrent}
                onClick={() => choose(plan)}
                className={cn(
                  'mt-6 min-h-[48px] w-full text-base',
                  highlight ? 'bg-oww-cyan text-white hover:bg-sky-700' : 'bg-oww-navy text-white hover:bg-[#003070]'
                )}
              >
                {isCurrent ? 'Current plan' : busy === plan.code ? 'Starting checkout…' : plan.price_cents === 0 ? 'Join free' : 'Subscribe'}
              </Button>
            </article>
          );
        })}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="font-display text-xl font-semibold text-oww-navy">How membership connects to WW360</h3>
        <p className="mt-2 text-lg leading-relaxed text-slate-700">
          Utility memberships use the same national → state → utility role tiers as Water Workforce 360. Utility administrators manage their
          managers and team members here, and the same accounts will federate to WW360 when single sign-on is enabled.
        </p>
      </section>
    </div>
  );
}
