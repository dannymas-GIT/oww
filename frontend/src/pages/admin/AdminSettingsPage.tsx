import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import {
  fetchPlatformSettings,
  fetchSocialStatus,
  updatePlatformSettings,
  updateSocialSettings,
} from '@/services/adminService';
import { formatDateTime } from '@/lib/format';
import type { PlatformSettings, SocialStatus } from '@/types';

const PLATFORM_OPTIONS = [
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'twitter', label: 'X / Twitter' },
  { id: 'oww_blog', label: 'OWW Blog' },
  { id: 'ww360', label: 'WW360' },
];

export default function AdminSettingsPage() {
  const { isPlatformAdmin } = useAuth();
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [reviewRequired, setReviewRequired] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [socialStatus, setSocialStatus] = useState<SocialStatus | null>(null);
  const [defaultPlatforms, setDefaultPlatforms] = useState<string[]>(['linkedin']);
  const [autoShare, setAutoShare] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchPlatformSettings(), fetchSocialStatus().catch(() => null)])
      .then(([s, st]) => {
        setSettings(s);
        setReviewRequired(Boolean(s.utility_registration_review_required));
        setNotifyEmail(s.registration_notify_email || '');
        setDefaultPlatforms(s.social_default_platforms || st?.default_platforms || ['linkedin']);
        setAutoShare(Boolean(s.social_auto_share_on_publish ?? st?.auto_share_on_publish));
        setSocialStatus(st);
      })
      .catch(() => setError('Could not load platform settings.'));
  }, []);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!isPlatformAdmin) return;
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const next = await updatePlatformSettings({
        utility_registration_review_required: reviewRequired,
        registration_notify_email: notifyEmail.trim(),
        social_default_platforms: defaultPlatforms,
        social_auto_share_on_publish: autoShare,
      });
      setSettings(next);
      try {
        await updateSocialSettings({
          social_default_platforms: defaultPlatforms,
          social_auto_share_on_publish: autoShare,
        });
      } catch {
        // platform settings already persisted the social keys
      }
      setMsg('Settings saved.');
      window.setTimeout(() => setMsg(null), 4000);
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Could not save settings.');
    } finally {
      setBusy(false);
    }
  }

  function togglePlatform(id: string) {
    setDefaultPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  }

  return (
    <div className="space-y-6">
      <OwwPageHero
        eyebrow="Administration"
        title="Platform settings"
        description="Controls for self-registration review, social publishing, and related notifications."
        actions={
          <Button variant="outline" className="min-h-[44px] border-white/40 bg-white/10 text-base text-white hover:bg-white/20" asChild>
            <Link to="/admin/registrations">Utility registrations</Link>
          </Button>
        }
      />

      {msg ? <p className="rounded-lg bg-emerald-50 p-3 text-base text-emerald-900">{msg}</p> : null}
      {error ? <p className="rounded-lg bg-rose-50 p-3 text-base text-rose-800">{error}</p> : null}

      <Card className="max-w-2xl border-slate-200" data-tour="platform-settings">
        <CardHeader>
          <CardTitle className="font-display text-xl text-oww-navy">Utility self-registration</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSave} className="space-y-6">
            <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 p-4">
              <div className="space-y-1">
                <Label htmlFor="review-toggle" className="text-base font-semibold text-oww-navy">
                  Review new utility registrations
                </Label>
                <p className="text-base text-slate-600">
                  When on, new utility signups appear in the Utility registrations queue as pending review. Payment still
                  activates the account immediately — review is post-hoc. When off, registrations are marked “review not
                  required” and never land in the pending queue.
                </p>
              </div>
              <Switch
                id="review-toggle"
                checked={reviewRequired}
                onCheckedChange={setReviewRequired}
                disabled={!isPlatformAdmin || busy}
                className="mt-1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notify-email" className="text-base">
                Notify email for new registrations
              </Label>
              <Input
                id="notify-email"
                type="email"
                className="min-h-[44px] text-base"
                value={notifyEmail}
                onChange={e => setNotifyEmail(e.target.value)}
                disabled={!isPlatformAdmin || busy}
                placeholder="jenny@nysawwa.org"
              />
              <p className="text-sm text-slate-500">Stubbed in sample mode (logged to the backend console).</p>
            </div>

            {settings?.updated_at ? (
              <p className="text-sm text-slate-500">
                Last updated {formatDateTime(settings.updated_at)}
                {settings.updated_by_name ? ` by ${settings.updated_by_name}` : ''}
              </p>
            ) : null}

            {isPlatformAdmin ? (
              <Button type="submit" className="min-h-[44px] bg-oww-cyan text-base text-white hover:bg-sky-700" disabled={busy}>
                {busy ? 'Saving…' : 'Save settings'}
              </Button>
            ) : (
              <p className="text-base text-slate-600">Only platform administrators can change these settings.</p>
            )}
          </form>
        </CardContent>
      </Card>

      <Card className="max-w-2xl border-slate-200">
        <CardHeader>
          <CardTitle className="font-display text-xl text-oww-navy">Social publishing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-center gap-3 text-base text-slate-700">
            <Badge variant={socialStatus?.live ? 'default' : 'secondary'}>
              {socialStatus?.provider || 'ayrshare'} {socialStatus?.live ? '(live)' : '(stub — optional)'}
            </Badge>
            <span>
              Connected:{' '}
              {(socialStatus?.connected_platforms || []).join(', ') ||
                (socialStatus?.api_key_configured ? 'none yet' : 'API key not set yet')}
            </span>
            <Button variant="outline" className="min-h-[44px] text-base" asChild>
              <Link to="/admin/social">Open Social posts</Link>
            </Button>
            <Button variant="outline" className="min-h-[44px] text-base" asChild>
              <Link to="/admin/marketing">Marketing &amp; SEO</Link>
            </Button>
          </div>

          {socialStatus?.setup && !socialStatus.setup.ready ? (
            <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-base text-amber-950">
              <p className="font-semibold">Connect {socialStatus.setup.provider_label} when ready</p>
              <p>{socialStatus.setup.message}</p>
              <ol className="list-decimal space-y-1 pl-5">
                {(socialStatus.setup.steps || []).map(step => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <p className="text-sm">
                Env var: <code className="rounded bg-white px-1">{socialStatus.setup.env_var}</code> ·{' '}
                <a
                  href={socialStatus.setup.docs_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-800 underline"
                >
                  Ayrshare docs
                </a>
              </p>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label className="text-base font-semibold text-oww-navy">Default platforms</Label>
            <div className="flex flex-wrap gap-3">
              {PLATFORM_OPTIONS.map(p => (
                <label key={p.id} className="flex min-h-[44px] items-center gap-2 text-base">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={defaultPlatforms.includes(p.id)}
                    onChange={() => togglePlatform(p.id)}
                    disabled={!isPlatformAdmin || busy}
                  />
                  {p.label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 p-4">
            <div className="space-y-1">
              <Label htmlFor="auto-share" className="text-base font-semibold text-oww-navy">
                Auto-share blog posts on publish
              </Label>
              <p className="text-base text-slate-600">
                When Jenny publishes a blog post, queue a social post to the default platforms (LinkedIn by default).
              </p>
            </div>
            <Switch
              id="auto-share"
              checked={autoShare}
              onCheckedChange={setAutoShare}
              disabled={!isPlatformAdmin || busy}
              className="mt-1"
            />
          </div>

          {isPlatformAdmin ? (
            <Button
              type="button"
              className="min-h-[44px] bg-oww-cyan text-base text-white hover:bg-sky-700"
              disabled={busy}
              onClick={e => void onSave(e as unknown as React.FormEvent)}
            >
              {busy ? 'Saving…' : 'Save social settings'}
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
