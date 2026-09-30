import { api } from '@/lib/api';
import type { TaxonomyPayload } from '@/types';

export async function fetchTaxonomy(): Promise<TaxonomyPayload> {
  const { data } = await api.get('/taxonomy');
  return data;
}
