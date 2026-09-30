import { api } from '@/lib/api';
import type { Interview, MessageThread } from '@/types';

export async function listThreads(): Promise<MessageThread[]> {
  const { data } = await api.get('/messaging/threads');
  return data;
}

export async function sendMessage(threadId: number, body: string) {
  const { data } = await api.post(`/messaging/threads/${threadId}/messages`, { body });
  return data;
}

export async function createThread(payload: { subject: string; recipient_user_id: number; body: string }) {
  const { data } = await api.post('/messaging/threads', payload);
  return data as MessageThread;
}

export async function listNotes(params?: { individual_id?: number }) {
  const { data } = await api.get('/messaging/notes', { params });
  return data as Array<{ id: number; body: string; created_at: string }>;
}

export async function createNote(body: { individual_id: number; body: string }) {
  const { data } = await api.post('/messaging/notes', body);
  return data;
}

export async function listInterviews(): Promise<Interview[]> {
  const { data } = await api.get('/messaging/interviews');
  return data;
}

export async function scheduleInterview(payload: {
  job_id?: number;
  individual_id: number;
  scheduled_at: string;
  location?: string;
  notes?: string;
}) {
  const { data } = await api.post('/messaging/interviews', payload);
  return data as Interview;
}
