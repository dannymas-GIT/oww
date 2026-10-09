import { api } from '@/lib/api';
import type { Course, EducatorEvent } from '@/types';

export interface EducatorProgram {
  id: number;
  program_name: string;
  organization_name?: string | null;
  program_type?: string | null;
  region?: string | null;
  status: string;
  description?: string | null;
  created_at?: string | null;
}

export async function listCourses(): Promise<Course[]> {
  const { data } = await api.get('/educator/courses');
  return data;
}

export async function listEvents(): Promise<EducatorEvent[]> {
  const { data } = await api.get('/educator/events');
  return data;
}

export async function listEducatorPrograms(): Promise<EducatorProgram[]> {
  const { data } = await api.get('/educator/programs');
  return data;
}

export async function createCourse(body: Partial<Course>) {
  const { data } = await api.post('/educator/courses', body);
  return data as Course;
}

export async function createEvent(body: Partial<EducatorEvent>) {
  const { data } = await api.post('/educator/events', body);
  return data as EducatorEvent;
}
