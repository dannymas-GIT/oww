import { useEffect, useId, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, GraduationCap, HeartHandshake, Briefcase, Users } from 'lucide-react';
import { pathwaySections, publicPathways } from '@/config/nav';
import { cn } from '@/lib/utils';

const pathwayIcons = {
  career: Users,
  hire: Briefcase,
  educate: GraduationCap,
  ambassador: HeartHandshake,
} as const;

const bySlug = Object.fromEntries(publicPathways.map(p => [p.slug, p]));

/**
 * Pathways dropdown — logically grouped (people vs organizations).
 * Native panel only (no iframe / portal shell).
 */
export function PathwaysMenu({
  state,
  onNavigate,
  variant = 'desktop',
}: {
  state: string;
  onNavigate?: () => void;
  variant?: 'desktop' | 'mobile';
}) {
  const [open, setOpen] = useState(variant === 'mobile');
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);
  const panelId = useId();
  const location = useLocation();
  const pathwayActive = /\/(career|hire|educate|ambassador)(\/|$)/.test(location.pathname);

  function openMenu() {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setOpen(true);
  }

  function scheduleClose() {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), 220);
  }

  useEffect(() => {
    if (variant !== 'desktop') return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, [variant]);

  if (variant === 'mobile') {
    return (
      <div className="space-y-3">
        {pathwaySections.map(section => (
          <div key={section.id} className="space-y-1">
            <p className="px-3 pt-2 text-sm font-semibold uppercase tracking-wide text-slate-500">{section.label}</p>
            {section.slugs.map(slug => {
              const p = bySlug[slug];
              if (!p) return null;
              const Icon = pathwayIcons[p.slug as keyof typeof pathwayIcons];
              return (
                <NavLink
                  key={p.slug}
                  to={`/${state}/${p.slug}`}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-[44px] items-start gap-3 rounded-lg px-3 py-2 text-base',
                      isActive ? 'bg-[#e8f0ff] text-oww-navy' : 'text-oww-navy hover:bg-slate-50'
                    )
                  }
                >
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-oww-cyan" aria-hidden />
                  <span>
                    <span className="block font-medium">{p.label}</span>
                    <span className="block text-sm text-slate-600">{p.description}</span>
                  </span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        className={cn(
          'inline-flex min-h-[44px] items-center gap-1 rounded-md px-2.5 text-base font-medium text-oww-navy',
          open || pathwayActive ? 'bg-[#e8f0ff] text-oww-navy' : 'hover:bg-slate-100'
        )}
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="true"
        onClick={() => setOpen(o => !o)}
      >
        Pathways
        <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', open && 'rotate-180')} aria-hidden />
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-50 pt-2" onMouseEnter={openMenu}>
          <div
            id={panelId}
            role="menu"
            className="oww-flyout w-[min(28rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
          >
            {pathwaySections.map((section, idx) => (
              <div key={section.id} className={cn(idx > 0 && 'mt-2 border-t border-slate-100 pt-2')}>
                <p className="px-3 pb-1 pt-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  {section.label}
                </p>
                {section.slugs.map(slug => {
                  const p = bySlug[slug];
                  if (!p) return null;
                  const Icon = pathwayIcons[p.slug as keyof typeof pathwayIcons];
                  return (
                    <Link
                      key={p.slug}
                      role="menuitem"
                      to={`/${state}/${p.slug}`}
                      onClick={() => {
                        setOpen(false);
                        onNavigate?.();
                      }}
                      className="flex min-h-[44px] items-start gap-3 rounded-lg px-3 py-3 text-oww-navy hover:bg-[#f4f7fb] focus-visible:bg-[#e8f0ff] focus-visible:outline-none"
                    >
                      <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#e8f0ff] text-oww-cyan">
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <span>
                        <span className="block text-base font-semibold">{p.label}</span>
                        <span className="block text-sm leading-snug text-slate-600">{p.description}</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
