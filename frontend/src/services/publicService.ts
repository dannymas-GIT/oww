import { api } from '@/lib/api';
import type {
  BlogPostCard,
  ContentPage,
  InterestSubmission,
  Job,
  Microvideo,
  Organization,
  ProgramSubmission,
  Testimonial,
  WorkforceStatsResponse,
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

export async function getWorkforceStats(state: string) {
  const { data } = await api.get(`/public/workforce-stats/${state}`);
  return data as WorkforceStatsResponse;
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

export async function getPublishedPage(state: string, slug: string) {
  const { data } = await api.get(`/public/pages/${state}/${slug}`);
  return data as ContentPage;
}

export async function listBlogPosts(state: string, params?: { tag?: string; limit?: number; offset?: number }) {
  const { data } = await api.get(`/public/blog/${state}`, { params });
  return data as { total: number; items: BlogPostCard[]; state_code: string; tag?: string | null };
}

export async function getBlogPost(state: string, slug: string) {
  const { data } = await api.get(`/public/blog/${state}/${slug}`);
  return data as ContentPage;
}
