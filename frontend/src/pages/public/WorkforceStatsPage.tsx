import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { OwwEmptyState } from '@/components/oww/OwwEmptyState';
import { SortableTableHead } from '@/components/oww/SortableTableHead';
import { TableSearchFilter } from '@/components/oww/TableSearchFilter';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { useTableControls } from '@/hooks/useTableControls';
import { DEFAULT_STATE } from '@/lib/constants';
import { getWorkforceStats } from '@/services/publicService';
import type { OrgPublicStats, WorkforceStatsResponse } from '@/types';

const SUMMARY_ORDER = [
  'open_jobs',
  'hires_12mo',
  'applicants_contacted',
  'hiring_projection',
  'workforce_size',
] as const;

export default function WorkforceStatsPage() {
  const params = useParams();
  const state = (params.state || DEFAULT_STATE).toLowerCase();
  const [data, setData] = useState<WorkforceStatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getWorkforceStats(state)
      .then(setData)
      .catch(() => {
        setData(null);
        setError('Could not load workforce statistics.');
      });
  }, [state]);

  const rows = data?.organizations || [];
  const labels = data?.share_labels || {};

  const table = useTableControls({
    rows,
    initialSortKey: 'name',
    getValue: useMemo(
      () => (row: OrgPublicStats, key: string) => {
        if (key === 'name') return row.name;
        if (key === 'region') return row.region || row.city || '';
        if (key === 'open_jobs') return row.open_jobs ?? null;
        if (key === 'hires_12mo') return row.hires_12mo ?? null;
        if (key === 'applicants_contacted') return row.applicants_contacted ?? null;
        if (key === 'hiring_projection') return row.hiring_projection ?? null;
        if (key === 'workforce_size') return row.workforce_size ?? null;
        return '';
      },
      []
    ),
    getSearchText: useMemo(
      () => (row: OrgPublicStats) =>
        [row.name, row.region, row.county, row.city].filter(Boolean).join(' '),
      []
    ),
  });

  const showRegionCol = Boolean(data?.keys_present?.includes('show_region'));
  const numericCols = SUMMARY_ORDER.filter(k => data?.keys_present?.includes(k));

  return (
    <div className="space-y-8" data-tour="workforce-stats">
      <OwwPageHero
        eyebrow={`${state.toUpperCase()} workforce`}
        title="Shared workforce statistics"
        description="Utilities that opt in can share aggregate hiring and workforce metrics. Figures may include sample demonstration data."
        actions={
          <Button variant="outline" className="min-h-[44px] text-base" asChild>
            <Link to={`/${state}/companies`}>Browse companies</Link>
          </Button>
        }
      />

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-base text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      {!data ? (
        <p className="text-lg text-slate-600">Loading statistics…</p>
      ) : data.org_count === 0 ? (
        <OwwEmptyState
          title="No utilities are sharing stats yet"
          description="When a utility admin opts in on their organization profile, aggregate metrics appear here."
        />
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Statewide totals">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-oww-cyan">Sharing utilities</p>
              <p className="mt-2 font-display text-3xl font-semibold text-oww-navy">{data.org_count}</p>
            </div>
            {SUMMARY_ORDER.filter(k => k in (data.summary || {})).map(key => (
              <div key={key} className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="text-sm font-semibold uppercase tracking-wide text-oww-cyan">
                  {labels[key] || key}
                </p>
                <p className="mt-2 font-display text-3xl font-semibold text-oww-navy">
                  {data.summary[key] ?? 0}
                </p>
              </div>
            ))}
          </section>

          <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <TableSearchFilter
                value={table.filter}
                onChange={table.setFilter}
                resultCount={table.resultCount}
                totalCount={table.totalCount}
                placeholder="Filter utilities…"
              />
              <p className="text-sm text-slate-600">
                Filtered ({table.resultCount}) · All ({table.totalCount})
              </p>
            </div>
            {table.resultCount === 0 ? (
              <OwwEmptyState title="No utilities match your filter" />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableTableHead
                        column="name"
                        label="Utility"
                        sortKey={table.sortKey}
                        sortDir={table.sortDir}
                        onSort={table.toggleSort}
                      />
                      {showRegionCol ? (
                        <SortableTableHead
                          column="region"
                          label="Region"
                          sortKey={table.sortKey}
                          sortDir={table.sortDir}
                          onSort={table.toggleSort}
                        />
                      ) : null}
                      {numericCols.map(col => (
                        <SortableTableHead
                          key={col}
                          column={col}
                          label={labels[col] || col}
                          sortKey={table.sortKey}
                          sortDir={table.sortDir}
                          onSort={table.toggleSort}
                        />
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {table.rows.map(row => (
                      <TableRow key={row.org_id}>
                        <TableCell className="text-base">
                          <Link
                            className="font-medium text-sky-800 hover:underline"
                            to={`/${state}/companies/${row.org_id}?from=stats`}
                          >
                            {row.name}
                          </Link>
                        </TableCell>
                        {showRegionCol ? (
                          <TableCell className="text-base">
                            {[row.region, row.county || row.city].filter(Boolean).join(' · ') || '—'}
                          </TableCell>
                        ) : null}
                        {numericCols.map(col => (
                          <TableCell key={col} className="text-base tabular-nums">
                            {row[col] ?? '—'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
