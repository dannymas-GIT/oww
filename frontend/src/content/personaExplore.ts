/** Deep-link tips shown in the View-as-role banner for each demo persona. */

export interface PersonaExploreLink {
  label: string;
  path: string;
}

export interface PersonaExploreGuide {
  headline: string;
  links: PersonaExploreLink[];
}

export const PERSONA_EXPLORE: Record<string, PersonaExploreGuide> = {
  'student-explorer': {
    headline: 'Explore pathways, matches, and a starter profile — no hiring tools.',
    links: [
      { label: 'Dashboard', path: '/candidate' },
      { label: 'My matches', path: '/candidate/matches' },
      { label: 'Profile', path: '/candidate/profile' },
      { label: 'Career pathway', path: '/ny/career' },
    ],
  },
  'job-seeker': {
    headline: 'Full questionnaire, ranked matches, and sample applications in flight.',
    links: [
      { label: 'My matches', path: '/candidate/matches' },
      { label: 'Profile', path: '/candidate/profile' },
      { label: 'NY jobs board', path: '/ny/jobs' },
    ],
  },
  educator: {
    headline: 'Published courses, upcoming events, and a pending program submission.',
    links: [
      { label: 'Educator home', path: '/educator' },
      { label: 'Educate pathway', path: '/ny/educate' },
    ],
  },
  ambassador: {
    headline: 'Talking points, toolkits, and sample outreach engagement on the pathway.',
    links: [
      { label: 'Ambassador pathway', path: '/ny/ambassador' },
      { label: 'Interest form', path: '/ny/interest?pathway=ambassador' },
    ],
  },
  'employer-hiring': {
    headline: 'Active membership unlocks jobs, candidates, messages, and interviews.',
    links: [
      { label: 'Workspace', path: '/employer' },
      { label: 'Jobs', path: '/employer/jobs' },
      { label: 'Candidates', path: '/employer/candidates' },
      { label: 'Messages', path: '/employer/messages' },
      { label: 'Interviews', path: '/employer/interviews' },
    ],
  },
  'employer-paywall': {
    headline: 'Membership lapsed — hiring tools show a gate with teaser sample data.',
    links: [
      { label: 'Workspace', path: '/employer' },
      { label: 'Jobs (gated)', path: '/employer/jobs' },
      { label: 'Renew pricing', path: '/pricing' },
    ],
  },
  'utility-admin': {
    headline: 'Org hiring pipeline plus Water Workforce 360 launch for utility staff.',
    links: [
      { label: 'Workspace', path: '/employer' },
      { label: 'Applications', path: '/employer/applications' },
      { label: 'Messages', path: '/employer/messages' },
      { label: 'Interviews', path: '/employer/interviews' },
      { label: 'Billing', path: '/billing' },
    ],
  },
  'utility-manager': {
    headline: 'Same utility hiring pack — post and manage jobs without Team admin.',
    links: [
      { label: 'Workspace', path: '/employer' },
      { label: 'Jobs', path: '/employer/jobs' },
      { label: 'Candidates', path: '/employer/candidates' },
      { label: 'Interviews', path: '/employer/interviews' },
    ],
  },
  'state-admin': {
    headline: 'NY-scoped operations: memberships, registrations, CMS draft, communications.',
    links: [
      { label: 'Admin dashboard', path: '/admin' },
      { label: 'Memberships', path: '/admin/memberships' },
      { label: 'Registrations', path: '/admin/registrations' },
      { label: 'Communications', path: '/admin/communications' },
      { label: 'CMS pages', path: '/admin/cms' },
    ],
  },
};
