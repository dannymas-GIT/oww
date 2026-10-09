import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { OwwKpiTile } from '@/components/oww/OwwKpiTile';
import { OwwSection } from '@/components/oww/OwwSection';
import { OwwEmptyState } from '@/components/oww/OwwEmptyState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import {
  listCourses,
  listEvents,
  listEducatorPrograms,
  type EducatorProgram,
} from '@/services/educatorService';
import type { Course, EducatorEvent } from '@/types';
import { formatDate, formatDateTime, titleCase } from '@/lib/format';
import { DEFAULT_STATE } from '@/lib/constants';

export default function EducatorDashboard() {
  const { user, activeStateCode } = useAuth();
  const state = (activeStateCode || DEFAULT_STATE).toLowerCase();
  const displayName = user?.full_name?.trim() || user?.username;
  const viewingAs = user?.impersonation?.persona_key === 'educator';
  const [courses, setCourses] = useState<Course[]>([]);
  const [events, setEvents] = useState<EducatorEvent[]>([]);
  const [programs, setPrograms] = useState<EducatorProgram[]>([]);

  useEffect(() => {
    void listCourses().then(setCourses).catch(() => setCourses([]));
    void listEvents().then(setEvents).catch(() => setEvents([]));
    void listEducatorPrograms().then(setPrograms).catch(() => setPrograms([]));
  }, []);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return events
      .filter(ev => ev.starts_at && new Date(ev.starts_at).getTime() >= now - 86400000)
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  }, [events]);
  const publishedCourses = courses.filter(c => c.published !== false).length;
  const pendingPrograms = programs.filter(p => (p.status || '').toLowerCase() === 'pending').length;

  return (
    <div className="space-y-6">
      <OwwPageHero
        eyebrow="Educator"
        title={displayName ? `Welcome, ${displayName}` : 'Training & events'}
        description="Publish courses and events that feed the statewide talent pipeline — and track program submissions awaiting NYSAWWA review."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button className="min-h-[44px] text-base" asChild>
              <Link to={`/${state}/programs/submit`}>Submit a program</Link>
            </Button>
            <Button
              variant="outline"
              className="min-h-[44px] border-white/40 bg-white/10 text-base text-white hover:bg-white/20"
              asChild
            >
              <Link to={`/${state}/educate`}>Public educate pathway</Link>
            </Button>
          </div>
        }
      />

      {viewingAs ? (
        <p className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-base text-slate-800">
          View as role sample data is loaded — courses, upcoming events, and a pending program submission illustrate the educator desk.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <OwwKpiTile label="Courses" value={courses.length} hint={`${publishedCourses} published`} />
        <OwwKpiTile label="Events" value={events.length} hint={`${upcoming.length} upcoming`} />
        <OwwKpiTile label="Program submissions" value={programs.length} hint={`${pendingPrograms} pending review`} />
        <OwwKpiTile
          label="Membership"
          value="Educator"
          hint="Complimentary — no hiring paywall"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <OwwSection title="Published courses" description="Modules that feed classroom awareness and pre-certification pathways.">
          {!courses.length ? (
            <OwwEmptyState title="No courses yet" description="Add courses to show CTE and training inventory." />
          ) : (
            <div className="space-y-3">
              {courses.map(c => (
                <Card key={c.id}>
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <CardTitle className="font-display text-lg">{c.title}</CardTitle>
                      <Badge variant="secondary" className="text-sm font-normal">
                        {c.published === false ? 'Draft' : 'Published'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1 text-base text-slate-600">
                    {c.description ? <p className="leading-relaxed text-slate-800">{c.description}</p> : null}
                    <p className="text-sm text-slate-500">
                      {[c.provider, c.region, formatDate(c.start_date)].filter(Boolean).join(' · ') || 'Statewide'}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </OwwSection>

        <OwwSection title="Upcoming events" description="Career fairs, plant tours, and classroom sessions on your calendar.">
          {!upcoming.length && !events.length ? (
            <OwwEmptyState title="No events scheduled" />
          ) : !(upcoming.length ? upcoming : events).length ? (
            <OwwEmptyState title="No upcoming events" />
          ) : (
            <div className="space-y-3">
              {(upcoming.length ? upcoming : events).map(ev => (
                <Card key={ev.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="font-display text-lg">{ev.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-base text-slate-600">
                    {ev.description ? <p className="leading-relaxed text-slate-800">{ev.description}</p> : null}
                    <p>
                      <span className="font-medium text-slate-800">{formatDateTime(ev.starts_at)}</span>
                      {ev.location ? ` · ${ev.location}` : ''}
                    </p>
                    {ev.region ? <p className="text-sm text-slate-500">{ev.region}</p> : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </OwwSection>
      </div>

      <OwwSection
        title="Program submissions"
        description="Workforce programs you submitted for NYSAWWA review and statewide tagging."
      >
        {!programs.length ? (
          <OwwEmptyState
            title="No program submissions"
            description="Submit a CTE academy, bootcamp, or partner program for the statewide catalog."
            action={
              <Button className="min-h-[44px] text-base" asChild>
                <Link to={`/${state}/programs/submit`}>Submit a program</Link>
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[36rem] text-left text-base">
              <thead className="border-b border-slate-200 bg-slate-50 text-sm text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Program</th>
                  <th className="px-4 py-3 font-semibold">Organization</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {programs.map(p => (
                  <tr key={p.id} className="border-b border-slate-100 last:border-0 align-top">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{p.program_name}</p>
                      {p.description ? (
                        <p className="mt-1 line-clamp-2 text-sm text-slate-600">{p.description}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">{p.organization_name || '—'}</td>
                    <td className="px-4 py-3">{titleCase(p.program_type || '—')}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-sm font-normal">
                        {titleCase(p.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{formatDate(p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </OwwSection>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h2 className="font-display text-xl font-semibold text-navy">How educators power OWW</h2>
        <ul className="mt-3 list-inside list-disc space-y-2 text-base text-slate-700">
          <li>Courses and events surface on the Educate pathway for students and career changers.</li>
          <li>Program submissions help NYSAWWA tag regional training capacity for utilities and partners.</li>
          <li>Complimentary Educator membership — no hiring paywall; focus stays on talent pipeline.</li>
        </ul>
      </div>
    </div>
  );
}
