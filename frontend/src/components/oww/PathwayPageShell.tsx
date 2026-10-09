import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { CmsPageRenderer } from '@/components/oww/CmsPageRenderer';
import { HeroStorySlider } from '@/components/oww/HeroStorySlider';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { OwwSection } from '@/components/oww/OwwSection';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { usePublicSlides } from '@/hooks/usePublicSlides';
import { homeForRoles, isHiringRole, isPlatformStaff } from '@/lib/roleHome';
import { PATHWAY_HERO_SLIDES } from '@/content/pathwayHeroSlides';
import {
  pathwayContent,
  resolvePathwayPath,
  type PathwaySlug,
} from '@/content/owwPublicContent';
import { getPublishedPage } from '@/services/publicService';
import type { ContentPage } from '@/types';

/** Seeded pathway_landing templates still use this headline — treat as unpublished. */
function isPlaceholderPathwayCms(page: ContentPage): boolean {
  const hero = page.sections?.find(s => s.type === 'hero');
  const headline = (hero?.headline || '').trim().toLowerCase();
  return headline === 'pathway title' || headline === '';
}

const PUBLIC_AUTH_CTAS = [/\/login/i, /\/register/i, /create account/i, /express interest/i];

function isPublicOnboardingStep(label: string, to: string): boolean {
  const hay = `${label} ${to}`.toLowerCase();
  return PUBLIC_AUTH_CTAS.some(re => re.test(hay));
}

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
  const { isAuthenticated, userRoles } = useAuth();
  const [cmsPage, setCmsPage] = useState<ContentPage | null | undefined>(undefined);
  const pathwaySlides = usePublicSlides(state, slug, PATHWAY_HERO_SLIDES[slug]);
  const roleHome = homeForRoles(userRoles);
  const hiring = isHiringRole(userRoles);
  const platform = isPlatformStaff(userRoles);

  const nextSteps = useMemo(() => {
    let steps = content.nextSteps;
    if (isAuthenticated) {
      steps = steps.filter(s => !isPublicOnboardingStep(s.label, s.to));
    }
    // Signed-in utility/employer: on hire pathway, prefer workspace over public browse CTAs
    if (hiring && slug === 'hire') {
      return [
        {
          label: 'Open hiring workspace',
          description: 'Jobs, applicants, messaging, and interviews',
          to: '/employer',
          variant: 'primary' as const,
        },
        {
          label: 'Manage jobs',
          description: 'Post and edit openings',
          to: '/employer/jobs',
          variant: 'secondary' as const,
        },
        ...steps.filter(s => !/register|interest|sign-in|login/i.test(`${s.label} ${s.to}`)),
      ];
    }
    if (hiring && slug !== 'hire') {
      return [
        {
          label: 'Back to hiring workspace',
          description: 'You are signed in as an employer/utility — this page is for visitors',
          to: '/employer',
          variant: 'primary' as const,
        },
      ];
    }
    if (platform) {
      return [
        {
          label: 'Open administration',
          description: 'Platform operations and users',
          to: '/admin',
          variant: 'primary' as const,
        },
      ];
    }
    return steps;
  }, [content.nextSteps, hiring, isAuthenticated, platform, slug]);

  useEffect(() => {
    void getPublishedPage(state, slug)
      .then(page => {
        if (!page?.sections?.length || isPlaceholderPathwayCms(page)) {
          setCmsPage(null);
          return;
        }
        setCmsPage(page);
      })
      .catch(() => setCmsPage(null));
  }, [state, slug]);

  if (cmsPage === undefined) {
    return <p className="text-base text-slate-600">Loading…</p>;
  }

  const backTo = isAuthenticated ? roleHome : `/${state}`;
  const backLabel = isAuthenticated ? 'Back to workspace' : `Back to ${state.toUpperCase()} home`;

  const slider = (
    <section data-tour="pathway-slider" className="-mx-4 overflow-hidden sm:-mx-6 lg:-mx-8">
      <HeroStorySlider
        slides={pathwaySlides}
        state={state}
        ariaLabel={`${content.title} story slider`}
      />
    </section>
  );

  if (cmsPage) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" className="min-h-[44px] px-0 text-base text-sky-800" asChild>
          <Link to={backTo}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {backLabel}
          </Link>
        </Button>
        {slider}
        <CmsPageRenderer page={cmsPage} state={state} />
        {extra}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Button variant="ghost" className="min-h-[44px] px-0 text-base text-sky-800" asChild>
        <Link to={backTo}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {backLabel}
        </Link>
      </Button>

      {slider}

      {hiring && slug !== 'hire' ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-base text-amber-950">
          You are signed in on the hiring pathway. Public career/educator/ambassador pages stay
          available for visitors; use your hiring workspace for day-to-day work.
        </div>
      ) : null}

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
            {nextSteps.slice(0, 2).map(step => (
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

      <OwwSection
        title="Suggested next steps"
        description={
          isAuthenticated
            ? 'Actions for your signed-in role on this pathway.'
            : 'A practical checklist so you do not stall on a single CTA.'
        }
      >
        {!isAuthenticated ? (
          <ol className="list-decimal space-y-2 pl-6 text-lg text-slate-700">
            {content.checklist.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3" data-tour="pathway-next">
          {nextSteps.map(step => (
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
