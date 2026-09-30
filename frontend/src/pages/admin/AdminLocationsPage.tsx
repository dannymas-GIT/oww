import { useEffect, useMemo, useState } from 'react';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { SortableTableHead } from '@/components/oww/SortableTableHead';
import { TableSearchFilter } from '@/components/oww/TableSearchFilter';
import { OwwEmptyState } from '@/components/oww/OwwEmptyState';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { useTableControls } from '@/hooks/useTableControls';
import { rowValue } from '@/lib/tableControls';
import { listLocations } from '@/services/adminService';
import type { LocationItem } from '@/types';

export default function AdminLocationsPage() {
  const [rows, setRows] = useState<LocationItem[]>([]);
  useEffect(() => {
    void listLocations().then(setRows).catch(() => setRows([]));
  }, []);
  const table = useTableControls({
    rows,
    getValue: useMemo(() => (row: LocationItem, key: string) => rowValue(row, key), []),
    getSearchText: useMemo(
      () => (row: LocationItem) => [row.name, row.city, row.location_type, row.state_code].filter(Boolean).join(' '),
      []
    ),
    initialSortKey: 'name',
  });
  return (
    <div className="space-y-6">
      <OwwPageHero eyebrow="Administration" title="Locations" description="Facilities and geocoded places used on maps and job posts." />
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TableSearchFilter value={table.filter} onChange={table.setFilter} resultCount={table.resultCount} totalCount={table.totalCount} />
          <p className="text-sm text-slate-600">Filtered ({table.resultCount}) · All ({table.totalCount})</p>
        </div>
        {table.totalCount === 0 ? (
          <OwwEmptyState title="No locations" />
        ) : table.resultCount === 0 ? (
          <OwwEmptyState title="No locations match your filter" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead column="name" label="Name" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <SortableTableHead column="location_type" label="Type" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <SortableTableHead column="city" label="City" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <SortableTableHead column="state_code" label="State" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.rows.map(l => (
                  <TableRow key={l.id}>
                    <TableCell className="text-base">{l.name}</TableCell>
                    <TableCell className="text-base">{l.location_type || '—'}</TableCell>
                    <TableCell className="text-base">{l.city || '—'}</TableCell>
                    <TableCell className="text-base">{l.state_code || '—'}</TableCell>
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
