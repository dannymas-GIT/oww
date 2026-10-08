import { useEffect, useState } from 'react';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { OwwKpiTile } from '@/components/oww/OwwKpiTile';
import { OwwSection } from '@/components/oww/OwwSection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { listCourses, listEvents } from '@/services/educatorService';
import type { Course, EducatorEvent } from '@/types';
import { formatDate } from '@/lib/format';

export default function EducatorDashboard() {
  const { user } = useAuth();
  const displayName = user?.full_name?.trim() || user?.username;
  const [courses, setCourses] = useState<Course[]>([]);
  const [events, setEvents] = useState<EducatorEvent[]>([]);
  useEffect(() => {
    void listCourses().then(setCourses).catch(() => setCourses([]));
    void listEvents().then(setEvents).catch(() => setEvents([]));
  }, []);
  return (
    <div className="space-y-6">
      <OwwPageHero
        eyebrow="Educator"
        title={displayName ? `Welcome, ${displayName}` : 'Training & events'}
        description="Publish courses and events that feed the statewide talent pipeline."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <OwwKpiTile label="Courses" value={courses.length} />
        <OwwKpiTile label="Events" value={events.length} />
      </div>
      <OwwSection title="Courses">
        <div className="grid gap-3 md:grid-cols-2">
          {courses.map(c => (
            <Card key={c.id}>
              <CardHeader>
                <CardTitle className="font-display text-lg">{c.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-base text-slate-600">
                {[c.provider, c.modality, formatDate(c.start_date)].filter(Boolean).join(' · ')}
              </CardContent>
            </Card>
          ))}
        </div>
      </OwwSection>
      <OwwSection title="Events">
        <div className="grid gap-3 md:grid-cols-2">
          {events.map(ev => (
            <Card key={ev.id}>
              <CardHeader>
                <CardTitle className="font-display text-lg">{ev.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-base text-slate-600">
                {formatDate(ev.starts_at)}
                {ev.location ? ` · ${ev.location}` : ''}
              </CardContent>
            </Card>
          ))}
        </div>
      </OwwSection>
    </div>
  );
}
