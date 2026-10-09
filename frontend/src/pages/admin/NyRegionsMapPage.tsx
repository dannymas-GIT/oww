import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { OwwLeafletMap } from '@/components/oww/OwwLeafletMap';

type RegionMeta = {
  id: string;
  name: string;
  color: string;
  counties: string[];
};

export default function NyRegionsMapPage() {
  const [regions, setRegions] = useState<RegionMeta[]>([]);

  useEffect(() => {
    let alive = true;
    void fetch('/maps/regions.json')
      .then(r => {
        if (!r.ok) throw new Error(`regions.json ${r.status}`);
        return r.json();
      })
      .then((doc: { regions?: RegionMeta[] }) => {
        if (alive && doc.regions?.length) setRegions(doc.regions);
      })
      .catch(() => {
        void fetch('/maps/ny-counties-regions.geojson')
          .then(r => r.json())
          .then(
            (fc: {
              features?: Array<{
                properties?: { region_id?: string; region_name?: string; fill?: string; county?: string };
              }>;
            }) => {
              if (!alive) return;
              const byId = new Map<string, RegionMeta>();
              for (const f of fc.features || []) {
                const id = f.properties?.region_id || 'unknown';
                const name = f.properties?.region_name || id;
                const color = f.properties?.fill || '#64748b';
                const county = f.properties?.county;
                const row = byId.get(id) || { id, name, color, counties: [] };
                if (county && !row.counties.includes(county)) row.counties.push(county);
                byId.set(id, row);
              }
              setRegions(Array.from(byId.values()));
            }
          )
          .catch(() => {
            if (alive) setRegions([]);
          });
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <OwwPageHero
        eyebrow="Administration"
        title="NY regions map"
        description="NYSAWWA’s 10 economic development regions across New York. Toggle the choropleth on the map; hover a county for region name."
        actions={
          <Link
            to="/admin/map"
            className="inline-flex min-h-[44px] items-center rounded-md border border-white/40 bg-white/10 px-4 text-base font-semibold text-white hover:bg-white/20"
          >
            National map
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="h-[28rem] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:h-[36rem]">
          <OwwLeafletMap
            center={[42.9, -75.5]}
            zoom={6}
            defaultRegionsVisible
            fitNyOnMount
            scrollWheelZoom
          />
        </div>

        <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="font-display text-xl font-semibold text-oww-navy">10 regions</h2>
          <p className="mt-1 text-sm text-slate-600">County coloring matches the official NYSAWWA artwork.</p>
          <ul className="mt-4 space-y-3">
            {regions.length === 0 ? (
              <li className="text-base text-slate-600">Loading region legend…</li>
            ) : (
              regions.map(r => (
                <li key={r.id} className="flex gap-3">
                  <span
                    className="mt-1 h-5 w-5 shrink-0 rounded-sm ring-1 ring-slate-300"
                    style={{ backgroundColor: r.color }}
                    aria-hidden
                  />
                  <div>
                    <p className="text-base font-semibold text-oww-navy">{r.name}</p>
                    <p className="text-sm text-slate-600">{r.counties.length} counties</p>
                  </div>
                </li>
              ))
            )}
          </ul>
          <p className="mt-4 text-sm text-slate-500">
            Reference art:{' '}
            <a className="underline" href="/maps/NY10Regions.png" target="_blank" rel="noreferrer">
              NY10Regions.png
            </a>
          </p>
        </aside>
      </div>
    </div>
  );
}
