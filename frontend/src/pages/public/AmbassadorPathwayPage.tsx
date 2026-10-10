import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PathwayPageShell } from '@/components/oww/PathwayPageShell';
import { OwwSection } from '@/components/oww/OwwSection';
import { useAuth } from '@/context/AuthContext';
import { useJurisdiction } from '@/context/JurisdictionContext';
import { DEFAULT_STATE } from '@/lib/constants';

const talkingPoints = [
  'Workforce development is a current operational necessity—not a future problem.',
  'Clean water capital projects only move as fast as the people who operate, maintain, review, and deliver them.',
  'OWW connects career awareness, training, and hiring so utilities can build sustainable pathways—not one-off postings.',
  'Ambassadors help schools, civic groups, and elected officials see water careers as skilled public-service work.',
];

export default function AmbassadorPathwayPage() {
  const params = useParams();
  const state = (params.state || DEFAULT_STATE).toLowerCase();
  const { user, isAuthenticated } = useAuth();
  const { impactStats, mission, partnerShort, config } = useJurisdiction();
  const navigate = useNavigate();
  const isAmbassador = Boolean(user?.roles?.includes('ambassador'));

  useEffect(() => {
    if (isAuthenticated && isAmbassador) {
      navigate('/ambassador', { replace: true });
    }
  }, [isAuthenticated, isAmbassador, navigate]);

  if (isAuthenticated && isAmbassador) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-8 text-lg text-slate-600">
        Opening your ambassador desk…
      </div>
    );
  }

  return (
    <PathwayPageShell
      slug="ambassador"
      state={state}
      extra={
        <>
          <OwwSection
            title="Talking points you can use tomorrow"
            description={`Grounded in ${partnerShort} messaging and ${config?.name || state.toUpperCase()} workforce context.`}
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
              {impactStats.map(stat => (
                <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="font-display text-3xl font-semibold text-navy">{stat.value}</p>
                  <p className="mt-1 text-base font-semibold text-slate-800">{stat.label}</p>
                  <p className="mt-2 text-sm text-slate-600">{stat.detail}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-base text-slate-600">
              Partner inquiries: {mission.contact.partnerLabel} ·{' '}
              <a className="text-sky-800 underline" href={`mailto:${mission.contact.partnerEmail}`}>
                {mission.contact.partnerEmail}
              </a>
            </p>
          </OwwSection>
        </>
      }
    />
  );
}
