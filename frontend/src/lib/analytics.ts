/**
 * Fleet GA4 loader (React / Vite) — loads only when VITE_GA4_MEASUREMENT_ID is set.
 * Path-only; no PII; public routes by default.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const MEASUREMENT_ID = (
  (import.meta.env.VITE_GA4_MEASUREMENT_ID as string | undefined) || ''
).trim();

let PUBLIC_PATHS: string[] = ['*'];
/** Authenticated / admin prefixes never report (government-facing). */
let EXCLUDE_PREFIXES: string[] = [
  '/profile',
  '/billing',
  '/candidate',
  '/employer',
  '/admin',
  '/educator',
  '/ambassador',
  '/utility',
  '/platform',
];
let initialized = false;

export function setPublicPaths(paths: string[]): void {
  PUBLIC_PATHS = paths.length ? paths : ['*'];
}

export function setExcludePrefixes(prefixes: string[]): void {
  EXCLUDE_PREFIXES = prefixes;
}

export function isGa4Enabled(): boolean {
  return Boolean(MEASUREMENT_ID);
}

function trackingOptOut(): boolean {
  if (typeof navigator === 'undefined') return true;
  if (navigator.doNotTrack === '1') return true;
  // @ts-expect-error Global Privacy Control
  if (navigator.globalPrivacyControl === true) return true;
  return false;
}

function pathOnly(path: string): string {
  const q = path.indexOf('?');
  const h = path.indexOf('#');
  let end = path.length;
  if (q >= 0) end = Math.min(end, q);
  if (h >= 0) end = Math.min(end, h);
  return path.slice(0, end) || '/';
}

export function isPublicPath(path: string): boolean {
  const p = pathOnly(path);
  if (EXCLUDE_PREFIXES.some((ex) => p === ex || p.startsWith(`${ex}/`))) {
    return false;
  }
  if (PUBLIC_PATHS.includes('*')) return true;
  return PUBLIC_PATHS.some((prefix) => {
    if (prefix === '/') return p === '/';
    return p === prefix || p.startsWith(prefix.endsWith('/') ? prefix : `${prefix}/`);
  });
}

function ensureGtag(): boolean {
  if (!MEASUREMENT_ID || typeof window === 'undefined') return false;
  if (trackingOptOut()) return false;
  if (initialized && typeof window.gtag === 'function') return true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', MEASUREMENT_ID, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });

  if (!document.getElementById('saas-ga4-script')) {
    const script = document.createElement('script');
    script.id = 'saas-ga4-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID)}`;
    document.head.appendChild(script);
  }

  initialized = true;
  return true;
}

export function initAnalytics(): void {
  ensureGtag();
}

/** @deprecated Prefer initAnalytics */
export function initGa4(): void {
  ensureGtag();
}

export function trackPageView(path: string, title?: string): void {
  if (!ensureGtag()) return;
  const clean = pathOnly(path);
  window.gtag!('event', 'page_view', {
    page_path: clean,
    page_title: title || document.title,
    page_location: `${window.location.origin}${clean}`,
  });
}

export function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean>
): void {
  if (!ensureGtag()) return;
  window.gtag!('event', name, params ?? {});
}
