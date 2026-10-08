import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Ban, CheckCircle2, RotateCcw } from 'lucide-react';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { SortableTableHead } from '@/components/oww/SortableTableHead';
import { TableSearchFilter } from '@/components/oww/TableSearchFilter';
import { OwwEmptyState } from '@/components/oww/OwwEmptyState';
import { MembershipStatusPill, membershipStatusLabel } from '@/components/oww/MembershipStatusPill';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTableControls } from '@/hooks/useTableControls';
import { rowValue } from '@/lib/tableControls';
import { listRegistrations, reviewRegistration } from '@/services/adminService';
import { formatDate, formatDateTime } from '@/lib/format';
import type { UtilityRegistration, UtilityRegistrationStatus } from '@/types';
import { cn } from '@/lib/utils';

const STATUS_TABS: Array<{ id: string; label: string }> = [
  { id: 'pending_review', label: 'Pending review' },
  { id: 'verified', label: 'Verified' },
  { id: 'suspended', label: 'Suspended' },
  { id: 'all', label: 'All' },
];

function reviewStatusLabel(status: UtilityRegistrationStatus) {
  switch (status) {
    case 'pending_review':
      return 'Pending review';
    case 'verified':
      return 'Verified';
    case 'not_required':
      return 'Review not required';
    case 'suspended':
      return 'Suspended';
    default:
      return status;
  }
}

function ReviewPill({ status }: { status: UtilityRegistrationStatus }) {
  const styles: Record<UtilityRegistrationStatus, string> = {
    pending_review: 'bg-amber-100 text-amber-900',
    verified: 'bg-emerald-100 text-emerald-900',
    not_required: 'bg-slate-100 text-slate-700',
    suspended: 'bg-rose-100 text-rose-900',
  };
  return (
    <span className={cn('inline-flex rounded-full px-3 py-1 text-sm font-semibold', styles[status] || 'bg-slate-100')}>
      {reviewStatusLabel(status)}
    </span>
  );
}

function paymentLabel(r: UtilityRegistration) {
  if (!r.payment_status) return 'Unpaid';
  if (['active', 'complimentary', 'past_due'].includes(r.payment_status)) return 'Paid';
  if (r.payment_status === 'pending') return 'Checkout pending';
  return membershipStatusLabel(r.payment_status);
}

export default function AdminRegistrationsPage() {
  const [params, setParams] = useSearchParams();
  const initialTab = params.get('status') || 'pending_review';
  const [tab, setTab] = useState(initialTab);
  const [rows, setRows] = useState<UtilityRegistration[]>([]);
  const [suspendTarget, setSuspendTarget] = useState<UtilityRegistration | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setRows(await listRegistrations());
    } catch {
      setRows([]);
    }
  }
  useEffect(() => {
    void load();
  }, []);

  const scoped = useMemo(() => {
    if (tab === 'all') return rows;
    return rows.filter(r => r.status === tab);
  }, [rows, tab]);

  const table = useTableControls({
    rows: scoped,
    getValue: useMemo(
      () => (row: UtilityRegistration, key: string) => {
        if (key === 'status') return reviewStatusLabel(row.status);
        if (key === 'payment') return paymentLabel(row);
        if (key === 'admin') return `${row.contact_name} ${row.contact_email}`;
        return rowValue(row, key);
      },
      []
    ),
    getSearchText: useMemo(
      () => (row: UtilityRegistration) =>
        [row.utility_name, row.contact_name, row.contact_email, row.phone, row.website, row.state_code, reviewStatusLabel(row.status), paymentLabel(row)]
          .filter(Boolean)
          .join(' '),
      []
    ),
    initialSortKey: 'created_at',
  });

  function selectTab(id: string) {
    setTab(id);
    const next = new URLSearchParams();
    if (id !== 'all') next.set('status', id);
    setParams(next, { replace: true });
  }

  async function act(reg: UtilityRegistration, action: 'verify' | 'suspend' | 'reinstate', reviewNote?: string) {
    setBusy(true);
    setError(null);
    try {
      await reviewRegistration(reg.id, { action, note: reviewNote });
      setMsg(
        action === 'verify'
          ? `Verified ${reg.utility_name}.`
          : action === 'suspend'
            ? `Suspended ${reg.utility_name}.`
            : `Reinstated ${reg.utility_name}.`
      );
      setSuspendTarget(null);
      setNote('');
      await load();
      window.setTimeout(() => setMsg(null), 5000);
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Could not update the registration.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <OwwPageHero
        eyebrow="Administration"
        title="Utility registrations"
        description="Review self-registered utilities. Payment activates access immediately; you can verify, suspend, or reinstate afterward."
        actions={
          <>
            <Button variant="outline" className="min-h-[44px] border-white/40 bg-white/10 text-base text-white hover:bg-white/20" asChild>
              <Link to="/admin/settings">Platform settings</Link>
            </Button>
            <Button variant="outline" className="min-h-[44px] border-white/40 bg-white/10 text-base text-white hover:bg-white/20" asChild>
              <Link to="/admin">Back to dashboard</Link>
            </Button>
          </>
        }
      />

      {msg ? <p className="rounded-lg bg-emerald-50 p-3 text-base text-emerald-900">{msg}</p> : null}
      {error ? <p className="rounded-lg bg-rose-50 p-3 text-base text-rose-800">{error}</p> : null}

      <div role="tablist" aria-label="Registration status" className="flex flex-wrap gap-1 border-b border-slate-200">
        {STATUS_TABS.map(t => {
          const count = t.id === 'all' ? rows.length : rows.filter(r => r.status === t.id).length;
          return (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={tab === t.id}
              onClick={() => selectTab(t.id)}
              className={cn(
                'min-h-[44px] border-b-2 px-3 text-base font-medium transition',
                tab === t.id ? 'border-oww-cyan text-oww-navy' : 'border-transparent text-slate-600 hover:text-oww-navy'
              )}
            >
              {t.label} <span className="ml-1 text-sm text-slate-500">({count})</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm" data-tour="registrations-table">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TableSearchFilter value={table.filter} onChange={table.setFilter} resultCount={table.resultCount} totalCount={table.totalCount} />
          <p className="text-sm text-slate-600">
            Filtered ({table.resultCount}) · All ({table.totalCount})
          </p>
        </div>
        {table.totalCount === 0 ? (
          <OwwEmptyState
            title={tab === 'pending_review' ? 'No registrations awaiting review' : 'No registrations in this view'}
          />
        ) : table.resultCount === 0 ? (
          <OwwEmptyState title="No registrations match your filter" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead column="utility_name" label="Utility" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <SortableTableHead column="admin" label="Admin" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <SortableTableHead column="state_code" label="State" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <SortableTableHead column="payment" label="Payment" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <SortableTableHead column="created_at" label="Submitted" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <SortableTableHead column="status" label="Review" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.rows.map(r => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <p className="text-base font-medium">{r.utility_name}</p>
                      <p className="text-sm text-slate-500">
                        {[r.website, r.phone].filter(Boolean).join(' · ') || '—'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-base font-medium">{r.contact_name}</p>
                      <p className="text-sm text-slate-500">{r.contact_email}</p>
                      {r.job_title ? <p className="text-sm text-slate-500">{r.job_title}</p> : null}
                    </TableCell>
                    <TableCell className="text-base">{r.state_code}</TableCell>
                    <TableCell>
                      {r.payment_status ? <MembershipStatusPill status={r.payment_status} /> : <span className="text-base text-slate-600">Unpaid</span>}
                      <span className="mt-1 block text-sm text-slate-500">{paymentLabel(r)}</span>
                    </TableCell>
                    <TableCell className="text-base">{formatDateTime(r.created_at) || formatDate(r.created_at)}</TableCell>
                    <TableCell>
                      <ReviewPill status={r.status} />
                      {r.reviewed_at ? (
                        <span className="mt-1 block text-sm text-slate-500">
                          {r.reviewed_by_name ? `${r.reviewed_by_name} · ` : ''}
                          {formatDate(r.reviewed_at)}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {r.status === 'pending_review' || r.status === 'not_required' ? (
                          <Button
                            type="button"
                            variant="outline"
                            className="min-h-[44px] text-base"
                            disabled={busy}
                            onClick={() => void act(r, 'verify')}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden />
                            Verify
                          </Button>
                        ) : null}
                        {r.status !== 'suspended' ? (
                          <Button
                            type="button"
                            variant="outline"
                            className="min-h-[44px] text-base text-rose-700"
                            disabled={busy}
                            onClick={() => {
                              setSuspendTarget(r);
                              setNote('');
                            }}
                          >
                            <Ban className="mr-2 h-4 w-4" aria-hidden />
                            Suspend
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            className="min-h-[44px] text-base"
                            disabled={busy}
                            onClick={() => void act(r, 'reinstate')}
                          >
                            <RotateCcw className="mr-2 h-4 w-4" aria-hidden />
                            Reinstate
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={!!suspendTarget} onOpenChange={o => !o && setSuspendTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Suspend {suspendTarget?.utility_name}</DialogTitle>
            <DialogDescription className="text-base">
              Locks hiring tools and Water Workforce 360 for this utility. A note is required and is emailed to the utility admin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="suspend-note" className="text-base">
              Reason
            </Label>
            <Input
              id="suspend-note"
              className="min-h-[44px] text-base"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Unable to confirm utility affiliation"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" className="min-h-[44px] text-base" onClick={() => setSuspendTarget(null)}>
              Cancel
            </Button>
            <Button
              className="min-h-[44px] bg-rose-700 text-base text-white hover:bg-rose-800"
              disabled={busy || note.trim().length < 3}
              onClick={() => suspendTarget && void act(suspendTarget, 'suspend', note.trim())}
            >
              {busy ? 'Suspending…' : 'Suspend account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
