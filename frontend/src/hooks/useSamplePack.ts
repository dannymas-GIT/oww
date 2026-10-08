import { useCallback, useEffect, useState } from 'react';
import { clearOrgSamplePack, getOrgSampleStatus } from '@/services/orgService';

export interface SampleStatus {
  sample_pack_active?: boolean;
  sections?: Record<string, { showing_sample?: boolean; count?: number }>;
}

/** Hiring-workspace sample pack banner + clear. */
export function useSamplePack(section?: string) {
  const [status, setStatus] = useState<SampleStatus | null>(null);
  const [clearing, setClearing] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setStatus(await getOrgSampleStatus());
    } catch {
      setStatus(null);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const showingSample =
    Boolean(status?.sample_pack_active) &&
    (section ? Boolean(status?.sections?.[section]?.showing_sample) : true);

  const clear = useCallback(async () => {
    setClearing(true);
    try {
      await clearOrgSamplePack();
      await refresh();
    } finally {
      setClearing(false);
    }
  }, [refresh]);

  return { status, showingSample, clearing, clear, refresh };
}
