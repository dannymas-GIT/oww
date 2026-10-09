import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import {
  normalizeHeroSlide,
  resolveSlideHref,
  type HomeHeroSlide,
} from '@/content/homeHeroStage';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const ROTATE_MS = 7000;

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

export type NormalizedSlide = ReturnType<typeof normalizeHeroSlide>;

/**
 * Full-width right→left story slider (shared by home + pathway pages).
 */
export function HeroStorySlider({
  slides: rawSlides,
  state = 'ny',
  className,
  ariaLabel = 'Story slider',
  tourAnchor = false,
}: {
  slides: HomeHeroSlide[] | NormalizedSlide[];
  state?: string;
  className?: string;
  ariaLabel?: string;
  /** When true, active CTA gets data-tour="hero-cta" for the home tour. */
  tourAnchor?: boolean;
}) {
  const slides = rawSlides.map(s => normalizeHeroSlide(s as HomeHeroSlide));
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const slideKey = slides.map(s => String(s.id)).join('|');

  useEffect(() => {
    setIndex(0);
  }, [slideKey]);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const id = window.setInterval(() => {
      setIndex(i => (i + 1) % slides.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [paused, slides.length]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setIndex(i => (i - 1 + slides.length) % slides.length);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setIndex(i => (i + 1) % slides.length);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [slides.length]);

  if (!slides.length) return null;

  function go(delta: number) {
    setIndex(i => (i + delta + slides.length) % slides.length);
  }

  return (
    <div
      className={cn('relative w-full', className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={e => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
      }}
      aria-roledescription="carousel"
      aria-label={ariaLabel}
    >
      <div className="relative min-h-[420px] overflow-hidden bg-oww-navy md:min-h-[520px]">
        <div
          className={cn(
            'flex h-full min-h-[420px] w-full md:min-h-[520px]',
            !reducedMotion && 'transition-transform duration-700 ease-out'
          )}
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((s, i) => {
            const href = resolveSlideHref(s.ctaHref, state);
            const showCta = Boolean(s.ctaLabel && href);
            return (
              <div
                key={s.id}
                className="relative min-h-[420px] w-full shrink-0 md:min-h-[520px]"
                aria-hidden={i !== index}
              >
                <img
                  src={s.imageSrc}
                  alt={s.imageAlt}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading={i === 0 ? 'eager' : 'lazy'}
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-r from-oww-navy/92 via-oww-navy/65 to-oww-navy/20"
                />
                <div className="relative z-10 flex min-h-[420px] max-w-2xl flex-col justify-center px-6 py-12 md:min-h-[520px] md:px-12 lg:px-16">
                  <p className="text-sm font-semibold uppercase tracking-wide text-oww-cyan">{s.kicker}</p>
                  <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-white md:text-4xl">
                    {s.title}
                  </h2>
                  <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/90">{s.body}</p>
                  {showCta ? (
                    <div className="mt-6">
                      <Button
                        className="min-h-[44px] bg-oww-cyan text-base text-white hover:bg-sky-700"
                        data-tour={tourAnchor && i === index ? 'hero-cta' : undefined}
                        asChild
                      >
                        <Link to={href}>{s.ctaLabel}</Link>
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-2 py-1.5 sm:px-4">
        <div className="flex flex-wrap items-center gap-0.5" role="tablist" aria-label="Slide">
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
