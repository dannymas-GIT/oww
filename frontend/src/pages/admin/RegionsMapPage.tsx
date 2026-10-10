import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { OwwLeafletMap } from '@/components/oww/OwwLeafletMap';
import { getJurisdiction, listJurisdictions } from '@/services/jurisdictionService';
import type { JurisdictionConfig, JurisdictionListItem, JurisdictionRegion } from '@/types';
import { DEFAULT_STATE } from '@/lib/constants';

export default function RegionsMapPage() {
  const [params, setParams] = useSearchParams();
  const state = (params.get('state') || DEFAULT_STATE).toLowerCase();
  const [list, setList] = useState<JurisdictionListItem[]>([]);
  const [cfg, setCfg] = useState<JurisdictionConfig | null>(null);

  useEffect(() => {
    void listJurisdictions().then(setList).catch(() => setList([]));
  }, []);

  useEffect(() => {
    let alive = true;
    void getJurisdiction(state)
      .then(c => {
        if (alive) setCfg(c);
      })
      .catch(() => {
        if (alive) setCfg(null);
      });
    return () => {
      alive = false;
    };
  }, [state]);

  const regions: JurisdictionRegion[] = cfg?.regions || [];
  const map = cfg?.map;
  const center = (map?.center as [number, number] | undefined) || [42.9, -75.5];
  const zoom = map?.zoom || 6;
  const overlayUrl = map?.overlay_url || null;

  return (
    <div className="space-y-6">
      <OwwPageHero
        eyebrow="Administration"
        title="Regions map"
        description={
          cfg
            ? `${cfg.name} regions (${cfg.geo_unit_label || 'County'} unit). ${
                overlayUrl ? 'Toggle the choropleth on the map.' : 'No GeoJSON overlay for this state yet — region list below.'
              }`
            : 'Select a jurisdiction to view its regions.'
        }
        actions={
          <Link
            to="/admin/map"
            className="inline-flex min-h-[44px] items-center rounded-md border border-white/40 bg-white/10 px-4 text-base font-semibold text-white hover:bg-white/20"
          >
            National map
          </Link>
        }
      />

      <div className="flex flex-wrap gap-2">
        {list.map(j => (
          <button
            key={j.code}
            type="button"
            className={`min-h-[44px] rounded-md border px-4 text-base font-semibold ${
              j.code === state
                ? 'border-oww-cyan bg-[#e8f0ff] text-oww-navy'
                : 'border-slate-200 bg-white text-slate-700 hover:border-oww-cyan/40'
            }`}
            onClick={() => setParams({ state: j.code })}
          >
            {j.code.toUpperCase()} · {j.name}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="h-[28rem] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:h-[36rem]">
          <OwwLeafletMap
            center={center as [number, number]}
            zoom={zoom}
            defaultRegionsVisible={Boolean(overlayUrl)}
            fitBoundsOnMount={map?.bounds || null}
            overlayUrl={overlayUrl}
            geoUnitLabel={cfg?.geo_unit_label || 'County'}
            regionsLabel={`${(cfg?.code || state).toUpperCase()} regions`}
            regionsHint={overlayUrl ? 'Region overlay' : 'No overlay'}
            scrollWheelZoom
          />
        </div>

        <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="font-display text-xl font-semibold text-oww-navy">
            {regions.length || '—'} regions
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {cfg?.partner?.short || cfg?.name || 'Jurisdiction'} · {cfg?.geo_unit_label || 'County'}
          </p>
          <ul className="mt-4 space-y-3">
            {regions.length === 0 ? (
              <li className="text-base text-slate-600">No regions configured.</li>
            ) : (
              regions.map(r => (
                <li key={r.id} className="flex gap-3">
                  <span
                    className="mt-1 h-5 w-5 shrink-0 rounded-sm ring-1 ring-slate-300"
                    style={{ backgroundColor: r.color || '#64748b' }}
                    aria-hidden
                  />
                  <div>
                    <p className="text-base font-semibold text-oww-navy">{r.name}</p>
                    <p className="text-sm text-slate-600">
                      {(r.counties?.length || r.towns?.length)
                        ? `${r.counties?.length || r.towns?.length} ${(r.counties?.length ? cfg?.geo_unit_label || 'counties' : 'towns').toLowerCase()}`
                        : r.kind.replace(/_/g, ' ')}
                    </p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </aside>
      </div>
    </div>
  );
}
