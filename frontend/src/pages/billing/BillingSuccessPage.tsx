import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { myMembership } from '@/services/billingService';
import { openWaterWorkforce360 } from '@/services/ww360Service';
import { formatDate } from '@/lib/format';
import type { Membership } from '@/types';

export default function BillingSuccessPage() {
  const [params] = useSearchParams();
  const { hasAnyRole, isUtilityAdmin, canManageUsers } = useAuth();
  const [membership, setMembership] = useState<Membership | null>(null);
  const [ww360Busy, setWw360Busy] = useState(false);
  const [ww360Error, setWw360Error] = useState<string | null>(null);
  const isRegisterFlow = params.get('flow') === 'register';
  const reviewNote = params.get('review') === '1';

  useEffect(() => {
    myMembership().then(r => setMembership(r.membership)).catch(() => setMembership(null));
  }, [params]);

  const hiring = hasAnyRole('employer', 'employer_admin', 'employer_member', 'utility_admin', 'utility_manager');
  const canOpenWw360 = Boolean(isUtilityAdmin || canManageUsers);

  async function handleWw360() {
    setWw360Busy(true);
    setWw360Error(null);
    try {
      const result = await openWaterWorkforce360();
      window.location.assign(result.redirect_url);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
      const code =
        typeof detail === 'object' && detail && 'code' in detail ? String((detail as { code: string }).code) : null;
      if (code === 'account_suspended') {
        setWw360Error('This utility account has been suspended. Contact NYSAWWA.');
      } else if (code === 'payment_required') {
        setWw360Error('Payment is required before opening Water Workforce 360.');
      } else {
        setWw360Error('Could not open Water Workforce 360. Try again from your hiring workspace.');
      }
      setWw360Busy(false);
    }
  }

  return (
    <div className="oww-rise mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <CheckCircle2 className="h-9 w-9" aria-hidden />
      </span>
      <h1 className="mt-5 font-display text-3xl font-semibold text-oww-navy">
        {isRegisterFlow ? 'Your utility account is active' : "You're a member"}
      </h1>
      <p className="mt-3 text-lg text-slate-700">
        {membership
          ? `Your ${membership.plan_name} membership is ${membership.status === 'complimentary' ? 'active (complimentary)' : 'active'}${
              membership.current_period_end ? ` through ${formatDate(membership.current_period_end)}` : ''
            }.`
          : 'Your membership is being confirmed.'}
      </p>
      {isRegisterFlow ? (
        <p className="mt-3 text-base text-slate-600">
          Invite utility managers and team members from Water Workforce 360 after you open it.
          {reviewNote
            ? ' NYSAWWA may review new utility registrations; you can use the platform while that review is in progress.'
            : ''}
        </p>
      ) : null}
      {ww360Error ? <p className="mt-4 rounded-lg bg-amber-50 p-3 text-base text-amber-950">{ww360Error}</p> : null}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {isRegisterFlow && canOpenWw360 ? (
          <Button
            className="min-h-[48px] bg-oww-navy text-base text-white hover:bg-[#003070]"
            disabled={ww360Busy}
            onClick={() => void handleWw360()}
          >
            {ww360Busy ? 'Opening…' : 'Open Water Workforce 360'}
          </Button>
        ) : null}
        {hiring ? (
          <Button className="min-h-[48px] bg-oww-cyan text-base text-white hover:bg-sky-700" asChild>
            <Link to={isRegisterFlow ? '/employer' : '/employer/jobs'}>
              {isRegisterFlow ? 'Go to hiring workspace' : 'Post a job'}
            </Link>
          </Button>
        ) : null}
        <Button variant="outline" className="min-h-[48px] text-base" asChild>
          <Link to="/billing">Billing &amp; membership</Link>
        </Button>
      </div>
    </div>
  );
}
