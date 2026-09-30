import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DropdownItem = {
  label: string;
  path: string;
  icon?: LucideIcon;
  description?: string;
};

export type DropdownSection = {
  id: string;
  label: string;
  items: DropdownItem[];
};

/**
 * Native dropdown menu (no portals/iframes). Click + hover, Escape, outside-click.
 * When there is a single section (top-level group already named), item list has no inner header.
 */
export function NavDropdown({
  label,
  sections,
  activeMatch,
  align = 'left',
  onNavigate,
  showSectionLabels,
}: {
  label: string;
  sections: DropdownSection[];
  /** Path prefix or predicate — highlights the trigger when a child route is active */
  activeMatch?: string | ((pathname: string) => boolean);
  align?: 'left' | 'right';
  onNavigate?: () => void;
  /** Default: true only when multiple sections are passed */
  showSectionLabels?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);
  const panelId = useId();
  const location = useLocation();
  const withLabels = showSectionLabels ?? sections.length > 1;

  const allPaths = sections.flatMap(s => s.items.map(i => i.path));
  const active =
    typeof activeMatch === 'function'
      ? activeMatch(location.pathname)
      : activeMatch
        ? location.pathname.startsWith(activeMatch)
        : allPaths.some(p => location.pathname === p || location.pathname.startsWith(`${p}/`));

  function openMenu() {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setOpen(true);
  }

  function scheduleClose() {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), 220);
  }

  useEffect(() => {
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
  }, []);

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
          'inline-flex min-h-[44px] shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-2.5 text-base font-medium text-oww-navy',
          open || active ? 'bg-[#e8f0ff] text-oww-navy' : 'hover:bg-slate-100'
        )}
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="true"
        onClick={() => setOpen(o => !o)}
      >
        {label}
        <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', open && 'rotate-180')} aria-hidden />
      </button>
      {open ? (
        <div
          className={cn('absolute top-full z-50 pt-2', align === 'right' ? 'right-0' : 'left-0')}
          onMouseEnter={openMenu}
        >
          <div
            id={panelId}
            role="menu"
            className="oww-flyout w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
          >
            {sections.map((section, idx) => (
              <div key={section.id} className={cn(withLabels && idx > 0 && 'mt-2 border-t border-slate-100 pt-2')}>
                {withLabels ? (
                  <p className="px-3 pb-1 pt-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
                    {section.label}
                  </p>
                ) : null}
                <ul className="space-y-0.5">
                  {section.items.map(item => {
                    const Icon = item.icon;
                    const isItemActive =
                      location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                    return (
                      <li key={item.path}>
                        <Link
                          role="menuitem"
                          to={item.path}
                          onClick={() => {
                            setOpen(false);
                            onNavigate?.();
                          }}
                          className={cn(
                            'flex min-h-[44px] items-start gap-3 rounded-lg px-3 py-2.5 text-oww-navy hover:bg-[#f4f7fb] focus-visible:bg-[#e8f0ff] focus-visible:outline-none',
                            isItemActive && 'bg-[#e8f0ff]'
                          )}
                        >
                          {Icon ? (
                            <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e8f0ff] text-oww-cyan">
                              <Icon className="h-4 w-4" aria-hidden />
                            </span>
                          ) : null}
                          <span className="min-w-0">
                            <span className="block text-base font-semibold">{item.label}</span>
                            {item.description ? (
                              <span className="block text-sm leading-snug text-slate-600">{item.description}</span>
                            ) : null}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
