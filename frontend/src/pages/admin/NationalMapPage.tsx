import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { OwwLeafletMap } from '@/components/oww/OwwLeafletMap';
import { nationalMapData } from '@/services/adminService';

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const CENTROIDS: Record<string, [number, number]> = {
  NY: [42.9, -75.5],
  NJ: [40.1, -74.6],
  CT: [41.6, -72.7],
  CA: [37.2, -119.4],
  TX: [31.5, -99.3],
  FL: [27.8, -81.7],
};

export default function NationalMapPage() {
  const [rows, setRows] = useState<
    Array<{ code: string; name: string; individuals: number; jobs: number; orgs?: number }>
  >([]);
  useEffect(() => {
    void nationalMapData()
      .then(d => setRows(d.jurisdictions || []))
      .catch(() => setRows([{ code: 'NY', name: 'New York', individuals: 0, jobs: 0 }]));
  }, []);

  return (
    <div className="space-y-6">
      <OwwPageHero
        eyebrow="Administration"
        title="National map"
        description="Jurisdiction footprint across One Water Workforce deployments. Open the regions map for per-state geography."
        actions={
          <Link
            to="/admin/regions"
            className="inline-flex min-h-[44px] items-center rounded-md bg-oww-cyan px-4 text-base font-semibold text-white hover:bg-sky-700"
          >
            Regions map
          </Link>
        }
      />
      <div className="h-[28rem] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:h-[32rem]">
        <OwwLeafletMap
          center={[40.5, -75.5]}
          zoom={5}
          defaultRegionsVisible={false}
          overlayUrl={null}
          scrollWheelZoom
        >
          {rows.map(j => {
            const pos = CENTROIDS[j.code.toUpperCase()] || [39.8, -98.5];
            return (
              <Marker key={j.code} position={pos} icon={markerIcon}>
                <Popup>
                  <strong>{j.name}</strong>
                  <div className="text-sm">
                    {j.individuals} individuals · {j.jobs} jobs
                    {typeof j.orgs === 'number' ? ` · ${j.orgs} orgs` : ''}
                  </div>
                  <Link className="text-sm text-sky-800 underline" to={`/admin/regions?state=${j.code.toLowerCase()}`}>
                    Regions
                  </Link>
                </Popup>
              </Marker>
            );
          })}
        </OwwLeafletMap>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(j => (
          <li key={j.code} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="font-display text-lg font-semibold text-oww-navy">
              {j.code.toUpperCase()} · {j.name}
            </p>
            <p className="mt-1 text-base text-slate-600">
              {j.individuals} individuals · {j.jobs} jobs
              {typeof j.orgs === 'number' ? ` · ${j.orgs} orgs` : ''}
            </p>
            <Link
              className="mt-2 inline-flex min-h-[44px] items-center text-base text-oww-cyan underline-offset-2 hover:underline"
              to={`/admin/regions?state=${j.code.toLowerCase()}`}
            >
              Open regions
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
