import { useParams } from 'react-router-dom';
import { PathwayPageShell } from '@/components/oww/PathwayPageShell';
import { OwwSection } from '@/components/oww/OwwSection';
import { DEFAULT_STATE } from '@/lib/constants';

const hiringOutcomes = [
  {
    title: 'Ready now',
    body: 'Candidates who meet essential requirements and align on location, schedule, and working conditions.',
  },
  {
    title: 'Strong transferable',
    body: 'People with relevant experience from another water role or industry who can learn water-specific needs.',
  },
  {
    title: 'Developing',
    body: 'Strong fits after a credential, course, apprenticeship, or employer-supported training period.',
  },
  {
    title: 'Future',
    body: 'Interest aligned to anticipated openings even when no seat is open today—your talent pipeline.',
  },
];

export default function HirePathwayPage() {
  const params = useParams();
  const state = (params.state || DEFAULT_STATE).toLowerCase();

  return (
    <PathwayPageShell
      slug="hire"
      state={state}
      extra={
        <OwwSection
          title="Exact matching, not keyword noise"
          description="OWW uses the shared individual/employer taxonomy so hiring managers see why someone fits—not just who applied first."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {hiringOutcomes.map(item => (
              <div key={item.title} className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="font-display text-lg font-semibold text-navy">{item.title}</h3>
                <p className="mt-2 text-lg leading-relaxed text-slate-700">{item.body}</p>
              </div>
            ))}
          </div>
        </OwwSection>
      }
    />
  );
}
