import {
  Briefcase,
  Building2,
  Calendar,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Map,
  Megaphone,
  MessageSquare,
  Search,
  Shield,
  Sparkles,
  Users,
  BarChart3,
  MapPin,
  Award,
  Star,
  CreditCard,
  Mail,
  UsersRound,
  LogIn,
  ClipboardList,
  Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { DropdownSection } from '@/components/oww/NavDropdown';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  roles?: string[];
  description?: string;
}

export interface NavSection {
  id: string;
  label: string;
  /** Top-level chrome icon (AquaSafe pattern: icon + label per area). */
  icon?: LucideIcon;
  items: NavItem[];
}

export interface NavGroup {
  id: string;
  label: string;
  /** When set, desktop nav uses a grouped dropdown instead of a flat strip */
  sections: NavSection[];
}

/** Roles that use the hiring workspace (mirrors backend HIRING_ROLES). */
export const HIRING_ROLES = ['employer', 'employer_admin', 'employer_member', 'utility_admin', 'utility_manager'];
/** Roles that may manage their organization's team on OWW (employers only — utilities invite staff in WW360). */
export const ORG_ADMIN_ROLES = ['employer', 'employer_admin'];
/** Utility-facing hiring roles (no OWW Users & access / Team surface). */
export const UTILITY_HIRING_ROLES = ['utility_admin', 'utility_manager'];

/** Platform staff with full control. */
export const PLATFORM_ADMIN_ROLES = ['platform_admin'];
/** Ops: memberships, registrations, communications, analytics, logins. */
export const PLATFORM_OPS_ROLES = ['platform_admin', 'platform_ops', 'platform_manager', 'state_admin'];
/** Content: CMS, programs, featured, certs, locations. */
export const PLATFORM_EDITOR_ROLES = ['platform_admin', 'platform_editor', 'state_admin'];
/** People directories (candidates, hirers, ambassadors, educators). */
export const PLATFORM_PEOPLE_ROLES = ['platform_admin', 'platform_manager', 'state_admin'];
/** Users & access (platform staff accounts). */
export const PLATFORM_USERS_ROLES = ['platform_admin', 'state_admin'];

export const publicPathways = [
  {
    slug: 'career',
    label: 'I Want a Career',
    description: 'Explore water careers and build your profile.',
    group: 'people' as const,
  },
  {
    slug: 'hire',
    label: 'I Want to Hire',
    description: 'Post opportunities and match with candidates.',
    group: 'orgs' as const,
  },
  {
    slug: 'educate',
    label: 'I Want to Educate',
    description: 'Share courses, events, and pathways.',
    group: 'orgs' as const,
  },
  {
    slug: 'ambassador',
    label: 'I Want to Be an Ambassador',
    description: 'Champion the one-water workforce.',
    group: 'people' as const,
  },
] as const;

export const pathwaySections: { id: string; label: string; slugs: readonly string[] }[] = [
  { id: 'people', label: 'For people', slugs: ['career', 'ambassador'] },
  { id: 'orgs', label: 'For organizations', slugs: ['hire', 'educate'] },
];

export const roleNavGroups: NavGroup[] = [
  {
    id: 'candidate',
    label: 'Candidate',
    sections: [
      {
        id: 'candidate-overview',
        label: 'Overview',
        icon: LayoutDashboard,
        items: [
          {
            label: 'Dashboard',
            path: '/candidate',
            icon: LayoutDashboard,
            roles: ['individual', 'student'],
            description: 'Overview and next steps',
          },
        ],
      },
      {
        id: 'candidate-profile',
        label: 'Profile',
        icon: Users,
        items: [
          {
            label: 'My profile',
            path: '/candidate/profile',
            icon: Users,
            roles: ['individual', 'student'],
            description: 'Skills, goals, and preferences',
          },
        ],
      },
      {
        id: 'candidate-matches',
        label: 'Matches',
        icon: Sparkles,
        items: [
          {
            label: 'Matches',
            path: '/candidate/matches',
            icon: Sparkles,
            roles: ['individual', 'student'],
            description: 'Roles that fit your profile',
          },
        ],
      },
    ],
  },
  {
    id: 'employer',
    label: 'Hiring',
    sections: [
      {
        id: 'hiring-workspace',
        label: 'Workspace',
        icon: LayoutDashboard,
        items: [
          {
            label: 'Dashboard',
            path: '/employer',
            icon: LayoutDashboard,
            roles: HIRING_ROLES,
            description: 'Membership and hiring snapshot',
          },
          {
            label: 'Organization',
            path: '/employer/org',
            icon: Building2,
            roles: ['employer', 'employer_admin', 'employer_member'],
            description: 'Org profile and settings',
          },
          {
            label: 'Utility profile',
            path: '/employer/org',
            icon: Building2,
            roles: UTILITY_HIRING_ROLES,
            description: 'Utility details and your OWW roles',
          },
        ],
      },
      {
        id: 'hiring-talent',
        label: 'Hiring',
        icon: Briefcase,
        items: [
          {
            label: 'Jobs',
            path: '/employer/jobs',
            icon: Briefcase,
            roles: HIRING_ROLES,
            description: 'Post and manage openings',
          },
          {
            label: 'Candidates',
            path: '/employer/candidates',
            icon: Search,
            roles: HIRING_ROLES,
            description: 'Search the talent pool',
          },
          {
            label: 'Applications',
            path: '/employer/applications',
            icon: FileText,
            roles: HIRING_ROLES,
            description: 'Review applicants',
          },
        ],
      },
      {
        id: 'hiring-collaborate',
        label: 'Collaborate',
        icon: MessageSquare,
        items: [
          { label: 'Messages', path: '/employer/messages', icon: MessageSquare, roles: HIRING_ROLES },
          { label: 'Interviews', path: '/employer/interviews', icon: Calendar, roles: HIRING_ROLES },
          {
            label: 'Team',
            path: '/employer/team',
            icon: UsersRound,
            roles: ORG_ADMIN_ROLES,
            description: 'Invite and manage employer team members',
          },
        ],
      },
      {
        id: 'hiring-billing',
        label: 'Billing',
        icon: CreditCard,
        items: [
          {
            label: 'Billing',
            path: '/billing',
            icon: CreditCard,
            roles: HIRING_ROLES,
            description: 'Membership and invoices',
          },
        ],
      },
    ],
  },
  {
    id: 'educator',
    label: 'Educator',
    sections: [
      {
        id: 'educator-overview',
        label: 'Overview',
        icon: GraduationCap,
        items: [
          {
            label: 'Dashboard',
            path: '/educator',
            icon: GraduationCap,
            roles: ['educator'],
            description: 'Courses, events, and program submissions',
          },
        ],
      },
    ],
  },
  {
    id: 'ambassador',
    label: 'Ambassador',
    sections: [
      {
        id: 'ambassador-overview',
        label: 'Overview',
        icon: Megaphone,
        items: [
          {
            label: 'Dashboard',
            path: '/ambassador',
            icon: Megaphone,
            roles: ['ambassador'],
            description: 'Outreach desk, toolkits, and talking points',
          },
        ],
      },
    ],
  },
  {
    id: 'admin',
    label: 'Administration',
    sections: [
      {
        id: 'admin-ops',
        label: 'Operations',
        icon: LayoutDashboard,
        items: [
          {
            label: 'Dashboard',
            path: '/admin',
            icon: LayoutDashboard,
            roles: PLATFORM_OPS_ROLES,
            description: 'Memberships, ARR, outreach',
          },
          {
            label: 'Memberships',
            path: '/admin/memberships',
            icon: CreditCard,
            roles: PLATFORM_OPS_ROLES,
            description: 'Active, expiring, expired',
          },
          {
            label: 'Communications',
            path: '/admin/communications',
            icon: Mail,
            roles: PLATFORM_OPS_ROLES,
            description: 'Email and SMS by audience',
          },
          {
            label: 'Login activity',
            path: '/admin/logins',
            icon: LogIn,
            roles: PLATFORM_OPS_ROLES,
            description: 'Sign-in stats and audit trail',
          },
          {
            label: 'Analytics',
            path: '/admin/analytics',
            icon: BarChart3,
            roles: PLATFORM_OPS_ROLES,
            description: 'Pipeline and engagement',
          },
          {
            label: 'Platform settings',
            path: '/admin/settings',
            icon: Settings,
            roles: PLATFORM_ADMIN_ROLES,
            description: 'Registration review and notifications',
          },
        ],
      },
      {
        id: 'admin-people',
        label: 'People',
        icon: Users,
        items: [
          {
            label: 'Users & access',
            path: '/admin/users',
            icon: Users,
            roles: PLATFORM_USERS_ROLES,
            description: 'Platform staff accounts and roles',
          },
          {
            label: 'Utility registrations',
            path: '/admin/registrations',
            icon: ClipboardList,
            roles: PLATFORM_OPS_ROLES,
            description: 'Review, verify, or suspend self-signups',
          },
          {
            label: 'Candidates',
            path: '/admin/people/candidates',
            icon: Search,
            roles: PLATFORM_PEOPLE_ROLES,
            description: 'Job seekers and students',
          },
          {
            label: 'Hirers',
            path: '/admin/people/hirers',
            icon: Briefcase,
            roles: PLATFORM_PEOPLE_ROLES,
            description: 'Employers and utilities',
          },
          {
            label: 'Ambassadors',
            path: '/admin/people/ambassadors',
            icon: Star,
            roles: PLATFORM_PEOPLE_ROLES,
            description: 'Career champions',
          },
          {
            label: 'Educators',
            path: '/admin/people/educators',
            icon: GraduationCap,
            roles: PLATFORM_PEOPLE_ROLES,
            description: 'Trainers and program partners',
          },
        ],
      },
      {
        id: 'admin-content',
        label: 'Content',
        icon: FileText,
        items: [
          {
            label: 'Pages & blog',
            path: '/admin/cms',
            icon: FileText,
            roles: PLATFORM_EDITOR_ROLES,
            description: 'Landing templates, blog posts, media, and publish',
          },
          { label: 'Programs', path: '/admin/programs', icon: GraduationCap, roles: PLATFORM_EDITOR_ROLES },
          { label: 'Featured posts', path: '/admin/featured', icon: Star, roles: PLATFORM_EDITOR_ROLES },
        ],
      },
      {
        id: 'admin-catalog',
        label: 'Catalog',
        icon: Award,
        items: [
          {
            label: 'Certifications',
            path: '/admin/certifications',
            icon: Award,
            roles: PLATFORM_EDITOR_ROLES,
          },
          { label: 'Locations', path: '/admin/locations', icon: MapPin, roles: PLATFORM_EDITOR_ROLES },
          { label: 'Jurisdictions', path: '/admin/jurisdictions', icon: Map, roles: PLATFORM_ADMIN_ROLES },
          { label: 'National map', path: '/admin/map', icon: Shield, roles: PLATFORM_ADMIN_ROLES },
        ],
      },
    ],
  },
];

function filterSections(sections: NavSection[], roles: Set<string>): NavSection[] {
  return sections
    .map(s => ({
      ...s,
      items: s.items.filter(i => !i.roles || i.roles.some(r => roles.has(r))),
    }))
    .filter(s => s.items.length > 0);
}

export function navForRoles(roles: string[]): NavGroup[] {
  const set = new Set(roles);
  return roleNavGroups
    .map(g => ({
      ...g,
      sections: filterSections(g.sections, set),
    }))
    .filter(g => g.sections.length > 0);
}

/** Flat item list for mobile / search. */
export function flatNavItems(group: NavGroup): NavItem[] {
  return group.sections.flatMap(s => s.items);
}

export function toDropdownSections(group: NavGroup): DropdownSection[] {
  return group.sections.map(sectionToDropdown);
}

export function sectionToDropdown(section: NavSection): DropdownSection {
  return {
    id: section.id,
    label: section.label,
    items: section.items.map(i => ({
      label: i.label,
      path: i.path,
      icon: i.icon,
      description: i.description,
    })),
  };
}

/** One top-level nav control per section (same pattern for every role). */
export function sectionNavEntries(groups: NavGroup[]): Array<
  | { kind: 'link'; key: string; item: NavItem & { label: string } }
  | { kind: 'dropdown'; key: string; label: string; section: NavSection }
> {
  const out: Array<
    | { kind: 'link'; key: string; item: NavItem & { label: string } }
    | { kind: 'dropdown'; key: string; label: string; section: NavSection }
  > = [];
  for (const g of groups) {
    for (const section of g.sections) {
      if (section.items.length === 1) {
        // Top-level label = section name (Overview, People, Billing…); destination = sole item
        const item = section.items[0];
        out.push({
          kind: 'link',
          key: section.id,
          item: { ...item, label: section.label },
        });
      } else {
        out.push({ kind: 'dropdown', key: section.id, label: section.label, section });
      }
    }
  }
  return out;
}
