import { useEffect, useState } from 'react';
import { ImagePlus, Pencil, Plus, Trash2 } from 'lucide-react';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { SortableTableHead } from '@/components/oww/SortableTableHead';
import { TableSearchFilter } from '@/components/oww/TableSearchFilter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTableControls } from '@/hooks/useTableControls';
import { api } from '@/lib/api';
import { uploadCmsMedia, listCmsMedia } from '@/services/adminService';
import type { MediaAsset } from '@/types';
import { cn } from '@/lib/utils';

type SlideScope = 'home' | 'career' | 'hire' | 'educate' | 'ambassador';

const SCOPE_TABS: { id: SlideScope; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'career', label: 'Career' },
  { id: 'hire', label: 'Hire' },
  { id: 'educate', label: 'Educate' },
  { id: 'ambassador', label: 'Ambassador' },
];

type Slide = {
  id: number;
  state_code: string;
  scope: SlideScope | string;
  kicker: string;
  title: string;
  body: string;
  image_url: string;
  image_alt: string;
  cta_label: string | null;
  cta_href: string | null;
  sort_order: number;
  is_active: boolean;
};

type Draft = {
  id?: number;
  state_code: string;
  scope: SlideScope;
  kicker: string;
  title: string;
  body: string;
  image_url: string;
  image_alt: string;
  cta_label: string;
  cta_href: string;
  sort_order: number;
  is_active: boolean;
};

const emptyDraft = (scope: SlideScope): Draft => ({
  state_code: 'NY',
  scope,
  kicker: '',
  title: '',
  body: '',
  image_url: '',
  image_alt: '',
  cta_label: '',
  cta_href: '',
  sort_order: 100,
  is_active: true,
});

export default function AdminHomeSlidesPage() {
  const [scope, setScope] = useState<SlideScope>('home');
  const [slides, setSlides] = useState<Slide[]>([]);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => emptyDraft('home'));
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const table = useTableControls({
    rows: slides,
    initialSortKey: 'sort_order',
    initialSortDir: 'asc',
    getValue: (row, key) => {
      if (key === 'sort_order') return row.sort_order;
      if (key === 'title') return row.title;
      if (key === 'is_active') return row.is_active ? 1 : 0;
      return '';
    },
    getSearchText: row =>
      [row.kicker, row.title, row.body, row.cta_label, row.cta_href, row.image_alt]
        .filter(Boolean)
        .join(' '),
  });

  async function load(activeScope: SlideScope = scope) {
    setLoading(true);
    setError(null);
    try {
      const [{ data }, assets] = await Promise.all([
        api.get('/admin/home-slides', { params: { state_code: 'NY', scope: activeScope } }),
        listCmsMedia().catch(() => [] as MediaAsset[]),
      ]);
      setSlides(data.slides || []);
      setMedia(
        assets.filter(a => (a.kind || '') === 'image' || (a.content_type || '').startsWith('image/'))
      );
    } catch {
      setError('Could not load hero slides.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(scope);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when scope tab changes
  }, [scope]);

  function openCreate() {
    setDraft(emptyDraft(scope));
    setOpen(true);
  }

  function openEdit(s: Slide) {
    setDraft({
      ...s,
      scope: (s.scope as SlideScope) || scope,
      cta_label: s.cta_label || '',
      cta_href: s.cta_href || '',
    });
    setOpen(true);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      if (!draft.title.trim() || !draft.image_url.trim()) {
        setError('Title and image are required.');
        setSaving(false);
        return;
      }
      const payload = { ...draft, scope };
      if (draft.id) {
        await api.patch(`/admin/home-slides/${draft.id}`, payload);
      } else {
        await api.post('/admin/home-slides', payload);
      }
      setOpen(false);
      await load(scope);
    } catch {
      setError('Could not save slide.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!window.confirm('Delete this slide?')) return;
    await api.delete(`/admin/home-slides/${id}`);
    await load(scope);
  }

  async function onUpload(file: File) {
    const asset = await uploadCmsMedia(file, draft.state_code);
    setDraft(d => ({
      ...d,
      image_url: asset.url || '',
      image_alt: d.image_alt || asset.original_name || file.name,
    }));
    setMedia(m => [asset, ...m]);
  }

  const scopeLabel = SCOPE_TABS.find(t => t.id === scope)?.label || 'Home';

  return (
    <div className="space-y-6">
      <OwwPageHero
        eyebrow="Content"
        title="Hero slides"
        description="Full-width sliders for the public home and each pathway. Edit kicker, headline, body, image, and optional button label/link per slide."
        actions={
          <Button className="min-h-[44px] bg-oww-cyan text-base text-white hover:bg-sky-700" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add slide
          </Button>
        }
      />

      <div className="flex flex-wrap gap-1 border-b border-slate-200" role="tablist" aria-label="Slide scope">
        {SCOPE_TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={scope === tab.id}
            className={cn(
              'min-h-[44px] px-4 text-base font-semibold transition-colors',
              scope === tab.id
                ? 'border-b-2 border-oww-cyan text-oww-navy'
                : 'text-slate-600 hover:text-oww-navy'
            )}
            onClick={() => setScope(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-base text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      <TableSearchFilter
        value={table.filter}
        onChange={table.setFilter}
        resultCount={table.resultCount}
        totalCount={table.totalCount}
        placeholder={`Filter ${scopeLabel.toLowerCase()} slides…`}
      />

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-6 text-base text-slate-600">Loading slides…</p>
        ) : slides.length === 0 ? (
          <p className="p-6 text-base text-slate-600">No slides yet for {scopeLabel}. Add one to populate this slider.</p>
        ) : table.rows.length === 0 ? (
          <p className="p-6 text-base text-slate-600">No slides match this filter.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead
                  column="sort_order"
                  label="Order"
                  sortKey={table.sortKey}
                  sortDir={table.sortDir}
                  onSort={table.toggleSort}
                />
                <TableHead className="text-base">Preview</TableHead>
                <SortableTableHead
                  column="title"
                  label="Tiers"
                  sortKey={table.sortKey}
                  sortDir={table.sortDir}
                  onSort={table.toggleSort}
                />
                <SortableTableHead
                  column="is_active"
                  label="Status"
                  sortKey={table.sortKey}
                  sortDir={table.sortDir}
                  onSort={table.toggleSort}
                />
                <TableHead className="text-base">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.rows.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="text-base tabular-nums">{s.sort_order}</TableCell>
                  <TableCell>
                    <img src={s.image_url} alt="" className="h-16 w-28 rounded-md object-cover" />
                  </TableCell>
                  <TableCell className="max-w-md">
                    <p className="text-sm font-semibold uppercase tracking-wide text-oww-cyan">{s.kicker}</p>
                    <p className="font-display text-lg font-semibold text-oww-navy">{s.title}</p>
                    <p className="line-clamp-2 text-base text-slate-600">{s.body}</p>
                    {s.cta_label ? (
                      <p className="mt-1 text-sm text-slate-500">
                        CTA: {s.cta_label}
                        {s.cta_href ? ` → ${s.cta_href}` : ''}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 text-sm font-semibold',
                        s.is_active ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      )}
                    >
                      {s.is_active ? 'Active' : 'Hidden'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" className="h-11 w-11 p-0" aria-label="Edit" onClick={() => openEdit(s)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" className="h-11 w-11 p-0 text-red-700" aria-label="Delete" onClick={() => void remove(s.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{draft.id ? 'Edit slide' : 'Add slide'}</DialogTitle>
            <DialogDescription className="text-base">
              Scope: <strong>{scopeLabel}</strong>. Tier 1 = kicker · Tier 2 = headline · Tier 3 = body. Optional button uses{' '}
              {'{state}'} in the link.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-base">Scope</Label>
              <Input className="mt-1 min-h-[44px] text-base" value={scopeLabel} readOnly />
            </div>
            <div>
              <Label className="text-base">Tier 1 — Kicker</Label>
              <Input
                className="mt-1 min-h-[44px] text-base"
                value={draft.kicker}
                onChange={e => setDraft({ ...draft, kicker: e.target.value })}
                placeholder="e.g. Explore careers"
              />
            </div>
            <div>
              <Label className="text-base">Tier 2 — Headline</Label>
              <Input
                className="mt-1 min-h-[44px] text-base"
                value={draft.title}
                onChange={e => setDraft({ ...draft, title: e.target.value })}
                placeholder="Short headline"
              />
            </div>
            <div>
              <Label className="text-base">Tier 3 — Body</Label>
              <Textarea
                className="mt-1 min-h-[96px] text-base"
                value={draft.body}
                onChange={e => setDraft({ ...draft, body: e.target.value })}
                placeholder="One or two sentences"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-base">Button label</Label>
                <Input
                  className="mt-1 min-h-[44px] text-base"
                  value={draft.cta_label}
                  onChange={e => setDraft({ ...draft, cta_label: e.target.value })}
                  placeholder="e.g. Browse jobs"
                />
              </div>
              <div>
                <Label className="text-base">Button link</Label>
                <Input
                  className="mt-1 min-h-[44px] text-base"
                  value={draft.cta_href}
                  onChange={e => setDraft({ ...draft, cta_href: e.target.value })}
                  placeholder="/{state}/jobs"
                />
                <p className="mt-1 text-sm text-slate-500">Use {'{state}'} for the jurisdiction slug.</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-base">Image</Label>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" className="min-h-[44px] text-base" onClick={() => setPickerOpen(true)}>
                  <ImagePlus className="mr-2 h-4 w-4" />
                  Media library
                </Button>
                <label className="inline-flex min-h-[44px] cursor-pointer items-center rounded-md border border-slate-200 px-4 text-base hover:bg-slate-50">
                  Upload file
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) void onUpload(f);
                    }}
                  />
                </label>
              </div>
              <Input
                className="min-h-[44px] text-base"
                value={draft.image_url}
                onChange={e => setDraft({ ...draft, image_url: e.target.value })}
                placeholder="/pathways/stage/… or uploaded media URL"
              />
              {draft.image_url ? (
                <img src={draft.image_url} alt="" className="mt-2 h-36 w-full rounded-lg object-cover" />
              ) : null}
              <Input
                className="min-h-[44px] text-base"
                value={draft.image_alt}
                onChange={e => setDraft({ ...draft, image_alt: e.target.value })}
                placeholder="Image alt text"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-base">Sort order</Label>
                <Input
                  type="number"
                  className="mt-1 min-h-[44px] text-base"
                  value={draft.sort_order}
                  onChange={e => setDraft({ ...draft, sort_order: Number(e.target.value) || 0 })}
                />
              </div>
              <label className="mt-7 flex min-h-[44px] items-center gap-2 text-base">
                <input
                  type="checkbox"
                  className="h-5 w-5"
                  checked={draft.is_active}
                  onChange={e => setDraft({ ...draft, is_active: e.target.checked })}
                />
                Active on public {scopeLabel.toLowerCase()} slider
              </label>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="min-h-[44px] text-base" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button className="min-h-[44px] bg-oww-cyan text-base text-white hover:bg-sky-700" disabled={saving} onClick={() => void save()}>
              {saving ? 'Saving…' : 'Save slide'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Choose from media library</DialogTitle>
            <DialogDescription className="text-base">Recent CMS uploads. Prefer landscape (16:9) images.</DialogDescription>
          </DialogHeader>
          <div className="grid max-h-[50vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
            {media.length === 0 ? (
              <p className="col-span-full text-base text-slate-600">No images in the library yet — upload above.</p>
            ) : (
              media.map(m => {
                return (
                  <button
                    key={m.id}
                    type="button"
                    className="overflow-hidden rounded-lg border border-slate-200 text-left hover:border-oww-cyan"
                    onClick={() => {
                      setDraft(d => ({
                        ...d,
                        image_url: m.url,
                        image_alt: d.image_alt || m.original_name || '',
                      }));
                      setPickerOpen(false);
                    }}
                  >
                    <img src={m.url} alt="" className="h-28 w-full object-cover" />
                    <p className="truncate p-2 text-sm text-slate-600">{m.original_name}</p>
                  </button>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
