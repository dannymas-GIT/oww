import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { SortableTableHead } from '@/components/oww/SortableTableHead';
import { TableSearchFilter } from '@/components/oww/TableSearchFilter';
import { OwwEmptyState } from '@/components/oww/OwwEmptyState';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useTableControls } from '@/hooks/useTableControls';
import { rowValue } from '@/lib/tableControls';
import { DEFAULT_STATE } from '@/lib/constants';
import { listPublicJobs } from '@/services/publicService';
import type { Job } from '@/types';

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function JobsBoardPage() {
  const params = useParams();
  const state = (params.state || DEFAULT_STATE).toLowerCase();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    void listPublicJobs({ state })
      .then(setJobs)
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, [state]);

  const getValue = useMemo(
    () => (row: Job, key: string) => rowValue(row, key),
    []
  );
  const getSearchText = useMemo(
    () => (row: Job) =>
      [row.title, row.organization_name, row.city, row.career_area, row.opportunity_type]
        .filter(Boolean)
        .join(' '),
    []
  );
  const table = useTableControls({
    rows: jobs,
    getValue,
    getSearchText,
    initialSortKey: 'title',
  });

  const mapped = table.rows.filter(j => j.latitude != null && j.longitude != null);

  return (
    <div className="space-y-6">
      <OwwPageHero
        eyebrow={`${state.toUpperCase()} jobs`}
        title="Jobs board"
        description="Explore openings across the water sector. Sort and filter the table; markers show geocoded roles."
      />
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="h-72 md:h-96">
          <MapContainer center={[42.9, -75.5]} zoom={6} scrollWheelZoom={false} className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {mapped.map(j => (
              <Marker key={j.id} position={[j.latitude!, j.longitude!]} icon={markerIcon}>
                <Popup>
                  <Link to={`/${state}/jobs/${j.id}`} className="font-medium text-sky-800">
                    {j.title}
                  </Link>
                  <div className="text-sm">{j.organization_name}</div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm" data-tour="jobs-table">
        <div className="flex flex-wrap items-center justify-between gap-3" data-tour="jobs-filter">
          <TableSearchFilter
            value={table.filter}
            onChange={table.setFilter}
            resultCount={table.resultCount}
            totalCount={table.totalCount}
            placeholder="Filter by title, employer, city…"
          />
          <p className="text-sm text-slate-600">
            Filtered ({table.resultCount}) · All ({table.totalCount})
          </p>
        </div>
        {loading ? (
          <p className="text-base text-slate-600">Loading jobs…</p>
        ) : table.totalCount === 0 ? (
          <OwwEmptyState title="No jobs in this jurisdiction yet" description="Check back soon or express interest to stay informed." />
        ) : table.resultCount === 0 ? (
          <OwwEmptyState title="No jobs match your filter" description="Clear the search box to see all openings." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead column="title" label="Title" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <SortableTableHead column="organization_name" label="Employer" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <SortableTableHead column="city" label="Location" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <SortableTableHead column="opportunity_type" label="Type" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <SortableTableHead column="career_area" label="Career area" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.rows.map(j => (
                  <TableRow key={j.id}>
                    <TableCell className="text-base">
                      <Link className="font-medium text-sky-800 hover:underline" to={`/${state}/jobs/${j.id}`}>
                        {j.title}
                      </Link>
                      {j.is_featured ? (
                        <Badge className="ml-2 bg-sky-100 text-sky-900" variant="secondary">
                          Featured
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-base">{j.organization_name || '—'}</TableCell>
                    <TableCell className="text-base">{j.city || j.location || '—'}</TableCell>
                    <TableCell className="text-base">{j.opportunity_type || '—'}</TableCell>
                    <TableCell className="text-base">{j.career_area || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
