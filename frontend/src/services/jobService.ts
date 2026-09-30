import { api } from '@/lib/api';
import type { Application, Job } from '@/types';

export async function listMyJobs(): Promise<Job[]> {
  const { data } = await api.get('/jobs');
  return data;
}

export async function createJob(body: Partial<Job>) {
  const { data } = await api.post('/jobs', body);
  return data as Job;
}

export async function updateJob(id: number, body: Partial<Job>) {
  const { data } = await api.patch(`/jobs/${id}`, body);
  return data as Job;
}

export async function duplicateJob(id: number) {
  const { data } = await api.post(`/jobs/${id}/duplicate`);
  return data as Job;
}

export async function featureJob(id: number, featured = true) {
  const { data } = await api.post(`/jobs/${id}/feature`, { featured });
  return data as Job;
}

export async function listJobTemplates() {
  const { data } = await api.get('/jobs/templates');
  return data as Job[];
}

export async function listApplications(params?: { job_id?: number }) {
  const { data } = await api.get('/jobs/applications', { params });
  return data as Application[];
}

export async function applyToJob(jobId: number, cover_note?: string) {
  const { data } = await api.post(`/jobs/${jobId}/applications`, { cover_note });
  return data as Application;
}
