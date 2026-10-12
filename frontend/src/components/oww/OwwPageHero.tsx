import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Use on outline/ghost buttons inside OwwPageHero actions (navy background). */
export const OWW_HERO_OUTLINE_BTN =
  'min-h-[44px] border-white/40 bg-white/10 text-base text-white shadow-none hover:bg-white/20 hover:text-white';

export interface OwwPageHeroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  badges?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function OwwPageHero({
  eyebrow,
  title,
  description,
  badges,
  actions,
  className,
}: OwwPageHeroProps) {
  return (
    <header
      className={cn(
        'relative overflow-hidden rounded-2xl bg-oww-navy px-6 py-6 text-white shadow-md md:px-8 md:py-8',
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(55% 80% at 88% 18%, rgba(0,93,248,0.45), transparent 58%), radial-gradient(45% 65% at 8% 88%, rgba(0,92,232,0.28), transparent 55%)',
        }}
      />
      {/* subtle wave motif echoing the logo droplet */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-6 left-0 right-0 h-16 opacity-30"
        style={{
          background:
            'linear-gradient(180deg, transparent, rgba(0,93,248,0.35)), radial-gradient(120% 80% at 20% 100%, rgba(0,92,232,0.5), transparent 55%)',
        }}
      />
      <div className="relative flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 max-w-3xl">
          {eyebrow ? (
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#7eb0ff]">{eyebrow}</p>
          ) : null}
          <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
          {description ? (
            <p className="mt-3 text-lg leading-relaxed text-slate-200">{description}</p>
          ) : null}
          {badges ? <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">{badges}</div> : null}
        </div>
        {actions ? (
          <div
            className={cn(
              'flex flex-wrap items-center gap-2',
              // Outline buttons use bg-background (white) but inherit hero text-white → invisible.
              // Force glass + white label for any bordered control in the actions slot.
              '[&_a.border]:border-white/40 [&_a.border]:bg-white/10 [&_a.border]:text-white [&_a.border]:shadow-none',
              '[&_a.border]:hover:bg-white/20 [&_a.border]:hover:text-white',
              '[&_button.border]:border-white/40 [&_button.border]:bg-white/10 [&_button.border]:text-white [&_button.border]:shadow-none',
              '[&_button.border]:hover:bg-white/20 [&_button.border]:hover:text-white'
            )}
          >
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}
