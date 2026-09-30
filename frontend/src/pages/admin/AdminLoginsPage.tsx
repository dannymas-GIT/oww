import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, LogIn } from 'lucide-react';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { OwwKpiTile } from '@/components/oww/OwwKpiTile';
import { OwwEmptyState } from '@/components/oww/OwwEmptyState';
import { SortableTableHead } from '@/components/oww/SortableTableHead';
import { TableSearchFilter } from '@/components/oww/TableSearchFilter';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTableControls } from '@/hooks/useTableControls';
import { fetchLoginActivity } from '@/services/adminService';
import { formatDateTime, formatNumber, titleCase } from '@/lib/format';
import type { LoginActivityResponse, LoginEventRow } from '@/types';
import { cn } from '@/lib/utils';

type FilterMode = 'all' | 'success' | 'failed';

export default function AdminLoginsPage() {
  const [data, setData] = useState<LoginActivityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<FilterMode>('all');

  useEffect(() => {
    const success = mode === 'all' ? undefined : mode === 'success';
    fetchLoginActivity({ success, limit: 250 })
      .then(setData)
      .catch(() => setError('Could not load login activity.'));
  }, [mode]);

  const rows = data?.events ?? [];
  const table = useTableControls({
    rows,
    getValue: (row: LoginEventRow, key: string) => {
      if (key === 'created_at') return row.created_at || '';
      if (key === 'success') return row.success ? 1 : 0;
      if (key === 'identifier') return row.user_name || row.identifier;
      if (key === 'method') return row.method;
      return '';
    },
    getSearchText: (row: LoginEventRow) =>
      [row.identifier, row.user_name, row.user_email, row.method, row.ip_address, row.failure_reason]
        .filter(Boolean)
        .join(' '),
    initialSortKey: 'created_at',
    initialSortDir: 'desc',
  });

  const stats = data?.stats;
  const maxDay = useMemo(() => Math.max(1, ...(stats?.by_day.map(d => d.count) ?? [1])), [stats]);

  return (
    <div className="space-y-6">
      <OwwPageHero
        eyebrow="Administration"
        title="Login activity"
        description="Successful and failed sign-ins across the platform — who signed in, when, and how."
        actions={
          <Button variant="outline" className="min-h-[44px] border-white/40 bg-white/10 text-base text-white hover:bg-white/20" asChild>
            <Link to="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
              Back to dashboard
            </Link>
          </Button>
        }
      />

      {error ? <p className="rounded-lg bg-rose-50 p-3 text-base text-rose-800">{error}</p> : null}

      <section aria-label="Login KPIs" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <OwwKpiTile label="Logins today" value={formatNumber(stats?.logins_today)} icon={<LogIn className="h-5 w-5 text-oww-cyan" aria-hidden />} />
        <OwwKpiTile label="Last 7 days" value={formatNumber(stats?.logins_7d)} />
        <OwwKpiTile label="Last 30 days" value={formatNumber(stats?.logins_30d)} />
        <OwwKpiTile label="Unique users (30d)" value={formatNumber(stats?.unique_users_30d)} />
        <OwwKpiTile
          label="Failed attempts (30d)"
          value={formatNumber(stats?.failed_30d)}
          className={stats && stats.failed_30d > 0 ? 'border-amber-200' : undefined}
        />
      </section>

      {stats?.by_day?.length ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm" aria-label="Logins by day">
          <h2 className="font-display text-xl font-semibold text-oww-navy">Successful logins — last 14 days</h2>
          <div className="mt-4 flex h-32 items-end gap-1.5" role="img" aria-label="Bar chart of daily successful logins">
            {stats.by_day.map(d => (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-oww-cyan/80"
                  style={{ height: `${Math.max(4, (d.count / maxDay) * 100)}%` }}
                  title={`${d.date}: ${d.count}`}
                />
                <span className="text-sm text-slate-500">{d.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-oww-navy">Sign-in events</h2>
            <p className="text-sm text-slate-600">
              Filtered {table.resultCount} · All {table.totalCount}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {([
              ['all', 'All'],
              ['success', 'Successful'],
              ['failed', 'Failed'],
            ] as const).map(([key, label]) => (
              <Button
                key={key}
                type="button"
                variant={mode === key ? 'default' : 'outline'}
                className={cn('min-h-[44px] text-base', mode === key && 'bg-oww-navy')}
                onClick={() => setMode(key)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <TableSearchFilter
            value={table.filter}
            onChange={table.setFilter}
            resultCount={table.resultCount}
            totalCount={table.totalCount}
            placeholder="Filter by user, email, IP…"
          />
        </div>

        {!data ? (
          <p className="py-8 text-center text-base text-slate-500">Loading…</p>
        ) : table.rows.length === 0 ? (
          <OwwEmptyState
            title={table.filter ? 'No events match this filter' : 'No login events yet'}
            className="mt-3 py-8"
          />
        ) : (
          <div className="mt-3 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead column="created_at" label="When" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <SortableTableHead column="identifier" label="Account" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <SortableTableHead column="success" label="Result" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <SortableTableHead column="method" label="Method" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <TableHead className="text-sm font-semibold">IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.rows.map(row => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap text-base">{formatDateTime(row.created_at)}</TableCell>
                    <TableCell>
                      <p className="text-base font-medium text-oww-navy">{row.user_name || row.identifier}</p>
                      <p className="text-sm text-slate-500">{row.user_email || row.identifier}</p>
                      {!row.success && row.failure_reason ? (
                        <p className="text-sm text-rose-700">{row.failure_reason}</p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2.5 py-0.5 text-sm font-semibold',
                          row.success ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
                        )}
                      >
                        {row.success ? 'Success' : 'Failed'}
                      </span>
                    </TableCell>
                    <TableCell className="text-base">{titleCase(row.method)}</TableCell>
                    <TableCell className="font-mono text-sm text-slate-600">{row.ip_address || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
