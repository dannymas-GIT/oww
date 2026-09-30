import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DEFAULT_STATE } from '@/lib/constants';
import { getPublicJob } from '@/services/publicService';
import { applyToJob } from '@/services/jobService';
import { useAuth } from '@/context/AuthContext';
import type { Job } from '@/types';

export default function JobDetailPage() {
  const params = useParams();
  const state = (params.state || DEFAULT_STATE).toLowerCase();
  const id = params.id!;
  const { isAuthenticated, isIndividual } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    void getPublicJob(id).then(setJob).catch(() => setJob(null));
  }, [id]);

  async function onApply() {
    if (!job) return;
    try {
      await applyToJob(job.id);
      setMsg('Application submitted.');
    } catch {
      setMsg('Could not apply. Sign in as a candidate and try again.');
    }
  }

  if (!job) {
    return <p className="text-lg text-slate-600">Loading job…</p>;
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" className="min-h-[44px] px-0 text-base text-sky-800" asChild>
        <Link to={`/${state}/jobs`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {state.toUpperCase()} jobs
        </Link>
      </Button>
      <OwwPageHero
        eyebrow={job.organization_name || 'Opportunity'}
        title={job.title}
        description={[job.city, job.opportunity_type, job.career_area].filter(Boolean).join(' · ')}
        actions={
          isAuthenticated && isIndividual ? (
            <Button className="min-h-[44px] text-base" onClick={onApply}>
              Apply
            </Button>
          ) : (
            <Button className="min-h-[44px] text-base" asChild>
              <Link to="/login">Sign in to apply</Link>
            </Button>
          )
        }
      />
      <Card>
        <CardContent className="space-y-4 pt-6 text-lg leading-relaxed text-slate-700">
          <p>{job.description || 'No description provided.'}</p>
          {job.organization_id ? (
            <Button variant="outline" className="min-h-[44px] text-base" asChild>
              <Link to={`/${state}/companies/${job.organization_id}`}>View employer</Link>
            </Button>
          ) : null}
          {msg ? <p className="text-base text-emerald-700">{msg}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
