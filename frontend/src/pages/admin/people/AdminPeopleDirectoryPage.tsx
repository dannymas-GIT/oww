import { useEffect, useMemo, useState } from 'react';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { SampleBadge, SampleDataBanner } from '@/components/oww/SampleDataBanner';
import { SortableTableHead } from '@/components/oww/SortableTableHead';
import { TableSearchFilter } from '@/components/oww/TableSearchFilter';
import { OwwEmptyState } from '@/components/oww/OwwEmptyState';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTableControls } from '@/hooks/useTableControls';
import { listPeopleDirectory } from '@/services/adminService';
import type { OwwUser } from '@/types';
import { initials, titleCase } from '@/lib/format';
import { cn } from '@/lib/utils';

export type PeopleAudience = 'candidates' | 'hirers' | 'ambassadors' | 'educators';

const COPY: Record<PeopleAudience, { title: string; description: string; empty: string }> = {
  candidates: {
    title: 'Candidates',
    description: 'Job seekers and students on the platform.',
    empty: 'No candidates in the dataset yet.',
  },
  hirers: {
    title: 'Hirers',
    description: 'Employers and utilities that hire through OWW.',
    empty: 'No hirers in the dataset yet.',
  },
  ambassadors: {
    title: 'Ambassadors',
    description: 'People championing water careers.',
    empty: 'No ambassadors in the dataset yet.',
  },
  educators: {
    title: 'Educators',
    description: 'Trainers and education partners.',
    empty: 'No educators in the dataset yet.',
  },
};

const ROLE_CHIP: Record<string, string> = {
  individual: 'bg-slate-100 text-slate-700',
  student: 'bg-lime-100 text-lime-900',
  employer: 'bg-teal-100 text-teal-900',
  employer_admin: 'bg-teal-100 text-teal-900',
  employer_member: 'bg-teal-50 text-teal-800',
  utility_admin: 'bg-sky-100 text-sky-900',
  utility_manager: 'bg-cyan-100 text-cyan-900',
  ambassador: 'bg-amber-100 text-amber-900',
  educator: 'bg-violet-100 text-violet-900',
};

export default function AdminPeopleDirectoryPage({ audience }: { audience: PeopleAudience }) {
  const copy = COPY[audience];
  const [rows, setRows] = useState<OwwUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listPeopleDirectory(audience)
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [audience]);

  const showingSample = rows.some(r => r.is_sample || r.showing_sample);

  const getValue = useMemo(
    () => (row: OwwUser, key: string) => {
      if (key === 'roles') return (row.roles || []).join(', ');
      if (key === 'is_active') return row.is_active === false ? 0 : 1;
      if (key === 'full_name') return row.full_name || row.username || '';
      if (key === 'org_name') return row.org_name || '';
      return (row as Record<string, unknown>)[key];
    },
    []
  );

  const getSearchText = useMemo(
    () => (row: OwwUser) =>
      [row.full_name, row.username, row.email, row.org_name, ...(row.roles || [])].filter(Boolean).join(' '),
    []
  );

  const table = useTableControls({
    rows,
    getValue,
    getSearchText,
    initialSortKey: 'full_name',
  });

  return (
    <div className="space-y-6">
      <OwwPageHero eyebrow="People" title={copy.title} description={copy.description} />

      {showingSample ? <SampleDataBanner section={copy.title.toLowerCase()} /> : null}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div>
            <h2 className="font-display text-xl text-oww-navy">
              {copy.title} ({table.totalCount})
            </h2>
            <p className="text-sm text-slate-600">
              Filtered ({table.resultCount}) · All ({table.totalCount})
            </p>
          </div>
          <TableSearchFilter
            value={table.filter}
            onChange={table.setFilter}
            resultCount={table.resultCount}
            totalCount={table.totalCount}
            placeholder={`Filter ${copy.title.toLowerCase()}…`}
          />
        </div>

        {loading ? (
          <p className="p-6 text-lg text-slate-600">Loading…</p>
        ) : table.totalCount === 0 ? (
          <div className="p-4">
            <OwwEmptyState title={copy.empty} description="Sample rows appear here when the directory is empty." />
          </div>
        ) : table.resultCount === 0 ? (
          <div className="p-4">
            <OwwEmptyState
              title="No rows match your filter"
              description="Clear the search to see all people in this directory."
              action={
                <Button variant="outline" className="min-h-[44px] text-base" onClick={() => table.setFilter('')}>
                  Clear filter
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead column="full_name" label="Name" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <SortableTableHead column="username" label="Username" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <TableHead className="text-base font-semibold">Roles</TableHead>
                  {audience === 'hirers' ? (
                    <SortableTableHead
                      column="org_name"
                      label="Organization"
                      sortKey={table.sortKey}
                      sortDir={table.sortDir}
                      onSort={table.toggleSort}
                    />
                  ) : null}
                  <SortableTableHead column="is_active" label="Status" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.rows.map(u => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-oww-navy">
                          {initials(u.full_name || u.username)}
                        </span>
                        <div>
                          <p className="text-base font-medium text-slate-900">{u.full_name || u.username}</p>
                          <p className="text-sm text-slate-600">{u.email}</p>
                          {u.is_sample ? (
                            <div className="mt-1">
                              <SampleBadge />
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-base">{u.username}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(u.roles || []).map(r => (
                          <span
                            key={r}
                            className={cn(
                              'inline-flex rounded-full px-2.5 py-0.5 text-sm font-semibold',
                              ROLE_CHIP[r] ?? 'bg-slate-100 text-slate-700'
                            )}
                          >
                            {titleCase(r)}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    {audience === 'hirers' ? (
                      <TableCell className="text-base">{u.org_name || '—'}</TableCell>
                    ) : null}
                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2.5 py-0.5 text-sm font-semibold',
                          u.is_active ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-100 text-slate-600'
                        )}
                      >
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
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
