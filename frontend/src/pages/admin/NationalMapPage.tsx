import { useEffect, useState } from 'react';
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
  CA: [37.2, -119.4],
  TX: [31.5, -99.3],
  FL: [27.8, -81.7],
};

export default function NationalMapPage() {
  const [rows, setRows] = useState<Array<{ code: string; name: string; individuals: number; jobs: number }>>([]);
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
        description="Jurisdiction footprint across One Water Workforce deployments. Toggle the NYSAWWA 10-region overlay for New York detail."
      />
      <div className="h-[28rem] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <OwwLeafletMap center={[39.8, -98.5]} zoom={4} defaultRegionsVisible={false} scrollWheelZoom>
          {rows.map(j => {
            const pos = CENTROIDS[j.code.toUpperCase()] || [39.8, -98.5];
            return (
              <Marker key={j.code} position={pos} icon={markerIcon}>
                <Popup>
                  <strong>{j.name}</strong>
                  <div className="text-sm">
                    {j.individuals} individuals · {j.jobs} jobs
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </OwwLeafletMap>
      </div>
    </div>
  );
}
