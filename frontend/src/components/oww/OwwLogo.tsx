import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

type OwwLogoProps = {
  to?: string;
  /** Compact for sticky nav; full for landing/login */
  size?: 'nav' | 'hero' | 'footer';
  /** Dark surfaces need a light chip behind the full-color mark */
  onDark?: boolean;
  className?: string;
  showTagline?: boolean;
};

/**
 * Logo sizes aligned with AquaSafe / WW360 `WW360_LOGO_SIZE` in brandHost.ts:
 * navMinPx 120 · navPx 148 · heroPx 260 · loginPx 320.
 * Brand must predominate the chrome row — never favicon-scale.
 */
export const OWW_LOGO_SIZE = {
  navMinPx: 120,
  navPx: 148,
  heroPx: 260,
  loginPx: 320,
} as const;

const sizeClass = {
  nav: 'h-[7.5rem] w-auto max-w-[min(100%,28rem)] md:h-[9.25rem] md:max-w-[36rem]',
  hero: 'h-[12rem] w-auto max-w-[min(100%,40rem)] sm:h-[14rem] sm:max-w-[48rem] md:h-[16.25rem] md:max-w-[56rem]',
  footer: 'h-[7.5rem] w-auto max-w-[28rem]',
} as const;

/**
 * Official One Water Workforce wordmark + droplet mark.
 * Asset: /brand/oww-logo.png (includes tagline “From GED to PhD: A Job for Everyone”).
 */
export function OwwLogo({
  to = '/',
  size = 'nav',
  onDark = false,
  className,
  showTagline = true,
}: OwwLogoProps) {
  const img = (
    <img
      src="/brand/oww-logo.png"
      alt="One Water Workforce — From GED to PhD: A Job for Everyone"
      className={cn(sizeClass[size], 'object-contain object-left', className)}
      width={480}
      height={160}
      decoding="async"
    />
  );

  const wrapped = onDark ? (
    <span
      className={cn(
        'inline-flex items-center rounded-lg bg-white px-2.5 py-1.5 shadow-sm ring-1 ring-white/40',
        size === 'hero' && 'px-4 py-3'
      )}
    >
      {img}
    </span>
  ) : (
    img
  );

  if (!to) return wrapped;

  return (
    <Link
      to={to}
      className="inline-flex min-h-[44px] items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oww-cyan"
      aria-label="One Water Workforce home"
    >
      {wrapped}
      {/* Tagline is in the raster; keep prop for future SVG split */}
      {!showTagline ? null : null}
    </Link>
  );
}
