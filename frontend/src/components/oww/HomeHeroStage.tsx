import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import {
  HOME_HERO_SLIDES,
  HOME_HERO_VIDEO,
  normalizeHeroSlide,
  type HomeHeroSlide,
} from '@/content/homeHeroStage';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const ROTATE_MS = 7000;

/**
 * Full-panel home hero rotator: 3-tier copy (kicker / title / body) + image.
 * Loads from `/public/home-slides/{state}` with static fallback.
 */
export function HomeHeroStage({
  state = 'ny',
  className,
}: {
  state?: string;
  className?: string;
}) {
  const [slides, setSlides] = useState(() => HOME_HERO_SLIDES.map(normalizeHeroSlide));
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let alive = true;
    void api
      .get(`/public/home-slides/${state}`)
      .then(res => {
        const raw = (res.data?.slides || []) as HomeHeroSlide[];
        if (!alive || !raw.length) return;
        setSlides(raw.map(normalizeHeroSlide));
        setIndex(0);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [state]);

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
      <div
        className={cn(
          'flex h-full min-h-[320px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm',
          className
        )}
      >
        <div className="space-y-2 px-4 py-4 sm:px-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-oww-cyan">Water workforce</p>
          <h2 className="font-display text-xl font-semibold text-oww-navy sm:text-2xl">{v.caption}</h2>
        </div>
        <div className="relative min-h-0 flex-1 bg-oww-navy">
          <video className="h-full w-full object-cover" src={v.src} poster={v.poster} controls playsInline muted loop autoPlay>
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
        'flex h-full min-h-[320px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm',
        className
      )}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Home story rotator"
    >
      {/* Entire card is the rotator unit: 3 tiers + image */}
      <div className="relative flex min-h-0 flex-1 flex-col">
        {slides.map((s, i) => (
          <div
            key={s.id}
            className={cn(
              'absolute inset-0 flex flex-col transition-opacity duration-700',
              i === index ? 'opacity-100' : 'pointer-events-none opacity-0'
            )}
            aria-hidden={i !== index}
          >
            <div className="shrink-0 space-y-2 px-4 py-4 sm:px-5 sm:py-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-oww-cyan">{s.kicker}</p>
              <h2 className="font-display text-xl font-semibold leading-snug text-oww-navy sm:text-2xl">{s.title}</h2>
              <p className="text-base leading-relaxed text-slate-700">{s.body}</p>
            </div>
            <div className="relative min-h-0 flex-1 bg-slate-100">
              <img
                src={s.imageSrc}
                alt={s.imageAlt}
                className="absolute inset-0 h-full w-full object-cover"
                loading={i === 0 ? 'eager' : 'lazy'}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="relative z-10 flex shrink-0 items-center justify-between gap-2 border-t border-slate-100 bg-white px-2 py-1.5">
        <div className="flex items-center gap-0.5" role="tablist" aria-label="Slide">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show ${s.title}`}
              className="flex h-11 min-w-[44px] items-center justify-center px-1.5"
              onClick={() => setIndex(i)}
            >
              <span
                className={cn(
                  'block h-2.5 w-2.5 rounded-full',
                  i === index ? 'bg-oww-cyan' : 'bg-slate-300'
                )}
              />
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-oww-navy hover:bg-slate-100"
            aria-label="Previous slide"
            onClick={() => go(-1)}
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-oww-navy hover:bg-slate-100"
            aria-label={paused ? 'Play slideshow' : 'Pause slideshow'}
            onClick={() => setPaused(p => !p)}
          >
            {paused ? <Play className="h-5 w-5" aria-hidden /> : <Pause className="h-5 w-5" aria-hidden />}
          </button>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-oww-navy hover:bg-slate-100"
            aria-label="Next slide"
            onClick={() => go(1)}
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
