import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { FileText, Megaphone, RefreshCw } from 'lucide-react';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { OwwEmptyState } from '@/components/oww/OwwEmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  deleteSocialPost,
  fetchSocialStatus,
  listSocialPosts,
  publishSocialPost,
  retrySocialPost,
} from '@/services/adminService';
import type { SocialPostRecord, SocialStatus } from '@/types';
import { formatDateTime } from '@/lib/format';

const PLATFORM_LABELS: Record<string, string> = {
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter: 'X / Twitter',
  x: 'X / Twitter',
  bluesky: 'Bluesky',
  youtube: 'YouTube',
  oww_blog: 'OWW Blog',
  ww360: 'WW360',
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [st, list] = await Promise.all([fetchSocialStatus(), listSocialPosts({ limit: 50 })]);
    setStatus(st);
    setPosts(list.items);
  }, []);

  useEffect(() => {
    void refresh().catch(() => setError('Could not load social syndication.'));
  }, [refresh]);

  // Legacy ?page= compose deep-links → Document Studio (sole authoring surface)
  if (pageParam) {
    const id = Number(pageParam);
    if (Number.isFinite(id) && id > 0) {
      return <Navigate to={`/admin/studio?content_page=${id}`} replace />;
    }
    return <Navigate to="/admin/studio?intent=social" replace />;
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

  return (
    <div className="space-y-6">
      <OwwPageHero
        eyebrow="Administration"
        title="Social posts"
        description="Compose and publish in Document Studio. This page shows provider status and post history — retry, publish drafts, or delete records here."
        actions={
          <>
            <Button
              className="min-h-[44px] bg-oww-cyan text-base text-white hover:bg-sky-700"
              asChild
            >
              <Link to="/admin/studio?intent=social">
                <FileText className="mr-2 h-4 w-4" />
                Compose in Document Studio
              </Link>
            </Button>
            <Button
              variant="outline"
              className="min-h-[44px] border-white/40 bg-white/10 text-base text-white hover:bg-white/20"
              onClick={() => void refresh()}
              disabled={busy}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </>
        }
      />

      {error ? <p className="rounded-lg bg-rose-50 p-3 text-base text-rose-800">{error}</p> : null}

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-xl text-oww-navy">
            <Megaphone className="h-5 w-5" />
            Provider status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-base text-slate-700">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={status?.live ? 'default' : 'secondary'}>
              {status?.provider || '…'} {status?.live ? '(live)' : '(stub — optional)'}
            </Badge>
            <span>
              Connected:{' '}
              {(status?.connected_platforms || []).map(p => PLATFORM_LABELS[p] || p).join(', ') ||
                (status?.api_key_configured ? 'none yet' : 'API key not set')}
            </span>
            <Button variant="outline" className="min-h-[44px] text-base" asChild>
              <Link to="/admin/settings">Social settings</Link>
            </Button>
            <Button variant="outline" className="min-h-[44px] text-base" asChild>
              <Link to="/admin/marketing">Marketing &amp; SEO</Link>
            </Button>
            <Button variant="outline" className="min-h-[44px] text-base" asChild>
              <Link to="/admin/communications">Communications</Link>
            </Button>
          </div>
          {status?.setup && !status.setup.ready ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
              <p className="font-semibold">Ayrshare API key is optional until you are ready to go live</p>
              <p className="mt-1">{status.setup.message}</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                {(status.setup.steps || []).map(step => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-oww-cyan/30 bg-[#f0f7ff]">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
          <div>
            <p className="font-display text-lg font-semibold text-oww-navy">Author in Document Studio</p>
            <p className="mt-1 text-base text-slate-700">
              Write social drafts, grab screenshots, and publish to LinkedIn and other destinations from Studio.
            </p>
          </div>
          <Button className="min-h-[44px] bg-oww-cyan text-base text-white hover:bg-sky-700" asChild>
            <Link to="/admin/studio?intent=social">Open Studio</Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="font-display text-xl text-oww-navy">History</CardTitle>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <OwwEmptyState
              title="No social posts yet"
              description="Compose your first post in Document Studio, then publish to connected networks."
            />
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
                      <td className="py-3 pr-3">
                        {(p.platforms || []).map(x => PLATFORM_LABELS[x] || x).join(', ')}
                      </td>
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
