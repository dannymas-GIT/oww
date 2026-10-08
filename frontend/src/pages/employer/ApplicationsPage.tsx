import { useEffect, useMemo, useState } from 'react';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { SortableTableHead } from '@/components/oww/SortableTableHead';
import { TableSearchFilter } from '@/components/oww/TableSearchFilter';
import { OwwEmptyState } from '@/components/oww/OwwEmptyState';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { useTableControls } from '@/hooks/useTableControls';
import { rowValue } from '@/lib/tableControls';
import { SampleBadge, SampleDataBanner } from '@/components/oww/SampleDataBanner';
import { useSamplePack } from '@/hooks/useSamplePack';
import { listApplications } from '@/services/jobService';
import type { Application } from '@/types';
import { formatDate } from '@/lib/format';

export default function ApplicationsPage() {
  const [rows, setRows] = useState<Application[]>([]);
  const sample = useSamplePack('applications');
  async function load() {
    try {
      setRows(await listApplications());
      await sample.refresh();
    } catch {
      setRows([]);
    }
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const table = useTableControls({
    rows,
    getValue: useMemo(() => (row: Application, key: string) => rowValue(row, key), []),
    getSearchText: useMemo(
      () => (row: Application) => [row.job_title, row.individual_name, row.status].filter(Boolean).join(' '),
      []
    ),
    initialSortKey: 'created_at',
    initialSortDir: 'desc',
  });
  const showingSample = sample.showingSample || rows.some(r => r.is_sample || r.showing_sample);
  return (
    <div className="space-y-6">
      <OwwPageHero eyebrow="Employer" title="Applications" description="Track candidates who applied to your openings." />
      {showingSample ? (
        <SampleDataBanner
          section="application"
          clearing={sample.clearing}
          onClear={async () => {
            await sample.clear();
            await load();
          }}
        />
      ) : null}
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TableSearchFilter value={table.filter} onChange={table.setFilter} resultCount={table.resultCount} totalCount={table.totalCount} />
          <p className="text-sm text-slate-600">Filtered ({table.resultCount}) · All ({table.totalCount})</p>
        </div>
        {table.totalCount === 0 ? (
          <OwwEmptyState title="No applications yet" />
        ) : table.resultCount === 0 ? (
          <OwwEmptyState title="No applications match your filter" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead column="job_title" label="Job" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <SortableTableHead column="individual_name" label="Candidate" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <SortableTableHead column="status" label="Status" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <SortableTableHead column="created_at" label="Submitted" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.rows.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="text-base">
                      <span className="inline-flex flex-wrap items-center gap-2">
                        {a.job_title || a.job_id}
                        {a.is_sample ? <SampleBadge /> : null}
                      </span>
                    </TableCell>
                    <TableCell className="text-base">{a.individual_name || '—'}</TableCell>
                    <TableCell className="text-base">{a.status}</TableCell>
                    <TableCell className="text-base">{formatDate(a.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
