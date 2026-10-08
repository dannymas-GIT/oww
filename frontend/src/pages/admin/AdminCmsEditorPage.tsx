import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowDown, ArrowLeft, ArrowUp, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { CmsSectionView } from '@/components/oww/CmsPageRenderer';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  deleteCmsPage,
  fetchCmsCatalog,
  getCmsPage,
  listCmsMedia,
  saveCmsPage,
  uploadCmsMedia,
} from '@/services/adminService';
import type { CmsSection, CmsSectionTypeMeta, CmsTemplateMeta, ContentPage, MediaAsset } from '@/types';

function blankSection(type: string): CmsSection {
  if (type === 'hero') {
    return {
      type: 'hero',
      eyebrow: '',
      headline: '',
      subhead: '',
      cta_label: '',
      cta_href: '',
      cta2_label: '',
      cta2_href: '',
      media_url: '',
      media_type: 'image',
    };
  }
  if (type === 'stats') {
    return { type: 'stats', title: '', items: [{ value: '', label: '', detail: '' }] };
  }
  if (type === 'rich_text') {
    return { type: 'rich_text', title: '', html: '<p></p>' };
  }
  if (type === 'cards') {
    return { type: 'cards', title: '', description: '', items: [{ title: '', body: '', href: '' }] };
  }
  if (type === 'media_gallery') {
    return { type: 'media_gallery', title: '', description: '', items: [{ url: '', caption: '', media_type: 'image' }] };
  }
  if (type === 'cta_band') {
    return { type: 'cta_band', title: '', body: '', cta_label: '', cta_href: '' };
  }
  if (type === 'quote') {
    return { type: 'quote', quote: '', author: '', role: '', organization: '' };
  }
  return { type };
}

const FALLBACK_SECTION_TYPES: CmsSectionTypeMeta[] = [
  { type: 'hero', label: 'Hero', description: 'Headline, supporting text, CTAs, and optional media.', fields: [] },
  { type: 'stats', label: 'Stat strip', description: 'Three or four impact numbers.', fields: [] },
  { type: 'rich_text', label: 'Rich text', description: 'Title plus HTML body (links, lists, embeds).', fields: [] },
  { type: 'cards', label: 'Card grid', description: 'Title cards with optional links (pathways, resources).', fields: [] },
  { type: 'media_gallery', label: 'Media gallery', description: 'Images, video, or audio with captions.', fields: [] },
  { type: 'cta_band', label: 'Call to action', description: 'Closing band with button.', fields: [] },
  { type: 'quote', label: 'Quote / testimonial', description: 'Pull quote with attribution.', fields: [] },
];

function sectionLabel(type: string, catalog: CmsSectionTypeMeta[]) {
  return catalog.find(s => s.type === type)?.label || String(type).replace(/_/g, ' ');
}

export default function AdminCmsEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const pageId = Number(id);
  const [page, setPage] = useState<ContentPage | null>(null);
  const [sectionTypes, setSectionTypes] = useState<CmsSectionTypeMeta[]>([]);
  const [templates, setTemplates] = useState<CmsTemplateMeta[]>([]);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addType, setAddType] = useState('rich_text');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const sections = useMemo(() => page?.sections || [], [page]);
  const isBlog = page?.template === 'blog_post';
  const state = (page?.state_code || 'ny').toLowerCase();

  const allowedSectionTypes = useMemo(() => {
    const catalog = sectionTypes.length ? sectionTypes : FALLBACK_SECTION_TYPES;
    const tpl = templates.find(t => t.id === page?.template);
    const allowed = tpl?.section_types;
    if (!allowed?.length) return catalog;
    return catalog.filter(s => allowed.includes(s.type));
  }, [sectionTypes, templates, page?.template]);

  useEffect(() => {
    if (!pageId) return;
    void Promise.all([getCmsPage(pageId), fetchCmsCatalog(), listCmsMedia()])
      .then(([p, cat, m]) => {
        setPage({ ...p, sections: p.sections || [] });
        setSectionTypes(cat.section_types || []);
        setTemplates(cat.templates || []);
        setMedia(m);
        const tpl = (cat.templates || []).find(t => t.id === p.template);
        const first = tpl?.section_types?.[0] || cat.section_types?.[0]?.type || 'rich_text';
        setAddType(first);
      })
      .catch(() => setError('Could not load page.'));
  }, [pageId]);

  useEffect(() => {
    if (!allowedSectionTypes.some(s => s.type === addType) && allowedSectionTypes[0]) {
      setAddType(allowedSectionTypes[0].type);
    }
  }, [allowedSectionTypes, addType]);

  function updateSection(index: number, patch: Partial<CmsSection>) {
    setPage(prev => {
      if (!prev) return prev;
      const next = [...(prev.sections || [])];
      next[index] = { ...next[index], ...patch };
      return { ...prev, sections: next };
    });
  }

  function updateItem(sectionIndex: number, itemIndex: number, patch: Record<string, string>) {
    setPage(prev => {
      if (!prev) return prev;
      const next = [...(prev.sections || [])];
      const items = [...((next[sectionIndex].items || []) as Record<string, string>[])];
      items[itemIndex] = { ...items[itemIndex], ...patch };
      next[sectionIndex] = { ...next[sectionIndex], items };
      return { ...prev, sections: next };
    });
  }

  function moveSection(index: number, direction: -1 | 1) {
    setPage(prev => {
      if (!prev) return prev;
      const list = [...(prev.sections || [])];
      const target = index + direction;
      if (target < 0 || target >= list.length) return prev;
      const tmp = list[index];
      list[index] = list[target];
      list[target] = tmp;
      return { ...prev, sections: list };
    });
    setSelectedIndex(prev => {
      if (prev == null) return prev;
      if (prev === index) return index + direction;
      if (prev === index + direction) return index;
      return prev;
    });
  }

  function removeSection(index: number) {
    setPage(prev => {
      if (!prev) return prev;
      return { ...prev, sections: (prev.sections || []).filter((_, i) => i !== index) };
    });
    setSelectedIndex(prev => {
      if (prev == null) return prev;
      if (prev === index) return null;
      if (prev > index) return prev - 1;
      return prev;
    });
  }

  async function onSave(publish?: boolean) {
    if (!page) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const saved = await saveCmsPage({
        id: page.id,
        title: page.title,
        slug: page.slug,
        template: page.template,
        state_code: page.state_code,
        summary: page.summary || page.excerpt || undefined,
        pathway: page.pathway || undefined,
        sections: page.sections || [],
        published: publish ?? page.published,
        author_name: page.author_name || undefined,
        tags: page.tags || [],
        published_at: page.published_at || undefined,
      });
      setPage({ ...saved, sections: saved.sections || [] });
      setMessage(publish ? 'Published to the live site.' : 'Draft saved.');
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Save failed.');
    } finally {
      setBusy(false);
    }
  }

  async function onUpload(file: File, sectionIndex?: number, itemIndex?: number) {
    setBusy(true);
    setError(null);
    try {
      const asset = await uploadCmsMedia(file, page?.state_code);
      setMedia(m => [asset, ...m]);
      if (sectionIndex != null) {
        const sec = sections[sectionIndex];
        if (sec.type === 'hero') {
          updateSection(sectionIndex, { media_url: asset.url, media_type: asset.kind });
        } else if (sec.type === 'media_gallery' && itemIndex != null) {
          updateItem(sectionIndex, itemIndex, { url: asset.url, media_type: asset.kind });
        }
      }
      setMessage(`Uploaded ${asset.original_name}`);
    } catch {
      setError('Upload failed. Check file type and size (max 80 MB).');
    } finally {
      setBusy(false);
    }
  }

  if (!page) {
    return (
      <div className="space-y-4">
        <p className="text-base text-slate-700">{error || 'Loading…'}</p>
        <Button variant="outline" className="min-h-[44px] text-base" asChild>
          <Link to="/admin/cms">Back</Link>
        </Button>
      </div>
    );
  }

  const livePath = isBlog
    ? `/${state}/blog/${page.slug}`
    : `/${state}${page.slug === 'home' ? '' : `/${page.slug}`}`;

  const selectedAddMeta = allowedSectionTypes.find(s => s.type === addType);

  return (
    <div className="space-y-6">
      <Button variant="ghost" className="min-h-[44px] px-0 text-base text-sky-800" asChild>
        <Link to="/admin/cms">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {isBlog ? 'All blog posts' : 'All landing pages'}
        </Link>
      </Button>

      <OwwPageHero
        eyebrow={page.published ? 'Published' : 'Draft'}
        title={page.title || (isBlog ? 'Untitled post' : 'Untitled page')}
        description={`Template: ${page.template} · Live layout below matches the public site · /${page.slug}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button className="min-h-[44px] text-base" disabled={busy} onClick={() => void onSave(false)}>
              Save draft
            </Button>
            <Button className="min-h-[44px] bg-oww-cyan text-base hover:bg-sky-700" disabled={busy} onClick={() => void onSave(true)}>
              Publish
            </Button>
            {page.published ? (
              <Button variant="outline" className="min-h-[44px] text-base" asChild>
                <Link to={livePath} target="_blank">
                  View live
                </Link>
              </Button>
            ) : null}
          </div>
        }
      />

      {message ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-base text-emerald-900">{message}</p> : null}
      {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-base text-red-800">{error}</p> : null}

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="font-display text-lg">{isBlog ? 'Post settings' : 'Page settings'}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label className="text-base">Title</Label>
            <Input className="min-h-[44px] text-base" value={page.title} onChange={e => setPage({ ...page, title: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label className="text-base">Slug</Label>
            <Input className="min-h-[44px] text-base" value={page.slug} onChange={e => setPage({ ...page, slug: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label className="text-base">State</Label>
            <Input
              maxLength={2}
              className="min-h-[44px] text-base uppercase"
              value={page.state_code || 'NY'}
              onChange={e => setPage({ ...page, state_code: e.target.value.toUpperCase() })}
            />
          </div>
          {isBlog ? (
            <>
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-base">Excerpt</Label>
                <Input
                  className="min-h-[44px] text-base"
                  value={page.summary || page.excerpt || ''}
                  onChange={e => setPage({ ...page, summary: e.target.value, excerpt: e.target.value })}
                  placeholder="Short teaser shown on the blog index"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-base">Author</Label>
                <Input
                  className="min-h-[44px] text-base"
                  value={page.author_name || ''}
                  onChange={e => setPage({ ...page, author_name: e.target.value })}
                  placeholder="Jenny Ingrao-Aman"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-base">Publish date</Label>
                <Input
                  type="datetime-local"
                  className="min-h-[44px] text-base"
                  value={page.published_at ? new Date(page.published_at).toISOString().slice(0, 16) : ''}
                  onChange={e =>
                    setPage({
                      ...page,
                      published_at: e.target.value ? new Date(e.target.value).toISOString() : null,
                    })
                  }
                />
                <p className="text-sm text-slate-600">Leave blank to set automatically on first publish.</p>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-base">Tags</Label>
                <Input
                  className="min-h-[44px] text-base"
                  value={(page.tags || []).join(', ')}
                  onChange={e =>
                    setPage({
                      ...page,
                      tags: e.target.value
                        .split(/[,#]/)
                        .map(t => t.trim().toLowerCase())
                        .filter(Boolean),
                    })
                  }
                  placeholder="workforce, training, nysawwa"
                />
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[12rem] flex-1 space-y-2 sm:max-w-xs">
            <Label className="text-base" htmlFor="cms-add-section">
              Add section
            </Label>
            <select
              id="cms-add-section"
              className="min-h-[44px] w-full rounded-md border border-slate-300 bg-white px-3 text-base"
              value={addType}
              onChange={e => setAddType(e.target.value)}
              aria-describedby="cms-add-section-help"
            >
              {allowedSectionTypes.map(s => (
                <option key={s.type} value={s.type}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <Button
            className="min-h-[44px] text-base"
            onClick={() => {
              setPage(prev =>
                prev ? { ...prev, sections: [...(prev.sections || []), blankSection(addType)] } : prev
              );
              setSelectedIndex(sections.length);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add section
          </Button>
        </div>
        <p id="cms-add-section-help" className="text-base text-slate-600">
          {selectedAddMeta?.description || 'Choose a section type allowed by this template.'}
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl text-oww-navy">Public page layout</h2>
          <p className="text-base text-slate-600">Click a block to edit · use arrows to place it</p>
        </div>

        {sections.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <p className="text-lg text-slate-700">No sections yet — add one above to start the public layout.</p>
          </div>
        ) : (
          <div className="space-y-6 rounded-2xl border border-slate-200 bg-[#f4f7fb] p-4 md:p-6">
            {sections.map((section, idx) => {
              const selected = selectedIndex === idx;
              return (
                <div
                  key={`${section.type}-${idx}`}
                  className={cn(
                    'rounded-2xl border-2 bg-transparent transition',
                    selected ? 'border-oww-cyan shadow-md' : 'border-transparent hover:border-slate-300'
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-t-xl bg-white/95 px-3 py-2 border-b border-slate-200">
                    <button
                      type="button"
                      className="inline-flex min-h-[44px] items-center gap-2 text-base font-semibold text-oww-navy"
                      onClick={() => setSelectedIndex(selected ? null : idx)}
                    >
                      <Pencil className="h-4 w-4 text-oww-cyan" />
                      {idx + 1}. {sectionLabel(String(section.type), allowedSectionTypes)}
                      <span className="font-normal text-slate-500">{selected ? '(editing)' : '(click to edit)'}</span>
                    </button>
                    <div className="flex flex-wrap gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        className="min-h-[44px] min-w-[44px] px-3 text-base"
                        disabled={idx === 0}
                        aria-label="Move section up"
                        onClick={() => moveSection(idx, -1)}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="min-h-[44px] min-w-[44px] px-3 text-base"
                        disabled={idx === sections.length - 1}
                        aria-label="Move section down"
                        onClick={() => moveSection(idx, 1)}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="min-h-[44px] text-base text-red-700"
                        onClick={() => removeSection(idx)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  </div>

                  <div
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer p-3 text-left md:p-4"
                    onClick={() => setSelectedIndex(idx)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedIndex(idx);
                      }
                    }}
                    aria-label={`Select ${sectionLabel(String(section.type), allowedSectionTypes)} section`}
                  >
                    <CmsSectionView section={section} state={state} interactive={false} />
                  </div>

                  {selected ? (
                    <div className="space-y-3 border-t border-slate-200 bg-white p-4">
                      <p className="text-base font-semibold text-oww-navy">Edit this block</p>
                      <SectionFields
                        section={section}
                        index={idx}
                        updateSection={updateSection}
                        updateItem={updateItem}
                        onUpload={onUpload}
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="font-display text-lg">Media library</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-md border border-slate-300 px-4 text-base">
            <Upload className="h-4 w-4" />
            Upload media (image, video, audio, PDF, Office)
            <input
              type="file"
              className="hidden"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) void onUpload(f);
              }}
            />
          </label>
          <ul className="space-y-2 text-base">
            {media.slice(0, 20).map(m => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 px-3 py-2">
                <span className="truncate">
                  {m.original_name} · {m.kind} · {Math.round(m.size_bytes / 1024)} KB
                </span>
                <Button
                  variant="outline"
                  className="min-h-[44px] text-base"
                  onClick={() => {
                    void navigator.clipboard.writeText(m.url);
                    setMessage('Media URL copied — paste into a section field.');
                  }}
                >
                  Copy URL
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {page.slug !== 'home' ? (
        <Button
          variant="outline"
          className="min-h-[44px] text-base text-red-700"
          disabled={busy}
          onClick={async () => {
            if (!window.confirm(isBlog ? 'Delete this post?' : 'Delete this page?')) return;
            await deleteCmsPage(page.id);
            navigate('/admin/cms');
          }}
        >
          {isBlog ? 'Delete post' : 'Delete page'}
        </Button>
      ) : null}
    </div>
  );
}

function SectionFields({
  section,
  index,
  updateSection,
  updateItem,
  onUpload,
}: {
  section: CmsSection;
  index: number;
  updateSection: (index: number, patch: Partial<CmsSection>) => void;
  updateItem: (sectionIndex: number, itemIndex: number, patch: Record<string, string>) => void;
  onUpload: (file: File, sectionIndex?: number, itemIndex?: number) => Promise<void>;
}) {
  if (section.type === 'hero') {
    return (
      <>
        {(['eyebrow', 'headline', 'subhead', 'cta_label', 'cta_href', 'cta2_label', 'cta2_href'] as const).map(field => (
          <div key={field} className="space-y-1">
            <Label className="text-base capitalize">{field.replace('_', ' ')}</Label>
            <Input
              className="min-h-[44px] text-base"
              value={String(section[field] || '')}
              onChange={e => updateSection(index, { [field]: e.target.value })}
            />
          </div>
        ))}
        <div className="space-y-2">
          <Label className="text-base">Hero media URL</Label>
          <Input
            className="min-h-[44px] text-base"
            value={section.media_url || ''}
            onChange={e => updateSection(index, { media_url: e.target.value })}
            placeholder="/api/v1/public/media/…"
          />
          <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 text-base text-oww-cyan">
            <Upload className="h-4 w-4" />
            Upload image / video / audio
            <input
              type="file"
              className="hidden"
              accept="image/*,video/*,audio/*,.pdf"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) void onUpload(f, index);
              }}
            />
          </label>
        </div>
      </>
    );
  }

  if (section.type === 'rich_text') {
    return (
      <>
        <div className="space-y-1">
          <Label className="text-base">Title</Label>
          <Input
            className="min-h-[44px] text-base"
            value={section.title || ''}
            onChange={e => updateSection(index, { title: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-base">HTML body</Label>
          <textarea
            className="min-h-[160px] w-full rounded-md border border-slate-300 p-3 text-base"
            value={section.html || ''}
            onChange={e => updateSection(index, { html: e.target.value })}
          />
          <p className="text-sm text-slate-600">Use simple HTML: &lt;p&gt;, &lt;ul&gt;, &lt;a href&gt;, &lt;strong&gt;. Scripts are stripped.</p>
        </div>
      </>
    );
  }

  if (section.type === 'stats' || section.type === 'cards' || section.type === 'media_gallery') {
    return (
      <>
        <div className="space-y-1">
          <Label className="text-base">Section title</Label>
          <Input
            className="min-h-[44px] text-base"
            value={section.title || ''}
            onChange={e => updateSection(index, { title: e.target.value })}
          />
        </div>
        {(section.type === 'cards' || section.type === 'media_gallery') && (
          <div className="space-y-1">
            <Label className="text-base">Description</Label>
            <Input
              className="min-h-[44px] text-base"
              value={section.description || ''}
              onChange={e => updateSection(index, { description: e.target.value })}
            />
          </div>
        )}
        {(section.items || []).map((raw, itemIdx) => {
          const item = raw as Record<string, string>;
          return (
            <div key={itemIdx} className="space-y-2 rounded-lg border border-slate-200 p-3">
              {section.type === 'stats' ? (
                <>
                  <Input className="min-h-[44px] text-base" placeholder="Value" value={item.value || ''} onChange={e => updateItem(index, itemIdx, { value: e.target.value })} />
                  <Input className="min-h-[44px] text-base" placeholder="Label" value={item.label || ''} onChange={e => updateItem(index, itemIdx, { label: e.target.value })} />
                  <Input className="min-h-[44px] text-base" placeholder="Detail" value={item.detail || ''} onChange={e => updateItem(index, itemIdx, { detail: e.target.value })} />
                </>
              ) : null}
              {section.type === 'cards' ? (
                <>
                  <Input className="min-h-[44px] text-base" placeholder="Title" value={item.title || ''} onChange={e => updateItem(index, itemIdx, { title: e.target.value })} />
                  <Input className="min-h-[44px] text-base" placeholder="Body" value={item.body || ''} onChange={e => updateItem(index, itemIdx, { body: e.target.value })} />
                  <Input className="min-h-[44px] text-base" placeholder="Link (/{state}/…)" value={item.href || ''} onChange={e => updateItem(index, itemIdx, { href: e.target.value })} />
                </>
              ) : null}
              {section.type === 'media_gallery' ? (
                <>
                  <Input className="min-h-[44px] text-base" placeholder="Media URL" value={item.url || ''} onChange={e => updateItem(index, itemIdx, { url: e.target.value })} />
                  <Input className="min-h-[44px] text-base" placeholder="Caption" value={item.caption || ''} onChange={e => updateItem(index, itemIdx, { caption: e.target.value })} />
                  <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 text-base text-oww-cyan">
                    <Upload className="h-4 w-4" />
                    Upload media
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*,video/*,audio/*,.pdf,application/pdf"
                      onChange={e => {
                        const f = e.target.files?.[0];
                        if (f) void onUpload(f, index, itemIdx);
                      }}
                    />
                  </label>
                </>
              ) : null}
            </div>
          );
        })}
        <Button
          variant="outline"
          className="min-h-[44px] text-base"
          onClick={() => {
            const blank =
              section.type === 'stats'
                ? { value: '', label: '', detail: '' }
                : section.type === 'cards'
                  ? { title: '', body: '', href: '' }
                  : { url: '', caption: '', media_type: 'image' };
            updateSection(index, { items: [...((section.items || []) as object[]), blank] as CmsSection['items'] });
          }}
        >
          Add item
        </Button>
      </>
    );
  }

  if (section.type === 'cta_band') {
    return (
      <>
        {(['title', 'body', 'cta_label', 'cta_href'] as const).map(field => (
          <div key={field} className="space-y-1">
            <Label className="text-base capitalize">{field.replace('_', ' ')}</Label>
            <Input
              className="min-h-[44px] text-base"
              value={String(section[field] || '')}
              onChange={e => updateSection(index, { [field]: e.target.value })}
            />
          </div>
        ))}
      </>
    );
  }

  if (section.type === 'quote') {
    return (
      <>
        {(['quote', 'author', 'role', 'organization'] as const).map(field => (
          <div key={field} className="space-y-1">
            <Label className="text-base capitalize">{field}</Label>
            <Input
              className="min-h-[44px] text-base"
              value={String(section[field] || '')}
              onChange={e => updateSection(index, { [field]: e.target.value })}
            />
          </div>
        ))}
      </>
    );
  }

  return <p className="text-base text-slate-600">No editable fields for this section type.</p>;
}
