import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DEFAULT_STATE } from '@/lib/constants';
import { getPublicCompany } from '@/services/publicService';
import type { Organization } from '@/types';

const STAT_LABELS: Record<string, string> = {
  open_jobs: 'Open jobs',
  hires_12mo: 'Hires reported (12 mo)',
  applicants_contacted: 'Applicants contacted',
  hiring_projection: 'Hiring projection (next 12 mo)',
  workforce_size: 'Approximate workforce size',
};

export default function CompanyDetailPage() {
  const params = useParams();
  const [search] = useSearchParams();
  const state = (params.state || DEFAULT_STATE).toLowerCase();
  const fromStats = search.get('from') === 'stats';
  const [org, setOrg] = useState<Organization | null>(null);

  useEffect(() => {
    void getPublicCompany(params.id!).then(setOrg).catch(() => setOrg(null));
  }, [params.id]);

  if (!org) return <p className="text-lg text-slate-600">Loading organization…</p>;

  const stats = org.public_stats;
  const numericEntries = stats
    ? (Object.keys(STAT_LABELS) as Array<keyof typeof STAT_LABELS>)
        .filter(k => typeof stats[k as keyof typeof stats] === 'number')
        .map(k => [k, stats[k as keyof typeof stats] as number] as const)
    : [];

  return (
    <div className="space-y-6">
      <Button variant="ghost" className="min-h-[44px] px-0 text-base text-sky-800" asChild>
        <Link to={fromStats ? `/${state}/workforce-stats` : `/${state}/companies`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {fromStats ? `Back to ${state.toUpperCase()} workforce stats` : `Back to ${state.toUpperCase()} companies`}
        </Link>
      </Button>
      <OwwPageHero
        eyebrow={org.org_type || 'Organization'}
        title={org.name}
        description={[org.city, org.state_code].filter(Boolean).join(', ')}
        actions={
          org.website ? (
            <Button className="min-h-[44px] text-base" asChild>
              <a href={org.website} target="_blank" rel="noreferrer">
                Website
              </a>
            </Button>
          ) : null
        }
      />
      <Card>
        <CardContent className="pt-6 text-lg leading-relaxed text-slate-700">
          {org.description || 'No description available.'}
        </CardContent>
      </Card>

      {stats && (numericEntries.length > 0 || stats.region || stats.county) ? (
        <Card data-tour="company-public-stats">
          <CardHeader>
            <CardTitle className="font-display text-xl text-oww-navy">Shared workforce stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-base text-slate-600">
              This utility opted in to share the metrics below. Values may include sample demonstration data.
            </p>
            {(stats.region || stats.county || stats.city) && stats.shared_keys?.includes('show_region') ? (
              <p className="text-lg text-slate-700">
                <span className="font-semibold text-oww-navy">Location: </span>
                {[stats.region, stats.county || stats.city].filter(Boolean).join(' · ')}
              </p>
            ) : null}
            {numericEntries.length ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {numericEntries.map(([key, value]) => (
                  <div key={key} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold uppercase tracking-wide text-oww-cyan">
                      {STAT_LABELS[key] || key}
                    </p>
                    <p className="mt-1 font-display text-2xl font-semibold text-oww-navy">{value}</p>
                  </div>
                ))}
              </div>
            ) : null}
            <Button variant="outline" className="min-h-[44px] text-base" asChild>
              <Link to={`/${state}/workforce-stats`}>View statewide workforce stats</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
