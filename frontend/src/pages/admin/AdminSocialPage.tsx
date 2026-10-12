import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Megaphone, RefreshCw } from 'lucide-react';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { OwwEmptyState } from '@/components/oww/OwwEmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  composeSocialFromPage,
  createSocialPost,
  deleteSocialPost,
  fetchSocialStatus,
  listCmsPages,
  listSocialPosts,
  publishSocialPost,
  retrySocialPost,
} from '@/services/adminService';
import type { ContentPage, SocialPostRecord, SocialStatus } from '@/types';
import { formatDateTime } from '@/lib/format';

const PLATFORM_LABELS: Record<string, string> = {
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter: 'X / Twitter',
  x: 'X / Twitter',
  bluesky: 'Bluesky',
  youtube: 'YouTube',
};

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'posted') return 'default';
  if (status === 'partial') return 'outline';
  if (status === 'failed') return 'destructive';
  return 'secondary';
}

export default function AdminSocialPage() {
  const [searchParams] = useSearchParams();
  const pageParam = searchParams.get('page');

  const [status, setStatus] = useState<SocialStatus | null>(null);
  const [posts, setPosts] = useState<SocialPostRecord[]>([]);
  const [blogs, setBlogs] = useState<ContentPage[]>([]);
  const [message, setMessage] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [platforms, setPlatforms] = useState<string[]>(['linkedin']);
  const [contentPageId, setContentPageId] = useState<number | null>(null);
  const [scheduledAt, setScheduledAt] = useState('');
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [st, list, pages] = await Promise.all([
      fetchSocialStatus(),
      listSocialPosts({ limit: 50 }),
      listCmsPages('blog').catch(() => [] as ContentPage[]),
    ]);
    setStatus(st);
    setPosts(list.items);
    setBlogs(Array.isArray(pages) ? pages.filter(p => p.published) : []);
    if (!platforms.length && st.default_platforms?.length) {
      setPlatforms(st.default_platforms);
    }
  }, [platforms.length]);

  useEffect(() => {
    void refresh().catch(() => setError('Could not load social syndication.'));
  }, [refresh]);

  useEffect(() => {
    if (!pageParam) return;
    const id = Number(pageParam);
    if (!Number.isFinite(id)) return;
    setContentPageId(id);
    void composeSocialFromPage(id)
      .then(c => {
        setMessage(c.message);
        setLinkUrl(c.link_url || '');
        setMediaUrl(c.media_url || '');
        if (c.default_platforms?.length) setPlatforms(c.default_platforms);
      })
      .catch(() => setError('Could not compose message from that blog post.'));
  }, [pageParam]);

  const charHint = useMemo(() => {
    if (!status?.char_hints) return null;
    const limits = platforms
      .map(p => ({ p, n: status.char_hints[p] || status.char_hints[p === 'x' ? 'twitter' : p] }))
      .filter(x => x.n);
    if (!limits.length) return null;
    const tightest = limits.reduce((a, b) => (a.n! < b.n! ? a : b));
    return `${message.length} / ${tightest.n} (${PLATFORM_LABELS[tightest.p] || tightest.p})`;
  }, [message, platforms, status]);

  function togglePlatform(p: string) {
    setPlatforms(prev => (prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]));
  }

  async function onPickBlog(id: string) {
    if (!id) {
      setContentPageId(null);
      return;
    }
    const num = Number(id);
    setContentPageId(num);
    try {
      const c = await composeSocialFromPage(num);
      setMessage(c.message);
      setLinkUrl(c.link_url || '');
      setMediaUrl(c.media_url || '');
    } catch {
      setError('Could not load blog post for composing.');
    }
  }

  async function onPublish(schedule: boolean) {
    if (!message.trim()) {
      setError('Message is required.');
      return;
    }
    if (!platforms.length) {
      setError('Select at least one platform.');
      return;
    }
    setBusy(true);
    setError(null);
    setFlash(null);
    try {
      const saved = await createSocialPost({
        message: message.trim(),
        platforms,
        content_page_id: contentPageId || undefined,
        link_url: linkUrl || undefined,
        media_url: mediaUrl || undefined,
        scheduled_at: schedule && scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        publish: true,
      });
      setFlash(
        saved.status === 'posted' || saved.status === 'partial'
          ? `Published (${saved.status}).`
          : saved.status === 'scheduled'
            ? 'Scheduled.'
            : `Saved as ${saved.status}.`
      );
      await refresh();
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Publish failed.');
    } finally {
      setBusy(false);
    }
  }

  async function onRetry(id: number) {
    setBusy(true);
    try {
      await retrySocialPost(id);
      await refresh();
    } catch {
      setError('Retry failed.');
    } finally {
      setBusy(false);
    }
  }

  async function onPublishDraft(id: number) {
    setBusy(true);
    try {
      await publishSocialPost(id);
      await refresh();
    } catch {
      setError('Publish failed.');
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: number) {
    if (!window.confirm('Delete this social post record?')) return;
    setBusy(true);
    try {
      await deleteSocialPost(id);
      await refresh();
    } catch {
      setError('Delete failed.');
    } finally {
      setBusy(false);
    }
  }

  const availablePlatforms = status?.connected_platforms?.length
    ? status.connected_platforms
    : ['linkedin', 'facebook', 'instagram', 'twitter'];

  return (
    <div className="space-y-6">
      <OwwPageHero
        eyebrow="Administration"
        title="Social posts"
        description="Compose once and publish to LinkedIn (and other connected networks) via the aggregator. Stub mode logs posts until an API key is configured."
        actions={
          <Button
            variant="outline"
            className="min-h-[44px] border-white/40 bg-white/10 text-base text-white hover:bg-white/20"
            onClick={() => void refresh()}
            disabled={busy}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        }
      />

      {flash ? <p className="rounded-lg bg-emerald-50 p-3 text-base text-emerald-900">{flash}</p> : null}
      {error ? <p className="rounded-lg bg-rose-50 p-3 text-base text-rose-800">{error}</p> : null}

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-xl text-oww-navy">
            <Megaphone className="h-5 w-5" />
            Provider status
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3 text-base text-slate-700">
          <Badge variant={status?.live ? 'default' : 'secondary'}>
            {status?.provider || '…'} {status?.live ? '(live)' : '(stub)'}
          </Badge>
          <span>
            Connected:{' '}
            {(status?.connected_platforms || []).map(p => PLATFORM_LABELS[p] || p).join(', ') || 'none yet'}
          </span>
          <Button variant="outline" className="min-h-[44px] text-base" asChild>
            <Link to="/admin/settings">Social settings</Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="font-display text-xl text-oww-navy">Compose</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-base">From published blog post</Label>
            <select
              className="min-h-[44px] w-full rounded-md border border-slate-300 bg-white px-3 text-base"
              value={contentPageId ?? ''}
              onChange={e => void onPickBlog(e.target.value)}
            >
              <option value="">Free-form (no blog link)</option>
              {blogs.map(b => (
                <option key={b.id} value={b.id}>
                  {b.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label className="text-base">Message</Label>
            <Textarea
              className="min-h-[140px] text-base"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Title, summary, link, and hashtags…"
            />
            {charHint ? <p className="text-sm text-slate-500">{charHint}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-base">Link URL</Label>
              <Input className="min-h-[44px] text-base" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-base">Media URL (optional)</Label>
              <Input className="min-h-[44px] text-base" value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-base">Platforms</Label>
            <div className="flex flex-wrap gap-3">
              {availablePlatforms.map(p => (
                <label key={p} className="flex min-h-[44px] items-center gap-2 text-base">
                  <input
                    type="checkbox"
                    checked={platforms.includes(p)}
                    onChange={() => togglePlatform(p)}
                    className="h-4 w-4"
                  />
                  {PLATFORM_LABELS[p] || p}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2 max-w-sm">
            <Label className="text-base">Schedule (optional)</Label>
            <Input
              type="datetime-local"
              className="min-h-[44px] text-base"
              value={scheduledAt}
              onChange={e => setScheduledAt(e.target.value)}
            />
          </div>

          {message ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Preview</p>
              <p className="whitespace-pre-wrap text-base text-slate-800">{message}</p>
              {mediaUrl ? (
                <img src={mediaUrl} alt="" className="mt-3 max-h-40 rounded-lg object-cover" />
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              className="min-h-[44px] bg-oww-cyan text-base text-white hover:bg-sky-700"
              disabled={busy}
              onClick={() => void onPublish(false)}
            >
              Publish now
            </Button>
            <Button
              variant="outline"
              className="min-h-[44px] text-base"
              disabled={busy || !scheduledAt}
              onClick={() => void onPublish(true)}
            >
              Schedule
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="font-display text-xl text-oww-navy">History</CardTitle>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <OwwEmptyState title="No social posts yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-base">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600">
                    <th className="py-2 pr-3 font-semibold">Status</th>
                    <th className="py-2 pr-3 font-semibold">Platforms</th>
                    <th className="py-2 pr-3 font-semibold">Message</th>
                    <th className="py-2 pr-3 font-semibold">When</th>
                    <th className="py-2 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map(p => (
                    <tr key={p.id} className="border-b border-slate-100 align-top">
                      <td className="py-3 pr-3">
                        <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
                        {p.error ? <p className="mt-1 text-sm text-rose-700">{p.error}</p> : null}
                      </td>
                      <td className="py-3 pr-3">{(p.platforms || []).map(x => PLATFORM_LABELS[x] || x).join(', ')}</td>
                      <td className="py-3 pr-3 max-w-xs truncate" title={p.message}>
                        {p.message.slice(0, 120)}
                        {p.message.length > 120 ? '…' : ''}
                      </td>
                      <td className="py-3 pr-3 whitespace-nowrap text-sm text-slate-600">
                        {p.posted_at
                          ? formatDateTime(p.posted_at)
                          : p.scheduled_at
                            ? `Sched ${formatDateTime(p.scheduled_at)}`
                            : p.created_at
                              ? formatDateTime(p.created_at)
                              : '—'}
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-2">
                          {(p.status === 'draft' || p.status === 'queued') && (
                            <Button
                              size="sm"
                              className="min-h-[44px] text-base"
                              disabled={busy}
                              onClick={() => void onPublishDraft(p.id)}
                            >
                              Publish
                            </Button>
                          )}
                          {(p.status === 'failed' || p.status === 'partial') && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="min-h-[44px] text-base"
                              disabled={busy}
                              onClick={() => void onRetry(p.id)}
                            >
                              Retry
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="min-h-[44px] text-base text-rose-700"
                            disabled={busy}
                            onClick={() => void onDelete(p.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
