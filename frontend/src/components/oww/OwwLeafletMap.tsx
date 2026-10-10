import { useState, type ReactNode } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  FitBoundsOnce,
  RegionsGeoLayer,
  RegionsToggle,
} from '@/components/oww/RegionsOverlay';
import { cn } from '@/lib/utils';

type OwwLeafletMapProps = {
  center: LatLngExpression;
  zoom: number;
  className?: string;
  /** When true, regions overlay defaults on. */
  defaultRegionsVisible?: boolean;
  fitNyOnMount?: boolean;
  fitBoundsOnMount?: number[][] | null;
  overlayUrl?: string | null;
  geoUnitLabel?: string;
  regionsLabel?: string;
  regionsHint?: string;
  scrollWheelZoom?: boolean;
  children?: ReactNode;
};

/**
 * Shared Leaflet shell: OSM tiles + optional jurisdiction region overlay.
 */
export function OwwLeafletMap({
  center,
  zoom,
  className,
  defaultRegionsVisible = true,
  fitNyOnMount = false,
  fitBoundsOnMount = null,
  overlayUrl = '/maps/ny-counties-regions.geojson',
  geoUnitLabel = 'County',
  regionsLabel = 'Regions',
  regionsHint = 'Jurisdiction region overlay',
  scrollWheelZoom = false,
  children,
}: OwwLeafletMapProps) {
  const hasOverlay = Boolean(overlayUrl);
  const [regionsOn, setRegionsOn] = useState(defaultRegionsVisible && hasOverlay);
  const bounds =
    fitBoundsOnMount ||
    (fitNyOnMount
      ? [
          [40.45, -79.8],
          [45.05, -71.75],
        ]
      : null);

  return (
    <div className={cn('relative h-full w-full', className)}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={scrollWheelZoom}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {hasOverlay ? (
          <RegionsGeoLayer visible={regionsOn} overlayUrl={overlayUrl} geoUnitLabel={geoUnitLabel} />
        ) : null}
        {bounds ? <FitBoundsOnce enabled bounds={bounds} /> : null}
        {children}
      </MapContainer>
      {hasOverlay ? (
        <RegionsToggle
          checked={regionsOn}
          onChange={setRegionsOn}
          label={regionsLabel}
          hint={regionsHint}
        />
      ) : null}
    </div>
  );
}
