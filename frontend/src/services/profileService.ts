import { api } from '@/lib/api';
import type { IndividualProfile } from '@/types';

export async function getMyProfile(): Promise<IndividualProfile> {
  const { data } = await api.get('/profiles/me');
  return data;
}

export async function saveMyProfile(body: { answers: Record<string, unknown>; display_name?: string }) {
  const { data } = await api.put('/profiles/me', body);
  return data as IndividualProfile;
}
