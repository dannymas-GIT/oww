import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useParams } from 'react-router-dom';
import { LogOut, Menu, UserRound, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { navForRoles, publicPathways, sectionNavEntries, sectionToDropdown } from '@/config/nav';
import { Button } from '@/components/ui/button';
import { OwwLogo } from '@/components/oww/OwwLogo';
import { PathwaysMenu } from '@/components/oww/PathwaysMenu';
import { NavDropdown } from '@/components/oww/NavDropdown';
import { PersonaSwitcher, ImpersonationBanner } from '@/components/oww/PersonaSwitcher';
import { PageAwareTour } from '@/components/oww/PageAwareTour';
import { DEFAULT_STATE } from '@/lib/constants';
import { cn } from '@/lib/utils';

const linkClass = (active: boolean) =>
  cn(
    'inline-flex min-h-[44px] shrink-0 items-center whitespace-nowrap rounded-md px-2.5 text-base font-medium',
    active ? 'bg-[#e8f0ff] text-oww-navy' : 'text-oww-navy hover:bg-slate-100'
  );

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
          return (
            <NavLink key={entry.key} to={entry.item.path} className={({ isActive }) => linkClass(isActive)}>
              {entry.item.label}
            </NavLink>
          );
        }
        return (
          <NavDropdown
            key={entry.key}
            label={entry.label}
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

  const quietLinks = [
    { label: 'Home', to: `/${state}` },
    { label: 'Jobs', to: `/${state}/jobs` },
    { label: 'Blog', to: `/${state}/blog` },
    { label: 'Companies', to: `/${state}/companies` },
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
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 md:gap-3 md:px-6">
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-md text-oww-navy lg:hidden"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(o => !o)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <OwwLogo to={`/${state}`} size="nav" />
          </div>

          <nav
            className="hidden flex-1 items-center justify-center gap-0.5 lg:flex"
            aria-label="Primary"
          >
            {showRoleNav ? (
              <>
                <NavLink to={`/${state}`} end className={({ isActive }) => linkClass(isActive)}>
                  Explore
                </NavLink>
                <RoleNav />
              </>
            ) : isPublic ? (
              <>
                <NavLink to={`/${state}`} end className={({ isActive }) => linkClass(isActive)}>
                  Home
                </NavLink>
                <PathwaysMenu state={state} />
                <NavLink to={`/${state}/jobs`} className={({ isActive }) => linkClass(isActive)}>
                  Jobs
                </NavLink>
                <NavLink to={`/${state}/blog`} className={({ isActive }) => linkClass(isActive)}>
                  Blog
                </NavLink>
                <NavLink to={`/${state}/companies`} className={({ isActive }) => linkClass(isActive)}>
                  Companies
                </NavLink>
              </>
            ) : (
              <RoleNav />
            )}
          </nav>

          <div className="flex shrink-0 items-center gap-1">
            {isAuthenticated ? (
              <>
                <PersonaSwitcher />
                <Button
                  variant="ghost"
                  className="min-h-[44px] min-w-[44px] px-2 text-base text-oww-navy hover:bg-slate-100 xl:px-3"
                  asChild
                >
                  <Link to="/profile" aria-label="Profile">
                    <UserRound className="h-4 w-4 xl:mr-2" />
                    <span className="hidden xl:inline">Profile</span>
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="min-h-[44px] min-w-[44px] px-2 text-base text-oww-navy hover:bg-slate-100 xl:px-3"
                  onClick={logout}
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4 xl:mr-2" />
                  <span className="hidden xl:inline">Sign out</span>
                </Button>
              </>
            ) : (
              <Button className="min-h-[44px] bg-oww-cyan text-base text-white hover:bg-sky-700" asChild>
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
                  to={`/${state}`}
                  end
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-[44px] items-center rounded-md px-3 text-base font-medium',
                      isActive ? 'bg-[#e8f0ff] text-oww-navy' : 'text-oww-navy hover:bg-slate-50'
                    )
                  }
                >
                  Explore
                </NavLink>
                {groups.map(g =>
                  g.sections.map(section => (
                    <div key={section.id} className="space-y-1">
                      <p className="px-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                        {section.label}
                      </p>
                      {section.items.map(item => (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          onClick={() => setMobileOpen(false)}
                          className={({ isActive }) =>
                            cn(
                              'flex min-h-[44px] items-center gap-2 rounded-md px-3 text-base font-medium',
                              isActive ? 'bg-[#e8f0ff] text-oww-navy' : 'text-oww-navy hover:bg-slate-50'
                            )
                          }
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
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
                            'flex min-h-[44px] items-center rounded-md px-3 text-base font-medium',
                            isActive ? 'bg-[#e8f0ff] text-oww-navy' : 'text-oww-navy hover:bg-slate-50'
                          )
                        }
                      >
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
                      <p className="px-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                        {section.label}
                      </p>
                      {section.items.map(item => (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          onClick={() => setMobileOpen(false)}
                          className={({ isActive }) =>
                            cn(
                              'flex min-h-[44px] items-center gap-2 rounded-md px-3 text-base font-medium',
                              isActive ? 'bg-[#e8f0ff] text-oww-navy' : 'text-oww-navy hover:bg-slate-50'
                            )
                          }
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          {item.label}
                        </NavLink>
                      ))}
                    </div>
                  ))
                )}
              </div>
            )}
            {isAuthenticated ? (
              <div className="mt-2 px-1">
                <PersonaSwitcher variant="mobile" />
              </div>
            ) : null}
            {user ? <p className="mt-3 px-3 text-sm text-slate-500">{user.full_name || user.username}</p> : null}
          </nav>
        ) : null}
      </header>

      <main id="main-content" className="oww-rise mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <Outlet />
      </main>
      <PageAwareTour />

      <footer className="border-t border-slate-200 bg-white">
        <div className="h-1 bg-gradient-to-r from-oww-navy via-oww-cyan to-oww-navy" aria-hidden />
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between md:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <OwwLogo to={`/${state}`} size="footer" />
            <p className="text-sm text-slate-600">
              © {new Date().getFullYear()} One Water Workforce · NYSAWWA
              <span className="mt-1 block text-oww-cyan">From GED to PhD: A Job for Everyone</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-base text-oww-navy">
            <Link className="inline-flex min-h-[44px] items-center" to={`/${state}/blog`}>
              Blog
            </Link>
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
          </div>
        </div>
      </footer>
    </div>
  );
}
