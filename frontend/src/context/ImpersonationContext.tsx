import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchPersonas,
  startImpersonation,
  stopImpersonation,
  type DemoPersona,
} from '@/services/impersonationService';
import { useAuth } from '@/context/AuthContext';
import { homeForRoles } from '@/lib/roleHome';
import type { OwwUser } from '@/types';

interface ImpersonationContextValue {
  isImpersonating: boolean;
  isPreviewMode: boolean;
  personas: DemoPersona[];
  personasLoading: boolean;
  loadPersonas: () => Promise<void>;
  startPreview: (personaKey: string) => Promise<void>;
  startActAs: (personaKey: string, reason: string) => Promise<void>;
  stop: () => Promise<void>;
  canUsePersonaSwitcher: boolean;
  canActAs: boolean;
}

const ImpersonationContext = createContext<ImpersonationContextValue | undefined>(undefined);

export const ImpersonationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, applySessionUser, isPlatformAdmin, isStateAdmin } = useAuth();
  const navigate = useNavigate();
  const [personas, setPersonas] = useState<DemoPersona[]>([]);
  const [personasLoading, setPersonasLoading] = useState(false);

  const isImpersonating = Boolean(user?.impersonation?.active);
  const isPreviewMode = Boolean(isImpersonating && user?.impersonation?.mode === 'preview');
  const canUsePersonaSwitcher = !isImpersonating && (isPlatformAdmin || isStateAdmin);
  const canActAs = isPlatformAdmin && !isImpersonating;

  const loadPersonas = useCallback(async () => {
    if (!canUsePersonaSwitcher && !canActAs) return;
    setPersonasLoading(true);
    try {
      setPersonas(await fetchPersonas());
    } catch {
      setPersonas([]);
    } finally {
      setPersonasLoading(false);
    }
  }, [canUsePersonaSwitcher, canActAs]);

  const finishSession = useCallback(
    (next: OwwUser) => {
      applySessionUser(next);
      void navigate(homeForRoles(next.roles || []));
    },
    [applySessionUser, navigate]
  );

  const startPreview = useCallback(
    async (personaKey: string) => {
      const data = await startImpersonation({ persona_key: personaKey, mode: 'preview' });
      finishSession(data.user);
    },
    [finishSession]
  );

  const startActAs = useCallback(
    async (personaKey: string, reason: string) => {
      const data = await startImpersonation({ persona_key: personaKey, mode: 'act', reason });
      finishSession(data.user);
    },
    [finishSession]
  );

  const stop = useCallback(async () => {
    const data = await stopImpersonation();
    finishSession(data.user);
  }, [finishSession]);

  const value = useMemo(
    () => ({
      isImpersonating,
      isPreviewMode,
      personas,
      personasLoading,
      loadPersonas,
      startPreview,
      startActAs,
      stop,
      canUsePersonaSwitcher,
      canActAs,
    }),
    [
      isImpersonating,
      isPreviewMode,
      personas,
      personasLoading,
      loadPersonas,
      startPreview,
      startActAs,
      stop,
      canUsePersonaSwitcher,
      canActAs,
    ]
  );

  return <ImpersonationContext.Provider value={value}>{children}</ImpersonationContext.Provider>;
};

export function useImpersonation(): ImpersonationContextValue {
  const ctx = useContext(ImpersonationContext);
  if (!ctx) throw new Error('useImpersonation must be used within ImpersonationProvider');
  return ctx;
}

export function useReadOnly(): boolean {
  const { isPreviewMode } = useImpersonation();
  return isPreviewMode;
}
