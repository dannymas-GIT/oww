import { api } from '@/lib/api';

export type Ww360AccessResult = {
  redirect_url: string;
  ww360_org_id: string;
  ww360_user_id: string;
  expires_in: number;
};

export async function openWaterWorkforce360(opts?: {
  next?: string;
}): Promise<Ww360AccessResult> {
  const { data } = await api.post('/integrations/ww360/access', opts?.next ? { next: opts.next } : {});
  return data;
}
