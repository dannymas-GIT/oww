import { api } from '@/lib/api';
import type { OrgProfile, Organization } from '@/types';

export async function getMyOrg(): Promise<Organization & OrgProfile> {
  const { data } = await api.get('/orgs/me');
  return data;
}

export async function saveMyOrg(body: Partial<Organization> & { answers?: Record<string, unknown> }) {
  const { data } = await api.put('/orgs/me', body);
  return data;
}

export async function searchCandidates(params?: { q?: string; career_area?: string }) {
  const { data } = await api.get('/orgs/candidates', { params });
  return data as Array<{
    id: number;
    display_name: string;
    career_area?: string;
    match_score?: number;
    is_sample?: boolean;
    showing_sample?: boolean;
  }>;
}

export async function getOrgSampleStatus() {
  const { data } = await api.get('/orgs/sample-status');
  return data as {
    sample_pack_active?: boolean;
    sections?: Record<string, { showing_sample?: boolean; count?: number; has_real?: boolean }>;
  };
}

export async function clearOrgSamplePack() {
  const { data } = await api.post('/orgs/sample-pack/clear');
  return data as { ok: boolean };
}
