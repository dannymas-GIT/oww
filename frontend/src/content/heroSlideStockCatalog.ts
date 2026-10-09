/**
 * Curated hero-slide imagery for admins — OWW-owned generated assets (no third-party license).
 * Prefer 16:9 landscape so the full-bleed slider + left text scrim look correct.
 */

export const HERO_SLIDE_IMAGE_SPECS = {
  aspectRatio: '16:9',
  recommendedPx: '1920 × 1080',
  minimumPx: '1280 × 720',
  formats: 'JPEG or WebP',
  maxFileHint: 'Under ~500 KB after compression',
  composition:
    'Leave visual interest on the right; keep the left third relatively clear for the navy text scrim and headline.',
} as const;

export type HeroStockImage = {
  id: string;
  url: string;
  title: string;
  alt: string;
  tags: string[];
  /** Suggested scopes; empty = any */
  scopes?: Array<'home' | 'career' | 'hire' | 'educate' | 'ambassador'>;
};

export const HERO_SLIDE_STOCK_CATALOG: HeroStockImage[] = [
  {
    id: 'home-lab',
    url: '/home/stage/lab-testing.jpg',
    title: 'Lab testing',
    alt: 'Water quality analyst testing drinking water samples in a laboratory',
    tags: ['lab', 'quality', 'home'],
    scopes: ['home', 'career', 'educate'],
  },
  {
    id: 'home-treatment',
    url: '/home/stage/treatment-plant.jpg',
    title: 'Treatment plant',
    alt: 'Municipal drinking water treatment plant filtration basins',
    tags: ['plant', 'treatment', 'home'],
    scopes: ['home', 'hire', 'career'],
  },
  {
    id: 'home-source',
    url: '/home/stage/source-sampling.jpg',
    title: 'Source sampling',
    alt: 'Operator sampling clear reservoir water for quality monitoring',
    tags: ['source', 'field', 'home'],
    scopes: ['home', 'educate', 'ambassador'],
  },
  {
    id: 'home-wastewater',
    url: '/home/stage/wastewater.jpg',
    title: 'Wastewater',
    alt: 'Wastewater treatment aeration basin protecting receiving waters',
    tags: ['wastewater', 'environment', 'home'],
    scopes: ['home', 'hire', 'ambassador'],
  },
  {
    id: 'home-oww',
    url: '/home/stage/oww-careers.jpg',
    title: 'OWW careers',
    alt: 'Workforce participants touring a water treatment plant control room',
    tags: ['careers', 'tour', 'home'],
    scopes: ['home', 'career', 'educate'],
  },
  {
    id: 'home-ww360',
    url: '/home/stage/ww360.jpg',
    title: 'WW360 dashboards',
    alt: 'Utility manager reviewing workforce and training dashboards',
    tags: ['utility', 'admin', 'home'],
    scopes: ['home', 'hire'],
  },
  {
    id: 'career-1',
    url: '/pathways/stage/career-1.jpg',
    title: 'Distribution crew',
    alt: 'Utility field crew in high-visibility vests working at a distribution hydrant',
    tags: ['field', 'career'],
    scopes: ['career', 'home'],
  },
  {
    id: 'career-2',
    url: '/pathways/stage/career-2.jpg',
    title: 'Career changer at SCADA',
    alt: 'Career changer at a laptop in a treatment plant control room',
    tags: ['matching', 'career'],
    scopes: ['career'],
  },
  {
    id: 'career-3',
    url: '/pathways/stage/career-3.jpg',
    title: 'Operator training lab',
    alt: 'Instructor and students in a hands-on operator training lab',
    tags: ['training', 'career', 'educate'],
    scopes: ['career', 'educate'],
  },
  {
    id: 'hire-1',
    url: '/pathways/stage/hire-1.jpg',
    title: 'Recruiting desk',
    alt: 'Utility HR manager reviewing candidate profiles on a monitor',
    tags: ['hiring', 'hire'],
    scopes: ['hire'],
  },
  {
    id: 'hire-2',
    url: '/pathways/stage/hire-2.jpg',
    title: 'Succession walk',
    alt: 'Supervisor and senior operator walking a treatment plant gallery',
    tags: ['mentoring', 'hire'],
    scopes: ['hire', 'career'],
  },
  {
    id: 'hire-3',
    url: '/pathways/stage/hire-3.jpg',
    title: 'First day hire',
    alt: 'New operator receiving a handshake and badge at a plant gate',
    tags: ['hire', 'outcomes'],
    scopes: ['hire'],
  },
  {
    id: 'educate-1',
    url: '/pathways/stage/educate-1.jpg',
    title: 'Classroom hydraulics',
    alt: 'Community college instructor teaching hydraulics at a whiteboard',
    tags: ['educate', 'classroom'],
    scopes: ['educate'],
  },
  {
    id: 'educate-2',
    url: '/pathways/stage/educate-2.jpg',
    title: 'Training center benches',
    alt: 'Hands-on operator training room with bench-scale treatment units',
    tags: ['educate', 'training'],
    scopes: ['educate', 'career'],
  },
  {
    id: 'educate-3',
    url: '/pathways/stage/educate-3.jpg',
    title: 'Plant tour students',
    alt: 'Students on a plant tour with a guide pointing at a clarifier',
    tags: ['educate', 'tour'],
    scopes: ['educate', 'ambassador'],
  },
  {
    id: 'ambassador-1',
    url: '/pathways/stage/ambassador-1.jpg',
    title: 'Town board talk',
    alt: 'Speaker presenting to a town board in a community meeting room',
    tags: ['ambassador', 'outreach'],
    scopes: ['ambassador'],
  },
  {
    id: 'ambassador-2',
    url: '/pathways/stage/ambassador-2.jpg',
    title: 'Career fair mentoring',
    alt: 'Retired operator mentoring a teen at a career fair table',
    tags: ['ambassador', 'mentoring'],
    scopes: ['ambassador', 'career'],
  },
  {
    id: 'ambassador-3',
    url: '/pathways/stage/ambassador-3.jpg',
    title: 'Reservoir partners',
    alt: 'Partners meeting at a reservoir overlook during a watershed visit',
    tags: ['ambassador', 'partnership'],
    scopes: ['ambassador', 'home'],
  },
  {
    id: 'stock-plant',
    url: '/stock/hero/plant-exterior.jpg',
    title: 'Plant exterior',
    alt: 'Municipal water treatment plant exterior with clarifier basins at golden hour',
    tags: ['stock', 'plant'],
  },
  {
    id: 'stock-tap',
    url: '/stock/hero/tap-water.jpg',
    title: 'Safe tap water',
    alt: 'Clear drinking water pouring from a tap into a glass',
    tags: ['stock', 'quality'],
  },
  {
    id: 'stock-crew',
    url: '/stock/hero/field-crew.jpg',
    title: 'Field crew',
    alt: 'Water utility operators reviewing a clipboard beside outdoor pipes and valves',
    tags: ['stock', 'field', 'crew'],
  },
  {
    id: 'stock-reservoir',
    url: '/stock/hero/reservoir.jpg',
    title: 'Reservoir watershed',
    alt: 'New York reservoir with forested shoreline and calm blue water',
    tags: ['stock', 'source', 'watershed'],
  },
];

export function stockCatalogForScope(scope?: string): HeroStockImage[] {
  if (!scope) return HERO_SLIDE_STOCK_CATALOG;
  const preferred = HERO_SLIDE_STOCK_CATALOG.filter(
    img => !img.scopes?.length || img.scopes.includes(scope as NonNullable<HeroStockImage['scopes']>[number])
  );
  const rest = HERO_SLIDE_STOCK_CATALOG.filter(img => !preferred.includes(img));
  return [...preferred, ...rest];
}
