import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Building2, ClipboardList, CreditCard, LogIn, Mail, Users } from 'lucide-react';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { OwwKpiTile } from '@/components/oww/OwwKpiTile';
import { OwwEmptyState } from '@/components/oww/OwwEmptyState';
import { MembershipStatusPill } from '@/components/oww/MembershipStatusPill';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/context/AuthContext';
import { fetchAdminDashboard } from '@/services/adminService';
import { formatPrice } from '@/services/billingService';
import { formatDate, formatDateTime, formatNumber, titleCase } from '@/lib/format';
import type { AdminDashboard } from '@/types';

export default function AdminDashboardPage() {
  const { isPlatformAdmin } = useAuth();
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminDashboard()
      .then(setData)
      .catch(() => setError('Could not load the dashboard.'));
  }, []);

  const m = data?.memberships;

  return (
    <div className="space-y-6">
      <OwwPageHero
        eyebrow="Administration"
        title={isPlatformAdmin ? 'Platform dashboard' : 'State dashboard'}
        description="Memberships, renewals, accounts and outreach at a glance."
        badges={data?.sample_mode ? <span className="rounded-full bg-amber-400/20 px-3 py-1 text-amber-100 ring-1 ring-amber-300/40">Stripe sample mode</span> : null}
        actions={
          <>
            <Button className="min-h-[44px] bg-oww-cyan text-base text-white hover:bg-sky-700" asChild>
              <Link to="/admin/communications">
                <Mail className="mr-2 h-5 w-5" aria-hidden />
                Communications
              </Link>
            </Button>
            <Button variant="outline" className="min-h-[44px] border-white/40 bg-white/10 text-base text-white hover:bg-white/20" asChild>
              <Link to="/admin/users">Users &amp; access</Link>
            </Button>
          </>
        }
      />

      {error ? <p className="rounded-lg bg-rose-50 p-3 text-base text-rose-800">{error}</p> : null}

      <section aria-label="Membership KPIs" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" data-tour="admin-kpis">
        <OwwKpiTile
          label="Active memberships"
          value={formatNumber(m?.active_total)}
          hint={m ? `${m.counts.active ?? 0} paid · ${m.counts.complimentary ?? 0} comp · ${m.counts.past_due ?? 0} past due` : undefined}
          icon={<CreditCard className="h-5 w-5 text-oww-cyan" aria-hidden />}
        />
        <OwwKpiTile
          label="Expiring in 30 days"
          value={formatNumber(m?.expiring_30)}
          hint={m ? `${m.expiring_60} within 60 days` : undefined}
          icon={<AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden />}
          className={m && m.expiring_30 > 0 ? 'border-amber-200' : undefined}
        />
        <OwwKpiTile
          label="Expired (90 days)"
          value={formatNumber(m?.recently_expired_90)}
          hint={m ? `${m.counts.expired ?? 0} expired total · ${m.counts.canceled ?? 0} canceling` : undefined}
          icon={<AlertTriangle className="h-5 w-5 text-rose-500" aria-hidden />}
        />
        <OwwKpiTile
          label="Annual recurring (sample)"
          value={m ? formatPrice(m.arr_cents) : '—'}
          hint={m ? m.by_plan.map(p => `${p.count} ${p.plan_name}`).join(' · ') || 'No active plans' : undefined}
          icon={<CreditCard className="h-5 w-5 text-emerald-600" aria-hidden />}
        />
      </section>

      <section aria-label="Account KPIs" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OwwKpiTile label="Accounts" value={formatNumber(data?.users_total)} hint={data ? `${data.users_active} active · ${data.users_new_30} new in 30 days` : undefined} icon={<Users className="h-5 w-5 text-oww-cyan" aria-hidden />} />
        <OwwKpiTile label="Organizations" value={formatNumber(data?.organizations)} hint="Utilities, employers, educators" icon={<Building2 className="h-5 w-5 text-oww-cyan" aria-hidden />} />
        <OwwKpiTile
          label="Logins (30d)"
          value={formatNumber(data?.logins?.logins_30d)}
          hint={
            data?.logins
              ? `${data.logins.logins_today} today · ${data.logins.unique_users_30d} unique · ${data.logins.failed_30d} failed`
              : undefined
          }
          icon={<LogIn className="h-5 w-5 text-oww-cyan" aria-hidden />}
        />
        {data?.utility_registration_review_required !== false ? (
          <Link to="/admin/registrations?status=pending_review" className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-oww-cyan">
            <OwwKpiTile
              label="Registrations awaiting review"
              value={formatNumber(data?.registrations_pending)}
              hint="Self-registered utilities · click to review"
              icon={<ClipboardList className="h-5 w-5 text-amber-600" aria-hidden />}
              className={(data?.registrations_pending ?? 0) > 0 ? 'border-amber-200' : undefined}
            />
          </Link>
        ) : (
          <OwwKpiTile label="Engagement events (30d)" value={formatNumber(data?.engagement_events_30)} hint="Interest → employment pipeline" />
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm" data-tour="admin-expiring">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold text-oww-navy">Expiring soon</h2>
            <Button variant="ghost" className="min-h-[44px] text-base" asChild>
              <Link to="/admin/memberships?expiring_days=60">
                All memberships <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>
          {!data ? (
            <p className="py-8 text-center text-base text-slate-500">Loading…</p>
          ) : data.expiring_soon.length === 0 ? (
            <OwwEmptyState title="Nothing expiring in the next 30 days" className="mt-3 py-8" />
          ) : (
            <div className="mt-3 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-sm font-semibold">Member</TableHead>
                    <TableHead className="text-sm font-semibold">Plan</TableHead>
                    <TableHead className="text-sm font-semibold">Status</TableHead>
                    <TableHead className="text-right text-sm font-semibold">Ends</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.expiring_soon.map(row => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <p className="text-base font-medium">{row.member_name || '—'}</p>
                        <p className="text-sm text-slate-500">{row.member_email}</p>
                      </TableCell>
                      <TableCell className="text-base">{row.plan_name}</TableCell>
                      <TableCell>
                        <MembershipStatusPill status={row.status} />
                      </TableCell>
                      <TableCell className="text-right text-base">
                        {formatDate(row.current_period_end)}
                        <span className="block text-sm text-slate-500">{row.days_left} days</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm" data-tour="admin-logins">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-xl font-semibold text-oww-navy">Recent logins</h2>
              <Button variant="ghost" className="min-h-[44px] text-base" asChild>
                <Link to="/admin/logins">
                  Full activity <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </div>
            {!data ? null : (data.recent_logins ?? []).length === 0 ? (
              <p className="mt-3 text-base text-slate-600">No sign-ins recorded yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100">
                {(data.recent_logins ?? []).map(ev => (
                  <li key={ev.id} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-medium text-slate-800">
                        {ev.user_name || ev.identifier}
                      </p>
                      <p className="text-sm text-slate-500">
                        {titleCase(ev.method)} · {formatDateTime(ev.created_at)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-sm font-semibold ${
                        ev.success ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
                      }`}
                    >
                      {ev.success ? 'OK' : 'Fail'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-xl font-semibold text-oww-navy">Recent communications</h2>
              <Button variant="ghost" className="min-h-[44px] text-base" asChild>
                <Link to="/admin/communications">Open portal</Link>
              </Button>
            </div>
            {!data ? null : data.recent_communications.length === 0 ? (
              <p className="mt-3 text-base text-slate-600">No messages yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100">
                {data.recent_communications.map(c => (
                  <li key={c.id} className="py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-base font-medium text-slate-800">{c.subject}</p>
                      <span className={`rounded-full px-2.5 py-0.5 text-sm font-semibold ${c.status === 'sent' ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-100 text-slate-700'}`}>
                        {titleCase(c.status)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">
                      {c.status === 'sent' ? `${c.recipient_count} recipients · ${formatDate(c.sent_at)}` : `Draft · ${formatDate(c.created_at)}`}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="font-display text-xl font-semibold text-oww-navy">Accounts by role</h2>
            <ul className="mt-3 grid grid-cols-2 gap-2">
              {(data?.users_by_role ?? []).map(r => (
                <li key={r.role} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-base">
                  <span className="text-slate-700">{titleCase(r.role)}</span>
                  <span className="font-semibold text-oww-navy">{r.count}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
