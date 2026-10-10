import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { SortableTableHead } from '@/components/oww/SortableTableHead';
import { TableSearchFilter } from '@/components/oww/TableSearchFilter';
import { OwwEmptyState } from '@/components/oww/OwwEmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTableControls } from '@/hooks/useTableControls';
import { rowValue } from '@/lib/tableControls';
import { listAdminJurisdictions, upsertJurisdiction } from '@/services/jurisdictionService';
import type { Jurisdiction } from '@/types';

export default function AdminJurisdictionsPage() {
  const [rows, setRows] = useState<Jurisdiction[]>([]);
  const [editing, setEditing] = useState<Jurisdiction | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = () => {
    void listAdminJurisdictions().then(setRows).catch(() => setRows([]));
  };

  useEffect(() => {
    reload();
  }, []);

  const table = useTableControls({
    rows,
    getValue: useMemo(
      () => (row: Jurisdiction, key: string) => {
        if (key === 'partner') return row.partner_name || row.partner?.short || '';
        if (key === 'regions_count') return row.regions_count ?? row.regions?.length ?? 0;
        return rowValue(row, key);
      },
      []
    ),
    getSearchText: useMemo(
      () => (row: Jurisdiction) =>
        `${row.code} ${row.name} ${row.partner_name || ''} ${row.partner?.short || ''}`,
      []
    ),
    initialSortKey: 'code',
  });

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    setError(null);
    try {
      await upsertJurisdiction({
        code: editing.code,
        name: editing.name,
        is_active: editing.is_active,
        partner_name: editing.partner_name || editing.partner?.short || null,
        tagline: editing.tagline || null,
        demonym: editing.demonym || null,
        geo_unit_label: editing.geo_unit_label || null,
        partner: editing.partner || undefined,
        regions: editing.regions || undefined,
        regulators: editing.regulators || undefined,
      });
      setEditing(null);
      reload();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <OwwPageHero
        eyebrow="Administration"
        title="Jurisdictions"
        description="Multi-tenant scaffolding: NY is the live NYSAWWA flagship. NJ, CT, and New England (NE) packs stay inactive until a partner MOU — flip Active only then."
        actions={
          <Link
            to="/admin/regions"
            className="inline-flex min-h-[44px] items-center rounded-md border border-white/40 bg-white/10 px-4 text-base font-semibold text-white hover:bg-white/20"
          >
            Regions map
          </Link>
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
          <OwwEmptyState title="No jurisdictions" />
        ) : table.resultCount === 0 ? (
          <OwwEmptyState title="No jurisdictions match your filter" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead
                    column="code"
                    label="Code"
                    sortKey={table.sortKey}
                    sortDir={table.sortDir}
                    onSort={table.toggleSort}
                  />
                  <SortableTableHead
                    column="name"
                    label="Name"
                    sortKey={table.sortKey}
                    sortDir={table.sortDir}
                    onSort={table.toggleSort}
                  />
                  <SortableTableHead
                    column="partner"
                    label="Partner"
                    sortKey={table.sortKey}
                    sortDir={table.sortDir}
                    onSort={table.toggleSort}
                  />
                  <SortableTableHead
                    column="regions_count"
                    label="Regions"
                    sortKey={table.sortKey}
                    sortDir={table.sortDir}
                    onSort={table.toggleSort}
                  />
                  <SortableTableHead
                    column="is_active"
                    label="Active"
                    sortKey={table.sortKey}
                    sortDir={table.sortDir}
                    onSort={table.toggleSort}
                  />
                  <th className="px-3 py-2 text-left text-base font-semibold text-slate-700">Actions</th>
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.rows.map(j => (
                  <TableRow key={j.id}>
                    <TableCell className="text-base font-medium">{j.code.toUpperCase()}</TableCell>
                    <TableCell className="text-base">{j.name}</TableCell>
                    <TableCell className="text-base">{j.partner_name || j.partner?.short || '—'}</TableCell>
                    <TableCell className="text-base">
                      {j.regions_count ?? j.regions?.length ?? 0}
                    </TableCell>
                    <TableCell className="text-base">{j.is_active ? 'Yes' : 'No'}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        className="min-h-[44px] text-base"
                        onClick={() => setEditing({ ...j })}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={Boolean(editing)} onOpenChange={open => !open && setEditing(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit {editing?.code?.toUpperCase()} jurisdiction</DialogTitle>
          </DialogHeader>
          {editing ? (
            <div className="space-y-4">
              {editing.pack_version ? (
                <p className="text-sm text-slate-600">Pack version: {editing.pack_version} (read-only code defaults)</p>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="jx-name">Name</Label>
                <Input
                  id="jx-name"
                  className="min-h-[44px] text-base"
                  value={editing.name}
                  onChange={e => setEditing({ ...editing, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jx-partner">Partner short name</Label>
                <Input
                  id="jx-partner"
                  className="min-h-[44px] text-base"
                  value={editing.partner_name || editing.partner?.short || ''}
                  onChange={e =>
                    setEditing({
                      ...editing,
                      partner_name: e.target.value,
                      partner: { ...(editing.partner || { lead_org: e.target.value, short: e.target.value, contact_label: e.target.value }), short: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jx-tagline">Tagline</Label>
                <Input
                  id="jx-tagline"
                  className="min-h-[44px] text-base"
                  value={editing.tagline || ''}
                  onChange={e => setEditing({ ...editing, tagline: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jx-demonym">Demonym</Label>
                <Input
                  id="jx-demonym"
                  className="min-h-[44px] text-base"
                  value={editing.demonym || ''}
                  onChange={e => setEditing({ ...editing, demonym: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jx-geo">Geo unit label</Label>
                <Input
                  id="jx-geo"
                  className="min-h-[44px] text-base"
                  value={editing.geo_unit_label || ''}
                  onChange={e => setEditing({ ...editing, geo_unit_label: e.target.value })}
                  placeholder="County or Town"
                />
              </div>
              <label className="flex min-h-[44px] items-center gap-3 text-base">
                <input
                  type="checkbox"
                  className="h-5 w-5"
                  checked={Boolean(editing.is_active)}
                  onChange={e => setEditing({ ...editing, is_active: e.target.checked })}
                />
                Active (public microsite)
              </label>
              <p className="text-sm text-slate-600">
                Regions: {editing.regions?.length ?? 0} · Regulators: {editing.regulators?.length ?? 0}
              </p>
              {error ? <p className="text-base text-red-700">{error}</p> : null}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" className="min-h-[44px] text-base" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button className="min-h-[44px] text-base" disabled={saving} onClick={() => void save()}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
