import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { CmsPageRenderer } from '@/components/oww/CmsPageRenderer';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { OwwSection } from '@/components/oww/OwwSection';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  pathwayContent,
  resolvePathwayPath,
  type PathwaySlug,
} from '@/content/owwPublicContent';
import { getPublishedPage } from '@/services/publicService';
import type { ContentPage } from '@/types';

export function PathwayPageShell({
  slug,
  state,
  extra,
}: {
  slug: PathwaySlug;
  state: string;
  extra?: ReactNode;
}) {
  const content = pathwayContent[slug];
  const [cmsPage, setCmsPage] = useState<ContentPage | null | undefined>(undefined);

  useEffect(() => {
    void getPublishedPage(state, slug)
      .then(page => setCmsPage(page?.sections?.length ? page : null))
      .catch(() => setCmsPage(null));
  }, [state, slug]);

  if (cmsPage === undefined) {
    return <p className="text-base text-slate-600">Loading…</p>;
  }

  if (cmsPage) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" className="min-h-[44px] px-0 text-base text-sky-800" asChild>
          <Link to={`/${state}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {state.toUpperCase()} home
          </Link>
        </Button>
        <CmsPageRenderer page={cmsPage} state={state} />
        {extra}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Button variant="ghost" className="min-h-[44px] px-0 text-base text-sky-800" asChild>
        <Link to={`/${state}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {state.toUpperCase()} home
        </Link>
      </Button>

      <OwwPageHero
        eyebrow={content.eyebrow}
        title={content.title}
        description={content.description}
        badges={
          <span className="rounded-full border border-sky-400/40 bg-sky-500/10 px-3 py-1 text-sm text-sky-100">
            Pathway · {content.rfpLabel}
          </span>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {content.nextSteps.slice(0, 2).map(step => (
              <Button
                key={step.to}
                className="min-h-[44px] text-base"
                variant={step.variant === 'primary' ? 'default' : 'secondary'}
                asChild
              >
                <Link to={resolvePathwayPath(step.to, state)}>{step.label}</Link>
              </Button>
            ))}
          </div>
        }
      />

      <OwwSection title="Why this pathway exists" description={content.intro}>
        <div className="grid gap-4 md:grid-cols-2" data-tour="pathway-who">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="font-display text-lg">Who it is for</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-lg text-slate-700">
                {content.whoFor.map(item => (
                  <li key={item} className="flex gap-2">
                    <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-sky-600" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="font-display text-lg">What you can do here</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-lg text-slate-700">
                {content.youCan.map(item => (
                  <li key={item} className="flex gap-2">
                    <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-sky-600" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </OwwSection>

      <OwwSection
        title="Tools & resources"
        description="Job board, training, employer tools, and outreach—organized for this pathway."
      >
        <div className="grid gap-4 sm:grid-cols-2" data-tour="pathway-resources">
          {content.resources.map(resource => (
            <div key={resource.title} className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-display text-lg font-semibold text-navy">{resource.title}</h3>
              <p className="mt-2 text-lg leading-relaxed text-slate-700">{resource.body}</p>
            </div>
          ))}
        </div>
      </OwwSection>

      <OwwSection title="Suggested next steps" description="A practical checklist so you do not stall on a single CTA.">
        <ol className="list-decimal space-y-2 pl-6 text-lg text-slate-700">
          {content.checklist.map(item => (
            <li key={item}>{item}</li>
          ))}
        </ol>
        <div className="mt-6 flex flex-wrap gap-3" data-tour="pathway-next">
          {content.nextSteps.map(step => (
            <Button
              key={`${step.label}-${step.to}`}
              className="min-h-[44px] text-base"
              variant={
                step.variant === 'primary'
                  ? 'default'
                  : step.variant === 'secondary'
                    ? 'secondary'
                    : 'outline'
              }
              asChild
            >
              <Link to={resolvePathwayPath(step.to, state)}>
                <span className="flex flex-col items-start leading-tight">
                  <span>{step.label}</span>
                  <span className="text-sm font-normal opacity-80">{step.description}</span>
                </span>
              </Link>
            </Button>
          ))}
        </div>
      </OwwSection>

      {extra}
    </div>
  );
}
