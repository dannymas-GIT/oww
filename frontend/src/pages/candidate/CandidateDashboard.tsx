import { Link } from 'react-router-dom';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { OwwKpiTile } from '@/components/oww/OwwKpiTile';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

export default function CandidateDashboard() {
  const { user, activeStateCode } = useAuth();
  return (
    <div className="space-y-6">
      <OwwPageHero
        eyebrow="Candidate"
        title={`Welcome, ${user?.full_name?.trim() || user?.username || 'there'}`}
        description="Complete your profile, review matches, and apply to openings."
        actions={
          <Button className="min-h-[44px] text-base" asChild>
            <Link to="/candidate/profile">Complete profile</Link>
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <OwwKpiTile label="Profile" value="Build" hint="17-category questionnaire" />
        <OwwKpiTile label="Matches" value="View" hint="Ready now → future" />
        <OwwKpiTile label="Jobs" value="Browse" hint={`${activeStateCode.toUpperCase()} board`} />
      </div>
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" className="min-h-[44px] text-base" asChild>
          <Link to="/candidate/matches">My matches</Link>
        </Button>
        <Button variant="outline" className="min-h-[44px] text-base" asChild>
          <Link to={`/${activeStateCode}/jobs`}>Jobs board</Link>
        </Button>
      </div>
    </div>
  );
}
