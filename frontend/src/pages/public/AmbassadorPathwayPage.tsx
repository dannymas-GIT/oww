import { Link, useParams } from 'react-router-dom';
import { Megaphone } from 'lucide-react';
import { PathwayPageShell } from '@/components/oww/PathwayPageShell';
import { OwwSection } from '@/components/oww/OwwSection';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { DEFAULT_STATE } from '@/lib/constants';
import { owwImpactStats, owwMission } from '@/content/owwPublicContent';

const talkingPoints = [
  'Workforce development is a current operational necessity—not a future problem.',
  'Clean water capital projects only move as fast as the people who operate, maintain, review, and deliver them.',
  'OWW connects career awareness, training, and hiring so utilities can build sustainable pathways—not one-off postings.',
  'Ambassadors help schools, civic groups, and elected officials see water careers as skilled public-service work.',
];

const unlockItems = [
  'Talking points and shareable workforce facts for classrooms, boards, and civic groups',
  'Outreach toolkit resources on this pathway (sample pack for View as role demos)',
  'Pathways Interest form already on file so partners can follow up',
  'Sample outreach engagement events (school visit, civic briefing, referral) in the pipeline',
];

export default function AmbassadorPathwayPage() {
  const params = useParams();
  const state = (params.state || DEFAULT_STATE).toLowerCase();
  const { user } = useAuth();
  const viewingAsAmbassador =
    Boolean(user?.impersonation?.active) && user?.impersonation?.persona_key === 'ambassador';

  return (
    <PathwayPageShell
      slug="ambassador"
      state={state}
      extra={
        <>
          {viewingAsAmbassador ? (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-lg text-amber-950">
              <div className="flex items-start gap-3">
                <Megaphone className="mt-0.5 h-6 w-6 shrink-0 text-amber-800" aria-hidden />
                <div className="space-y-3">
                  <h2 className="font-display text-xl font-semibold text-navy">What this role unlocks</h2>
                  <p className="leading-relaxed text-slate-800">
                    You are previewing the Ambassador experience. Ambassadors do not get a private hiring desk —
                    their power is outreach, awareness, and pipeline referrals into One Water Workforce.
                  </p>
                  <ul className="list-inside list-disc space-y-1 text-base text-slate-700">
                    {unlockItems.map(item => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <Button className="min-h-[44px] text-base" asChild>
                    <Link to={`/${state}/interest?pathway=ambassador`}>Open interest form</Link>
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
          <OwwSection
            title="Talking points you can use tomorrow"
            description="Grounded in NYSAWWA leadership messaging and New York workforce context."
          >
            <ul className="space-y-3">
              {talkingPoints.map(point => (
                <li key={point} className="rounded-xl border border-slate-200 bg-white p-4 text-lg leading-relaxed text-slate-700">
                  {point}
                </li>
              ))}
            </ul>
          </OwwSection>
          <OwwSection title="Shareable workforce facts" description="Use these figures when opening a classroom, board, or civic conversation.">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {owwImpactStats.map(stat => (
                <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="font-display text-3xl font-semibold text-navy">{stat.value}</p>
                  <p className="mt-1 text-base font-semibold text-slate-800">{stat.label}</p>
                  <p className="mt-2 text-sm text-slate-600">{stat.detail}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-base text-slate-600">
              Partner inquiries: {owwMission.contact.partnerLabel} ·{' '}
              <a className="text-sky-800 underline" href={`mailto:${owwMission.contact.partnerEmail}`}>
                {owwMission.contact.partnerEmail}
              </a>
            </p>
          </OwwSection>
        </>
      }
    />
  );
}
