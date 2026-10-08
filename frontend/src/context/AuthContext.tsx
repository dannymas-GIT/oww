import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  changePassword as apiChangePassword,
  fetchMe,
  getStoredToken,
  loginPassword,
  logout as apiLogout,
  registerUtilityAdmin as apiRegisterUtilityAdmin,
  requestOtp,
  verifyOtp,
} from '@/services/authService';
import { isTokenExpired, setStoredToken } from '@/lib/api';
import type { OwwUser } from '@/types';
import { DEFAULT_STATE } from '@/lib/constants';

interface AuthContextValue {
  user: OwwUser | null;
  userRoles: string[];
  loading: boolean;
  isAuthenticated: boolean;
  isPlatformAdmin: boolean;
  isStateAdmin: boolean;
  isEmployer: boolean;
  isUtilityAdmin: boolean;
  isUtilityManager: boolean;
  /** Any role that uses the hiring workspace (employer, utility admin/manager, team member). */
  isHiring: boolean;
  /** Can open Users & access (platform/state admins, utility admins, employer org admins). */
  canManageUsers: boolean;
  isIndividual: boolean;
  isEducator: boolean;
  activeStateCode: string;
  login: (
    username: string,
    password: string
  ) => Promise<{ access_token: string; user: OwwUser }>;
  registerUtilityAdmin: (payload: {
    utility_name: string;
    full_name: string;
    email: string;
    password: string;
    state_code?: string;
    phone?: string;
    website?: string;
    job_title?: string;
  }) => Promise<import('@/types').RegisterUtilityResult>;
  requestOtpCode: (payload: {
    email?: string;
    phone?: string;
  }) => Promise<{
    ok: boolean;
    message?: string;
    dev_code?: string;
    delivery?: string;
    channel?: string;
  }>;
  verifyOtpCode: (payload: {
    email?: string;
    phone?: string;
    code: string;
  }) => Promise<{ access_token: string; user: OwwUser }>;
  changePassword: (body: {
    current_password: string;
    new_password: string;
    confirm_password: string;
  }) => Promise<{ ok: boolean; message: string }>;
  logout: () => void;
  hasAnyRole: (...roles: string[]) => boolean;
  refreshUser: () => Promise<void>;
  applySessionUser: (next: OwwUser) => void;
  isImpersonating: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<OwwUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token || isTokenExpired(token)) {
      setStoredToken(null);
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      setUser(await fetchMe());
    } catch {
      apiLogout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (username: string, password: string) => {
    const data = await loginPassword(username, password);
    setUser(data.user);
    return data;
  }, []);

  const registerUtilityAdmin = useCallback(
    async (payload: {
      utility_name: string;
      full_name: string;
      email: string;
      password: string;
      state_code?: string;
      phone?: string;
      website?: string;
      job_title?: string;
    }) => {
      const data = await apiRegisterUtilityAdmin(payload);
      setUser(data.user);
      return data;
    },
    []
  );

  const requestOtpCode = useCallback(async (payload: { email?: string; phone?: string }) => {
    return requestOtp(payload);
  }, []);

  const verifyOtpCode = useCallback(async (payload: { email?: string; phone?: string; code: string }) => {
    const data = await verifyOtp(payload);
    setUser(data.user);
    return data;
  }, []);

  const changePassword = useCallback(
    async (body: { current_password: string; new_password: string; confirm_password: string }) => {
      return apiChangePassword(body);
    },
    []
  );

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
  }, []);

  const applySessionUser = useCallback((next: OwwUser) => {
    setUser(next);
  }, []);

  const hasAnyRole = useCallback(
    (...roles: string[]) => {
      const mine = Array.isArray(user?.roles) ? user!.roles : [];
      return roles.some(r => mine.includes(r));
    },
    [user]
  );

  const userRoles = user?.roles ?? [];
  const isPlatformAdmin = hasAnyRole('platform_admin');
  const isStateAdmin = hasAnyRole('state_admin');

  const value = useMemo(
    () => ({
      user,
      userRoles,
      loading,
      isAuthenticated: !!user,
      isPlatformAdmin,
      isStateAdmin,
      isEmployer: hasAnyRole('employer', 'employer_admin'),
      isUtilityAdmin: hasAnyRole('utility_admin'),
      isUtilityManager: hasAnyRole('utility_manager'),
      isHiring: hasAnyRole('employer', 'employer_admin', 'employer_member', 'utility_admin', 'utility_manager'),
      // Platform/state admins manage OWW users; employers manage employer team on OWW.
      // Utility admins invite staff in WW360 — not via OWW Users & access.
      canManageUsers: isPlatformAdmin || isStateAdmin || hasAnyRole('employer', 'employer_admin'),
      isIndividual: hasAnyRole('individual', 'student'),
      isEducator: hasAnyRole('educator'),
      activeStateCode: (user?.jurisdiction_code || DEFAULT_STATE).toLowerCase(),
      login,
      registerUtilityAdmin,
      requestOtpCode,
      verifyOtpCode,
      changePassword,
      logout,
      hasAnyRole,
      refreshUser,
      applySessionUser,
      isImpersonating: Boolean(user?.impersonation?.active),
    }),
    [
      user,
      userRoles,
      loading,
      isPlatformAdmin,
      isStateAdmin,
      login,
      registerUtilityAdmin,
      requestOtpCode,
      verifyOtpCode,
      changePassword,
      logout,
      hasAnyRole,
      refreshUser,
      applySessionUser,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
