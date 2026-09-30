import { useEffect, useMemo, useState } from 'react';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { SortableTableHead } from '@/components/oww/SortableTableHead';
import { TableSearchFilter } from '@/components/oww/TableSearchFilter';
import { OwwEmptyState } from '@/components/oww/OwwEmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTableControls } from '@/hooks/useTableControls';
import { rowValue } from '@/lib/tableControls';
import { createJob, duplicateJob, featureJob, listMyJobs } from '@/services/jobService';
import type { Job } from '@/types';
import { Copy, Star } from 'lucide-react';
import { MembershipGate } from '@/components/oww/MembershipGate';

export default function JobsManagePage() {
  return (
    <div className="space-y-6">
      <OwwPageHero
        eyebrow="Hiring"
        title="Manage jobs"
        description="Create openings, duplicate templates, and feature priority roles."
      />
      <MembershipGate feature="job posting">
        <JobsManageBody />
      </MembershipGate>
    </div>
  );
}

function JobsManageBody() {
  const [rows, setRows] = useState<Job[]>([]);
  const [title, setTitle] = useState('');

  async function load() {
    try {
      setRows(await listMyJobs());
    } catch {
      setRows([]);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const table = useTableControls({
    rows,
    getValue: useMemo(() => (row: Job, key: string) => rowValue(row, key), []),
    getSearchText: useMemo(() => (row: Job) => [row.title, row.status, row.city].filter(Boolean).join(' '), []),
    initialSortKey: 'title',
  });

  return (
    <div className="space-y-6">
      <form
        className="flex flex-wrap gap-3"
        onSubmit={async e => {
          e.preventDefault();
          if (!title.trim()) return;
          await createJob({ title, status: 'open' });
          setTitle('');
          await load();
        }}
      >
        <Input
          className="min-h-[44px] min-w-[16rem] flex-1 text-base"
          placeholder="New job title"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <Button type="submit" className="min-h-[44px] text-base">
          Create job
        </Button>
      </form>
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TableSearchFilter value={table.filter} onChange={table.setFilter} resultCount={table.resultCount} totalCount={table.totalCount} />
          <p className="text-sm text-slate-600">Filtered ({table.resultCount}) · All ({table.totalCount})</p>
        </div>
        {table.totalCount === 0 ? (
          <OwwEmptyState title="No jobs yet" description="Create your first opening above." />
        ) : table.resultCount === 0 ? (
          <OwwEmptyState title="No jobs match your filter" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead column="title" label="Title" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <SortableTableHead column="status" label="Status" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <SortableTableHead column="is_featured" label="Featured" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.rows.map(j => (
                  <TableRow key={j.id}>
                    <TableCell className="text-base">{j.title}</TableCell>
                    <TableCell className="text-base">{j.status || '—'}</TableCell>
                    <TableCell className="text-base">{j.is_featured ? 'Yes' : 'No'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="min-h-[44px] min-w-[44px]"
                          aria-label="Duplicate"
                          onClick={async () => {
                            await duplicateJob(j.id);
                            await load();
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="min-h-[44px] min-w-[44px]"
                          aria-label="Feature"
                          onClick={async () => {
                            await featureJob(j.id, !j.is_featured);
                            await load();
                          }}
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      </div>
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
