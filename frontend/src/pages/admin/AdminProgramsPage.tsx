import { useEffect, useMemo, useState } from 'react';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { SortableTableHead } from '@/components/oww/SortableTableHead';
import { TableSearchFilter } from '@/components/oww/TableSearchFilter';
import { OwwEmptyState } from '@/components/oww/OwwEmptyState';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { useTableControls } from '@/hooks/useTableControls';
import { listProgramSubmissions } from '@/services/adminService';

type Row = Record<string, unknown> & { id?: number; program_title?: string; organization_name?: string; email?: string; status?: string };

export default function AdminProgramsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    void listProgramSubmissions().then(d => setRows(d as Row[])).catch(() => setRows([]));
  }, []);
  const table = useTableControls({
    rows,
    getValue: useMemo(() => (row: Row, key: string) => row[key], []),
    getSearchText: useMemo(
      () => (row: Row) => [row.program_title, row.organization_name, row.email, row.status].filter(Boolean).join(' '),
      []
    ),
    initialSortKey: 'program_title',
  });
  return (
    <div className="space-y-6">
      <OwwPageHero eyebrow="Administration" title="Program submissions" description="Review educator and partner program intakes." />
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TableSearchFilter value={table.filter} onChange={table.setFilter} resultCount={table.resultCount} totalCount={table.totalCount} />
          <p className="text-sm text-slate-600">Filtered ({table.resultCount}) · All ({table.totalCount})</p>
        </div>
        {table.totalCount === 0 ? (
          <OwwEmptyState title="No program submissions" />
        ) : table.resultCount === 0 ? (
          <OwwEmptyState title="No submissions match your filter" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead column="program_title" label="Program" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <SortableTableHead column="organization_name" label="Organization" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <SortableTableHead column="email" label="Contact" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <SortableTableHead column="status" label="Status" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.rows.map((r, idx) => (
                  <TableRow key={String(r.id ?? idx)}>
                    <TableCell className="text-base">{String(r.program_title || '—')}</TableCell>
                    <TableCell className="text-base">{String(r.organization_name || '—')}</TableCell>
                    <TableCell className="text-base">{String(r.email || '—')}</TableCell>
                    <TableCell className="text-base">{String(r.status || 'pending')}</TableCell>
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
