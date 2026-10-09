import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Megaphone, ExternalLink } from 'lucide-react';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { OwwKpiTile } from '@/components/oww/OwwKpiTile';
import { OwwSection } from '@/components/oww/OwwSection';
import { OwwEmptyState } from '@/components/oww/OwwEmptyState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { fetchAmbassadorDesk, type AmbassadorDesk } from '@/services/ambassadorService';
import { formatDate, titleCase } from '@/lib/format';
import { DEFAULT_STATE } from '@/lib/constants';

export default function AmbassadorDashboard() {
  const { user, activeStateCode } = useAuth();
  const state = (activeStateCode || DEFAULT_STATE).toLowerCase();
  const [desk, setDesk] = useState<AmbassadorDesk | null>(null);
  const [loading, setLoading] = useState(true);
  const viewingAs = user?.impersonation?.persona_key === 'ambassador';

  useEffect(() => {
    setLoading(true);
    void fetchAmbassadorDesk()
      .then(setDesk)
      .catch(() => setDesk(null))
      .finally(() => setLoading(false));
  }, []);

  const displayName = desk?.full_name?.trim() || user?.full_name?.trim() || user?.username;

  return (
    <div className="space-y-6">
      <OwwPageHero
        eyebrow="Ambassador"
        title={displayName ? `Welcome, ${displayName}` : 'Ambassador desk'}
        description="Your private outreach workspace — talking points, toolkits, and engagement touchpoints. The public pathway page stays available for sharing."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button className="min-h-[44px] text-base" asChild>
              <Link to={`/${state}/interest?pathway=ambassador`}>Interest form</Link>
            </Button>
            <Button variant="outline" className="min-h-[44px] border-white/40 bg-white/10 text-base text-white hover:bg-white/20" asChild>
              <Link to={`/${state}/ambassador`}>Public pathway</Link>
            </Button>
          </div>
        }
      />

      {viewingAs ? (
        <p className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-base text-slate-800">
          View as role sample data is loaded — review outreach activity and toolkits below. Use Public pathway when you want the shareable page visitors see.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <OwwKpiTile label="Outreach touchpoints" value={loading ? '…' : desk?.outreach_count ?? 0} hint="Logged engagement" />
        <OwwKpiTile label="Toolkit resources" value={loading ? '…' : desk?.toolkit_count ?? 0} hint="Ambassador pathway" />
        <OwwKpiTile label="Interest records" value={loading ? '…' : desk?.interest_count ?? 0} hint="On file for follow-up" />
        <OwwKpiTile label="Talking points" value={desk?.talking_points?.length ?? 4} hint="Ready to use tomorrow" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <OwwSection title="Talking points" description="Grounded in NYSAWWA leadership messaging — copy into classroom, board, or civic conversations.">
          <ul className="space-y-3">
            {(desk?.talking_points || []).map(point => (
              <li key={point} className="rounded-xl border border-slate-200 bg-white p-4 text-lg leading-relaxed text-slate-700">
                {point}
              </li>
            ))}
          </ul>
        </OwwSection>

        <OwwSection title="Recent outreach" description="Sample and live engagement attributed to your ambassador account.">
          {!loading && !(desk?.outreach?.length) ? (
            <OwwEmptyState
              title="No outreach logged yet"
              description="School visits, civic briefings, and referrals will appear here."
            />
          ) : (
            <div className="space-y-3">
              {(desk?.outreach || []).map(ev => (
                <Card key={ev.id}>
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <CardTitle className="font-display text-lg">{titleCase(ev.event_type)}</CardTitle>
                      {ev.stage ? <Badge variant="secondary" className="text-sm font-normal">{titleCase(ev.stage)}</Badge> : null}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1 text-base text-slate-600">
                    {ev.note ? <p className="leading-relaxed text-slate-800">{ev.note}</p> : null}
                    <p className="text-sm text-slate-500">
                      {[ev.region, formatDate(ev.created_at)].filter(Boolean).join(' · ')}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </OwwSection>
      </div>

      <OwwSection title="Outreach toolkits" description="Shareable resources for schools, civic groups, and legislative conversations.">
        {!loading && !(desk?.toolkits?.length) ? (
          <OwwEmptyState title="No toolkit items yet" />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {(desk?.toolkits || []).map(item => (
              <Card key={item.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="font-display text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center justify-between gap-2 text-base text-slate-600">
                  <span className="text-sm">{titleCase(item.category || 'toolkit')}</span>
                  {item.url ? (
                    <Button variant="outline" className="min-h-[44px] text-base" asChild>
                      {item.url.startsWith('http') ? (
                        <a href={item.url} target="_blank" rel="noreferrer">
                          Open <ExternalLink className="h-4 w-4" aria-hidden />
                        </a>
                      ) : (
                        <Link to={item.url}>
                          Open <ExternalLink className="h-4 w-4" aria-hidden />
                        </Link>
                      )}
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </OwwSection>

      <OwwSection title="Interest & follow-up" description="Pathways Interest records tied to your ambassador email.">
        {!loading && !(desk?.interests?.length) ? (
          <OwwEmptyState
            title="No interest form on file"
            description="Submit the ambassador interest form so NYSAWWA can follow up."
            action={
              <Button className="min-h-[44px] text-base" asChild>
                <Link to={`/${state}/interest?pathway=ambassador`}>Open interest form</Link>
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[32rem] text-left text-base">
              <thead className="border-b border-slate-200 bg-slate-50 text-sm text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Pathway</th>
                  <th className="px-4 py-3 font-semibold">Region</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {(desk?.interests || []).map(row => (
                  <tr key={row.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3">{titleCase(row.pathway || '—')}</td>
                    <td className="px-4 py-3">{row.region || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-sm font-normal">
                        {titleCase(row.status || 'new')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{formatDate(row.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </OwwSection>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <Megaphone className="h-5 w-5 text-oww-navy" aria-hidden />
        <p className="flex-1 text-base text-slate-700">
          Need a deeper partnership with a school, utility, or legislator? Loop in NYSAWWA.
        </p>
        <Button variant="outline" className="min-h-[44px] text-base" asChild>
          <a href="mailto:jenny@nysawwa.org">Email Jenny</a>
        </Button>
      </div>
    </div>
  );
}
