import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { DEFAULT_STATE } from '@/lib/constants';
import { getJurisdiction, listJurisdictions } from '@/services/jurisdictionService';
import type { JurisdictionConfig, JurisdictionListItem } from '@/types';
import {
  localizeMission,
  localizeImpactStats,
  localizePathwayContent,
  localizeTrainingCenter,
  type LocalizedMission,
  type LocalizedTraining,
} from '@/content/localizePublicContent';
import type { PathwayContent, PathwaySlug } from '@/content/owwPublicContent';

type Status = 'loading' | 'ready' | 'invalid';

interface JurisdictionContextValue {
  code: string;
  config: JurisdictionConfig | null;
  status: Status;
  partnerShort: string;
  partnerLead: string;
  partnerContact: string;
  demonym: string;
  geoUnitLabel: string;
  mission: LocalizedMission;
  impactStats: ReturnType<typeof localizeImpactStats>;
  trainingCenter: LocalizedTraining | null;
  pathway: (slug: PathwaySlug) => PathwayContent;
  activeList: JurisdictionListItem[];
  refreshList: () => Promise<void>;
}

const JurisdictionContext = createContext<JurisdictionContextValue | null>(null);

const cache = new Map<string, JurisdictionConfig>();

export function JurisdictionProvider({
  children,
  code: codeProp,
}: {
  children: ReactNode;
  /** When omitted, reads `:state` from the route (falls back to DEFAULT_STATE). */
  code?: string;
}) {
  const params = useParams();
  const raw = (codeProp || params.state || DEFAULT_STATE).toLowerCase();
  const code = raw.slice(0, 2);

  const [config, setConfig] = useState<JurisdictionConfig | null>(() => cache.get(code) || null);
  const [status, setStatus] = useState<Status>(() => (cache.has(code) ? 'ready' : 'loading'));
  const [activeList, setActiveList] = useState<JurisdictionListItem[]>([]);

  const refreshList = useCallback(async () => {
    try {
      const rows = await listJurisdictions();
      setActiveList(rows);
    } catch {
      setActiveList([]);
    }
  }, []);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  useEffect(() => {
    let alive = true;
    if (cache.has(code)) {
      setConfig(cache.get(code)!);
      setStatus('ready');
      return () => {
        alive = false;
      };
    }
    setStatus('loading');
    void getJurisdiction(code)
      .then(cfg => {
        if (!alive) return;
        cache.set(code, cfg);
        setConfig(cfg);
        setStatus('ready');
      })
      .catch(() => {
        if (!alive) return;
        setConfig(null);
        setStatus('invalid');
      });
    return () => {
      alive = false;
    };
  }, [code]);

  const value = useMemo<JurisdictionContextValue>(() => {
    const partnerShort = config?.partner?.short || 'One Water Workforce';
    const partnerLead = config?.partner?.lead_org || partnerShort;
    const partnerContact = config?.partner?.contact_label || partnerShort;
    const demonym = config?.demonym || 'residents';
    const geoUnitLabel = config?.geo_unit_label || 'County';
    return {
      code,
      config,
      status,
      partnerShort,
      partnerLead,
      partnerContact,
      demonym,
      geoUnitLabel,
      mission: localizeMission(config),
      impactStats: localizeImpactStats(config),
      trainingCenter: localizeTrainingCenter(config),
      pathway: (slug: PathwaySlug) => localizePathwayContent(slug, config),
      activeList,
      refreshList,
    };
  }, [code, config, status, activeList, refreshList]);

  if (status === 'invalid' && code !== DEFAULT_STATE) {
    return <Navigate to={`/${DEFAULT_STATE}`} replace />;
  }

  return <JurisdictionContext.Provider value={value}>{children}</JurisdictionContext.Provider>;
}

export function useJurisdiction(): JurisdictionContextValue {
  const ctx = useContext(JurisdictionContext);
  if (!ctx) {
    throw new Error('useJurisdiction must be used within JurisdictionProvider');
  }
  return ctx;
}

/** Soft hook — returns null outside provider (admin chrome without state). */
export function useOptionalJurisdiction(): JurisdictionContextValue | null {
  return useContext(JurisdictionContext);
}
