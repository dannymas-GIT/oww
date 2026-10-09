import { api } from '@/lib/api';

export interface AmbassadorDesk {
  full_name?: string | null;
  email?: string | null;
  state_code: string;
  interest_count: number;
  outreach_count: number;
  toolkit_count: number;
  interests: Array<{
    id: number;
    pathway?: string | null;
    career_stage?: string | null;
    region?: string | null;
    status?: string | null;
    interests?: string[];
    created_at?: string | null;
  }>;
  outreach: Array<{
    id: number;
    event_type: string;
    stage?: string | null;
    region?: string | null;
    note?: string | null;
    created_at?: string | null;
  }>;
  toolkits: Array<{
    id: number;
    title: string;
    url?: string | null;
    category?: string | null;
    pathway?: string | null;
  }>;
  talking_points: string[];
}

export async function fetchAmbassadorDesk(): Promise<AmbassadorDesk> {
  const { data } = await api.get('/ambassador/desk');
  return data as AmbassadorDesk;
}
