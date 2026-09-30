import { useParams } from 'react-router-dom';
import { PathwayPageShell } from '@/components/oww/PathwayPageShell';
import { OwwSection } from '@/components/oww/OwwSection';
import { DEFAULT_STATE } from '@/lib/constants';
import { owwImpactStats, owwMission } from '@/content/owwPublicContent';

const talkingPoints = [
  'Workforce development is a current operational necessity—not a future problem.',
  'Clean water capital projects only move as fast as the people who operate, maintain, review, and deliver them.',
  'OWW connects career awareness, training, and hiring so utilities can build sustainable pathways—not one-off postings.',
  'Ambassadors help schools, civic groups, and elected officials see water careers as skilled public-service work.',
];

export default function AmbassadorPathwayPage() {
  const params = useParams();
  const state = (params.state || DEFAULT_STATE).toLowerCase();

  return (
    <PathwayPageShell
      slug="ambassador"
      state={state}
      extra={
        <>
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
