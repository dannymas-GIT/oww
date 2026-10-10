import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Lock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { myMembership } from '@/services/billingService';
import type { Membership } from '@/types';

const ACTIVE = new Set(['active', 'complimentary', 'past_due']);

/**
 * Wraps a paid hiring surface. Platform/state admins bypass. Everyone else must
 * hold an active employer/utility membership or they see the paywall card.
 */
export function MembershipGate({
  children,
  feature = 'this feature',
}: {
  children: ReactNode;
  feature?: string;
}) {
  const { isPlatformAdmin, isStateAdmin } = useAuth();
  const [state, setState] = useState<'loading' | 'ok' | 'locked' | 'suspended'>('loading');
  const [membership, setMembership] = useState<Membership | null>(null);

  useEffect(() => {
    if (isPlatformAdmin || isStateAdmin) {
      setState('ok');
      return;
    }
    let alive = true;
    myMembership()
      .then(res => {
        if (!alive) return;
        setMembership(res.membership);
        if (res.org_suspended) {
          setState('suspended');
          return;
        }
        const paidAudience =
          res.membership && ['employer_annual', 'utility_annual'].includes(res.membership.plan_code);
        setState(res.membership && ACTIVE.has(res.membership.status) && paidAudience ? 'ok' : 'locked');
      })
      .catch(() => alive && setState('locked'));
    return () => {
      alive = false;
    };
  }, [isPlatformAdmin, isStateAdmin]);

  if (state === 'loading') {
    return (
      <div className="flex min-h-[30vh] items-center justify-center text-lg text-slate-600">
        Checking your membership…
      </div>
    );
  }
  if (state === 'ok') return <>{children}</>;
  return <PaywallCard feature={feature} membership={membership} suspended={state === 'suspended'} />;
}

export function PaywallCard({
  feature,
  membership,
  suspended,
}: {
  feature: string;
  membership?: Membership | null;
  suspended?: boolean;
}) {
  const expired = membership && (membership.status === 'expired' || membership.status === 'canceled');
  return (
    <div className="oww-rise mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-start gap-4">
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-oww-navy text-white">
          <Lock className="h-6 w-6" aria-hidden />
        </span>
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-oww-cyan">
            {suspended ? 'Account suspended' : 'Membership required'}
          </p>
          <h2 className="font-display text-2xl font-semibold text-oww-navy">
            {suspended
              ? 'This utility is suspended'
              : expired
                ? 'Your membership has lapsed'
                : `Unlock ${feature}`}
          </h2>
          <p className="text-lg leading-relaxed text-slate-700">
            {suspended
              ? 'This utility account has been suspended. Hiring tools and Water Workforce 360 stay locked until the account is reinstated. Contact the platform team for your jurisdiction.'
              : expired
                ? `Your ${membership?.plan_name} membership ended. Renew to keep posting jobs, searching the resume bank, and messaging candidates.`
                : 'Employer and Utility memberships fund One Water Workforce and open job posting, candidate search, applicant tracking, and interview scheduling.'}
          </p>
        </div>
      </div>
      {!suspended ? (
        <>
          <ul className="mt-6 grid gap-2 text-base text-slate-700 sm:grid-cols-2">
            {[
              'Unlimited job postings',
              'Candidate search & resume bank',
              'Applicant tracking & messaging',
              'Match digests to your inbox',
            ].map(f => (
              <li key={f} className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" aria-hidden />
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button className="min-h-[44px] bg-oww-cyan text-base text-white hover:bg-sky-700" asChild>
              <Link to="/pricing">
                <CreditCard className="mr-2 h-5 w-5" aria-hidden />
                {expired ? 'Renew membership' : 'View membership plans'}
              </Link>
            </Button>
            <Button variant="outline" className="min-h-[44px] text-base" asChild>
              <Link to="/billing">Billing &amp; membership</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Sample checkout is enabled on this environment — no card is charged.
          </p>
        </>
      ) : null}
    </div>
  );
}
