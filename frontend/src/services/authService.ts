import { api, setStoredToken, getStoredToken } from '@/lib/api';
import type { OwwUser } from '@/types';

export async function requestOtp(payload: { email?: string; phone?: string }) {
  const { data } = await api.post('/auth/otp/request', payload);
  return data as {
    ok: boolean;
    message?: string;
    dev_code?: string;
    delivery?: 'stub' | 'email' | 'sms' | 'failed';
    channel?: string;
  };
}

export async function verifyOtp(payload: { email?: string; phone?: string; code: string }) {
  const { data } = await api.post('/auth/otp/verify', payload);
  setStoredToken(data.access_token);
  return data as { access_token: string; user: OwwUser };
}

export async function loginPassword(username: string, password: string) {
  const { data } = await api.post('/auth/login', { username, password });
  setStoredToken(data.access_token);
  return data as { access_token: string; user: OwwUser };
}

export async function registerUtilityAdmin(payload: {
  utility_name: string;
  full_name: string;
  email: string;
  password: string;
  state_code?: string;
  phone?: string;
  website?: string;
  job_title?: string;
}) {
  const { data } = await api.post('/auth/register-utility-admin', payload);
  setStoredToken(data.access_token);
  return data as import('@/types').RegisterUtilityResult;
}

export async function fetchMe(): Promise<OwwUser> {
  const { data } = await api.get('/auth/me');
  return data;
}

export async function changePassword(body: {
  current_password: string;
  new_password: string;
  confirm_password: string;
}) {
  const { data } = await api.post('/auth/change-password', body);
  return data as { ok: boolean; message: string };
}

export function logout() {
  setStoredToken(null);
}

export { getStoredToken };
