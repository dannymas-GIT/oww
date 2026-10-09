import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useParams } from 'react-router-dom';
import {
  Briefcase,
  Building2,
  FileText,
  Home,
  LogOut,
  Menu,
  UserRound,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { navForRoles, publicPathways, sectionNavEntries, sectionToDropdown } from '@/config/nav';
import { Button } from '@/components/ui/button';
import { OwwLogo } from '@/components/oww/OwwLogo';
import { PathwaysMenu } from '@/components/oww/PathwaysMenu';
import { NavDropdown } from '@/components/oww/NavDropdown';
import { PersonaSwitcher, ImpersonationBanner } from '@/components/oww/PersonaSwitcher';
import { PageAwareTour } from '@/components/oww/PageAwareTour';
import { Ww360LaunchButton } from '@/components/oww/Ww360LaunchButton';
import { DEFAULT_STATE } from '@/lib/constants';
import { homeForRoles } from '@/lib/roleHome';
import { cn } from '@/lib/utils';

/** AquaSafe-style top chrome: larger type + icon + label (min 48px touch). */
const linkClass = (active: boolean) =>
  cn(
    'inline-flex min-h-[48px] shrink-0 items-center gap-2 whitespace-nowrap rounded-md px-3 text-lg font-semibold',
    active ? 'bg-[#e8f0ff] text-oww-navy' : 'text-oww-navy hover:bg-slate-100'
  );

function NavIconLink({
  to,
  label,
  icon: Icon,
  end,
}: {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => linkClass(isActive)}>
      <Icon className="h-5 w-5 shrink-0 text-oww-cyan" aria-hidden />
      {label}
    </NavLink>
  );
}

/**
 * Same pattern for every role: short top-level labels; dropdowns when a section
 * has multiple destinations; direct link when there is only one.
 */
function RoleNav() {
  const entries = sectionNavEntries(navForRoles(useAuth().userRoles));
  return (
    <>
      {entries.map(entry => {
        if (entry.kind === 'link') {
          const Icon = entry.item.icon;
          return (
            <NavLink key={entry.key} to={entry.item.path} className={({ isActive }) => linkClass(isActive)}>
              {Icon ? <Icon className="h-5 w-5 shrink-0 text-oww-cyan" aria-hidden /> : null}
              {entry.item.label}
            </NavLink>
          );
        }
        return (
          <NavDropdown
            key={entry.key}
            label={entry.label}
            icon={entry.section.icon}
            sections={[sectionToDropdown(entry.section)]}
            showSectionLabels={false}
            activeMatch={pathname =>
              entry.section.items.some(i => pathname === i.path || pathname.startsWith(`${i.path}/`))
            }
          />
        );
      })}
    </>
  );
}

export function AppShell() {
  const { user, logout, userRoles, isAuthenticated } = useAuth();
  const params = useParams();
  const state = (params.state || DEFAULT_STATE).toLowerCase();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const groups = navForRoles(userRoles);
  const roleHome = homeForRoles(userRoles);
  // When signed-in users have role workspaces (Hiring, Administration, …), prefer
  // that nav on every page — including public /ny/* — so Hiring is discoverable.
  const showRoleNav = isAuthenticated && groups.length > 0;
  const isPublic = !showRoleNav
    && !location.pathname.startsWith('/candidate')
    && !location.pathname.startsWith('/employer')
    && !location.pathname.startsWith('/educator')
    && !location.pathname.startsWith('/admin')
    && !location.pathname.startsWith('/profile')
    && !location.pathname.startsWith('/billing')
    && !location.pathname.startsWith('/login')
    && !location.pathname.startsWith('/register');

  const quietLinks: Array<{ label: string; to: string; icon: LucideIcon }> = [
    { label: 'Home', to: `/${state}`, icon: Home },
    { label: 'Jobs', to: `/${state}/jobs`, icon: Briefcase },
    { label: 'Blog', to: `/${state}/blog`, icon: FileText },
    { label: 'Companies', to: `/${state}/companies`, icon: Building2 },
  ];

  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-oww-navy"
      >
        Skip to content
      </a>
      <ImpersonationBanner />
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 text-oww-navy backdrop-blur-md">
        <div className="h-1 bg-gradient-to-r from-oww-navy via-oww-cyan to-oww-navy" aria-hidden />
        <div className="flex min-h-[8.5rem] w-full items-center gap-2 px-4 py-3 sm:px-5 md:gap-3 md:px-6 lg:min-h-[10.5rem] lg:px-8 xl:px-10">
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              className="inline-flex min-h-[48px] min-w-[48px] shrink-0 items-center justify-center rounded-md text-oww-navy lg:hidden"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(o => !o)}
            >
              {mobileOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
            </button>
            <OwwLogo to={isAuthenticated ? roleHome : `/${state}`} size="nav" />
          </div>

          <nav
            className="hidden flex-1 items-center justify-center gap-1 lg:flex xl:gap-1.5"
            aria-label="Primary"
          >
            {showRoleNav ? (
              <>
                <NavIconLink to={roleHome} end label="Home" icon={Home} />
                <RoleNav />
              </>
            ) : isPublic ? (
              <>
                <NavIconLink to={`/${state}`} end label="Home" icon={Home} />
                <PathwaysMenu state={state} />
                <NavIconLink to={`/${state}/jobs`} label="Jobs" icon={Briefcase} />
                <NavIconLink to={`/${state}/blog`} label="Blog" icon={FileText} />
                <NavIconLink to={`/${state}/companies`} label="Companies" icon={Building2} />
              </>
            ) : (
              <RoleNav />
            )}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5">
            {isAuthenticated ? (
              <>
                <Ww360LaunchButton variant="header" />
                <PersonaSwitcher />
                <Button
                  variant="ghost"
                  className="min-h-[48px] max-w-[14rem] gap-2 px-3 text-lg font-semibold text-oww-navy hover:bg-slate-100 sm:max-w-[18rem]"
                  asChild
                >
                  <Link
                    to="/profile"
                    aria-label={
                      user?.full_name || user?.username
                        ? `Profile for ${user.full_name || user.username}`
                        : 'Profile'
                    }
                  >
                    <UserRound className="h-5 w-5 shrink-0 text-oww-cyan" />
                    <span className="hidden truncate sm:inline">
                      {user?.full_name?.trim() || user?.username || 'Profile'}
                    </span>
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="min-h-[48px] min-w-[48px] gap-2 px-3 text-lg font-semibold text-oww-navy hover:bg-slate-100"
                  onClick={logout}
                  aria-label="Sign out"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="hidden xl:inline">Sign out</span>
                </Button>
              </>
            ) : (
              <Button className="min-h-[48px] bg-oww-cyan px-4 text-lg font-semibold text-white hover:bg-sky-700" asChild>
                <Link to="/login">Sign in</Link>
              </Button>
            )}
          </div>
        </div>

        {mobileOpen ? (
          <nav className="oww-flyout border-t border-slate-200 bg-white px-4 py-3 lg:hidden" aria-label="Mobile">
            {showRoleNav ? (
              <div className="space-y-4">
                <NavLink
                  to={roleHome}
                  end
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-[48px] items-center gap-2 rounded-md px-3 text-lg font-semibold',
                      isActive ? 'bg-[#e8f0ff] text-oww-navy' : 'text-oww-navy hover:bg-slate-50'
                    )
                  }
                >
                  <Home className="h-5 w-5 shrink-0 text-oww-cyan" aria-hidden />
                  Home
                </NavLink>
                {groups.map(g =>
                  g.sections.map(section => (
                    <div key={section.id} className="space-y-1">
                      <p className="flex items-center gap-2 px-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                        {section.icon ? <section.icon className="h-4 w-4 text-oww-cyan" aria-hidden /> : null}
                        {section.label}
                      </p>
                      {section.items.map(item => (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          onClick={() => setMobileOpen(false)}
                          className={({ isActive }) =>
                            cn(
                              'flex min-h-[48px] items-center gap-3 rounded-md px-3 text-lg font-medium',
                              isActive ? 'bg-[#e8f0ff] text-oww-navy' : 'text-oww-navy hover:bg-slate-50'
                            )
                          }
                        >
                          <item.icon className="h-5 w-5 shrink-0 text-oww-cyan" />
                          {item.label}
                        </NavLink>
                      ))}
                    </div>
                  ))
                )}
              </div>
            ) : isPublic ? (
              <>
                <ul className="space-y-1">
                  {quietLinks.map(l => (
                    <li key={l.to}>
                      <NavLink
                        to={l.to}
                        end={l.to === `/${state}`}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            'flex min-h-[48px] items-center gap-3 rounded-md px-3 text-lg font-semibold',
                            isActive ? 'bg-[#e8f0ff] text-oww-navy' : 'text-oww-navy hover:bg-slate-50'
                          )
                        }
                      >
                        <l.icon className="h-5 w-5 shrink-0 text-oww-cyan" aria-hidden />
                        {l.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
                <PathwaysMenu state={state} variant="mobile" onNavigate={() => setMobileOpen(false)} />
              </>
            ) : (
              <div className="space-y-4">
                {groups.map(g =>
                  g.sections.map(section => (
                    <div key={section.id} className="space-y-1">
                      <p className="flex items-center gap-2 px-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                        {section.icon ? <section.icon className="h-4 w-4 text-oww-cyan" aria-hidden /> : null}
                        {section.label}
                      </p>
                      {section.items.map(item => (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          onClick={() => setMobileOpen(false)}
                          className={({ isActive }) =>
                            cn(
                              'flex min-h-[48px] items-center gap-3 rounded-md px-3 text-lg font-medium',
                              isActive ? 'bg-[#e8f0ff] text-oww-navy' : 'text-oww-navy hover:bg-slate-50'
                            )
                          }
                        >
                          <item.icon className="h-5 w-5 shrink-0 text-oww-cyan" />
                          {item.label}
                        </NavLink>
                      ))}
                    </div>
                  ))
                )}
              </div>
            )}
            {isAuthenticated ? (
              <div className="mt-2 space-y-2 px-1">
                <Ww360LaunchButton
                  variant="mobile"
                  onLaunched={() => setMobileOpen(false)}
                />
                <PersonaSwitcher variant="mobile" />
              </div>
            ) : null}
            {user ? (
              <div className="mt-3 space-y-1 px-3">
                <p className="text-sm text-slate-500">Signed in as</p>
                <p className="text-lg font-semibold text-oww-navy">{user.full_name?.trim() || user.username}</p>
                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex min-h-[48px] items-center text-lg font-medium text-oww-cyan"
                >
                  Profile
                </Link>
              </div>
            ) : null}
          </nav>
        ) : null}
      </header>

      <main id="main-content" className="oww-rise w-full px-4 py-6 sm:px-5 md:px-6 md:py-8 lg:px-8 xl:px-10">
        <Outlet />
      </main>
      <PageAwareTour />

      <footer className="border-t border-slate-200 bg-white">
        <div className="h-1 bg-gradient-to-r from-oww-navy via-oww-cyan to-oww-navy" aria-hidden />
        <div className="flex w-full flex-col gap-4 px-4 py-6 sm:px-5 md:flex-row md:items-center md:justify-between md:px-6 lg:px-8 xl:px-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <OwwLogo to={isAuthenticated ? roleHome : `/${state}`} size="footer" />
            <p className="text-sm text-slate-600">
              © {new Date().getFullYear()} One Water Workforce · NYSAWWA
              <span className="mt-1 block text-oww-cyan">From GED to PhD: A Job for Everyone</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-base text-oww-navy">
            <Link className="inline-flex min-h-[44px] items-center" to={`/${state}/blog`}>
              Blog
            </Link>
            <Link className="inline-flex min-h-[44px] items-center" to={`/${state}/workforce-stats`}>
              Workforce stats
            </Link>
            {!isAuthenticated ? (
              <>
                <Link className="inline-flex min-h-[44px] items-center" to={`/${state}/interest`}>
                  Express interest
                </Link>
                <Link className="inline-flex min-h-[44px] items-center" to={`/${state}/programs/submit`}>
                  Submit a program
                </Link>
                <Link className="inline-flex min-h-[44px] items-center" to="/pricing">
                  Membership
                </Link>
                {publicPathways.slice(0, 2).map(p => (
                  <Link key={p.slug} className="inline-flex min-h-[44px] items-center lg:hidden" to={`/${state}/${p.slug}`}>
                    {p.label}
                  </Link>
                ))}
              </>
            ) : (
              <Link className="inline-flex min-h-[44px] items-center" to={roleHome}>
                Workspace
              </Link>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
