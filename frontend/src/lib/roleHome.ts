import { DEFAULT_STATE } from '@/lib/constants';

/** Post-login / chrome home for the signed-in role (not the public marketing home). */
export function homeForRoles(roles: string[] | undefined): string {
  const r = roles || [];
  if (r.some(x => ['platform_admin', 'platform_manager', 'platform_ops', 'platform_editor', 'state_admin'].includes(x))) {
    return '/admin';
  }
  if (r.some(x => ['employer', 'employer_admin', 'employer_member', 'utility_admin', 'utility_manager'].includes(x))) {
    return '/employer';
  }
  if (r.includes('educator')) return '/educator';
  if (r.includes('ambassador')) return `/${DEFAULT_STATE}/ambassador`;
  if (r.includes('individual') || r.includes('student')) return '/candidate';
  return `/${DEFAULT_STATE}`;
}

export function isHiringRole(roles: string[] | undefined): boolean {
  return (roles || []).some(r =>
    ['employer', 'employer_admin', 'employer_member', 'utility_admin', 'utility_manager'].includes(r)
  );
}

export function isPlatformStaff(roles: string[] | undefined): boolean {
  return (roles || []).some(r =>
    ['platform_admin', 'platform_manager', 'platform_ops', 'platform_editor', 'state_admin'].includes(r)
  );
}
