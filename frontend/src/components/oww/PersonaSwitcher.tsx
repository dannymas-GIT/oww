import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Eye, Users, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useImpersonation } from '@/context/ImpersonationContext';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const TIER_LABELS: Record<string, string> = {
  community: 'Community',
  utility: 'Utility & employer',
  state: 'State',
  national: 'National',
};

export function PersonaSwitcher({ variant = 'header' }: { variant?: 'header' | 'mobile' }) {
  const { canUsePersonaSwitcher, canActAs, personas, personasLoading, loadPersonas, startPreview, startActAs } =
    useImpersonation();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'preview' | 'act'>('preview');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) void loadPersonas();
  }, [open, loadPersonas]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof personas>();
    for (const p of personas) {
      const tier = p.tier || 'community';
      if (!map.has(tier)) map.set(tier, []);
      map.get(tier)!.push(p);
    }
    return map;
  }, [personas]);

  if (!canUsePersonaSwitcher) return null;

  async function handleSelect(personaKey: string) {
    setBusy(personaKey);
    setError(null);
    try {
      if (mode === 'act' && canActAs) await startActAs(personaKey, reason.trim());
      else await startPreview(personaKey);
      setOpen(false);
      setReason('');
    } catch (err: unknown) {
      const detail =
        axios.isAxiosError(err) && err.response?.data?.detail
          ? String(err.response.data.detail)
          : err instanceof Error
            ? err.message
            : 'Could not start role preview';
      setError(detail);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant === 'mobile' ? 'outline' : 'ghost'}
          className={cn(
            'min-h-[44px] shrink-0 px-2 text-base xl:px-3',
            variant === 'header' ? 'text-oww-navy hover:bg-slate-100' : 'w-full justify-start'
          )}
        >
          <Users className="h-4 w-4 xl:mr-2" />
          <span className="hidden xl:inline">View as role</span>
          <span className="xl:hidden">View as</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto text-base">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">View as role</DialogTitle>
        </DialogHeader>
        <p className="text-lg leading-relaxed text-slate-700">
          Preview One Water Workforce exactly as a student, employer, utility admin, or state partner would see it.
          Read-only preview is the default.
        </p>
        {canActAs ? (
          <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-base">
              <input type="radio" name="imp-mode" checked={mode === 'preview'} onChange={() => setMode('preview')} />
              Read-only preview
            </label>
            <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-base">
              <input type="radio" name="imp-mode" checked={mode === 'act'} onChange={() => setMode('act')} />
              Act as (writes allowed, audited)
            </label>
            {mode === 'act' ? (
              <textarea
                className="min-h-[80px] w-full rounded-md border p-2 text-base"
                placeholder="Reason for act-as session (required)"
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
            ) : null}
          </div>
        ) : null}
        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 p-3 text-base text-red-800" role="alert">
            {error}
          </p>
        ) : null}
        {personasLoading ? <p className="text-slate-500">Loading personas…</p> : null}
        {!personasLoading && personas.length === 0 ? (
          <p className="text-slate-500">No personas available. Re-run the demo seed.</p>
        ) : null}
        {Array.from(grouped.entries()).map(([tier, items]) => (
          <div key={tier} className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{TIER_LABELS[tier] || tier}</h3>
            <ul className="space-y-2">
              {items.map(p => (
                <li key={p.persona_key}>
                  <button
                    type="button"
                    disabled={busy === p.persona_key || (mode === 'act' && !reason.trim())}
                    className="w-full rounded-lg border border-slate-200 p-3 text-left hover:border-sky-300 hover:bg-sky-50 disabled:opacity-50"
                    onClick={() => void handleSelect(p.persona_key)}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900">{p.label}</span>
                      <Badge variant="secondary" className="text-sm">
                        {p.username}
                      </Badge>
                    </div>
                    {p.subtitle ? <p className="mt-1 text-base text-slate-600">{p.subtitle}</p> : null}
                    <ul className="mt-2 list-disc pl-5 text-sm text-slate-500">
                      {(p.narrative_bullets || []).slice(0, 3).map(b => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </DialogContent>
    </Dialog>
  );
}

export function ImpersonationBanner() {
  const { isImpersonating, isPreviewMode, stop } = useImpersonation();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  if (!isImpersonating || !user?.impersonation?.active) return null;

  const expires = user.impersonation.expires_at
    ? new Date(user.impersonation.expires_at).toLocaleTimeString()
    : null;

  return (
    <div
      className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 border-b border-amber-300 bg-amber-100 px-4 py-3 text-lg"
      role="status"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Eye className="h-5 w-5 text-amber-800" aria-hidden />
        <span>
          Viewing as <strong>{user.full_name || user.username}</strong>
          {user.impersonation.persona_key ? (
            <span className="text-slate-600"> ({user.impersonation.persona_key})</span>
          ) : null}
        </span>
        <Badge className="text-sm">{isPreviewMode ? 'Read-only preview' : 'Act-as (audited)'}</Badge>
        {expires ? <span className="text-sm text-slate-600">Expires {expires}</span> : null}
      </div>
      <Button
        variant="outline"
        className="min-h-[44px] gap-1 text-base"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          void stop().finally(() => setBusy(false));
        }}
      >
        <X className="h-4 w-4" />
        Exit preview
      </Button>
    </div>
  );
}
