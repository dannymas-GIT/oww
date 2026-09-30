import { Link, useParams } from 'react-router-dom';
import { PathwayPageShell } from '@/components/oww/PathwayPageShell';
import { OwwSection } from '@/components/oww/OwwSection';
import { Button } from '@/components/ui/button';
import { DEFAULT_STATE } from '@/lib/constants';
import { careerAreas, owwTrainingCenter } from '@/content/owwPublicContent';

export default function CareerPathwayPage() {
  const params = useParams();
  const state = (params.state || DEFAULT_STATE).toLowerCase();

  return (
    <PathwayPageShell
      slug="career"
      state={state}
      extra={
        <>
          <OwwSection
            title="Career areas across the one-water sector"
            description="Operations, engineering, lab, field, technology, and leadership roles all keep systems running."
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {careerAreas.map(area => (
                <div key={area.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <h3 className="font-display text-lg font-semibold text-navy">{area.label}</h3>
                  <p className="mt-2 text-base leading-relaxed text-slate-700">{area.body}</p>
                </div>
              ))}
            </div>
          </OwwSection>
          <OwwSection
            title={owwTrainingCenter.title}
            description={`Partner training with ${owwTrainingCenter.partner} — ${owwTrainingCenter.locations.join(', ')}.`}
          >
            <p className="text-lg leading-relaxed text-slate-700">{owwTrainingCenter.summary}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button className="min-h-[44px] text-base" asChild>
                <Link to={`/${state}/jobs`}>Find openings near training hubs</Link>
              </Button>
              <Button variant="outline" className="min-h-[44px] text-base" asChild>
                <a href={owwTrainingCenter.externalLinks[1].href} target="_blank" rel="noreferrer">
                  View operator training
                </a>
              </Button>
            </div>
          </OwwSection>
        </>
      }
    />
  );
}
