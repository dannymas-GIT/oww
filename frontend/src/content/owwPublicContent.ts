/**
 * Public microsite copy for One Water Workforce (NYSAWWA).
 * Sources: onewaterworkforce.org, NYSAWWA/B&L Training Center announcements,
 * NYWEA/NYSDOH workforce context.
 */

export const owwMission = {
  name: 'One Water Workforce',
  shortName: 'OWW',
  leadOrg: 'New York Section American Water Works Association (NYSAWWA)',
  /** Official logo lockup tagline */
  tagline: 'From GED to PhD: A Job for Everyone',
  supportLine: 'Build a strong, prepared water and wastewater workforce for New York.',
  summary:
    'One Water Workforce, created by NYSAWWA, is the statewide one-stop hub for water and wastewater career awareness, recruitment, training, and hiring. It connects individuals, utilities, educators, industry partners, and community ambassadors so New York can protect public health, the environment, and infrastructure resilience.',
  whyItMatters:
    'More than 19 million New Yorkers rely on safe water produced by fewer than 10,000 certified operators. The workforce is aging out—utilities need practical pathways for new operators, career changers, and the next generation of supervisors and utility leaders.',
  contact: {
    partnerEmail: 'jenny@nysawwa.org',
    partnerLabel: 'Jenny Ingrao-Aman, Executive Director, NYSAWWA',
    publicSite: 'https://onewaterworkforce.org/',
    nysawwa: 'https://nysawwa.org/',
  },
} as const;

export const owwImpactStats = [
  {
    label: 'New Yorkers served',
    value: '19M+',
    detail: 'Rely on drinking water and wastewater systems every day.',
  },
  {
    label: 'Certified operators',
    value: '<10K',
    detail: 'Statewide licensed water and wastewater professionals.',
  },
  {
    label: 'Training hubs',
    value: '3',
    detail: 'Gold Standard courses delivered from Albany, Syracuse, and Rochester.',
  },
  {
    label: 'Career doorways',
    value: '4',
    detail: 'Career, Hire, Educate, and Ambassador pathways on this platform.',
  },
] as const;

export const owwTrainingCenter = {
  title: 'OWW Training Center',
  partner: 'Barton & Loguidice (B&L)',
  summary:
    'Through the One Water Workforce Training Center partnership with Barton & Loguidice, New York utilities and aspiring operators can access Gold Standard certification training and continuing education. Courses run in classrooms statewide and onsite at partnering treatment facilities—supporting people entering the profession and operators maintaining licensure.',
  locations: ['Albany', 'Syracuse', 'Rochester'],
  offerings: [
    'Entry-level / pre-certification operator training',
    'Continuing education for license renewal',
    'Drinking water and wastewater tracks',
    'Practical instruction tied to real treatment facilities',
  ],
  externalLinks: [
    {
      label: 'OWW public site',
      href: 'https://onewaterworkforce.org/',
    },
    {
      label: 'B&L operator training',
      href: 'https://www.bartonandloguidice.com/expertise/water-resources/water-operator-training-support/',
    },
    {
      label: 'NYSDOH operator training calendar',
      href: 'https://health.ny.gov/environmental/water/drinking/operate/training.htm',
    },
  ],
} as const;

export const careerAreas = [
  { id: 'treatment', label: 'Treatment operations', body: 'Drinking water and wastewater plant operations that protect public health every shift.' },
  { id: 'distribution', label: 'Distribution & collection', body: 'Field crews maintaining pipes, valves, hydrants, and collection systems.' },
  { id: 'lab', label: 'Laboratory & water quality', body: 'Sampling, analysis, and compliance monitoring that keep systems trustworthy.' },
  { id: 'engineering', label: 'Engineering & capital projects', body: 'Design, construction oversight, and long-range infrastructure planning.' },
  { id: 'tech', label: 'Technology & cyber', body: 'SCADA, GIS, data systems, and cybersecurity for modern utilities.' },
  { id: 'leadership', label: 'Supervision & leadership', body: 'Crew leads, managers, and utility leaders building the next generation.' },
] as const;

export type PathwaySlug = 'career' | 'hire' | 'educate' | 'ambassador';

export interface PathwayNextStep {
  label: string;
  description: string;
  to: string; // may include {state}
  variant?: 'primary' | 'outline' | 'secondary';
}

export interface PathwayContent {
  slug: PathwaySlug;
  eyebrow: string;
  title: string;
  rfpLabel: string;
  description: string;
  intro: string;
  whoFor: string[];
  youCan: string[];
  resources: { title: string; body: string }[];
  checklist: string[];
  nextSteps: PathwayNextStep[];
}

export const pathwayContent: Record<PathwaySlug, PathwayContent> = {
  career: {
    slug: 'career',
    eyebrow: 'Pathway · Individuals',
    title: 'I Want a Career in Water',
    rfpLabel: 'I Want a Career in Water',
    description:
      'Explore water-sector careers, build a matchable profile, and find jobs, apprenticeships, and training across New York.',
    intro:
      'Whether you are starting out, changing careers, or advancing as a licensed operator, OWW helps you see the full pathway—from career awareness and certification prep to job search and civil-service-ready hiring.',
    whoFor: [
      'High school and college students exploring public-service careers',
      'Career changers from construction, manufacturing, military, energy, or lab work',
      'Current operators seeking advancement, CEUs, or a better fit',
      'People interested in internships, apprenticeships, mentoring, or job shadows',
    ],
    youCan: [
      'Browse the statewide job board and employer directory',
      'Complete the individual matching questionnaire (17 taxonomy categories)',
      'Get Ready now / Strong transferable / Developing / Future match types',
      'Opt in to the resume bank and job alerts',
      'Request interview assistance and certification-prep interest',
      'Follow regional career resources and microvideos',
    ],
    resources: [
      {
        title: 'Job board & employer directory',
        body: 'Search openings by region, career area, and opportunity type—then apply once you create a candidate account.',
      },
      {
        title: 'Matching questionnaire',
        body: 'Share skills, credentials, schedule, location, and transferable industries so employers see ready-now and transferable talent.',
      },
      {
        title: 'Training & certification pathway',
        body: 'Connect to OWW/B&L Gold Standard training, NYSDOH-approved courses, and NYWEA wastewater certification resources.',
      },
      {
        title: 'Civil service & hiring readiness',
        body: 'Flag civil-service interest and interview help on the Interest & Access form so partners can follow up.',
      },
    ],
    checklist: [
      'Express interest so NYSAWWA can track your pathway stage',
      'Create a candidate account with email or SMS one-time code',
      'Complete your profile and matching questionnaire',
      'Browse jobs and save strong matches',
      'Ask about training or certification prep if you need a developing pathway',
    ],
    nextSteps: [
      { label: 'Browse jobs', description: 'Open the NY job board', to: '/{state}/jobs', variant: 'primary' },
      { label: 'Browse employers', description: 'Explore utilities and partners', to: '/{state}/companies', variant: 'outline' },
      { label: 'Express interest', description: 'Pathways Interest & Access form', to: '/{state}/interest?pathway=career', variant: 'secondary' },
      { label: 'Create account', description: 'Start your candidate profile', to: '/login', variant: 'outline' },
      { label: 'Regional careers', description: 'State/region category pages', to: '/{state}/regional/careers', variant: 'outline' },
    ],
  },
  hire: {
    slug: 'hire',
    eyebrow: 'Pathway · Employers',
    title: 'I Want to Hire',
    rfpLabel: 'I Want to Hire',
    description:
      'Post opportunities, search transferable talent, and manage applications with the same taxonomy candidates use.',
    intro:
      'Utilities, consultants, contractors, labs, and industry partners can use OWW as recruitment infrastructure—not just a brochure site. Post jobs with exact-matching criteria, review applicants, message candidates, and report hiring outcomes that feed statewide workforce analytics.',
    whoFor: [
      'Municipal and private water/wastewater utilities',
      'Consulting engineers, contractors, and manufacturers',
      'Labs, technology vendors, and public-works employers',
      'HR and operations leaders planning 30-day to 3-year workforce needs',
    ],
    youCan: [
      'Create an organization profile aligned to the shared taxonomy',
      'Post jobs (including templates, duplicates, and featured credits)',
      'Search candidates by Ready now and Strong transferable matches',
      'Review applications, message candidates, and schedule interviews',
      'Track resumes viewed, candidates contacted, and hires reported',
      'Receive weekly match digests when profiles and openings align',
    ],
    resources: [
      {
        title: 'Job posting portal',
        body: 'Describe the role, required vs trainable credentials, schedule, location, and compensation signals candidates care about.',
      },
      {
        title: 'Candidate search & resume bank',
        body: 'Find opt-in profiles that match your criteria—including career changers from transferable industries.',
      },
      {
        title: 'Employer dashboard',
        body: 'Manage posts, applicants, interest status, messaging, and interview scheduling in one place.',
      },
      {
        title: 'Pipeline analytics for partners',
        body: 'Hiring outcomes roll into NYSAWWA engagement → employment reporting for grants, boards, and legislators.',
      },
    ],
    checklist: [
      'Express interest as an employer or senior professional',
      'Create an employer account and complete your organization profile',
      'Post your first opening with matching criteria',
      'Review Ready now and Strong transferable candidates',
      'Update applicant status and report hires to close the outcome loop',
    ],
    nextSteps: [
      {
        label: 'Register as utility admin',
        description: 'Create your utility account (complimentary demo membership)',
        to: '/register/utility',
        variant: 'primary',
      },
      { label: 'Browse the job board', description: 'See how openings appear publicly', to: '/{state}/jobs', variant: 'outline' },
      { label: 'Express interest', description: 'Tell us you want to hire', to: '/{state}/interest?pathway=hire', variant: 'secondary' },
      { label: 'Employer sign-in', description: 'Post jobs and search talent', to: '/login', variant: 'outline' },
      { label: 'Employer directory', description: 'View public company profiles', to: '/{state}/companies', variant: 'outline' },
    ],
  },
  educate: {
    slug: 'educate',
    eyebrow: 'Pathway · Educators & trainers',
    title: 'I Want to Educate',
    rfpLabel: 'I Want to Educate',
    description:
      'Publish courses, events, and training pathways that feed New York’s water talent pipeline.',
    intro:
      'Educators, training providers, BOCES, community colleges, and workforce partners can list courses and events, align offerings to certification needs, and connect cohorts to employers hiring across the state. OWW also highlights the Training Center’s Gold Standard operator pathways.',
    whoFor: [
      'Community colleges, BOCES, and university environmental programs',
      'Approved operator training providers and CEU sponsors',
      'Utility training coordinators and apprenticeship sponsors',
      'Nonprofit and association partners building lesson plans and toolkits',
    ],
    youCan: [
      'List courses and events on your educator dashboard',
      'Point learners to certification and CEU pathways',
      'Submit statewide workforce programs for admin review',
      'Coordinate with employers on workforce-ready cohorts',
      'Share career resources and outreach toolkits',
      'Help learners move from interest → training → employment',
    ],
    resources: [
      {
        title: 'Courses & events',
        body: 'Publish upcoming training so candidates and utilities can discover it inside OWW—not only on scattered calendars.',
      },
      {
        title: 'OWW Training Center (B&L)',
        body: 'Gold Standard certification and continuing education delivered from Albany, Syracuse, and Rochester.',
      },
      {
        title: 'Program submission portal',
        body: 'Submit apprenticeships, bootcamps, and regional programs for NYSAWWA review and tagging.',
      },
      {
        title: 'Lesson plans & career resources',
        body: 'Use CMS resources and pathway pages to support classroom and community outreach.',
      },
    ],
    checklist: [
      'Express interest as an educator',
      'Create an educator account',
      'Add courses and events to your dashboard',
      'Submit programs that should appear statewide',
      'Send cohorts toward jobs and employer matches',
    ],
    nextSteps: [
      { label: 'Submit a program', description: 'Workforce program portal', to: '/{state}/programs/submit', variant: 'primary' },
      { label: 'Express interest', description: 'Educator pathway form', to: '/{state}/interest?pathway=educate', variant: 'secondary' },
      { label: 'Educator sign-in', description: 'Manage courses & events', to: '/login', variant: 'outline' },
      { label: 'Regional training', description: 'Browse regional category pages', to: '/{state}/regional/training', variant: 'outline' },
    ],
  },
  ambassador: {
    slug: 'ambassador',
    eyebrow: 'Pathway · Ambassadors',
    title: 'I Want to Be an Ambassador',
    rfpLabel: 'I Want to Be an Ambassador',
    description:
      'Champion water careers in schools, civic groups, and legislative conversations—with toolkits and real workforce facts.',
    intro:
      'Ambassadors multiply OWW’s reach. Share microvideos and statistics, host career conversations, connect people into the four pathways, and help elected officials understand why staffing capacity is as critical as capital investment.',
    whoFor: [
      'Operators, retirees, and utility leaders ready to mentor',
      'Teachers, counselors, and community organizers',
      'Industry partners and association volunteers',
      'Anyone who can open doors for the next generation of water professionals',
    ],
    youCan: [
      'Use outreach talking points and workforce statistics',
      'Share microvideos and pathway links with schools and civic groups',
      'Connect people to Career, Hire, and Educate doorways',
      'Support legislative and board conversations with measurable outcomes',
      'Help NYSAWWA grow partner engagement and membership awareness',
    ],
    resources: [
      {
        title: 'Workforce statistics',
        body: 'Use credible New York figures—millions served, thousands of operators, aging workforce—to make the case for careers in water.',
      },
      {
        title: 'Outreach toolkits',
        body: 'Point audiences to pathways, interest form, jobs, and training rather than one-off PDFs that go stale.',
      },
      {
        title: 'Microvideos & stories',
        body: 'Homepage testimonials and embedded microvideos help people picture themselves in the work.',
      },
      {
        title: 'Partner engagement',
        body: 'Introduce utilities, schools, and local officials to jenny@nysawwa.org when a deeper partnership is needed.',
      },
    ],
    checklist: [
      'Express interest as an ambassador',
      'Review the talking points and stats on this page',
      'Share a pathway link or microvideo with your network',
      'Invite interested people to the Interest & Access form',
      'Loop NYSAWWA in when a school, utility, or legislator wants to partner',
    ],
    nextSteps: [
      { label: 'Express interest', description: 'Join the ambassador network', to: '/{state}/interest?pathway=ambassador', variant: 'primary' },
      { label: 'Share career pathway', description: 'Send people to Start a Career', to: '/{state}/career', variant: 'outline' },
      { label: 'Share jobs board', description: 'Point to live openings', to: '/{state}/jobs', variant: 'outline' },
      { label: 'Create account', description: 'Stay connected as a partner', to: '/login', variant: 'secondary' },
    ],
  },
};

export function resolvePathwayPath(template: string, state: string): string {
  return template.replace('{state}', state);
}
