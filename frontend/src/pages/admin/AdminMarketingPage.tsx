import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Megaphone, Plus, Search } from 'lucide-react';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { OwwEmptyState } from '@/components/oww/OwwEmptyState';
import { RichTextEditor } from '@/components/oww/RichTextEditor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { findOwwStudioTemplate, OWW_STUDIO_TEMPLATES } from '@/config/owwStudioTemplates';
import {
  createMarketingEffort,
  deleteMarketingEffort,
  fetchMarketingCatalog,
  listMarketingEfforts,
  updateMarketingEffort,
} from '@/services/adminService';
import type { MarketingEffort } from '@/types';
import { formatDateTime } from '@/lib/format';

const KIND_FILTERS: Array<{ id: string; label: string }> = [
  { id: '', label: 'All' },
  { id: 'seo', label: 'SEO' },
  { id: 'campaign', label: 'Campaigns' },
  { id: 'content', label: 'Content' },
  { id: 'social', label: 'Social' },
  { id: 'event', label: 'Events' },
];

export default function AdminMarketingPage() {
  const [items, setItems] = useState<MarketingEffort[]>([]);
  const [kindFilter, setKindFilter] = useState('');
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState('campaign');
  const [status, setStatus] = useState('planned');
  const [channel, setChannel] = useState('');
  const [description, setDescription] = useState('<p></p>');
  const [keywords, setKeywords] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [sendMethod, setSendMethod] = useState('manual');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<{
    kinds: Array<{ id: string; label: string }>;
    statuses: string[];
    send_methods: Array<{ id: string; label: string }>;
  } | null>(null);

  const refresh = useCallback(async () => {
    const [list, cat] = await Promise.all([
      listMarketingEfforts({ kind: kindFilter || undefined, limit: 100 }),
      fetchMarketingCatalog().catch(() => null),
    ]);
    setItems(list.items);
    if (cat) setCatalog(cat);
  }, [kindFilter]);

  useEffect(() => {
    void refresh().catch(() => setError('Could not load marketing efforts.'));
  }, [refresh]);

  function applyTemplate(id: string) {
    setTemplateId(id);
    const t = findOwwStudioTemplate(id);
    if (!t) return;
    setTitle(t.subject || t.name);
    setDescription(t.bodyHtml);
    setKind(
      t.category === 'seo'
        ? 'seo'
        : t.category === 'social'
          ? 'social'
          : t.category === 'blog'
            ? 'content'
            : 'campaign'
    );
    setSendMethod(t.sendMethod || 'manual');
    if (t.seoKeywords?.length) setKeywords(t.seoKeywords.join(', '));
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      await createMarketingEffort({
        title: title.trim(),
        kind,
        status,
        channel: channel || undefined,
        description,
        seo_keywords: keywords
          .split(',')
          .map(k => k.trim())
          .filter(Boolean),
        target_url: targetUrl || undefined,
        template_id: templateId || undefined,
        send_method: sendMethod,
      });
      setMsg('Marketing effort saved.');
      setTitle('');
      setDescription('<p></p>');
      setKeywords('');
      setTargetUrl('');
      setTemplateId('');
      await refresh();
    } catch {
      setError('Could not save effort.');
    } finally {
      setBusy(false);
    }
  }

  async function setEffortStatus(id: number, next: string) {
    setBusy(true);
    try {
      await updateMarketingEffort(id, { status: next });
      await refresh();
    } catch {
      setError('Could not update status.');
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: number) {
    if (!window.confirm('Delete this marketing effort?')) return;
    setBusy(true);
    try {
      await deleteMarketingEffort(id);
      await refresh();
    } catch {
      setError('Delete failed.');
    } finally {
      setBusy(false);
    }
  }

  const seoTemplates = OWW_STUDIO_TEMPLATES.filter(t =>
    ['seo', 'blog', 'social', 'email', 'outreach', 'brief'].includes(t.category)
  );

  return (
    <div className="space-y-6">
      <OwwPageHero
        eyebrow="Communications"
        title="Marketing & SEO"
        description="Track campaigns, SEO briefs, content pushes, and social efforts in one place — then open the matching send path (email, blog, or social)."
        actions={
          <Button variant="outline" className="min-h-[44px] border-white/40 bg-white/10 text-base text-white hover:bg-white/20" asChild>
            <Link to="/admin/communications">Member messages</Link>
          </Button>
        }
      />

      {msg ? <p className="rounded-lg bg-emerald-50 p-3 text-base text-emerald-900">{msg}</p> : null}
      {error ? <p className="rounded-lg bg-rose-50 p-3 text-base text-rose-800">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        {KIND_FILTERS.map(f => (
          <Button
            key={f.id || 'all'}
            type="button"
            variant={kindFilter === f.id ? 'default' : 'outline'}
            className="min-h-[44px] text-base"
            onClick={() => setKindFilter(f.id)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-xl text-oww-navy">
              <Plus className="h-5 w-5" />
              New effort
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onCreate} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-base">Document Studio template</Label>
                <select
                  className="min-h-[44px] w-full rounded-md border border-slate-300 bg-white px-3 text-base"
                  value={templateId}
                  onChange={e => applyTemplate(e.target.value)}
                >
                  <option value="">Blank</option>
                  {seoTemplates.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                      {t.sourceStudioId ? ' · Studio' : ''} — {t.preview}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-base">Title</Label>
                <Input className="min-h-[44px] text-base" value={title} onChange={e => setTitle(e.target.value)} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-base">Kind</Label>
                  <select
                    className="min-h-[44px] w-full rounded-md border border-slate-300 bg-white px-3 text-base"
                    value={kind}
                    onChange={e => setKind(e.target.value)}
                  >
                    {(catalog?.kinds || KIND_FILTERS.filter(k => k.id)).map(k => (
                      <option key={k.id} value={k.id}>
                        {k.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-base">Status</Label>
                  <select
                    className="min-h-[44px] w-full rounded-md border border-slate-300 bg-white px-3 text-base"
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                  >
                    {(catalog?.statuses || ['planned', 'active', 'completed', 'archived']).map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-base">Channel</Label>
                  <Input
                    className="min-h-[44px] text-base"
                    value={channel}
                    onChange={e => setChannel(e.target.value)}
                    placeholder="web, linkedin, email…"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-base">Send method</Label>
                  <select
                    className="min-h-[44px] w-full rounded-md border border-slate-300 bg-white px-3 text-base"
                    value={sendMethod}
                    onChange={e => setSendMethod(e.target.value)}
                  >
                    {(catalog?.send_methods || [
                      { id: 'manual', label: 'Manual' },
                      { id: 'email', label: 'Email' },
                      { id: 'blog_publish', label: 'Blog' },
                      { id: 'social_share', label: 'Social' },
                    ]).map(m => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-base">SEO keywords</Label>
                <Input
                  className="min-h-[44px] text-base"
                  value={keywords}
                  onChange={e => setKeywords(e.target.value)}
                  placeholder="water workforce, NY operators"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base">Target URL</Label>
                <Input
                  className="min-h-[44px] text-base"
                  value={targetUrl}
                  onChange={e => setTargetUrl(e.target.value)}
                  placeholder="https://…"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base">Brief / copy</Label>
                <RichTextEditor value={description} onChange={setDescription} placeholder="Campaign brief, SEO notes, or draft copy…" />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" className="min-h-[44px] bg-oww-cyan text-base text-white hover:bg-sky-700" disabled={busy}>
                  Save effort
                </Button>
                {sendMethod === 'email' ? (
                  <Button type="button" variant="outline" className="min-h-[44px] text-base" asChild>
                    <Link to="/admin/communications?tab=messages">Open email composer</Link>
                  </Button>
                ) : null}
                {sendMethod === 'blog_publish' ? (
                  <Button type="button" variant="outline" className="min-h-[44px] text-base" asChild>
                    <Link to="/admin/cms?kind=blog">Open blog</Link>
                  </Button>
                ) : null}
                {sendMethod === 'social_share' ? (
                  <Button type="button" variant="outline" className="min-h-[44px] text-base" asChild>
                    <Link to="/admin/social">Open social posts</Link>
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-xl text-oww-navy">
              <LineChart className="h-5 w-5" />
              Effort board
            </CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <OwwEmptyState title="No marketing efforts yet" description="Create an SEO brief or campaign on the left." />
            ) : (
              <ul className="space-y-3">
                {items.map(item => (
                  <li key={item.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-base font-semibold text-oww-navy">{item.title}</p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          <Badge variant="secondary">{item.kind}</Badge>
                          <Badge variant="outline">{item.status}</Badge>
                          {item.send_method ? <Badge variant="outline">{item.send_method}</Badge> : null}
                        </div>
                        {(item.seo_keywords || []).length ? (
                          <p className="mt-2 flex items-center gap-1 text-sm text-slate-600">
                            <Search className="h-3.5 w-3.5" />
                            {(item.seo_keywords || []).join(', ')}
                          </p>
                        ) : null}
                        {item.target_url ? (
                          <a
                            href={item.target_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-block text-base text-sky-800 hover:underline"
                          >
                            {item.target_url}
                          </a>
                        ) : null}
                        <p className="mt-1 text-sm text-slate-500">
                          Updated {item.updated_at ? formatDateTime(item.updated_at) : '—'}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {item.status !== 'active' ? (
                          <Button
                            type="button"
                            size="sm"
                            className="min-h-[44px] text-base"
                            disabled={busy}
                            onClick={() => void setEffortStatus(item.id, 'active')}
                          >
                            Activate
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="min-h-[44px] text-base"
                            disabled={busy}
                            onClick={() => void setEffortStatus(item.id, 'completed')}
                          >
                            Complete
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="min-h-[44px] text-base text-rose-700"
                          disabled={busy}
                          onClick={() => void onDelete(item.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-lg text-oww-navy">
            <Megaphone className="h-5 w-5" />
            Quick links
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" className="min-h-[44px] text-base" asChild>
            <Link to="/admin/cms?kind=blog">Blog posts</Link>
          </Button>
          <Button variant="outline" className="min-h-[44px] text-base" asChild>
            <Link to="/admin/social">Social posts</Link>
          </Button>
          <Button variant="outline" className="min-h-[44px] text-base" asChild>
            <Link to="/admin/settings">Social API setup</Link>
          </Button>
          <Button variant="outline" className="min-h-[44px] text-base" asChild>
            <Link to="/admin/studio">Document Studio</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
