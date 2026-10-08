import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

type PreviewSize = 'icon' | 'large';

/** Wireframe blocks that mirror each CMS template’s public section stack. */
function LayoutWireframe({ templateId, size }: { templateId: string; size: PreviewSize }) {
  const large = size === 'large';
  const gap = large ? 'gap-2' : 'gap-0.5';
  const pad = large ? 'p-3' : 'p-1';
  const radius = large ? 'rounded-md' : 'rounded-sm';
  const label = large ? 'text-[11px] font-semibold uppercase tracking-wide text-slate-500' : 'sr-only';

  const hero = (
    <div className={cn(radius, 'bg-oww-navy', large ? 'space-y-2 p-3' : 'space-y-0.5 p-1')}>
      <div className={cn('rounded-sm bg-sky-400/40', large ? 'h-2 w-1/3' : 'h-1 w-1/3')} />
      <div className={cn('rounded-sm bg-white/90', large ? 'h-3 w-4/5' : 'h-1.5 w-4/5')} />
      <div className={cn('rounded-sm bg-white/50', large ? 'h-2 w-3/5' : 'h-1 w-3/5')} />
      <div className={cn('flex', large ? 'gap-2 pt-1' : 'gap-0.5')}>
        <div className={cn('rounded-sm bg-oww-cyan', large ? 'h-4 w-14' : 'h-1.5 w-4')} />
        <div className={cn('rounded-sm bg-white/30', large ? 'h-4 w-14' : 'h-1.5 w-4')} />
      </div>
    </div>
  );

  const stats = (
    <div className={cn('grid grid-cols-4', large ? 'gap-2' : 'gap-0.5')}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={cn(radius, 'border border-slate-200 bg-white', large ? 'p-2' : 'p-0.5')}>
          <div className={cn('rounded-sm bg-oww-navy/80', large ? 'mb-1 h-3 w-8' : 'mb-0.5 h-1.5 w-3')} />
          <div className={cn('rounded-sm bg-slate-200', large ? 'h-1.5 w-full' : 'h-0.5 w-full')} />
        </div>
      ))}
    </div>
  );

  const cards2 = (
    <div className={cn('grid grid-cols-2', large ? 'gap-2' : 'gap-0.5')}>
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className={cn(radius, 'border border-slate-200 bg-white', large ? 'space-y-1.5 p-2' : 'space-y-0.5 p-0.5')}
        >
          <div className={cn('rounded-sm bg-oww-navy/70', large ? 'h-2 w-2/3' : 'h-1 w-2/3')} />
          <div className={cn('rounded-sm bg-slate-200', large ? 'h-1.5 w-full' : 'h-0.5 w-full')} />
          <div className={cn('rounded-sm bg-slate-100', large ? 'h-1.5 w-4/5' : 'h-0.5 w-4/5')} />
        </div>
      ))}
    </div>
  );

  const cards4 = (
    <div className={cn('grid grid-cols-2', large ? 'gap-2' : 'gap-0.5')}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className={cn(radius, 'border border-slate-200 bg-white', large ? 'space-y-1 p-2' : 'space-y-0.5 p-0.5')}
        >
          <div className={cn('rounded-sm bg-oww-cyan/40', large ? 'mb-1 h-5 w-5' : 'mb-0.5 h-2 w-2')} />
          <div className={cn('rounded-sm bg-oww-navy/70', large ? 'h-2 w-3/4' : 'h-1 w-3/4')} />
          <div className={cn('rounded-sm bg-slate-200', large ? 'h-1.5 w-full' : 'h-0.5 w-full')} />
        </div>
      ))}
    </div>
  );

  const richText = (
    <div className={cn(radius, 'border border-slate-200 bg-white', large ? 'space-y-1.5 p-3' : 'space-y-0.5 p-1')}>
      <div className={cn('rounded-sm bg-oww-navy/60', large ? 'h-2 w-1/3' : 'h-1 w-1/3')} />
      <div className={cn('rounded-sm bg-slate-200', large ? 'h-1.5 w-full' : 'h-0.5 w-full')} />
      <div className={cn('rounded-sm bg-slate-200', large ? 'h-1.5 w-11/12' : 'h-0.5 w-11/12')} />
      <div className={cn('rounded-sm bg-slate-100', large ? 'h-1.5 w-4/5' : 'h-0.5 w-4/5')} />
    </div>
  );

  const gallery = (
    <div className={cn('grid grid-cols-2', large ? 'gap-2' : 'gap-0.5')}>
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className={cn(radius, 'bg-gradient-to-br from-sky-100 to-oww-navy/20', large ? 'h-16' : 'h-4')}
        />
      ))}
    </div>
  );

  const quote = (
    <div className={cn(radius, 'border border-slate-200 bg-white', large ? 'space-y-2 p-3' : 'space-y-0.5 p-1')}>
      <div className={cn('rounded-sm bg-slate-300', large ? 'h-2 w-full' : 'h-0.5 w-full')} />
      <div className={cn('rounded-sm bg-slate-200', large ? 'h-2 w-5/6' : 'h-0.5 w-5/6')} />
      <div className={cn('rounded-sm bg-slate-400', large ? 'mt-1 h-1.5 w-1/3' : 'h-0.5 w-1/3')} />
    </div>
  );

  const cta = (
    <div
      className={cn(
        radius,
        'bg-oww-navy',
        large ? 'flex items-center justify-between p-3' : 'flex items-center justify-between p-1'
      )}
    >
      <div className="space-y-0.5">
        <div className={cn('rounded-sm bg-white/80', large ? 'h-2 w-24' : 'h-1 w-8')} />
        <div className={cn('rounded-sm bg-white/40', large ? 'h-1.5 w-32' : 'h-0.5 w-10')} />
      </div>
      <div className={cn('rounded-sm bg-oww-cyan', large ? 'h-5 w-16' : 'h-2 w-5')} />
    </div>
  );

  const blogMeta = (
    <div className={cn('flex items-center', large ? 'gap-2' : 'gap-0.5')}>
      <div className={cn('rounded-sm bg-slate-300', large ? 'h-2 w-20' : 'h-1 w-6')} />
      <div className={cn('rounded-full bg-slate-200', large ? 'h-2 w-2' : 'h-1 w-1')} />
      <div className={cn('rounded-sm bg-slate-300', large ? 'h-2 w-16' : 'h-1 w-5')} />
      <div className={cn('ml-auto flex', large ? 'gap-1' : 'gap-0.5')}>
        <div className={cn('rounded-full bg-oww-cyan/30', large ? 'h-3 w-10' : 'h-1.5 w-3')} />
        <div className={cn('rounded-full bg-oww-cyan/30', large ? 'h-3 w-10' : 'h-1.5 w-3')} />
      </div>
    </div>
  );

  const heroWithMedia = (
    <div className={cn(large ? 'grid grid-cols-[1.2fr_0.8fr] gap-2' : 'grid grid-cols-[1.2fr_0.8fr] gap-0.5')}>
      {hero}
      <div
        className={cn(
          radius,
          'bg-gradient-to-br from-sky-200 to-oww-navy/40',
          large ? 'min-h-[5.5rem]' : 'min-h-[2rem]'
        )}
      />
    </div>
  );

  let blocks: ReactNode;
  let title: string;

  switch (templateId) {
    case 'home_landing':
      title = 'Home landing layout';
      blocks = (
        <>
          <p className={label}>Hero</p>
          {hero}
          <p className={label}>Stat strip</p>
          {stats}
          <p className={label}>Pathway cards</p>
          {cards4}
          <p className={label}>Rich text</p>
          {richText}
          <p className={label}>Quote</p>
          {quote}
          <p className={label}>Call to action</p>
          {cta}
        </>
      );
      break;
    case 'pathway_landing':
      title = 'Pathway landing layout';
      blocks = (
        <>
          <p className={label}>Hero</p>
          {hero}
          <p className={label}>Action cards</p>
          {cards2}
          <p className={label}>Rich text</p>
          {richText}
          <p className={label}>Call to action</p>
          {cta}
        </>
      );
      break;
    case 'story_feature':
      title = 'Story / feature layout';
      blocks = (
        <>
          <p className={label}>Hero + media</p>
          {heroWithMedia}
          <p className={label}>Story body</p>
          {richText}
          <p className={label}>Gallery</p>
          {gallery}
          <p className={label}>Call to action</p>
          {cta}
        </>
      );
      break;
    case 'simple_page':
      title = 'Simple page layout';
      blocks = (
        <>
          <p className={label}>Hero</p>
          {hero}
          <p className={label}>Body</p>
          {richText}
          <p className={label}>Optional media</p>
          {gallery}
          <p className={label}>Call to action</p>
          {cta}
        </>
      );
      break;
    case 'blog_post':
      title = 'Blog post layout';
      blocks = (
        <>
          <p className={label}>Date · author · tags</p>
          {blogMeta}
          <p className={label}>Hero</p>
          {hero}
          <p className={label}>Post body</p>
          {richText}
          <p className={label}>Media</p>
          {gallery}
          <p className={label}>Call to action</p>
          {cta}
        </>
      );
      break;
    default:
      title = 'Page layout';
      blocks = (
        <>
          {hero}
          {richText}
          {cta}
        </>
      );
  }

  return (
    <div
      className={cn('flex flex-col bg-[#f4f7fb]', gap, pad, large ? 'min-h-[22rem] w-full' : 'h-full w-full')}
      aria-hidden={size === 'icon'}
    >
      {large ? <p className="mb-1 font-display text-base font-semibold text-oww-navy">{title}</p> : null}
      {blocks}
    </div>
  );
}

export function CmsTemplateLayoutThumb({
  templateId,
  label,
  selected,
  className,
}: {
  templateId: string;
  label: string;
  selected?: boolean;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const closeTimer = useRef<number | null>(null);

  const place = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const previewW = Math.min(420, window.innerWidth - 24);
    const previewH = Math.min(520, window.innerHeight - 24);
    let left = rect.right + 12;
    if (left + previewW > window.innerWidth - 12) {
      left = Math.max(12, rect.left - previewW - 12);
    }
    let top = rect.top;
    if (top + previewH > window.innerHeight - 12) {
      top = Math.max(12, window.innerHeight - previewH - 12);
    }
    setCoords({ top, left });
  }, []);

  const show = useCallback(() => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    place();
    setOpen(true);
  }, [place]);

  const hide = useCallback(() => {
    closeTimer.current = window.setTimeout(() => setOpen(false), 120);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => place();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open, place]);

  useEffect(
    () => () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    },
    []
  );

  return (
    <>
      <div
        ref={wrapRef}
        className={cn('relative shrink-0', className)}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        <div
          tabIndex={0}
          role="img"
          aria-label={`${label} layout preview — hover or focus for a larger sample`}
          className={cn(
            'h-[4.5rem] w-[3.25rem] overflow-hidden rounded-md border bg-white shadow-sm outline-none ring-oww-cyan focus-visible:ring-2 sm:h-[5.25rem] sm:w-[3.75rem]',
            selected ? 'border-oww-cyan' : 'border-slate-300'
          )}
        >
          <LayoutWireframe templateId={templateId} size="icon" />
        </div>
      </div>

      {open
        ? createPortal(
            <div
              role="dialog"
              aria-label={`${label} layout sample`}
              className="fixed z-[80] w-[min(100vw-1.5rem,26rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
              style={{ top: coords.top, left: coords.left }}
              onMouseEnter={show}
              onMouseLeave={hide}
            >
              <div className="border-b border-slate-200 bg-oww-navy px-4 py-3 text-white">
                <p className="text-sm font-semibold uppercase tracking-wide text-sky-200">Layout sample</p>
                <p className="font-display text-lg font-semibold">{label}</p>
              </div>
              <div className="max-h-[min(70vh,28rem)] overflow-y-auto p-3">
                <LayoutWireframe templateId={templateId} size="large" />
              </div>
              <p className="border-t border-slate-100 px-4 py-2 text-sm text-slate-600">
                Blocks match the sections on the public page for this template.
              </p>
            </div>,
            document.body
          )
        : null}
    </>
  );
}

export function templateDisplayLabel(templateId?: string | null, catalogLabel?: string) {
  if (catalogLabel) return catalogLabel;
  switch (templateId) {
    case 'home_landing':
      return 'Home landing';
    case 'pathway_landing':
      return 'Pathway landing';
    case 'story_feature':
      return 'Story / feature';
    case 'simple_page':
      return 'Simple page';
    case 'blog_post':
      return 'Blog post';
    default:
      return templateId || 'Page';
  }
}
