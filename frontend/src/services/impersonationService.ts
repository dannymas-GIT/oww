import { api, setStoredToken } from '@/lib/api';
import type { ImpersonationState, OwwUser } from '@/types';

export interface DemoPersona {
  persona_key: string;
  tier: string;
  label: string;
  subtitle?: string | null;
  narrative_bullets: string[];
  target_user_id: number;
  username: string;
  roles: string[];
  state_code?: string | null;
  org_id?: number | null;
}

export async function fetchPersonas() {
  const { data } = await api.get('/impersonation/personas');
  return data as DemoPersona[];
}

export async function startImpersonation(body: {
  persona_key?: string;
  target_user_id?: number;
  mode: 'preview' | 'act';
  reason?: string;
}) {
  const { data } = await api.post('/impersonation/start', body);
  if (data.access_token) setStoredToken(data.access_token);
  return data as { access_token: string; user: OwwUser & { impersonation?: ImpersonationState } };
}

export async function stopImpersonation() {
  const { data } = await api.post('/impersonation/stop');
  if (data.access_token) setStoredToken(data.access_token);
  return data as { access_token: string; user: OwwUser };
}
