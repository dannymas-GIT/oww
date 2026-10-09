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
import { listMatches } from '@/services/matchService';
import { listApplications } from '@/services/jobService';
import { getMyProfile } from '@/services/profileService';
import { listThreads } from '@/services/messagingService';
import type { Application, IndividualProfile, MatchRow, MessageThread } from '@/types';
import { formatDate, titleCase } from '@/lib/format';

function isReadyNow(type: string | undefined): boolean {
  const t = (type || '').toLowerCase().replace(/[_-]+/g, ' ');
  return t.includes('ready') || t === 'exact' || t === 'strong';
}

export default function CandidateDashboard() {
  const { user, activeStateCode } = useAuth();
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [profile, setProfile] = useState<IndividualProfile | null>(null);
  const isStudent = Boolean(user?.roles?.includes('student'));
  const viewingAs = user?.impersonation?.persona_key;

  useEffect(() => {
    void listMatches()
      .then(setMatches)
      .catch(() => setMatches([]));
    void listApplications()
      .then(setApps)
      .catch(() => setApps([]));
    void listThreads()
      .then(setThreads)
      .catch(() => setThreads([]));
    void getMyProfile()
      .then(setProfile)
      .catch(() => setProfile(null));
  }, []);

  const completeness = typeof profile?.completion_pct === 'number' ? profile.completion_pct : null;
  const readyNow = useMemo(() => matches.filter(m => isReadyNow(m.match_type)).length, [matches]);
  const avgScore = useMemo(() => {
    if (!matches.length) return null;
    return Math.round(matches.reduce((sum, m) => sum + (m.score || 0), 0) / matches.length);
  }, [matches]);
  const topMatches = useMemo(
    () => [...matches].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 5),
    [matches]
  );
  const unread = useMemo(() => threads.reduce((n, t) => n + (t.unread || 0), 0), [threads]);

  return (
    <div className="space-y-6">
      <OwwPageHero
        eyebrow={isStudent ? 'Student' : 'Candidate'}
        title={`Welcome, ${user?.full_name?.trim() || user?.username || 'there'}`}
        description={
          isStudent
            ? 'Build an early-career profile, review matches, and explore pathways — hiring tools stay with employers.'
            : 'Complete your profile, review Exact Matching scores, and track applications in the pipeline.'
        }
        actions={
          <Button className="min-h-[44px] text-base" asChild>
            <Link to="/candidate/profile">
              {completeness != null && completeness >= 70 ? 'View profile' : 'Complete profile'}
            </Link>
          </Button>
        }
      />
      {viewingAs === 'student-explorer' || viewingAs === 'job-seeker' ? (
        <p className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-base text-slate-800">
          View as role sample data is loaded — scroll for top matches, applications, and employer messages.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <OwwKpiTile
          label="Profile"
          value={completeness != null ? `${completeness}%` : 'Build'}
          hint="17-category questionnaire"
        />
        <OwwKpiTile label="Matches" value={matches.length} hint="Ready now → future" />
        <OwwKpiTile label="Ready now" value={readyNow} hint="Strong / exact fits" />
        <OwwKpiTile
          label="Avg match score"
          value={avgScore != null ? avgScore : '—'}
          hint="Across ranked openings"
        />
        <OwwKpiTile
          label="Applications"
          value={apps.length}
          hint={`${activeStateCode.toUpperCase()} pipeline`}
        />
        <OwwKpiTile
          label="Messages"
          value={threads.length}
          hint={unread ? `${unread} unread` : 'Employer outreach'}
        />
      </div>

      <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Career stage</p>
          <p className="mt-1 text-lg font-semibold text-navy">{profile?.career_stage || 'Not set'}</p>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Region</p>
          <p className="mt-1 text-lg font-semibold text-navy">{profile?.region || 'Not set'}</p>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Resume bank</p>
          <p className="mt-1 text-lg font-semibold text-navy">
            {profile?.resume_bank_opt_in ? 'Opted in' : 'Not shared'}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <OwwSection
          title="Top matches"
          description="Highest Exact Matching scores against open NY roles."
        >
          {!topMatches.length ? (
            <OwwEmptyState
              title="No matches yet"
              description="Complete more of your profile to improve matching."
              action={
                <Button className="min-h-[44px] text-base" asChild>
                  <Link to="/candidate/profile">Update profile</Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {topMatches.map(m => (
                <Card key={m.id}>
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <CardTitle className="font-display text-lg">{m.job_title || 'Opening'}</CardTitle>
                      <Badge className="text-sm font-semibold">{Math.round(m.score)}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1 text-base text-slate-600">
                    <p>{m.organization_name || 'Employer'}</p>
                    <p className="text-sm">
                      <Badge variant="secondary" className="text-sm font-normal">
                        {titleCase(m.match_type || 'match')}
                      </Badge>
                      {m.explanation ? <span className="ml-2 text-slate-500">{m.explanation}</span> : null}
                    </p>
                  </CardContent>
                </Card>
              ))}
              <Button variant="outline" className="min-h-[44px] text-base" asChild>
                <Link to="/candidate/matches">View all matches</Link>
              </Button>
            </div>
          )}
        </OwwSection>

        <OwwSection title="Application pipeline" description="Status of applications you have submitted.">
          {!apps.length ? (
            <OwwEmptyState
              title="No applications yet"
              description="Browse the jobs board or apply from a strong match."
              action={
                <Button className="min-h-[44px] text-base" asChild>
                  <Link to={`/${activeStateCode}/jobs`}>Jobs board</Link>
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full min-w-[28rem] text-left text-base">
                <thead className="border-b border-slate-200 bg-slate-50 text-sm text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Role</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.slice(0, 8).map(a => (
                    <tr key={a.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3">
                        {a.job_title || `Job #${a.job_id}`}
                        {a.is_sample ? (
                          <span className="ml-2 text-sm text-sky-700">(sample)</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="text-sm font-normal">
                          {titleCase(a.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">{formatDate(a.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </OwwSection>
      </div>

      <OwwSection title="Employer messages" description="Threads from utilities and employers about your applications.">
        {!threads.length ? (
          <OwwEmptyState title="No messages yet" description="When employers reach out, conversations appear here." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {threads.slice(0, 4).map(t => (
              <Card key={t.id}>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="font-display text-lg">{t.subject}</CardTitle>
                    {(t.unread || 0) > 0 ? (
                      <Badge className="text-sm">{t.unread} unread</Badge>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="space-y-1 text-base text-slate-600">
                  <p className="font-medium text-slate-800">{t.peer_name || 'Employer'}</p>
                  <p className="line-clamp-2">{t.preview}</p>
                  <p className="text-sm text-slate-500">{formatDate(t.last_message_at)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </OwwSection>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" className="min-h-[44px] text-base" asChild>
          <Link to="/candidate/matches">My matches</Link>
        </Button>
        <Button variant="outline" className="min-h-[44px] text-base" asChild>
          <Link to={`/${activeStateCode}/jobs`}>Jobs board</Link>
        </Button>
        <Button variant="outline" className="min-h-[44px] text-base" asChild>
          <Link to={`/${activeStateCode}/career`}>Career pathway</Link>
        </Button>
      </div>
    </div>
  );
}
