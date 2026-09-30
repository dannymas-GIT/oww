import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { SortableTableHead } from '@/components/oww/SortableTableHead';
import { TableSearchFilter } from '@/components/oww/TableSearchFilter';
import { OwwEmptyState } from '@/components/oww/OwwEmptyState';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { useTableControls } from '@/hooks/useTableControls';
import { rowValue } from '@/lib/tableControls';
import { DEFAULT_STATE } from '@/lib/constants';
import { listPublicCompanies } from '@/services/publicService';
import type { Organization } from '@/types';

export default function CompaniesPage() {
  const params = useParams();
  const state = (params.state || DEFAULT_STATE).toLowerCase();
  const [rows, setRows] = useState<Organization[]>([]);

  useEffect(() => {
    void listPublicCompanies({ state }).then(setRows).catch(() => setRows([]));
  }, [state]);

  const table = useTableControls({
    rows,
    getValue: useMemo(() => (row: Organization, key: string) => rowValue(row, key), []),
    getSearchText: useMemo(
      () => (row: Organization) => [row.name, row.city, row.org_type].filter(Boolean).join(' '),
      []
    ),
    initialSortKey: 'name',
  });

  return (
    <div className="space-y-6">
      <OwwPageHero
        eyebrow={`${state.toUpperCase()} employers`}
        title="Companies & organizations"
        description="Utilities, contractors, manufacturers, and partners hiring into the water workforce."
      />
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TableSearchFilter
            value={table.filter}
            onChange={table.setFilter}
            resultCount={table.resultCount}
            totalCount={table.totalCount}
          />
          <p className="text-sm text-slate-600">
            Filtered ({table.resultCount}) · All ({table.totalCount})
          </p>
        </div>
        {table.totalCount === 0 ? (
          <OwwEmptyState title="No organizations listed yet" />
        ) : table.resultCount === 0 ? (
          <OwwEmptyState title="No organizations match your filter" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead column="name" label="Name" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <SortableTableHead column="org_type" label="Type" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <SortableTableHead column="city" label="City" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.rows.map(o => (
                  <TableRow key={o.id}>
                    <TableCell className="text-base">
                      <Link className="font-medium text-sky-800 hover:underline" to={`/${state}/companies/${o.id}`}>
                        {o.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-base">{o.org_type || '—'}</TableCell>
                    <TableCell className="text-base">{o.city || '—'}</TableCell>
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
