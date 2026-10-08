import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CircleHelp } from 'lucide-react';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { OwwEmptyState } from '@/components/oww/OwwEmptyState';
import {
  CmsTemplateLayoutThumb,
  templateDisplayLabel,
} from '@/components/oww/CmsTemplateLayoutPreview';
import { requestOpenTour } from '@/components/oww/OwwTourOverlay';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { fetchCmsCatalog, listCmsPages, saveCmsPage } from '@/services/adminService';
import type { CmsTemplateMeta, ContentPage } from '@/types';

type CmsKind = 'page' | 'blog';

const TEMPLATE_FALLBACKS: CmsTemplateMeta[] = [
  {
    id: 'home_landing',
    label: 'Home landing',
    description: 'Full state home: hero, mission stats, pathway cards, media, and CTA.',
    when_to_use:
      'Use once per state for the main public home (usually slug “home” → /ny). Start here for the NYSAWWA front door.',
    example_url: '/ny',
    suggested_slug: 'home',
    section_types: [],
  },
  {
    id: 'pathway_landing',
    label: 'Pathway landing',
    description: 'Career / Hire / Educate / Ambassador doorway pages.',
    when_to_use:
      'Use for each pathway people choose from the home page. Slugs should match the nav: career, hire, educate, or ambassador.',
    example_url: '/ny/career',
    suggested_slug: 'career',
    section_types: [],
  },
  {
    id: 'story_feature',
    label: 'Story / feature',
    description: 'Narrative page with hero media, rich body, gallery, and quote.',
    when_to_use:
      'Use for a one-off campaign, success story, or featured spotlight that is not a pathway and not an ongoing series.',
    example_url: '/ny/story',
    suggested_slug: 'story',
    section_types: [],
  },
  {
    id: 'simple_page',
    label: 'Simple page',
    description: 'Lightweight page: optional hero, rich text, media, and CTA.',
    when_to_use:
      'Use for short static content—FAQ, about NYSAWWA, partner blurb—when you do not need pathway cards or a blog feed.',
    example_url: '/ny/about',
    suggested_slug: 'page',
    section_types: [],
  },
  {
    id: 'blog_post',
    label: 'Blog post',
    description: 'Dated post with author and tags, listed on the public blog index.',
    when_to_use:
      'Use for running topics and ongoing updates (grant news, workforce tips, event recaps). Create these from the Blog tab.',
    example_url: '/ny/blog/my-topic',
    suggested_slug: 'my-topic',
    section_types: [],
    kind: 'blog',
  },
];

function isBlogTemplate(template?: string) {
  return template === 'blog_post';
}

function livePath(p: ContentPage) {
  const state = (p.state_code || 'ny').toLowerCase();
  if (isBlogTemplate(p.template)) return `/${state}/blog/${p.slug}`;
  return `/${state}${p.slug === 'home' ? '' : `/${p.slug}`}`;
}

function enrichTemplate(t: CmsTemplateMeta): CmsTemplateMeta {
  const fallback = TEMPLATE_FALLBACKS.find(f => f.id === t.id);
  return {
    ...fallback,
    ...t,
    when_to_use: t.when_to_use || fallback?.when_to_use,
    example_url: t.example_url || fallback?.example_url,
    description: t.description || fallback?.description || '',
  };
}

export default function AdminCmsPage() {
  const [pages, setPages] = useState<ContentPage[]>([]);
  const [templates, setTemplates] = useState<CmsTemplateMeta[]>([]);
  const [kind, setKind] = useState<CmsKind>('page');
  const [createOpen, setCreateOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', slug: '', template: 'home_landing', state_code: 'NY' });

  const enriched = useMemo(() => templates.map(enrichTemplate), [templates]);
  const pageTemplates = useMemo(
    () =>
      (enriched.length ? enriched : TEMPLATE_FALLBACKS).filter(
        t => t.kind !== 'blog' && t.id !== 'blog_post'
      ),
    [enriched]
  );
  const blogTemplates = useMemo(
    () =>
      (enriched.length ? enriched : TEMPLATE_FALLBACKS).filter(
        t => t.id === 'blog_post' || t.kind === 'blog'
      ),
    [enriched]
  );
  const createChoices = kind === 'blog' ? blogTemplates : pageTemplates;
  const selectedMeta = createChoices.find(t => t.id === form.template) || createChoices[0];
  const visible = useMemo(
    () => pages.filter(p => (isBlogTemplate(p.template) ? kind === 'blog' : kind === 'page')),
    [pages, kind]
  );

  async function load() {
    const [p, cat] = await Promise.all([listCmsPages('all'), fetchCmsCatalog()]);
    setPages(p);
    setTemplates(cat.templates || []);
  }

  useEffect(() => {
    void load().catch(() => setPages([]));
  }, []);

  function openCreate(nextKind: CmsKind) {
    setKind(nextKind);
    const pool =
      nextKind === 'blog'
        ? blogTemplates.length
          ? blogTemplates
          : TEMPLATE_FALLBACKS.filter(t => t.kind === 'blog')
        : pageTemplates.length
          ? pageTemplates
          : TEMPLATE_FALLBACKS.filter(t => t.kind !== 'blog');
    const defaultTpl = pool[0];
    setForm({
      title: '',
      slug: defaultTpl?.suggested_slug || (nextKind === 'blog' ? 'my-topic' : 'home'),
      template: defaultTpl?.id || (nextKind === 'blog' ? 'blog_post' : 'home_landing'),
      state_code: 'NY',
    });
    setError(null);
    setCreateOpen(true);
  }

  function selectTemplate(t: CmsTemplateMeta) {
    setForm(f => ({
      ...f,
      template: t.id,
      slug: t.suggested_slug || f.slug,
    }));
  }

  return (
    <div className="space-y-6">
      <OwwPageHero
        eyebrow="Administration"
        title={kind === 'blog' ? 'Blog posts' : 'Landing pages'}
        description={
          kind === 'blog'
            ? 'Running topics and updates — published posts appear on the public /blog index.'
            : 'Choose a layout template, drop in copy and media, and publish to the OWW public site.'
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="min-h-[44px] border-white/40 bg-white/10 text-base text-white hover:bg-white/20 hover:text-white"
              onClick={() => requestOpenTour('oww:tour:cms')}
            >
              <CircleHelp className="mr-2 h-4 w-4" />
              Template tour
            </Button>
            <Button data-tour="cms-new" className="min-h-[44px] text-base" onClick={() => openCreate(kind)}>
              {kind === 'blog' ? 'New post' : 'New page'}
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Content type" data-tour="cms-kind-tabs">
        <Button
          role="tab"
          aria-selected={kind === 'page'}
          variant={kind === 'page' ? 'default' : 'outline'}
          className="min-h-[44px] text-base"
          onClick={() => setKind('page')}
        >
          Landing pages
        </Button>
        <Button
          role="tab"
          aria-selected={kind === 'blog'}
          variant={kind === 'blog' ? 'default' : 'outline'}
          className="min-h-[44px] text-base"
          onClick={() => setKind('blog')}
        >
          Blog
        </Button>
      </div>

      {visible.length === 0 ? (
        <OwwEmptyState
          title={kind === 'blog' ? 'No blog posts yet' : 'No landing pages yet'}
          description={
            kind === 'blog'
              ? 'Create a post to keep a running topic or update on the public site.'
              : 'Create a home or pathway page from a template.'
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {visible.map(p => {
            const tplId = p.template || 'simple_page';
            const tplLabel = templateDisplayLabel(
              tplId,
              enriched.find(t => t.id === tplId)?.label
            );
            return (
              <Card key={p.id} className="border-slate-200">
                <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                  <CmsTemplateLayoutThumb templateId={tplId} label={tplLabel} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <CardTitle className="font-display text-lg text-oww-navy">{p.title}</CardTitle>
                      <Badge variant="secondary">{p.published ? 'Published' : 'Draft'}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      /{p.slug} · {p.state_code || 'NY'} · {tplLabel}
                      {isBlogTemplate(p.template) && p.author_name ? ` · ${p.author_name}` : ''}
                    </p>
                    {isBlogTemplate(p.template) && (p.tags || []).length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(p.tags || []).slice(0, 4).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-sm font-normal">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button className="min-h-[44px] text-base" asChild>
                    <Link to={`/admin/cms/${p.id}`}>Edit</Link>
                  </Button>
                  {p.published ? (
                    <Button variant="outline" className="min-h-[44px] text-base" asChild>
                      <Link to={livePath(p)} target="_blank">
                        View live
                      </Link>
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {kind === 'blog' ? 'New blog post' : 'New landing page'}
            </DialogTitle>
            <DialogDescription className="text-base">
              {kind === 'blog'
                ? 'Blog posts are dated running topics. They appear on /ny/blog with author and tags. Hover a layout thumbnail for a larger sample.'
                : 'Hover a layout thumbnail for a larger sample of the public page structure, then pick the template that fits.'}
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-5"
            onSubmit={async e => {
              e.preventDefault();
              setBusy(true);
              setError(null);
              try {
                const created = await saveCmsPage({
                  title: form.title.trim() || 'Untitled',
                  slug: form.slug.trim().toLowerCase() || undefined,
                  template: form.template,
                  state_code: form.state_code.toUpperCase(),
                  published: false,
                });
                setCreateOpen(false);
                window.location.assign(`/admin/cms/${created.id}`);
              } catch (err) {
                const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
                setError(typeof detail === 'string' ? detail : 'Could not create page.');
              } finally {
                setBusy(false);
              }
            }}
          >
            <fieldset className="space-y-3">
              <legend className="text-base font-semibold text-oww-navy">
                {kind === 'blog' ? 'Post type' : 'Which template fits?'}
              </legend>
              <div className="grid gap-3" role="radiogroup" aria-label="Template">
                {createChoices.map(t => {
                  const selected = form.template === t.id;
                  return (
                    <div
                      key={t.id}
                      className={cn(
                        'flex gap-3 rounded-xl border-2 p-3 transition sm:p-4',
                        selected
                          ? 'border-oww-cyan bg-[#e8f0ff] shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      )}
                    >
                      <CmsTemplateLayoutThumb templateId={t.id} label={t.label} selected={selected} />
                      <button
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => selectTemplate(t)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="font-display text-lg font-semibold text-oww-navy">{t.label}</p>
                          {t.example_url ? (
                            <span className="text-sm font-medium text-oww-cyan">{t.example_url}</span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-base text-slate-700">{t.description}</p>
                        {t.when_to_use ? (
                          <p className="mt-2 text-base leading-relaxed text-slate-600">
                            <span className="font-semibold text-oww-navy">When to use: </span>
                            {t.when_to_use}
                          </p>
                        ) : null}
                      </button>
                    </div>
                  );
                })}
              </div>
              {kind === 'page' ? (
                <p className="text-base text-slate-600">
                  Need a running series instead? Cancel and open the{' '}
                  <button type="button" className="font-semibold text-oww-cyan underline" onClick={() => openCreate('blog')}>
                    Blog
                  </button>{' '}
                  tab.
                </p>
              ) : null}
            </fieldset>

            {selectedMeta ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
                Selected: <span className="font-semibold text-oww-navy">{selectedMeta.label}</span>
                {selectedMeta.example_url ? ` · public URL shape ${selectedMeta.example_url}` : ''}
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="cms-title" className="text-base">
                Title
              </Label>
              <Input
                id="cms-title"
                className="min-h-[44px] text-base"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cms-slug" className="text-base">
                  URL slug
                </Label>
                <Input
                  id="cms-slug"
                  className="min-h-[44px] text-base"
                  value={form.slug}
                  onChange={e => setForm({ ...form, slug: e.target.value })}
                  placeholder={kind === 'blog' ? 'my-topic' : 'home'}
                />
                <p className="text-sm text-slate-600">
                  Suggested for this template: {selectedMeta?.suggested_slug || '—'}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cms-state" className="text-base">
                  State
                </Label>
                <Input
                  id="cms-state"
                  maxLength={2}
                  className="min-h-[44px] text-base uppercase"
                  value={form.state_code}
                  onChange={e => setForm({ ...form, state_code: e.target.value.toUpperCase() })}
                />
              </div>
            </div>
            {error ? <p className="text-base text-red-700">{error}</p> : null}
            <DialogFooter>
              <Button type="button" variant="outline" className="min-h-[44px] text-base" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="min-h-[44px] text-base" disabled={busy}>
                {busy ? 'Creating…' : 'Create & edit'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
