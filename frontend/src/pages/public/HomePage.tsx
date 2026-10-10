import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowRight, GraduationCap, HeartHandshake, Briefcase, Users } from 'lucide-react';
import { CmsPageRenderer } from '@/components/oww/CmsPageRenderer';
import { HomeHeroStage } from '@/components/oww/HomeHeroStage';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { OwwSection } from '@/components/oww/OwwSection';
import { OwwLogo } from '@/components/oww/OwwLogo';
import { Ww360LaunchButton } from '@/components/oww/Ww360LaunchButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { publicPathways } from '@/config/nav';
import { useAuth } from '@/context/AuthContext';
import { DEFAULT_STATE } from '@/lib/constants';
import { homeForRoles, isHiringRole, isPlatformStaff } from '@/lib/roleHome';
import { getPublishedPage, listTestimonials } from '@/services/publicService';
import type { ContentPage, Testimonial } from '@/types';
import { useJurisdiction } from '@/context/JurisdictionContext';

const icons = {
  career: Users,
  hire: Briefcase,
  educate: GraduationCap,
  ambassador: HeartHandshake,
} as const;

function SignedInHome({
  state,
  testimonials,
}: {
  state: string;
  testimonials: Testimonial[];
}) {
  const { user, userRoles, isUtilityAdmin, isEducator, isIndividual } = useAuth();
  const { mission: owwMission, pathway } = useJurisdiction();
  const pathwayContent = { hire: pathway('hire') };
  const displayName = user?.full_name?.trim() || user?.username || 'there';
  const hiring = isHiringRole(userRoles);
  const platform = isPlatformStaff(userRoles);

  const eyebrow = platform
    ? 'Platform'
    : hiring
      ? isUtilityAdmin
        ? 'Utility administrator'
        : 'Hiring workspace'
      : isEducator
        ? 'Educator'
        : isIndividual
          ? 'Candidate'
          : 'Signed in';

  const primaryTo = homeForRoles(userRoles);

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(70% 90% at 100% 0%, rgba(0,93,248,0.12), transparent 55%), radial-gradient(50% 70% at 0% 100%, rgba(0,32,80,0.08), transparent 50%)',
          }}
        />
        <div className="relative space-y-5 px-6 py-8 md:px-10 md:py-12">
          <OwwLogo to={primaryTo} size="hero" onDark={false} />
          <p className="text-sm font-semibold uppercase tracking-wide text-oww-cyan">{eyebrow}</p>
          <h1 className="font-display text-3xl font-semibold text-oww-navy md:text-4xl">
            Welcome back, {displayName}
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-slate-700">
            {hiring
              ? 'Continue in your hiring workspace — jobs, applicants, messaging, and Water Workforce 360.'
              : platform
                ? 'Open Administration for users, registrations, and statewide operations.'
                : isIndividual
                  ? 'Continue your candidate profile, matches, and applications.'
                  : isEducator
                    ? 'Continue to your educator workspace.'
                    : owwMission.summary}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button className="min-h-[44px] bg-oww-cyan text-base text-white hover:bg-sky-700" asChild>
              <Link to={primaryTo}>
                {hiring
                  ? 'Open hiring workspace'
                  : platform
                    ? 'Open administration'
                    : isIndividual
                      ? 'Open candidate dashboard'
                      : isEducator
                        ? 'Open educator workspace'
                        : 'Continue'}
              </Link>
            </Button>
            {hiring ? (
              <>
                <Button variant="outline" className="min-h-[44px] text-base" asChild>
                  <Link to="/employer/jobs">Manage jobs</Link>
                </Button>
                {isUtilityAdmin ? (
                  <Ww360LaunchButton
                    variant="inline"
                    next="/admin/users?invite=1"
                    label="Invite staff in WW360"
                  />
                ) : (
                  <Ww360LaunchButton variant="inline" />
                )}
              </>
            ) : null}
            {!hiring && !platform ? (
              <Button variant="outline" className="min-h-[44px] text-base" asChild>
                <Link to={`/${state}/jobs`}>Browse jobs</Link>
              </Button>
            ) : null}
          </div>
          <p className="text-sm text-slate-500">
            {owwMission.leadOrg} · Jurisdiction {state.toUpperCase()}
          </p>
        </div>
      </section>

      {hiring ? (
        <OwwSection
          title="Your hiring pathway"
          description="You are signed in as an employer/utility — public career and ambassador pathways stay available for visitors, not as your primary actions."
        >
          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-start gap-3 space-y-0">
              <div className="rounded-lg bg-[#e8f0ff] p-3 text-oww-cyan">
                <Briefcase className="h-6 w-6" aria-hidden />
              </div>
              <div>
                <CardTitle className="font-display text-xl text-oww-navy">
                  {pathwayContent.hire.rfpLabel}
                </CardTitle>
                <p className="mt-2 text-base text-slate-600">{pathwayContent.hire.description}</p>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="min-h-[44px] text-base" asChild>
                <Link to="/employer">
                  Go to hiring tools <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </OwwSection>
      ) : null}

      {!hiring && !platform ? (
        <OwwSection title="Voices from the field" description="Stories from operators, managers, and educators.">
          <div className="grid gap-4 md:grid-cols-2">
            {(testimonials.length
              ? testimonials
              : [
                  {
                    id: 0,
                    quote:
                      'Workforce development is no longer a future challenge—it is a current operational necessity.',
                    author_name: 'Jenny Ingrao-Aman',
                    author_role: 'Executive Director',
                    organization: 'NYSAWWA / One Water Workforce',
                  },
                ]
            )
              .slice(0, 2)
              .map(t => (
                <blockquote key={t.id} className="rounded-xl border border-slate-200 bg-white p-5">
                  <p className="text-lg leading-relaxed text-slate-800">“{t.quote}”</p>
                  <footer className="mt-3 text-sm text-slate-600">
                    — {t.author_name}
                    {t.author_role ? `, ${t.author_role}` : ''}
                  </footer>
                </blockquote>
              ))}
          </div>
        </OwwSection>
      ) : null}
    </div>
  );
}

function FallbackHome({ state, testimonials }: { state: string; testimonials: Testimonial[] }) {
  const {
    mission: owwMission,
    impactStats: owwImpactStats,
    trainingCenter: owwTrainingCenter,
    pathway,
    activeList,
  } = useJurisdiction();
  return (
    <div className="space-y-10">
      <section data-tour="brand" className="-mx-4 overflow-hidden sm:-mx-6 lg:-mx-8">
        <HomeHeroStage state={state} />
      </section>

      <OwwSection id="mission" title="Why One Water Workforce" description={owwMission.whyItMatters}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-tour="mission">
          {owwImpactStats.map(stat => (
            <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="font-display text-3xl font-semibold text-oww-navy">{stat.value}</p>
              <p className="mt-1 text-base font-semibold text-slate-800">{stat.label}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{stat.detail}</p>
            </div>
          ))}
        </div>
        {activeList.length > 1 ? (
          <p className="mt-4 text-sm text-slate-600">
            Jurisdiction{' '}
            {activeList.map((j, i) => (
              <span key={j.code}>
                {i > 0 ? ' · ' : ''}
                <Link
                  className={
                    j.code === state
                      ? 'font-semibold text-oww-navy'
                      : 'text-oww-cyan underline-offset-2 hover:underline'
                  }
                  to={`/${j.code}`}
                >
                  {j.code.toUpperCase()}
                </Link>
              </span>
            ))}
          </p>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            {owwMission.leadOrg} · Jurisdiction {state.toUpperCase()}
          </p>
        )}
      </OwwSection>

      <OwwSection title="Choose your pathway" description="Four doors into water careers—each opens into tools, checklists, and next steps.">
        <div className="grid gap-4 sm:grid-cols-2" data-tour="pathways">
          {publicPathways.map(p => {
            const Icon = icons[p.slug];
            const deep = pathway(p.slug);
            return (
              <Card key={p.slug} className="border-slate-200 transition hover:border-oww-cyan/40 hover:shadow-md">
                <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                  <div className="rounded-lg bg-[#e8f0ff] p-3 text-oww-cyan">
                    <Icon className="h-6 w-6" aria-hidden />
                  </div>
                  <div>
                    <CardTitle className="font-display text-xl text-oww-navy">{deep.rfpLabel}</CardTitle>
                    <p className="mt-2 text-base text-slate-600">{deep.description}</p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-1 text-base text-slate-700">
                    {deep.youCan.slice(0, 3).map(item => (
                      <li key={item} className="flex gap-2">
                        <span className="text-oww-cyan" aria-hidden>
                          •
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="min-h-[44px] text-base" asChild>
                    <Link to={`/${state}/${p.slug}`}>
                      Explore this pathway <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </OwwSection>

      {owwTrainingCenter ? (
      <OwwSection
        title={owwTrainingCenter.title}
        description={
          owwTrainingCenter.locations.length
            ? `In partnership with ${owwTrainingCenter.partner} · ${owwTrainingCenter.locations.join(' · ')}`
            : `With ${owwTrainingCenter.partner}`
        }
      >
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-lg leading-relaxed text-slate-700">{owwTrainingCenter.summary}</p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {owwTrainingCenter.offerings.map(item => (
              <li key={item} className="text-base text-slate-700">
                • {item}
              </li>
            ))}
          </ul>
        </div>
      </OwwSection>
      ) : null}

      <OwwSection title="Voices from the field" description="Stories from operators, managers, and educators.">
        <div className="grid gap-4 md:grid-cols-2">
          {(testimonials.length
            ? testimonials
            : [
                {
                  id: 0,
                  quote:
                    'Workforce development is no longer a future challenge—it is a current operational necessity. Communities need qualified operators, supervisors, and utility leaders.',
                  author_name: 'Jenny Ingrao-Aman',
                  author_role: 'Executive Director',
                  organization: 'NYSAWWA / One Water Workforce',
                },
              ]
          )
            .slice(0, 4)
            .map(t => (
              <blockquote key={t.id} className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="text-lg leading-relaxed text-slate-800">“{t.quote}”</p>
                <footer className="mt-3 text-sm text-slate-600">
                  — {t.author_name}
                  {t.author_role ? `, ${t.author_role}` : ''}
                  {t.organization ? ` · ${t.organization}` : ''}
                </footer>
              </blockquote>
            ))}
        </div>
      </OwwSection>

      <OwwPageHero
        eyebrow="Ready when you are"
        title={owwMission.tagline}
        description="Express interest, create an account, or jump straight into jobs and employers."
        actions={
          <Button className="min-h-[44px] bg-oww-cyan text-base hover:bg-sky-700" asChild>
            <Link to={`/${state}/career`}>Start a career pathway</Link>
          </Button>
        }
      />
    </div>
  );
}

export default function HomePage() {
  const params = useParams();
  const state = (params.state || DEFAULT_STATE).toLowerCase();
  const { isAuthenticated, userRoles, loading } = useAuth();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [cmsPage, setCmsPage] = useState<ContentPage | null | undefined>(undefined);

  useEffect(() => {
    void listTestimonials({ state }).then(setTestimonials).catch(() => setTestimonials([]));
    void getPublishedPage(state, 'home')
      .then(page => setCmsPage(page?.sections?.length ? page : null))
      .catch(() => setCmsPage(null));
  }, [state]);

  // Signed-in role users: skip CMS marketing home and go to their workspace.
  if (!loading && isAuthenticated && (isHiringRole(userRoles) || isPlatformStaff(userRoles))) {
    return <Navigate to={homeForRoles(userRoles)} replace />;
  }

  if (cmsPage === undefined || loading) {
    return <p className="text-base text-slate-600">Loading…</p>;
  }

  if (isAuthenticated) {
    return <SignedInHome state={state} testimonials={testimonials} />;
  }

  if (cmsPage) {
    return <CmsPageRenderer page={cmsPage} state={state} />;
  }

  return <FallbackHome state={state} testimonials={testimonials} />;
}
