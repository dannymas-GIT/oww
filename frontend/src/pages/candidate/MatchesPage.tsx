import { useEffect, useMemo, useState } from 'react';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { SortableTableHead } from '@/components/oww/SortableTableHead';
import { TableSearchFilter } from '@/components/oww/TableSearchFilter';
import { OwwEmptyState } from '@/components/oww/OwwEmptyState';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useTableControls } from '@/hooks/useTableControls';
import { rowValue } from '@/lib/tableControls';
import { listMatches, refreshMatches } from '@/services/matchService';
import type { MatchRow } from '@/types';
import { titleCase } from '@/lib/format';

export default function MatchesPage() {
  const [rows, setRows] = useState<MatchRow[]>([]);

  async function load() {
    try {
      setRows(await listMatches());
    } catch {
      setRows([]);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const table = useTableControls({
    rows,
    getValue: useMemo(() => (row: MatchRow, key: string) => rowValue(row, key), []),
    getSearchText: useMemo(
      () => (row: MatchRow) =>
        [row.job_title, row.organization_name, row.match_type, row.explanation].filter(Boolean).join(' '),
      []
    ),
    initialSortKey: 'score',
    initialSortDir: 'desc',
  });

  return (
    <div className="space-y-6">
      <OwwPageHero
        eyebrow="Matching"
        title="Your matches"
        description="Ready now, strong transferable, developing, and future fits based on shared taxonomy answers."
        actions={
          <Button
            className="min-h-[44px] text-base"
            onClick={async () => {
              await refreshMatches().catch(() => undefined);
              await load();
            }}
          >
            Refresh matches
          </Button>
        }
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
          <OwwEmptyState title="No matches yet" description="Complete more of your profile to improve matching." />
        ) : table.resultCount === 0 ? (
          <OwwEmptyState title="No matches match your filter" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead column="job_title" label="Opportunity" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <SortableTableHead column="organization_name" label="Employer" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <SortableTableHead column="match_type" label="Type" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <SortableTableHead column="score" label="Score" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} align="right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.rows.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="text-base">{m.job_title || '—'}</TableCell>
                    <TableCell className="text-base">{m.organization_name || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-sm">
                        {titleCase(m.match_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-base">{m.score}</TableCell>
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
