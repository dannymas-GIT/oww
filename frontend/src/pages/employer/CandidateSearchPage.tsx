import { useEffect, useMemo, useState } from 'react';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { SortableTableHead } from '@/components/oww/SortableTableHead';
import { TableSearchFilter } from '@/components/oww/TableSearchFilter';
import { OwwEmptyState } from '@/components/oww/OwwEmptyState';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { useTableControls } from '@/hooks/useTableControls';
import { rowValue } from '@/lib/tableControls';
import { searchCandidates } from '@/services/orgService';
import { MembershipGate } from '@/components/oww/MembershipGate';

type Row = { id: number; display_name: string; career_area?: string; match_score?: number };

export default function CandidateSearchPage() {
  return (
    <div className="space-y-6">
      <OwwPageHero eyebrow="Hiring" title="Candidate search" description="Browse individuals matched to your workforce needs." />
      <MembershipGate feature="candidate search">
        <CandidateSearchBody />
      </MembershipGate>
    </div>
  );
}

function CandidateSearchBody() {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    void searchCandidates().then(setRows).catch(() => setRows([]));
  }, []);
  const table = useTableControls({
    rows,
    getValue: useMemo(() => (row: Row, key: string) => rowValue(row, key), []),
    getSearchText: useMemo(() => (row: Row) => [row.display_name, row.career_area].filter(Boolean).join(' '), []),
    initialSortKey: 'match_score',
    initialSortDir: 'desc',
  });
  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TableSearchFilter value={table.filter} onChange={table.setFilter} resultCount={table.resultCount} totalCount={table.totalCount} />
          <p className="text-sm text-slate-600">Filtered ({table.resultCount}) · All ({table.totalCount})</p>
        </div>
        {table.totalCount === 0 ? (
          <OwwEmptyState title="No candidates available" />
        ) : table.resultCount === 0 ? (
          <OwwEmptyState title="No candidates match your filter" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead column="display_name" label="Name" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <SortableTableHead column="career_area" label="Career area" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <SortableTableHead column="match_score" label="Score" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} align="right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.rows.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="text-base">{r.display_name}</TableCell>
                    <TableCell className="text-base">{r.career_area || '—'}</TableCell>
                    <TableCell className="text-right text-base">{r.match_score ?? '—'}</TableCell>
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
