import { Link, useParams } from 'react-router-dom';
import { PathwayPageShell } from '@/components/oww/PathwayPageShell';
import { OwwSection } from '@/components/oww/OwwSection';
import { Button } from '@/components/ui/button';
import { useJurisdiction } from '@/context/JurisdictionContext';
import { DEFAULT_STATE } from '@/lib/constants';

export default function EducatePathwayPage() {
  const params = useParams();
  const state = (params.state || DEFAULT_STATE).toLowerCase();
  const { trainingCenter, partnerShort } = useJurisdiction();

  if (!trainingCenter) {
    return <PathwayPageShell slug="educate" state={state} />;
  }

  return (
    <PathwayPageShell
      slug="educate"
      state={state}
      extra={
        <OwwSection
          title={trainingCenter.title}
          description={`${partnerShort} and training partners feed operator pathways into the educate doorway.`}
        >
          <p className="text-lg leading-relaxed text-slate-700">{trainingCenter.summary}</p>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-lg text-slate-700">
            {trainingCenter.offerings.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap gap-3">
            {trainingCenter.externalLinks.map(link => (
              <Button key={link.href} variant="outline" className="min-h-[44px] text-base" asChild>
                <a href={link.href} target="_blank" rel="noreferrer">
                  {link.label}
                </a>
              </Button>
            ))}
            <Button className="min-h-[44px] text-base" asChild>
              <Link to={`/${state}/programs/submit`}>Submit your program</Link>
            </Button>
          </div>
        </OwwSection>
      }
    />
  );
}
