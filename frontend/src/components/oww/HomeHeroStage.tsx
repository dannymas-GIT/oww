import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { HOME_HERO_SLIDES, HOME_HERO_VIDEO } from '@/content/homeHeroStage';
import { cn } from '@/lib/utils';

const ROTATE_MS = 6500;

/**
 * Home hero media stage: informational copy above a rotating water-quality image
 * (or optional video). Replaces the static navy callout panel.
 */
export function HomeHeroStage({ className }: { className?: string }) {
  const slides = HOME_HERO_SLIDES;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || HOME_HERO_VIDEO || slides.length < 2) return;
    const id = window.setInterval(() => {
      setIndex(i => (i + 1) % slides.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [paused, slides.length]);

  if (HOME_HERO_VIDEO) {
    const v = HOME_HERO_VIDEO;
    return (
      <div className={cn('flex h-full min-h-[280px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm', className)}>
        <div className="space-y-2 border-b border-slate-100 px-4 py-3 sm:px-5 sm:py-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-oww-cyan">Water workforce</p>
          <h2 className="font-display text-xl font-semibold text-oww-navy sm:text-2xl">{v.caption}</h2>
        </div>
        <div className="relative min-h-0 flex-1 bg-oww-navy">
          <video
            className="h-full w-full object-cover"
            src={v.src}
            poster={v.poster}
            controls
            playsInline
            muted
            loop
            autoPlay
          >
            Your browser does not support embedded video.
          </video>
        </div>
      </div>
    );
  }

  const slide = slides[index] ?? slides[0];
  if (!slide) return null;

  function go(delta: number) {
    setIndex(i => (i + delta + slides.length) % slides.length);
  }

  return (
    <div
      className={cn(
        'flex h-full min-h-[280px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm',
        className
      )}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Water quality stories"
    >
      <div className="space-y-2 border-b border-slate-100 px-4 py-3 sm:px-5 sm:py-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-oww-cyan">{slide.kicker}</p>
        <h2 className="font-display text-xl font-semibold leading-snug text-oww-navy sm:text-2xl">{slide.title}</h2>
        <p className="text-base leading-relaxed text-slate-700">{slide.body}</p>
      </div>

      <div className="relative min-h-[180px] flex-1 bg-slate-100 sm:min-h-[220px]">
        {slides.map((s, i) => (
          <img
            key={s.id}
            src={s.imageSrc}
            alt={s.imageAlt}
            className={cn(
              'absolute inset-0 h-full w-full object-cover transition-opacity duration-700',
              i === index ? 'opacity-100' : 'opacity-0'
            )}
            loading={i === 0 ? 'eager' : 'lazy'}
          />
        ))}

        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-oww-navy/70 to-transparent px-3 pb-3 pt-10">
          <div className="flex items-center gap-1" role="tablist" aria-label="Slide">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Show ${s.title}`}
                className={cn(
                  'h-3 min-h-[44px] min-w-[44px] rounded-full px-2',
                  'flex items-center justify-center'
                )}
                onClick={() => setIndex(i)}
              >
                <span
                  className={cn(
                    'block h-2.5 w-2.5 rounded-full ring-2 ring-white/80',
                    i === index ? 'bg-white' : 'bg-white/40'
                  )}
                />
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-oww-navy hover:bg-white"
              aria-label="Previous slide"
              onClick={() => go(-1)}
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-oww-navy hover:bg-white"
              aria-label={paused ? 'Play slideshow' : 'Pause slideshow'}
              onClick={() => setPaused(p => !p)}
            >
              {paused ? <Play className="h-5 w-5" aria-hidden /> : <Pause className="h-5 w-5" aria-hidden />}
            </button>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-oww-navy hover:bg-white"
              aria-label="Next slide"
              onClick={() => go(1)}
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
