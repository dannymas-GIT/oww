import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, Lock, ShieldCheck } from 'lucide-react';
import { OwwLogo } from '@/components/oww/OwwLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { completeSampleCheckout, formatPrice, sampleSession } from '@/services/billingService';
import type { Membership, MembershipPlan } from '@/types';

/**
 * Stand-in for Stripe Checkout when STRIPE_SECRET_KEY is not configured.
 * Mirrors the hosted page layout so the flow is demonstrable end-to-end.
 */
export default function SampleCheckoutPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = params.get('session_id') || '';
  const isRegisterFlow = params.get('flow') === 'register';
  const [plan, setPlan] = useState<MembershipPlan | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [card, setCard] = useState('4242 4242 4242 4242');
  const [exp, setExp] = useState('12 / 34');
  const [cvc, setCvc] = useState('123');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    sampleSession(sessionId)
      .then(r => {
        setPlan(r.plan);
        setMembership(r.membership);
        setName(r.membership.member_name || '');
      })
      .catch(() => setError('This checkout session could not be found.'));
  }, [sessionId]);

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const digits = card.replace(/\D/g, '');
      await completeSampleCheckout(sessionId, digits.slice(-4) || '4242');
      navigate(
        isRegisterFlow
          ? `/billing/success?flow=register&plan=${membership?.plan_code ?? 'utility_annual'}`
          : `/billing/success?plan=${membership?.plan_code ?? ''}`
      );
    } catch {
      setError('Payment could not be completed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.1fr_1fr]">
      <aside className="oww-rise rounded-2xl bg-oww-navy p-6 text-white sm:p-8">
        <OwwLogo size="footer" onDark />
        {isRegisterFlow ? (
          <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-[#7eb0ff]">Step 2 of 3 — Utility membership</p>
        ) : (
          <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-[#7eb0ff]">Subscribe to</p>
        )}
        <h1 className="mt-1 font-display text-3xl font-semibold">{plan?.name ?? 'Membership'} membership</h1>
        <p className="mt-4 font-display text-4xl font-semibold">
          {formatPrice(plan?.price_cents)}
          {plan?.price_cents ? <span className="ml-1 text-lg font-normal text-white/70">/ {plan.interval}</span> : null}
        </p>
        <p className="mt-2 text-base text-white/80">{plan?.description}</p>
        <ul className="mt-6 space-y-2">
          {(plan?.features ?? []).map(f => (
            <li key={f} className="flex items-start gap-2 text-base text-white/90">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" aria-hidden />
              {f}
            </li>
          ))}
        </ul>
        <p className="mt-8 text-sm text-white/60">Billed annually · Cancel any time from Billing &amp; membership · Sample mode, no real charge</p>
      </aside>

      <form onSubmit={pay} className="oww-rise space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8" style={{ animationDelay: '80ms' }}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold text-oww-navy">Payment details</h2>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
            <Lock className="h-4 w-4" aria-hidden /> Sample checkout
          </span>
        </div>
        {error ? <p className="rounded-lg bg-rose-50 p-3 text-base text-rose-800">{error}</p> : null}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-base">Name on card</Label>
          <Input id="name" className="min-h-[48px] text-base" value={name} onChange={e => setName(e.target.value)} autoComplete="cc-name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="card" className="text-base">Card number</Label>
          <div className="relative">
            <CreditCard className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden />
            <Input id="card" className="min-h-[48px] pl-11 text-base" inputMode="numeric" value={card} onChange={e => setCard(e.target.value)} autoComplete="cc-number" />
          </div>
          <p className="text-sm text-slate-500">Use Stripe's test card 4242 4242 4242 4242.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="exp" className="text-base">Expiry</Label>
            <Input id="exp" className="min-h-[48px] text-base" value={exp} onChange={e => setExp(e.target.value)} autoComplete="cc-exp" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cvc" className="text-base">CVC</Label>
            <Input id="cvc" className="min-h-[48px] text-base" inputMode="numeric" value={cvc} onChange={e => setCvc(e.target.value)} autoComplete="cc-csc" />
          </div>
        </div>
        <Button type="submit" disabled={busy || !sessionId || !plan} className="min-h-[52px] w-full bg-oww-cyan text-lg text-white hover:bg-sky-700">
          {busy ? 'Processing…' : `Pay ${formatPrice(plan?.price_cents)}`}
        </Button>
        <p className="text-center text-sm text-slate-500">
          {isRegisterFlow ? (
            <Link to="/employer" className="underline underline-offset-4">
              Pay later — go to your workspace
            </Link>
          ) : (
            <Link to="/pricing" className="underline underline-offset-4">
              Back to plans
            </Link>
          )}
        </p>
      </form>
    </div>
  );
}
