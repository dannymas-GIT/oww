import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { OwwKpiTile } from '@/components/oww/OwwKpiTile';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { listMatches } from '@/services/matchService';
import { listApplications } from '@/services/jobService';
import { getMyProfile } from '@/services/profileService';

export default function CandidateDashboard() {
  const { user, activeStateCode } = useAuth();
  const [matchCount, setMatchCount] = useState<number | null>(null);
  const [appCount, setAppCount] = useState<number | null>(null);
  const [completeness, setCompleteness] = useState<number | null>(null);
  const isStudent = Boolean(user?.roles?.includes('student'));
  const viewingAs = user?.impersonation?.persona_key;

  useEffect(() => {
    void listMatches()
      .then(rows => setMatchCount(rows.length))
      .catch(() => setMatchCount(0));
    void listApplications()
      .then(rows => setAppCount(rows.length))
      .catch(() => setAppCount(0));
    void getMyProfile()
      .then(p => setCompleteness(typeof p?.completion_pct === 'number' ? p.completion_pct : null))
      .catch(() => setCompleteness(null));
  }, []);

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
              {completeness && completeness >= 70 ? 'View profile' : 'Complete profile'}
            </Link>
          </Button>
        }
      />
      {viewingAs === 'student-explorer' || viewingAs === 'job-seeker' ? (
        <p className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-base text-slate-800">
          View as role sample data is loaded — open Matches and Profile to see the power of Exact Matching
          {viewingAs === 'job-seeker' ? ' plus sample applications and employer messages.' : '.'}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-3">
        <OwwKpiTile
          label="Profile"
          value={completeness != null ? `${completeness}%` : 'Build'}
          hint="17-category questionnaire"
        />
        <OwwKpiTile
          label="Matches"
          value={matchCount != null ? matchCount : 'View'}
          hint="Ready now → future"
        />
        <OwwKpiTile
          label="Applications"
          value={appCount != null ? appCount : '—'}
          hint={`${activeStateCode.toUpperCase()} pipeline`}
        />
      </div>
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
