import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initAnalytics, isPublicPath, trackPageView } from '../../analytics';

/**
 * Fire GA4 page_view on SPA route changes for public paths only.
 * Mount inside the router (e.g. App.tsx). Does nothing when measurement ID is unset.
 */
export function PublicAnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    const path = location.pathname;
    if (!isPublicPath(path)) return;
    trackPageView(path);
  }, [location.pathname]);

  return null;
}
