import { useEffect, useState } from 'react';
import { HeroStorySlider } from '@/components/oww/HeroStorySlider';
import {
  HOME_HERO_SLIDES,
  HOME_HERO_VIDEO,
  normalizeHeroSlide,
  type HomeHeroSlide,
} from '@/content/homeHeroStage';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

/**
 * Home hero: loads `/public/home-slides/{state}` with static fallback, or optional video.
 */
export function HomeHeroStage({
  state = 'ny',
  className,
}: {
  state?: string;
  className?: string;
}) {
  const [slides, setSlides] = useState(() => HOME_HERO_SLIDES.map(normalizeHeroSlide));

  useEffect(() => {
    let alive = true;
    void api
      .get(`/public/home-slides/${state}`)
      .then(res => {
        const raw = (res.data?.slides || []) as HomeHeroSlide[];
        if (!alive || !raw.length) return;
        setSlides(raw.map(normalizeHeroSlide));
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [state]);

  if (HOME_HERO_VIDEO) {
    const v = HOME_HERO_VIDEO;
    return (
      <div
        className={cn(
          'relative min-h-[420px] overflow-hidden bg-oww-navy md:min-h-[520px]',
          className
        )}
      >
        <video
          className="absolute inset-0 h-full w-full object-cover"
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
        <div className="absolute inset-0 bg-gradient-to-r from-oww-navy/90 via-oww-navy/55 to-transparent" />
        <div className="relative z-10 flex min-h-[420px] max-w-xl flex-col justify-center px-6 py-10 md:min-h-[520px] md:px-12">
          <p className="text-sm font-semibold uppercase tracking-wide text-oww-cyan">Water workforce</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-white md:text-4xl">{v.caption}</h2>
        </div>
      </div>
    );
  }

  return (
    <HeroStorySlider
      slides={slides}
      state={state}
      className={className}
      ariaLabel="Home story slider"
      tourAnchor
    />
  );
}
