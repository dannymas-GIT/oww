import { Link, useParams } from 'react-router-dom';
import { PathwayPageShell } from '@/components/oww/PathwayPageShell';
import { OwwSection } from '@/components/oww/OwwSection';
import { Button } from '@/components/ui/button';
import { useJurisdiction } from '@/context/JurisdictionContext';
import { DEFAULT_STATE } from '@/lib/constants';
import { careerAreas } from '@/content/owwPublicContent';

export default function CareerPathwayPage() {
  const params = useParams();
  const state = (params.state || DEFAULT_STATE).toLowerCase();
  const { trainingCenter, config, reciprocity_note } = useJurisdictionWithExtras();

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
          {trainingCenter ? (
            <OwwSection
              title={trainingCenter.title}
              description={
                trainingCenter.locations.length
                  ? `Partner training with ${trainingCenter.partner} — ${trainingCenter.locations.join(', ')}.`
                  : `Certification pathways with ${trainingCenter.partner}.`
              }
            >
              <p className="text-lg leading-relaxed text-slate-700">{trainingCenter.summary}</p>
              {config?.reciprocity_note || reciprocity_note ? (
                <p className="mt-3 text-base text-slate-600">{config?.reciprocity_note || reciprocity_note}</p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-3">
                <Button className="min-h-[44px] text-base" asChild>
                  <Link to={`/${state}/jobs`}>Find openings</Link>
                </Button>
                {trainingCenter.externalLinks[0] ? (
                  <Button variant="outline" className="min-h-[44px] text-base" asChild>
                    <a href={trainingCenter.externalLinks[0].href} target="_blank" rel="noreferrer">
                      View operator training
                    </a>
                  </Button>
                ) : null}
              </div>
            </OwwSection>
          ) : null}
        </>
      }
    />
  );
}

function useJurisdictionWithExtras() {
  const j = useJurisdiction();
  return {
    trainingCenter: j.trainingCenter,
    config: j.config,
    reciprocity_note: j.config?.reciprocity_note,
  };
}
