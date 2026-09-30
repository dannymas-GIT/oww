import { useEffect, useMemo, useState } from 'react';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { SortableTableHead } from '@/components/oww/SortableTableHead';
import { TableSearchFilter } from '@/components/oww/TableSearchFilter';
import { OwwEmptyState } from '@/components/oww/OwwEmptyState';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { useTableControls } from '@/hooks/useTableControls';
import { rowValue } from '@/lib/tableControls';
import { listAdminJurisdictions } from '@/services/adminService';
import type { Jurisdiction } from '@/types';

export default function AdminJurisdictionsPage() {
  const [rows, setRows] = useState<Jurisdiction[]>([]);
  useEffect(() => {
    void listAdminJurisdictions().then(setRows).catch(() => setRows([]));
  }, []);
  const table = useTableControls({
    rows,
    getValue: useMemo(() => (row: Jurisdiction, key: string) => rowValue(row, key), []),
    getSearchText: useMemo(() => (row: Jurisdiction) => `${row.code} ${row.name}`, []),
    initialSortKey: 'code',
  });
  return (
    <div className="space-y-6">
      <OwwPageHero eyebrow="Administration" title="Jurisdictions" description="State/territory tenants. Default seed includes New York (NY)." />
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TableSearchFilter value={table.filter} onChange={table.setFilter} resultCount={table.resultCount} totalCount={table.totalCount} />
          <p className="text-sm text-slate-600">Filtered ({table.resultCount}) · All ({table.totalCount})</p>
        </div>
        {table.totalCount === 0 ? (
          <OwwEmptyState title="No jurisdictions" />
        ) : table.resultCount === 0 ? (
          <OwwEmptyState title="No jurisdictions match your filter" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead column="code" label="Code" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <SortableTableHead column="name" label="Name" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <SortableTableHead column="is_active" label="Active" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.rows.map(j => (
                  <TableRow key={j.id}>
                    <TableCell className="text-base font-medium">{j.code}</TableCell>
                    <TableCell className="text-base">{j.name}</TableCell>
                    <TableCell className="text-base">{j.is_active ? 'Yes' : 'No'}</TableCell>
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
