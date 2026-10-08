import { useEffect, useState } from 'react';
import { GeoJSON, useMap } from 'react-leaflet';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import type { Layer, PathOptions } from 'leaflet';
import L from 'leaflet';

const GEOJSON_URL = '/maps/ny-counties-regions.geojson';

type RegionFeatureProps = {
  county?: string;
  region_id?: string;
  region_name?: string;
  fill?: string;
};

function styleFeature(feature?: Feature<Geometry, RegionFeatureProps>): PathOptions {
  const fill = feature?.properties?.fill || '#64748b';
  return {
    fillColor: fill,
    fillOpacity: 0.45,
    color: '#ffffff',
    weight: 1.25,
    opacity: 0.95,
  };
}

function onEachFeature(feature: Feature<Geometry, RegionFeatureProps>, layer: Layer) {
  const name = feature.properties?.region_name || 'Region';
  const county = feature.properties?.county;
  layer.bindTooltip(county ? `${name} · ${county} County` : name, {
    sticky: true,
    className: 'oww-region-tooltip text-sm',
  });
}

/**
 * Leaflet GeoJSON choropleth for the NYSAWWA 10-region map.
 * Parent must render inside a MapContainer. Visibility is controlled by `visible`.
 */
export function NyRegionsGeoLayer({ visible }: { visible: boolean }) {
  const [data, setData] = useState<FeatureCollection | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(GEOJSON_URL)
      .then(r => {
        if (!r.ok) throw new Error(`Failed to load regions (${r.status})`);
        return r.json();
      })
      .then((fc: FeatureCollection) => {
        if (alive) setData(fc);
      })
      .catch(() => {
        if (alive) setData(null);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!visible || !data) return null;

  return (
    <GeoJSON
      key="ny-regions"
      data={data}
      style={styleFeature}
      onEachFeature={onEachFeature}
    />
  );
}

/** Optional: fit map to NY when the overlay is first shown (NY-focused maps). */
export function FitNyBoundsOnce({ enabled }: { enabled: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (!enabled) return;
    // Approximate NY state bounds
    map.fitBounds(
      L.latLngBounds([
        [40.45, -79.8],
        [45.05, -71.75],
      ]),
      { padding: [12, 12], maxZoom: 7 }
    );
  }, [enabled, map]);
  return null;
}

/**
 * Floating toggle control for the NY regions overlay.
 * Place as a sibling wrapping the map (absolute overlay), not inside MapContainer.
 */
export function NyRegionsToggle({
  checked,
  onChange,
  className,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  className?: string;
}) {
  return (
    <label
      className={
        className ||
        'absolute bottom-3 left-3 z-[1000] flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-base text-oww-navy shadow-md backdrop-blur'
      }
    >
      <input
        type="checkbox"
        className="h-5 w-5 rounded border-slate-300 text-oww-cyan focus:ring-oww-cyan"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        aria-describedby="ny-regions-toggle-hint"
      />
      <span>
        <span className="font-semibold">NY regions</span>
        <span id="ny-regions-toggle-hint" className="block text-sm text-slate-600">
          NYSAWWA 10-region overlay
        </span>
      </span>
    </label>
  );
}
