/**
 * Curated database field picker for Document Studio.
 */
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  fetchDataCatalog,
  resolvePlaceholders,
  type DataCatalogGroup,
  type DataCatalogItem,
} from '@/services/docStudioService';
import { cn } from '@/lib/utils';

interface DataInsertPanelProps {
  open: boolean;
  onClose: () => void;
  onInsertValue: (text: string) => void;
  onInsertHtml: (html: string) => void;
  onFillDocument: (vars: Record<string, string | number>) => void | Promise<void>;
}

export function DataInsertPanel({
  open,
  onClose,
  onInsertValue,
  onInsertHtml,
  onFillDocument,
}: DataInsertPanelProps) {
  const [groups, setGroups] = useState<DataCatalogGroup[]>([]);
  const [groupId, setGroupId] = useState<string>('analytics');
  const [q, setQ] = useState('');
  const [stateCode, setStateCode] = useState('NY');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setBusy(true);
    setError(null);
    void fetchDataCatalog(stateCode)
      .then(data => {
        setGroups(data.groups || []);
        setGroupId(prev =>
          data.groups?.some(g => g.id === prev) ? prev : data.groups?.[0]?.id || 'analytics'
        );
      })
      .catch(() => setError('Could not load data catalog.'))
      .finally(() => setBusy(false));
  }, [open, stateCode]);

  const items = useMemo(() => {
    const g = groups.find(x => x.id === groupId);
    const list = g?.items || [];
    const needle = q.trim().toLowerCase();
    if (!needle) return list;
    return list.filter(
      i =>
        i.label.toLowerCase().includes(needle) ||
        i.key.toLowerCase().includes(needle) ||
        (i.description || '').toLowerCase().includes(needle)
    );
  }, [groups, groupId, q]);

  if (!open) return null;

  function insertItem(item: DataCatalogItem, asToken: boolean) {
    if (asToken) {
      onInsertValue(`{{${item.key}}}`);
      return;
    }
    if (item.html) {
      onInsertHtml(item.html);
      return;
    }
    onInsertValue(item.value != null ? String(item.value) : `{{${item.key}}}`);
  }

  async function fillAll() {
    setBusy(true);
    setError(null);
    try {
      const resolved = await resolvePlaceholders({ state_code: stateCode });
      await onFillDocument(resolved.vars || {});
    } catch {
      setError('Could not resolve placeholders.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal>
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-display text-xl text-oww-navy">Insert data</h2>
          <p className="text-base text-slate-600">
            Drop curated database fields into this document — as live values or {'{{placeholders}}'}.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 px-5 py-3">
          <div className="space-y-1">
            <Label className="text-base">State</Label>
            <Input
              className="min-h-[44px] w-20 text-base uppercase"
              maxLength={2}
              value={stateCode}
              onChange={e => setStateCode(e.target.value.toUpperCase())}
            />
          </div>
          <div className="min-w-[12rem] flex-1 space-y-1">
            <Label className="text-base">Search</Label>
            <Input
              className="min-h-[44px] text-base"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="jobs, programs, metrics…"
            />
          </div>
          <Button
            type="button"
            className="min-h-[44px] bg-oww-cyan text-base text-white hover:bg-sky-700"
            disabled={busy}
            onClick={() => void fillAll()}
          >
            Fill all placeholders
          </Button>
        </div>
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <ul className="w-44 shrink-0 overflow-y-auto border-r border-slate-100 p-2">
            {groups.map(g => (
              <li key={g.id}>
                <button
                  type="button"
                  className={cn(
                    'mb-1 w-full rounded-lg px-3 py-2 text-left text-base',
                    groupId === g.id ? 'bg-sky-100 font-semibold text-oww-navy' : 'hover:bg-slate-50'
                  )}
                  onClick={() => setGroupId(g.id)}
                >
                  {g.label}
                </button>
              </li>
            ))}
          </ul>
          <div className="min-w-0 flex-1 overflow-y-auto p-3">
            {error ? <p className="text-base text-rose-700">{error}</p> : null}
            {busy && !items.length ? <p className="text-base text-slate-600">Loading…</p> : null}
            {!busy && !items.length ? (
              <p className="text-base text-slate-600">No fields in this group.</p>
            ) : null}
            <ul className="space-y-2">
              {items.map(item => (
                <li
                  key={item.key}
                  className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-slate-200 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-oww-navy">{item.label}</p>
                    <p className="text-sm text-slate-500">
                      <code>{`{{${item.key}}}`}</code>
                      {item.value != null ? ` · ${String(item.value).slice(0, 80)}` : ''}
                    </p>
                    {item.description ? (
                      <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      className="min-h-[44px] text-base"
                      onClick={() => insertItem(item, false)}
                    >
                      Insert value
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-[44px] text-base"
                      onClick={() => insertItem(item, true)}
                    >
                      Insert token
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <Button type="button" variant="outline" className="min-h-[44px] text-base" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
