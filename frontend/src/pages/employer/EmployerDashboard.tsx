import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { OwwKpiTile } from '@/components/oww/OwwKpiTile';
import { MembershipStatusPill } from '@/components/oww/MembershipStatusPill';
import { SampleDataBanner } from '@/components/oww/SampleDataBanner';
import { Ww360LaunchButton } from '@/components/oww/Ww360LaunchButton';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useSamplePack } from '@/hooks/useSamplePack';
import { myMembership } from '@/services/billingService';
import { listMyJobs } from '@/services/jobService';
import { formatDate } from '@/lib/format';
import type { Membership } from '@/types';

export default function EmployerDashboard() {
  const { user, isUtilityAdmin, isUtilityManager, isEmployer } = useAuth();
  const sample = useSamplePack();
  const displayName = user?.full_name?.trim() || user?.username;
  const [membership, setMembership] = useState<Membership | null | undefined>(undefined);
  const [orgSuspended, setOrgSuspended] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [jobCount, setJobCount] = useState<number | null>(null);

  useEffect(() => {
    myMembership()
      .then(r => {
        setMembership(r.membership);
        setOrgSuspended(Boolean(r.org_suspended));
        setCheckoutUrl(r.checkout_url || null);
      })
      .catch(() => {
        setMembership(null);
        setOrgSuspended(false);
        setCheckoutUrl(null);
      });
    listMyJobs().then(j => setJobCount(j.length)).catch(() => setJobCount(null));
  }, []);

  const active = membership && ['active', 'complimentary', 'past_due'].includes(membership.status);
  const pendingPay = membership?.status === 'pending' || (!membership && Boolean(checkoutUrl));
  const eyebrow = isUtilityAdmin ? 'Utility administrator' : isUtilityManager ? 'Utility manager' : 'Employer';

  return (
    <div className="space-y-6">
      <OwwPageHero
        eyebrow={eyebrow}
        title={displayName ? `Welcome, ${displayName}` : 'Hiring workspace'}
        description="Manage your organization profile, jobs, applications, and candidate conversations."
        badges={membership ? <MembershipStatusPill status={membership.status} className="bg-white/10 text-white ring-white/30" /> : null}
        actions={
          <Button className="min-h-[44px] bg-oww-cyan text-base text-white hover:bg-sky-700" asChild>
            <Link to="/employer/jobs">Manage jobs</Link>
          </Button>
        }
      />

      {sample.status?.sample_pack_active ? (
        <SampleDataBanner
          clearing={sample.clearing}
          onClear={async () => {
            await sample.clear();
            try {
              setJobCount((await listMyJobs()).length);
            } catch {
              /* ignore */
            }
          }}
        />
      ) : null}

      {orgSuspended ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 p-5">
          <div>
            <p className="font-display text-xl font-semibold text-rose-950">Account suspended</p>
            <p className="mt-1 text-base text-rose-900">
              NYSAWWA has suspended this utility. Hiring tools and Water Workforce 360 are locked until your
              account is reinstated. Contact NYSAWWA for help.
            </p>
          </div>
        </div>
      ) : null}

      {!orgSuspended && pendingPay ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div>
            <p className="font-display text-xl font-semibold text-amber-950">Finish your membership payment</p>
            <p className="mt-1 text-base text-amber-900">
              Complete the Utility membership checkout to unlock job posting, candidate search, and Water Workforce 360.
            </p>
          </div>
          <Button className="min-h-[44px] bg-oww-navy text-base text-white hover:bg-[#003070]" asChild>
            <Link to={checkoutUrl || '/pricing'}>Continue to payment</Link>
          </Button>
        </div>
      ) : null}

      {membership === undefined || orgSuspended || pendingPay ? null : !active ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div>
            <p className="font-display text-xl font-semibold text-amber-950">{membership ? 'Your membership has lapsed' : 'Activate a membership to post jobs'}</p>
            <p className="mt-1 text-base text-amber-900">
              {membership
                ? `${membership.plan_name} ended ${formatDate(membership.current_period_end)}. Renew to restore job posting and candidate search.`
                : 'Employer and Utility plans unlock job posting, candidate search, applicant tracking and interviews.'}
            </p>
          </div>
          <Button className="min-h-[44px] bg-oww-navy text-base text-white hover:bg-[#003070]" asChild>
            <Link to="/pricing">{membership ? 'Renew now' : 'See plans'}</Link>
          </Button>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-tour="employer-membership">
        <OwwKpiTile
          label="Membership"
          value={membership ? membership.plan_name : 'None'}
          hint={
            membership?.current_period_end
              ? `${!active ? 'Ended' : membership.cancel_at_period_end ? 'Ends' : 'Renews'} ${formatDate(membership.current_period_end)}`
              : 'Choose a plan to unlock hiring tools'
          }
        />
        <OwwKpiTile label="Open roles" value={jobCount ?? '—'} hint="Postings your organization manages" />
        <OwwKpiTile label="Pipeline" value="Apps" hint="Applications & interviews" />
        <OwwKpiTile label="Outreach" value="Messages" hint="Candidate conversations" />
      </div>

      <div className="flex flex-wrap gap-3" data-tour="employer-actions">
        {!orgSuspended ? <Ww360LaunchButton variant="inline" /> : null}
        {isUtilityAdmin && !orgSuspended ? (
          <Ww360LaunchButton
            variant="inline"
            next="/admin/users?invite=1"
            label="Invite staff in WW360"
          />
        ) : null}
        <Button variant="outline" className="min-h-[44px] text-base" asChild>
          <Link to="/employer/candidates">Search candidates</Link>
        </Button>
        <Button variant="outline" className="min-h-[44px] text-base" asChild>
          <Link to="/employer/interviews">Interviews</Link>
        </Button>
        {isEmployer ? (
          <Button variant="outline" className="min-h-[44px] text-base" asChild>
            <Link to="/employer/team">Manage team</Link>
          </Button>
        ) : null}
        {isUtilityAdmin || isUtilityManager ? (
          <Button variant="outline" className="min-h-[44px] text-base" asChild>
            <Link to="/employer/org">Utility profile</Link>
          </Button>
        ) : null}
        <Button variant="ghost" className="min-h-[44px] text-base" asChild>
          <Link to="/billing">Billing &amp; membership</Link>
        </Button>
      </div>

      {orgSuspended ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-base text-amber-950">
          This utility account has been suspended by NYSAWWA. Contact them to restore Water Workforce 360
          access.
        </div>
      ) : null}
    </div>
  );
}
