import { useEffect, useState } from 'react';
import { GeoJSON, useMap } from 'react-leaflet';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import type { Layer, PathOptions } from 'leaflet';
import L from 'leaflet';

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

function onEachFeature(feature: Feature<Geometry, RegionFeatureProps>, layer: Layer, geoUnit: string) {
  const name = feature.properties?.region_name || 'Region';
  const county = feature.properties?.county;
  layer.bindTooltip(county ? `${name} · ${county} ${geoUnit}` : name, {
    sticky: true,
    className: 'oww-region-tooltip text-sm',
  });
}

/** Leaflet GeoJSON choropleth when a jurisdiction provides an overlay URL. */
export function RegionsGeoLayer({
  visible,
  overlayUrl,
  geoUnitLabel = 'County',
}: {
  visible: boolean;
  overlayUrl?: string | null;
  geoUnitLabel?: string;
}) {
  const [data, setData] = useState<FeatureCollection | null>(null);
  const url = overlayUrl || null;

  useEffect(() => {
    if (!url) {
      setData(null);
      return;
    }
    let alive = true;
    fetch(url)
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
  }, [url]);

  if (!visible || !data || !url) return null;

  return (
    <GeoJSON
      key={url}
      data={data}
      style={styleFeature}
      onEachFeature={(f, layer) => onEachFeature(f, layer, geoUnitLabel)}
    />
  );
}

/** @deprecated Prefer RegionsGeoLayer with overlayUrl */
export function NyRegionsGeoLayer({ visible }: { visible: boolean }) {
  return <RegionsGeoLayer visible={visible} overlayUrl="/maps/ny-counties-regions.geojson" />;
}

export function FitBoundsOnce({
  enabled,
  bounds,
}: {
  enabled: boolean;
  bounds?: number[][] | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (!enabled || !bounds || bounds.length < 2) return;
    map.fitBounds(L.latLngBounds(bounds as [number, number][]), { padding: [12, 12], maxZoom: 8 });
  }, [enabled, map, bounds]);
  return null;
}

/** @deprecated Prefer FitBoundsOnce */
export function FitNyBoundsOnce({ enabled }: { enabled: boolean }) {
  return (
    <FitBoundsOnce
      enabled={enabled}
      bounds={[
        [40.45, -79.8],
        [45.05, -71.75],
      ]}
    />
  );
}

export function RegionsToggle({
  checked,
  onChange,
  label = 'Regions',
  hint = 'Jurisdiction region overlay',
  className,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  hint?: string;
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
        aria-describedby="regions-toggle-hint"
      />
      <span>
        <span className="font-semibold">{label}</span>
        <span id="regions-toggle-hint" className="block text-sm text-slate-600">
          {hint}
        </span>
      </span>
    </label>
  );
}

/** @deprecated Prefer RegionsToggle */
export function NyRegionsToggle(props: {
  checked: boolean;
  onChange: (next: boolean) => void;
  className?: string;
}) {
  return <RegionsToggle {...props} label="NY regions" hint="NYSAWWA 10-region overlay" />;
}
