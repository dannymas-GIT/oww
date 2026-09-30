import { api } from '@/lib/api';

export async function listFavorites() {
  const { data } = await api.get('/favorites');
  return data as Array<{ id: number; job_id: number; job_title?: string }>;
}

export async function addFavorite(jobId: number) {
  const { data } = await api.post('/favorites', { job_id: jobId });
  return data;
}

export async function removeFavorite(id: number) {
  await api.delete(`/favorites/${id}`);
}
