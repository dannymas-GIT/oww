import { api } from '@/lib/api';
import type { MatchRow } from '@/types';

export async function listMatches(): Promise<MatchRow[]> {
  const { data } = await api.get('/matches');
  return data;
}

export async function refreshMatches() {
  const { data } = await api.post('/matches/refresh');
  return data;
}
