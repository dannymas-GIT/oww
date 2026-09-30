import { api } from '@/lib/api';
import type {
  InterestSubmission,
  Job,
  Microvideo,
  Organization,
  ProgramSubmission,
  Testimonial,
} from '@/types';

export async function submitInterest(body: InterestSubmission) {
  const { data } = await api.post('/public/interest', body);
  return data;
}

export async function submitProgram(body: ProgramSubmission) {
  const { data } = await api.post('/public/programs', body);
  return data;
}

export async function listPublicJobs(params?: { state?: string; q?: string }) {
  const { data } = await api.get('/public/jobs', { params });
  return data as Job[];
}

export async function getPublicJob(id: number | string) {
  const { data } = await api.get(`/public/jobs/${id}`);
  return data as Job;
}

export async function listPublicCompanies(params?: { state?: string; q?: string }) {
  const { data } = await api.get('/public/companies', { params });
  return data as Organization[];
}

export async function getPublicCompany(id: number | string) {
  const { data } = await api.get(`/public/companies/${id}`);
  return data as Organization;
}

export async function listTestimonials(params?: { state?: string }) {
  const { data } = await api.get('/public/testimonials', { params });
  return data as Testimonial[];
}

export async function listMicrovideos(params?: { state?: string }) {
  const { data } = await api.get('/public/microvideos', { params });
  return data as Microvideo[];
}

export async function listResources(params?: { state?: string; category?: string }) {
  const { data } = await api.get('/public/resources', { params });
  return data as Array<{ id: number; title: string; url?: string; category?: string }>;
}
