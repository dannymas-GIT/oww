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

const sizeClass = {
  nav: 'h-10 w-auto max-w-[180px] xl:h-12 xl:max-w-[220px]',
  hero: 'h-16 w-auto max-w-[320px] sm:h-20 sm:max-w-[400px] md:h-24 md:max-w-[480px]',
  footer: 'h-12 w-auto max-w-[240px]',
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
