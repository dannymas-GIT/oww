import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { fetchPlatformSettings, updatePlatformSettings } from '@/services/adminService';
import { formatDateTime } from '@/lib/format';
import type { PlatformSettings } from '@/types';

export default function AdminSettingsPage() {
  const { isPlatformAdmin } = useAuth();
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [reviewRequired, setReviewRequired] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlatformSettings()
      .then(s => {
        setSettings(s);
        setReviewRequired(Boolean(s.utility_registration_review_required));
        setNotifyEmail(s.registration_notify_email || '');
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
      });
      setSettings(next);
      setMsg('Settings saved.');
      window.setTimeout(() => setMsg(null), 4000);
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Could not save settings.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <OwwPageHero
        eyebrow="Administration"
        title="Platform settings"
        description="Controls for self-registration review and related notifications."
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
    </div>
  );
}
