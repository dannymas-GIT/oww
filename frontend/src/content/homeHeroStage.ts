/** Fallback home hero slides when the API is empty/unreachable. */

export type HomeHeroSlide = {
  id: string | number;
  scope?: string;
  kicker: string;
  title: string;
  body: string;
  imageSrc?: string;
  image_url?: string;
  imageAlt?: string;
  image_alt?: string;
  cta_label?: string | null;
  cta_href?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
};

export const HOME_HERO_SLIDES: HomeHeroSlide[] = [
  {
    id: 'oww',
    kicker: 'One Water Workforce',
    title: 'From GED to PhD: careers that keep water safe',
    body: 'OWW connects seekers, educators, ambassadors, and hiring utilities so New York can recruit and train the next generation of water professionals.',
    imageSrc: '/home/stage/oww-careers.jpg',
    imageAlt: 'Workforce participants touring a water treatment plant control room',
    ctaLabel: 'Express interest',
    ctaHref: '/{state}/interest',
  },
  {
    id: 'ww360',
    kicker: 'Water Workforce 360',
    title: 'Utility staffing, CEU, and succession in one place',
    body: 'WW360 helps utilities document operators, training, and upcoming vacancies—so OWW outreach and candidate development start before gaps become emergencies.',
    imageSrc: '/home/stage/ww360.jpg',
    imageAlt: 'Utility manager reviewing workforce and training dashboards',
    ctaLabel: 'For utilities',
    ctaHref: '/{state}/hire',
  },
  {
    id: 'lab',
    kicker: 'Drinking water quality',
    title: 'Lab testing protects every tap',
    body: 'Operators and analysts verify turbidity, chlorine residual, and contaminants so communities can trust the water that reaches their homes.',
    imageSrc: '/home/stage/lab-testing.jpg',
    imageAlt: 'Water quality analyst testing drinking water samples in a treatment plant laboratory',
    ctaLabel: 'Browse jobs',
    ctaHref: '/{state}/jobs',
  },
  {
    id: 'treatment',
    kicker: 'Treatment & filtration',
    title: 'Clean water starts at the plant',
    body: 'Clarifiers, filters, and distribution systems turn source water into safe drinking water—work that depends on skilled people at every step.',
    imageSrc: '/home/stage/treatment-plant.jpg',
    imageAlt: 'Municipal drinking water treatment plant filtration and clarifying basins',
    ctaLabel: 'Start a career',
    ctaHref: '/{state}/career',
  },
  {
    id: 'source',
    kicker: 'Source water protection',
    title: 'Monitoring lakes, rivers, and reservoirs',
    body: 'Field sampling and watershed oversight catch quality issues early—before they become public-health emergencies.',
    imageSrc: '/home/stage/source-sampling.jpg',
    imageAlt: 'Operator sampling clear reservoir water for quality monitoring',
    ctaLabel: 'Educators',
    ctaHref: '/{state}/educate',
  },
  {
    id: 'wastewater',
    kicker: 'Wastewater & environment',
    title: 'Protecting rivers after use',
    body: 'Wastewater operators return treated water to the environment, safeguarding fishable, swimmable waters across New York.',
    imageSrc: '/home/stage/wastewater.jpg',
    imageAlt: 'Wastewater treatment aeration basin protecting receiving waters',
    ctaLabel: 'Become an ambassador',
    ctaHref: '/{state}/ambassador',
  },
];

/** Optional future hero video (when set, stage can prefer video over the carousel). */
export const HOME_HERO_VIDEO: { src: string; poster?: string; caption: string } | null = null;

export function resolveSlideHref(href: string | null | undefined, state: string): string {
  if (!href) return '';
  return href.replace(/\{state\}/gi, state.toLowerCase());
}

export function normalizeHeroSlide(s: HomeHeroSlide): {
  id: string | number;
  kicker: string;
  title: string;
  body: string;
  imageSrc: string;
  imageAlt: string;
  ctaLabel: string;
  ctaHref: string;
} {
  return {
    id: s.id,
    kicker: s.kicker || '',
    title: s.title || '',
    body: s.body || '',
    imageSrc: s.imageSrc || s.image_url || '',
    imageAlt: s.imageAlt || s.image_alt || s.title || 'Home slide',
    ctaLabel: (s.ctaLabel || s.cta_label || '').trim(),
    ctaHref: (s.ctaHref || s.cta_href || '').trim(),
  };
}
