import { useEffect, useState } from 'react';
import {
  normalizeHeroSlide,
  type HomeHeroSlide,
} from '@/content/homeHeroStage';
import { api } from '@/lib/api';

export type NormalizedPublicSlide = ReturnType<typeof normalizeHeroSlide>;

/**
 * Load public hero slides for a scope (home | career | hire | educate | ambassador).
 * Falls back to static slides when the API is empty or unreachable.
 */
export function usePublicSlides(
  state: string,
  scope: string,
  fallback: HomeHeroSlide[]
): NormalizedPublicSlide[] {
  const [slides, setSlides] = useState(() => fallback.map(normalizeHeroSlide));

  useEffect(() => {
    setSlides(fallback.map(normalizeHeroSlide));
    let alive = true;
    void api
      .get(`/public/home-slides/${state}`, { params: { scope } })
      .then(res => {
        const raw = (res.data?.slides || []) as HomeHeroSlide[];
        if (!alive || !raw.length) return;
        setSlides(raw.map(normalizeHeroSlide));
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
    // fallback is a module-level constant keyed by scope
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional stable fallback per scope
  }, [state, scope]);

  return slides;
}
