import { useEffect, useMemo, useState } from 'react';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { SortableTableHead } from '@/components/oww/SortableTableHead';
import { TableSearchFilter } from '@/components/oww/TableSearchFilter';
import { OwwEmptyState } from '@/components/oww/OwwEmptyState';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { useTableControls } from '@/hooks/useTableControls';
import { rowValue } from '@/lib/tableControls';
import { listCertifications } from '@/services/adminService';
import type { CertificationCatalogItem } from '@/types';

export default function AdminCertificationsPage() {
  const [rows, setRows] = useState<CertificationCatalogItem[]>([]);
  useEffect(() => {
    void listCertifications().then(setRows).catch(() => setRows([]));
  }, []);
  const table = useTableControls({
    rows,
    getValue: useMemo(() => (row: CertificationCatalogItem, key: string) => rowValue(row, key), []),
    getSearchText: useMemo(
      () => (row: CertificationCatalogItem) => [row.name, row.issuer, row.category, row.state_code].filter(Boolean).join(' '),
      []
    ),
    initialSortKey: 'name',
  });
  return (
    <div className="space-y-6">
      <OwwPageHero eyebrow="Administration" title="Certification catalog" description="Licenses and credentials referenced in profiles and matching." />
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TableSearchFilter value={table.filter} onChange={table.setFilter} resultCount={table.resultCount} totalCount={table.totalCount} />
          <p className="text-sm text-slate-600">Filtered ({table.resultCount}) · All ({table.totalCount})</p>
        </div>
        {table.totalCount === 0 ? (
          <OwwEmptyState title="No certifications in catalog" />
        ) : table.resultCount === 0 ? (
          <OwwEmptyState title="No certifications match your filter" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead column="name" label="Name" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <SortableTableHead column="issuer" label="Issuer" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <SortableTableHead column="category" label="Category" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <SortableTableHead column="state_code" label="State" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.rows.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="text-base">{c.name}</TableCell>
                    <TableCell className="text-base">{c.issuer || '—'}</TableCell>
                    <TableCell className="text-base">{c.category || '—'}</TableCell>
                    <TableCell className="text-base">{c.state_code || '—'}</TableCell>
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
