import { useState, type ReactNode } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FitNyBoundsOnce, NyRegionsGeoLayer, NyRegionsToggle } from '@/components/oww/NyRegionsOverlay';
import { cn } from '@/lib/utils';

type OwwLeafletMapProps = {
  center: LatLngExpression;
  zoom: number;
  className?: string;
  /** When true, regions overlay defaults on and can fit NY bounds once. */
  defaultRegionsVisible?: boolean;
  fitNyOnMount?: boolean;
  scrollWheelZoom?: boolean;
  children?: ReactNode;
};

/**
 * Shared Leaflet shell used by every map surface: OSM tiles + togglable NYSAWWA regions.
 */
export function OwwLeafletMap({
  center,
  zoom,
  className,
  defaultRegionsVisible = true,
  fitNyOnMount = false,
  scrollWheelZoom = false,
  children,
}: OwwLeafletMapProps) {
  const [regionsOn, setRegionsOn] = useState(defaultRegionsVisible);

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
        <NyRegionsGeoLayer visible={regionsOn} />
        {fitNyOnMount ? <FitNyBoundsOnce enabled /> : null}
        {children}
      </MapContainer>
      <NyRegionsToggle checked={regionsOn} onChange={setRegionsOn} />
    </div>
  );
}
