import { useLocation } from 'react-router-dom';
import { OwwTourOverlay } from '@/components/oww/OwwTourOverlay';
import { tourForPath } from '@/content/owwTours';

/** Mounts the tour that matches the current route (content-aware). */
export function PageAwareTour() {
  const { pathname } = useLocation();
  const config = tourForPath(pathname);
  if (!config) return null;
  // Remount when route family changes so dismissed/step storage is per-tour id
  return <OwwTourOverlay key={config.id} config={config} />;
}
