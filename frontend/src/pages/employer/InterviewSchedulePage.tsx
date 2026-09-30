import { useEffect, useMemo, useState } from 'react';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { SortableTableHead } from '@/components/oww/SortableTableHead';
import { TableSearchFilter } from '@/components/oww/TableSearchFilter';
import { OwwEmptyState } from '@/components/oww/OwwEmptyState';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { useTableControls } from '@/hooks/useTableControls';
import { rowValue } from '@/lib/tableControls';
import { listInterviews } from '@/services/messagingService';
import type { Interview } from '@/types';
import { formatDate } from '@/lib/format';

export default function InterviewSchedulePage() {
  const [rows, setRows] = useState<Interview[]>([]);
  useEffect(() => {
    void listInterviews().then(setRows).catch(() => setRows([]));
  }, []);
  const table = useTableControls({
    rows,
    getValue: useMemo(() => (row: Interview, key: string) => rowValue(row, key), []),
    getSearchText: useMemo(
      () => (row: Interview) => [row.job_title, row.candidate_name, row.status, row.location].filter(Boolean).join(' '),
      []
    ),
    initialSortKey: 'scheduled_at',
  });
  return (
    <div className="space-y-6">
      <OwwPageHero eyebrow="Employer" title="Interview schedule" description="Upcoming and past interview slots." />
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TableSearchFilter value={table.filter} onChange={table.setFilter} resultCount={table.resultCount} totalCount={table.totalCount} />
          <p className="text-sm text-slate-600">Filtered ({table.resultCount}) · All ({table.totalCount})</p>
        </div>
        {table.totalCount === 0 ? (
          <OwwEmptyState title="No interviews scheduled" />
        ) : table.resultCount === 0 ? (
          <OwwEmptyState title="No interviews match your filter" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead column="scheduled_at" label="When" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <SortableTableHead column="candidate_name" label="Candidate" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <SortableTableHead column="job_title" label="Job" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <SortableTableHead column="status" label="Status" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.rows.map(i => (
                  <TableRow key={i.id}>
                    <TableCell className="text-base">{formatDate(i.scheduled_at)}</TableCell>
                    <TableCell className="text-base">{i.candidate_name || '—'}</TableCell>
                    <TableCell className="text-base">{i.job_title || '—'}</TableCell>
                    <TableCell className="text-base">{i.status}</TableCell>
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
