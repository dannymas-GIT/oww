import { useEffect, useState } from 'react';
import { ImagePlus, Pencil, Plus, Trash2 } from 'lucide-react';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
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
import { api } from '@/lib/api';
import { uploadCmsMedia, listCmsMedia } from '@/services/adminService';
import type { MediaAsset } from '@/types';
import { cn } from '@/lib/utils';

type Slide = {
  id: number;
  state_code: string;
  kicker: string;
  title: string;
  body: string;
  image_url: string;
  image_alt: string;
  sort_order: number;
  is_active: boolean;
};

type Draft = {
  id?: number;
  state_code: string;
  kicker: string;
  title: string;
  body: string;
  image_url: string;
  image_alt: string;
  sort_order: number;
  is_active: boolean;
};

const emptyDraft = (): Draft => ({
  state_code: 'NY',
  kicker: '',
  title: '',
  body: '',
  image_url: '',
  image_alt: '',
  sort_order: 100,
  is_active: true,
});

export default function AdminHomeSlidesPage() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [{ data }, assets] = await Promise.all([
        api.get('/admin/home-slides', { params: { state_code: 'NY' } }),
        listCmsMedia().catch(() => [] as MediaAsset[]),
      ]);
      setSlides(data.slides || []);
      setMedia(
        assets.filter(a => (a.kind || '') === 'image' || (a.content_type || '').startsWith('image/'))
      );
    } catch {
      setError('Could not load home slides.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function openCreate() {
    setDraft(emptyDraft());
    setOpen(true);
  }

  function openEdit(s: Slide) {
    setDraft({ ...s });
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
      if (draft.id) {
        await api.patch(`/admin/home-slides/${draft.id}`, draft);
      } else {
        await api.post('/admin/home-slides', draft);
      }
      setOpen(false);
      await load();
    } catch {
      setError('Could not save slide.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!window.confirm('Delete this slide?')) return;
    await api.delete(`/admin/home-slides/${id}`);
    await load();
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

  return (
    <div className="space-y-6">
      <OwwPageHero
        eyebrow="Content"
        title="Home rotator slides"
        description="Three tiers per slide — kicker, headline, and body — plus an image. Shown on the public home right panel. Upload your own photos or pick from the media library; stock search (Unsplash/Pexels) can plug in later with an API key."
        actions={
          <Button className="min-h-[44px] bg-oww-cyan text-base text-white hover:bg-sky-700" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add slide
          </Button>
        }
      />

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-base text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-6 text-base text-slate-600">Loading slides…</p>
        ) : slides.length === 0 ? (
          <p className="p-6 text-base text-slate-600">No slides yet. Add one to populate the home rotator.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-base">Order</TableHead>
                <TableHead className="text-base">Preview</TableHead>
                <TableHead className="text-base">Tiers</TableHead>
                <TableHead className="text-base">Status</TableHead>
                <TableHead className="text-base">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slides.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="text-base tabular-nums">{s.sort_order}</TableCell>
                  <TableCell>
                    <img src={s.image_url} alt="" className="h-16 w-28 rounded-md object-cover" />
                  </TableCell>
                  <TableCell className="max-w-md">
                    <p className="text-sm font-semibold uppercase tracking-wide text-oww-cyan">{s.kicker}</p>
                    <p className="font-display text-lg font-semibold text-oww-navy">{s.title}</p>
                    <p className="line-clamp-2 text-base text-slate-600">{s.body}</p>
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
              Tier 1 = kicker · Tier 2 = headline · Tier 3 = body. Image sits below the copy on the public rotator.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-base">Tier 1 — Kicker</Label>
              <Input
                className="mt-1 min-h-[44px] text-base"
                value={draft.kicker}
                onChange={e => setDraft({ ...draft, kicker: e.target.value })}
                placeholder="e.g. Drinking water quality"
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
                placeholder="/home/stage/… or uploaded media URL"
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
              <p className="text-sm text-slate-500">
                Stock photos: paste an Unsplash/Pexels URL for now, or upload. A licensed search panel can use{' '}
                <code className="rounded bg-slate-100 px-1">UNSPLASH_ACCESS_KEY</code> /{' '}
                <code className="rounded bg-slate-100 px-1">PEXELS_API_KEY</code> when you are ready.
              </p>
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
                Active on public home
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
