import { api } from '@/lib/api';
import type { Jurisdiction } from '@/types';

export async function listJurisdictions(): Promise<Jurisdiction[]> {
  const { data } = await api.get('/jurisdictions');
  return data;
}

export async function upsertJurisdiction(body: Partial<Jurisdiction> & { code: string; name: string }) {
  const { data } = await api.post('/admin/jurisdictions', body);
  return data as Jurisdiction;
}
