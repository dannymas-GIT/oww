import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DEFAULT_STATE } from '@/lib/constants';
import { getPublicCompany } from '@/services/publicService';
import type { Organization } from '@/types';

export default function CompanyDetailPage() {
  const params = useParams();
  const state = (params.state || DEFAULT_STATE).toLowerCase();
  const [org, setOrg] = useState<Organization | null>(null);

  useEffect(() => {
    void getPublicCompany(params.id!).then(setOrg).catch(() => setOrg(null));
  }, [params.id]);

  if (!org) return <p className="text-lg text-slate-600">Loading organization…</p>;

  return (
    <div className="space-y-6">
      <Button variant="ghost" className="min-h-[44px] px-0 text-base text-sky-800" asChild>
        <Link to={`/${state}/companies`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {state.toUpperCase()} companies
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
    </div>
  );
}
