import { Link, useParams } from 'react-router-dom';
import { PathwayPageShell } from '@/components/oww/PathwayPageShell';
import { OwwSection } from '@/components/oww/OwwSection';
import { Button } from '@/components/ui/button';
import { DEFAULT_STATE } from '@/lib/constants';
import { owwTrainingCenter } from '@/content/owwPublicContent';

export default function EducatePathwayPage() {
  const params = useParams();
  const state = (params.state || DEFAULT_STATE).toLowerCase();

  return (
    <PathwayPageShell
      slug="educate"
      state={state}
      extra={
        <OwwSection
          title={owwTrainingCenter.title}
          description="NYSAWWA’s Training Center partnership brings Gold Standard operator pathways into the educate doorway."
        >
          <p className="text-lg leading-relaxed text-slate-700">{owwTrainingCenter.summary}</p>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-lg text-slate-700">
            {owwTrainingCenter.offerings.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap gap-3">
            {owwTrainingCenter.externalLinks.map(link => (
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
