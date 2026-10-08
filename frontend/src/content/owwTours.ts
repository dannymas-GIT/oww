import type { OwwTourConfig } from '@/components/oww/OwwTourOverlay';

/**
 * Page-aware tours — each config is keyed by a path matcher.
 * Highlights use `[data-tour="…"]` anchors on the matching page.
 */
export const owwTours: OwwTourConfig[] = [
  {
    id: 'oww-home',
    label: 'Home',
    dismissedKey: 'oww-tour-home-dismissed',
    stepKey: 'oww-tour-home-step',
    eventName: 'oww:tour:home',
    fabLabel: 'Tour this page',
    slides: [
      {
        id: 'welcome',
        title: 'Welcome to One Water Workforce',
        body: 'This landing page is the public front door — brand, mission stats, and the four pathways into careers, hiring, education, and ambassadors.',
        tip: 'Use the Pathways menu in the header anytime.',
        highlight: '[data-tour="brand"]',
      },
      {
        id: 'mission',
        title: 'Why it matters',
        body: 'Impact stats and the Training Center story explain the New York water workforce gap and NYSAWWA’s Gold Standard partnership.',
        highlight: '[data-tour="mission"]',
      },
      {
        id: 'pathways',
        title: 'Four pathways',
        body: 'Each card drills into a dedicated pathway page with checklists, resources, and next-step buttons — not a dead end.',
        highlight: '[data-tour="pathways"]',
      },
      {
        id: 'jobs',
        title: 'Jobs & companies',
        body: 'Jump straight to the public job board or employer directory for this state.',
        highlight: '[data-tour="jobs-cta"]',
      },
      {
        id: 'interest',
        title: 'Express interest',
        body: 'Capture pathway interest so partners can follow up — feeds the engagement pipeline.',
        highlight: '[data-tour="interest-cta"]',
      },
    ],
  },
  {
    id: 'oww-pathway',
    label: 'Pathway',
    dismissedKey: 'oww-tour-pathway-dismissed',
    stepKey: 'oww-tour-pathway-step',
    eventName: 'oww:tour:pathway',
    fabLabel: 'Pathway tour',
    slides: [
      {
        id: 'who',
        title: 'Who this pathway is for',
        body: 'Each pathway page opens with who it serves and what you can do here — career seekers, employers, educators, or ambassadors.',
        highlight: '[data-tour="pathway-who"]',
      },
      {
        id: 'resources',
        title: 'Resources & checklist',
        body: 'Scroll for tools, checklists, and outbound links. Next-step buttons keep you moving into jobs, interest, or sign-in.',
        highlight: '[data-tour="pathway-resources"]',
      },
      {
        id: 'next',
        title: 'Take the next step',
        body: 'Use the primary actions at the bottom — they preserve state/county context when you drill down.',
        highlight: '[data-tour="pathway-next"]',
      },
    ],
  },
  {
    id: 'oww-jobs',
    label: 'Jobs board',
    dismissedKey: 'oww-tour-jobs-dismissed',
    stepKey: 'oww-tour-jobs-step',
    eventName: 'oww:tour:jobs',
    fabLabel: 'Jobs tour',
    slides: [
      {
        id: 'filter',
        title: 'Find openings',
        body: 'Filter and sort the public job board by title, employer, or city. No account needed to browse.',
        tip: 'Employers need an active membership to post.',
        highlight: '[data-tour="jobs-filter"]',
      },
      {
        id: 'rows',
        title: 'Open a posting',
        body: 'Select a row for detail, apply links, and matching context when signed in as a candidate.',
        highlight: '[data-tour="jobs-table"]',
      },
    ],
  },
  {
    id: 'oww-pricing',
    label: 'Membership',
    dismissedKey: 'oww-tour-pricing-dismissed',
    stepKey: 'oww-tour-pricing-step',
    eventName: 'oww:tour:pricing',
    fabLabel: 'Membership tour',
    slides: [
      {
        id: 'plans',
        title: 'Choose a plan',
        body: 'Individuals and educators join free. Employer and Utility plans unlock postings, candidate search, and team seats.',
        tip: 'Staging uses sample checkout — no card is charged.',
        highlight: '[data-tour="pricing-plans"]',
      },
      {
        id: 'sample',
        title: 'Sample pricing',
        body: 'Yellow callout means placeholder rates for demonstration. NYSAWWA sets live prices in Stripe when going to production.',
        highlight: '[data-tour="pricing-sample"]',
      },
    ],
  },
  {
    id: 'oww-billing',
    label: 'Billing',
    dismissedKey: 'oww-tour-billing-dismissed',
    stepKey: 'oww-tour-billing-step',
    eventName: 'oww:tour:billing',
    fabLabel: 'Billing tour',
    slides: [
      {
        id: 'status',
        title: 'Your membership',
        body: 'See plan, status, renewal date, and provider. Cancel at period end keeps access until the current term closes.',
        highlight: '[data-tour="billing-current"]',
      },
      {
        id: 'history',
        title: 'Payment history',
        body: 'Sample and Stripe events appear here — invoices, activations, and checkouts.',
        highlight: '[data-tour="billing-history"]',
      },
    ],
  },
  {
    id: 'oww-employer',
    label: 'Hiring workspace',
    dismissedKey: 'oww-tour-employer-dismissed',
    stepKey: 'oww-tour-employer-step',
    eventName: 'oww:tour:employer',
    fabLabel: 'Hiring tour',
    slides: [
      {
        id: 'membership',
        title: 'Membership status',
        body: 'The hiring dashboard surfaces whether your Employer/Utility membership is active, expiring, or lapsed — and deep-links to renew.',
        highlight: '[data-tour="employer-membership"]',
      },
      {
        id: 'actions',
        title: 'Hiring tools',
        body: 'Jobs, candidates, interviews, and team management live under Hiring. Paid features show a paywall until membership is active.',
        highlight: '[data-tour="employer-actions"]',
      },
    ],
  },
  {
    id: 'oww-admin',
    label: 'Platform admin',
    dismissedKey: 'oww-tour-admin-dismissed',
    stepKey: 'oww-tour-admin-step',
    eventName: 'oww:tour:admin',
    fabLabel: 'Admin tour',
    slides: [
      {
        id: 'kpis',
        title: 'Membership health',
        body: 'Active, expiring, expired, and sample ARR tiles give a snapshot of the membership book.',
        highlight: '[data-tour="admin-kpis"]',
      },
      {
        id: 'expiring',
        title: 'Expiring soon',
        body: 'Jump to Memberships or send renewal notices from Communications for members nearing end of term.',
        highlight: '[data-tour="admin-expiring"]',
      },
      {
        id: 'view-as',
        title: 'View as role',
        body: 'Use View as role in the header to preview the app as a student, employer, utility admin, or other persona — read-only by default.',
        tip: 'Exit preview anytime from the amber banner.',
      },
    ],
  },
  {
    id: 'oww-cms',
    label: 'Pages & blog',
    dismissedKey: 'oww-tour-cms-dismissed',
    stepKey: 'oww-tour-cms-step',
    eventName: 'oww:tour:cms',
    fabLabel: 'Template tour',
    slides: [
      {
        id: 'tabs',
        title: 'Landing pages vs Blog',
        body: 'Landing pages are fixed public routes (home, pathways, stories). Blog is for running topics that stack on /ny/blog with date, author, and tags.',
        highlight: '[data-tour="cms-kind-tabs"]',
        tip: 'Switch to the Blog tab when you want an ongoing series instead of a one-off page.',
      },
      {
        id: 'new',
        title: 'Create from a template',
        body: 'New page opens a guide to each template. Pick the layout that matches where the content should live on the public site, then edit the live canvas.',
        highlight: '[data-tour="cms-new"]',
      },
      {
        id: 'home',
        title: 'Home landing',
        body: 'One per state — the front door at /ny. Hero, mission stats, pathway cards, media, and CTAs.',
        tip: 'Slug is usually “home”.',
      },
      {
        id: 'pathway',
        title: 'Pathway landing',
        body: 'Career, Hire, Educate, or Ambassador doorway pages. Use the matching slug so nav and home cards open the right page.',
        tip: 'Example: /ny/career',
      },
      {
        id: 'story',
        title: 'Story / feature',
        body: 'A one-off spotlight or campaign narrative — not a pathway and not a dated blog series.',
      },
      {
        id: 'simple',
        title: 'Simple page',
        body: 'Short static content such as About or FAQ when you do not need pathway grids or the blog index.',
      },
      {
        id: 'blog',
        title: 'Blog post',
        body: 'Ongoing topics and updates. Create these from the Blog tab so they appear on /ny/blog with publish date and tags.',
        tip: 'Use Blog when you will keep adding related posts over time.',
      },
    ],
  },
  {
    id: 'oww-users',
    label: 'Users & access',
    dismissedKey: 'oww-tour-users-dismissed',
    stepKey: 'oww-tour-users-step',
    eventName: 'oww:tour:users',
    fabLabel: 'Users tour',
    slides: [
      {
        id: 'add',
        title: 'Add local accounts',
        body: 'Create users with a temporary password stored in the local database. They sign in with email/username + password — not email OTP.',
        highlight: '[data-tour="users-add"]',
      },
      {
        id: 'roles',
        title: 'Roles & hierarchy',
        body: 'National and State tiers are locked. Utility admins fine-tune only their org. Same vocabulary as WW360 for future federation.',
        highlight: '[data-tour="users-tabs"]',
      },
    ],
  },
  {
    id: 'oww-login',
    label: 'Sign in',
    dismissedKey: 'oww-tour-login-dismissed',
    stepKey: 'oww-tour-login-step',
    eventName: 'oww:tour:login',
    fabLabel: 'Sign-in tour',
    slides: [
      {
        id: 'password',
        title: 'Account password (preferred)',
        body: 'Local accounts use username or email plus password from the OWW database. Admins and seeded demo users sign in here.',
        tip: 'OTP remains available for passwordless community access when email delivery is configured.',
        highlight: '[data-tour="login-password"]',
      },
      {
        id: 'otp',
        title: 'Email / text code (optional)',
        body: 'One-time codes create or unlock community profiles without a stored password. Useful for job seekers; less ideal for admins who need durable access.',
        highlight: '[data-tour="login-otp"]',
      },
    ],
  },
];

/** Match the best tour for the current pathname (most specific first). */
export function tourForPath(pathname: string): OwwTourConfig | null {
  const p = pathname.toLowerCase();
  if (p.startsWith('/login')) return owwTours.find(t => t.id === 'oww-login') ?? null;
  if (p.startsWith('/admin/users') || p.startsWith('/employer/team')) return owwTours.find(t => t.id === 'oww-users') ?? null;
  if (p.startsWith('/admin/cms')) return owwTours.find(t => t.id === 'oww-cms') ?? null;
  if (p === '/admin' || p.startsWith('/admin/memberships') || p.startsWith('/admin/communications')) {
    return owwTours.find(t => t.id === 'oww-admin') ?? null;
  }
  if (p.startsWith('/employer')) return owwTours.find(t => t.id === 'oww-employer') ?? null;
  if (p.startsWith('/billing')) return owwTours.find(t => t.id === 'oww-billing') ?? null;
  if (p.startsWith('/pricing')) return owwTours.find(t => t.id === 'oww-pricing') ?? null;
  if (/\/[^/]+\/jobs(\/|$)/.test(p)) return owwTours.find(t => t.id === 'oww-jobs') ?? null;
  if (/\/[^/]+\/(career|hire|educate|ambassador)(\/|$)/.test(p)) return owwTours.find(t => t.id === 'oww-pathway') ?? null;
  if (/^\/[a-z]{2}\/?$/.test(p) || p === '/') return owwTours.find(t => t.id === 'oww-home') ?? null;
  return null;
}
