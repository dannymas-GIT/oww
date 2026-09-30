import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CalendarPlus, Gift } from 'lucide-react';
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
import { useAuth } from '@/context/AuthContext';
import { extendMembership, listMemberships } from '@/services/adminService';
import { formatPrice } from '@/services/billingService';
import { formatDate } from '@/lib/format';
import type { Membership } from '@/types';
import { cn } from '@/lib/utils';

const STATUS_TABS: Array<{ id: string; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'expiring', label: 'Expiring ≤60d' },
  { id: 'past_due', label: 'Past due' },
  { id: 'canceled', label: 'Canceling' },
  { id: 'expired', label: 'Expired' },
  { id: 'complimentary', label: 'Complimentary' },
];

export default function AdminMembershipsPage() {
  const { isPlatformAdmin } = useAuth();
  const [params, setParams] = useSearchParams();
  const initialTab = params.get('expiring_days') ? 'expiring' : params.get('status') || 'all';
  const [tab, setTab] = useState(initialTab);
  const [rows, setRows] = useState<Membership[]>([]);
  const [extendTarget, setExtendTarget] = useState<Membership | null>(null);
  const [days, setDays] = useState('365');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      setRows(await listMemberships());
    } catch {
      setRows([]);
    }
  }
  useEffect(() => {
    void load();
  }, []);

  const scoped = useMemo(() => {
    if (tab === 'all') return rows;
    if (tab === 'expiring') return rows.filter(r => ['active', 'complimentary', 'past_due'].includes(r.status) && r.days_left != null && r.days_left >= 0 && r.days_left <= 60);
    return rows.filter(r => r.status === tab);
  }, [rows, tab]);

  const table = useTableControls({
    rows: scoped,
    getValue: useMemo(
      () => (row: Membership, key: string) => {
        if (key === 'status') return membershipStatusLabel(row.status);
        return rowValue(row, key);
      },
      []
    ),
    getSearchText: useMemo(
      () => (row: Membership) => [row.member_name, row.member_email, row.plan_name, membershipStatusLabel(row.status), row.provider].filter(Boolean).join(' '),
      []
    ),
    initialSortKey: 'current_period_end',
  });

  function selectTab(id: string) {
    setTab(id);
    const next = new URLSearchParams();
    if (id === 'expiring') next.set('expiring_days', '60');
    else if (id !== 'all') next.set('status', id);
    setParams(next, { replace: true });
  }

  return (
    <div className="space-y-6">
      <OwwPageHero
        eyebrow="Administration"
        title="Memberships"
        description="Every subscription across the platform — who is paying, who is lapsing, and who was granted complimentary access."
        actions={
          <Button variant="outline" className="min-h-[44px] border-white/40 bg-white/10 text-base text-white hover:bg-white/20" asChild>
            <Link to="/admin">Back to dashboard</Link>
          </Button>
        }
      />

      <div role="tablist" aria-label="Membership status" className="flex flex-wrap gap-1 border-b border-slate-200">
        {STATUS_TABS.map(t => {
          const count = t.id === 'all' ? rows.length : t.id === 'expiring' ? rows.filter(r => ['active', 'complimentary', 'past_due'].includes(r.status) && r.days_left != null && r.days_left >= 0 && r.days_left <= 60).length : rows.filter(r => r.status === t.id).length;
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

      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TableSearchFilter value={table.filter} onChange={table.setFilter} resultCount={table.resultCount} totalCount={table.totalCount} />
          <p className="text-sm text-slate-600">Filtered ({table.resultCount}) · All ({table.totalCount})</p>
        </div>
        {table.totalCount === 0 ? (
          <OwwEmptyState title="No memberships in this view" />
        ) : table.resultCount === 0 ? (
          <OwwEmptyState title="No memberships match your filter" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead column="member_name" label="Member" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <SortableTableHead column="plan_name" label="Plan" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <SortableTableHead column="status" label="Status" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <SortableTableHead column="current_period_end" label="Period ends" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <SortableTableHead column="price_cents" label="Price" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} align="right" />
                  <SortableTableHead column="provider" label="Provider" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  {isPlatformAdmin ? <TableHead className="font-semibold">Actions</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.rows.map(r => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <p className="text-base font-medium">{r.member_name || `Org #${r.org_id ?? '—'}`}</p>
                      <p className="text-sm text-slate-500">{r.member_email}</p>
                    </TableCell>
                    <TableCell className="text-base">{r.plan_name}</TableCell>
                    <TableCell>
                      <MembershipStatusPill status={r.status} />
                      {r.cancel_at_period_end && r.status !== 'canceled' ? <span className="block text-sm text-slate-500">ends at period</span> : null}
                    </TableCell>
                    <TableCell className="text-base">
                      {formatDate(r.current_period_end)}
                      {r.days_left != null ? (
                        <span className={cn('block text-sm', r.days_left < 0 ? 'text-rose-600' : r.days_left <= 30 ? 'text-amber-700' : 'text-slate-500')}>
                          {r.days_left < 0 ? `${Math.abs(r.days_left)} days ago` : `${r.days_left} days left`}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right text-base">{formatPrice(r.price_cents)}</TableCell>
                    <TableCell className="text-base">{r.provider === 'sample' ? 'Stripe (sample)' : r.provider}</TableCell>
                    {isPlatformAdmin ? (
                      <TableCell>
                        <Button
                          type="button"
                          variant="outline"
                          className="min-h-[44px] text-base"
                          onClick={() => {
                            setExtendTarget(r);
                            setDays('365');
                            setNote('');
                          }}
                        >
                          {['expired', 'canceled', 'pending'].includes(r.status) ? <Gift className="mr-2 h-4 w-4" aria-hidden /> : <CalendarPlus className="mr-2 h-4 w-4" aria-hidden />}
                          {['expired', 'canceled', 'pending'].includes(r.status) ? 'Grant access' : 'Extend'}
                        </Button>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={!!extendTarget} onOpenChange={o => !o && setExtendTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Extend membership</DialogTitle>
            <DialogDescription className="text-base">
              {extendTarget?.member_name} · {extendTarget?.plan_name}. Lapsed memberships become complimentary; audited in billing events.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="days" className="text-base">Days to add</Label>
              <Input id="days" type="number" min={1} className="min-h-[44px] text-base" value={days} onChange={e => setDays(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note" className="text-base">Note (optional)</Label>
              <Input id="note" className="min-h-[44px] text-base" placeholder="e.g. NYSAWWA conference sponsor" value={note} onChange={e => setNote(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="min-h-[44px] text-base" onClick={() => setExtendTarget(null)}>
              Cancel
            </Button>
            <Button
              className="min-h-[44px] bg-oww-cyan text-base text-white hover:bg-sky-700"
              disabled={busy}
              onClick={async () => {
                if (!extendTarget) return;
                setBusy(true);
                try {
                  await extendMembership(extendTarget.id, { days: Number(days) || 365, note: note || undefined });
                  setExtendTarget(null);
                  await load();
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? 'Saving…' : 'Extend'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
