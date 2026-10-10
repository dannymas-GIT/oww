import { api } from '@/lib/api';
import type { Jurisdiction, JurisdictionConfig, JurisdictionListItem } from '@/types';

export async function listJurisdictions(): Promise<JurisdictionListItem[]> {
  const { data } = await api.get('/jurisdictions');
  return data;
}

export async function getJurisdiction(code: string): Promise<JurisdictionConfig> {
  const { data } = await api.get(`/jurisdictions/${code}`);
  return data;
}

export async function listCertifications(code: string) {
  const { data } = await api.get(`/jurisdictions/${code}/certifications`);
  return data;
}

export async function listAdminJurisdictions(): Promise<Jurisdiction[]> {
  const { data } = await api.get('/admin/jurisdictions');
  return data;
}

export async function getAdminJurisdiction(code: string): Promise<Jurisdiction> {
  const { data } = await api.get(`/admin/jurisdictions/${code}`);
  return data;
}

export async function upsertJurisdiction(body: Partial<Jurisdiction> & { code: string; name: string }) {
  const { data } = await api.post('/admin/jurisdictions', body);
  return data as Jurisdiction;
}
