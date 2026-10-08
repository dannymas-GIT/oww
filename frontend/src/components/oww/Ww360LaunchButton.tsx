import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { openWaterWorkforce360 } from '@/services/ww360Service';
import { cn } from '@/lib/utils';

/** Roles allowed to call POST /integrations/ww360/access. */
export function canLaunchWw360(roles: string[] | undefined, orgId: number | null | undefined): boolean {
  const set = new Set(roles || []);
  // Jenny / platform staff — no org required
  if (set.has('platform_admin')) return true;
  if (!orgId) return false;
  return set.has('utility_admin') || set.has('employer') || set.has('employer_admin');
}

type Ww360LaunchButtonProps = {
  /** header = compact chrome control; inline = dashboard-sized CTA; mobile = full-width menu row */
  variant?: 'header' | 'inline' | 'mobile';
  className?: string;
  onLaunched?: () => void;
  /** Deep-link path inside WW360 after redeem (e.g. /admin/users?invite=1) */
  next?: string;
  label?: string;
};

/**
 * Always-on handoff into Water Workforce 360.
 * Platform admins open as platform_admin; utility/employer admins open their org workspace.
 */
export function Ww360LaunchButton({
  variant = 'header',
  className,
  onLaunched,
  next,
  label: labelOverride,
}: Ww360LaunchButtonProps) {
  const { user, userRoles } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canLaunchWw360(userRoles, user?.org_id ?? null)) {
    return null;
  }

  const handleClick = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await openWaterWorkforce360(next ? { next } : undefined);
      onLaunched?.();
      window.location.assign(result.redirect_url);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: unknown }; status?: number } })?.response
        ?.data?.detail;
      const code =
        typeof detail === 'object' && detail && 'code' in detail
          ? String((detail as { code: string }).code)
          : null;
      if (code === 'account_suspended') {
        setError('Utility suspended — contact NYSAWWA.');
      } else if (
        code === 'payment_required' ||
        (err as { response?: { status?: number } })?.response?.status === 403
      ) {
        setError('Membership payment required — update Billing, then try again.');
      } else {
        setError('Could not open Water Workforce 360.');
      }
      setBusy(false);
    }
  };

  const label = busy ? 'Opening WW360…' : labelOverride || 'Water Workforce 360';

  if (variant === 'mobile') {
    return (
      <div className={cn('space-y-1', className)}>
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleClick()}
          className="flex min-h-[48px] w-full items-center gap-3 rounded-md bg-oww-navy px-3 text-lg font-semibold text-white hover:bg-[#003070] disabled:opacity-60"
        >
          <ExternalLink className="h-5 w-5 shrink-0" aria-hidden />
          {label}
        </button>
        {error ? (
          <p className="px-1 text-sm text-amber-800" role="status">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      <Button
        type="button"
        disabled={busy}
        onClick={() => void handleClick()}
        className={cn(
          variant === 'header'
            ? 'min-h-[48px] gap-2 bg-oww-navy px-3 text-base font-semibold text-white hover:bg-[#003070] sm:text-lg'
            : 'min-h-[44px] gap-2 bg-oww-navy text-base text-white hover:bg-[#003070]',
          busy && 'opacity-70'
        )}
        aria-label="Open Water Workforce 360"
        title="Open Water Workforce 360"
      >
        <ExternalLink className="h-5 w-5 shrink-0" aria-hidden />
        <span className={variant === 'header' ? 'hidden md:inline' : undefined}>{label}</span>
        {variant === 'header' ? (
          <span className="md:hidden">{busy ? '…' : 'WW360'}</span>
        ) : null}
      </Button>
      {error ? (
        <p
          className="absolute right-0 top-full z-50 mt-1 w-64 rounded-md border border-amber-200 bg-amber-50 p-2 text-sm text-amber-950 shadow-md"
          role="status"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
