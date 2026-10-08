import { api } from '@/lib/api';
import type {
  AdminDashboard,
  AnalyticsSummary,
  BillingEventItem,
  CertificationCatalogItem,
  Communication,
  CommunicationAudience,
  ContentPage,
  FeaturedPost,
  Jurisdiction,
  LocationItem,
  LoginActivityResponse,
  Membership,
  MembershipPlan,
  MembershipSummary,
  OrgOption,
  OwwUser,
  RoleCatalogEntry,
} from '@/types';

export async function listUsers(params?: { q?: string }) {
  const { data } = await api.get('/admin/users', { params });
  return data as OwwUser[];
}

export async function listPeopleDirectory(audience: 'candidates' | 'hirers' | 'ambassadors' | 'educators') {
  const { data } = await api.get(`/admin/people/${audience}`);
  return data as OwwUser[];
}

export async function listOrgUsers() {
  const { data } = await api.get('/admin/org-users');
  return data as OwwUser[];
}

export async function createUser(body: {
  username: string;
  email: string;
  full_name?: string;
  roles: string[];
  org_id?: number | null;
  state_code?: string;
  phone?: string;
  temporary_password?: string;
}) {
  const { data } = await api.post('/admin/users', body);
  return data as OwwUser & { temporary_password: string };
}

export async function setUserRoles(id: number, roles: string[]) {
  const { data } = await api.put(`/admin/users/${id}/roles`, { roles });
  return data as OwwUser;
}

export async function fetchRoleCatalog() {
  const { data } = await api.get('/admin/roles/catalog');
  return data as { roles: RoleCatalogEntry[]; assignable: string[] };
}

export async function listOrganizations() {
  const { data } = await api.get('/admin/organizations');
  return data as OrgOption[];
}

export async function listRegistrations(params?: { status?: string }) {
  const { data } = await api.get('/admin/registrations', { params });
  return data as import('@/types').UtilityRegistration[];
}

export async function reviewRegistration(id: number, body: { action: 'verify' | 'suspend' | 'reinstate'; note?: string }) {
  const { data } = await api.post(`/admin/registrations/${id}/review`, body);
  return data as import('@/types').UtilityRegistration;
}

export async function fetchPlatformSettings() {
  const { data } = await api.get('/admin/settings');
  return data as import('@/types').PlatformSettings;
}

export async function updatePlatformSettings(body: Partial<import('@/types').PlatformSettings>) {
  const { data } = await api.put('/admin/settings', body);
  return data as import('@/types').PlatformSettings;
}

// ---- Platform dashboard / memberships ----

export async function fetchAdminDashboard() {
  const { data } = await api.get('/admin/dashboard');
  return data as AdminDashboard;
}

export async function fetchLoginActivity(params?: { success?: boolean; limit?: number }) {
  const { data } = await api.get('/admin/logins', { params });
  return data as LoginActivityResponse;
}

export async function listMemberships(params?: { status?: string; expiring_days?: number }) {
  const { data } = await api.get('/admin/memberships', { params });
  return data as Membership[];
}

export async function fetchMembershipSummary() {
  const { data } = await api.get('/admin/memberships/summary');
  return data as MembershipSummary;
}

export async function listAdminPlans() {
  const { data } = await api.get('/admin/memberships/plans');
  return data as MembershipPlan[];
}

export async function extendMembership(id: number, body: { days: number; note?: string }) {
  const { data } = await api.post(`/admin/memberships/${id}/extend`, body);
  return data as Membership;
}

export async function compMembership(userId: number, body: { plan_code?: string; days: number; note?: string }) {
  const { data } = await api.post(`/admin/users/${userId}/comp-membership`, body);
  return data as Membership;
}

export async function listBillingEvents(limit = 50) {
  const { data } = await api.get('/admin/billing-events', { params: { limit } });
  return data as BillingEventItem[];
}

// ---- Communications ----

export async function listCommunications() {
  const { data } = await api.get('/admin/communications');
  return data as Communication[];
}

export async function previewAudience(body: { subject: string; body: string; channel: string; audience: CommunicationAudience }) {
  const { data } = await api.post('/admin/communications/preview', body);
  return data as { count: number; sample: Array<{ name: string; email: string }> };
}

export async function createCommunication(body: { subject: string; body: string; channel: string; audience: CommunicationAudience }) {
  const { data } = await api.post('/admin/communications', body);
  return data as Communication;
}

export async function sendCommunication(id: number) {
  const { data } = await api.post(`/admin/communications/${id}/send`);
  return data as Communication;
}

export async function sendRenewalNotices(days = 30) {
  const { data } = await api.post('/admin/communications/renewal-notices', null, { params: { days } });
  return data as Communication;
}

export async function updateUser(id: number, body: Partial<OwwUser> & { roles?: string[]; is_active?: boolean }) {
  const { data } = await api.patch(`/admin/users/${id}`, body);
  return data as OwwUser;
}

export async function resetUserPassword(id: number, new_password: string) {
  const { data } = await api.post(`/admin/users/${id}/reset-password`, { new_password });
  return data;
}

export async function listCmsPages(kind?: 'page' | 'blog' | 'all') {
  const params = kind && kind !== 'all' ? { kind } : undefined;
  const { data } = await api.get('/admin/cms', { params });
  return data as ContentPage[];
}

export async function getCmsPage(id: number) {
  const { data } = await api.get(`/admin/cms/${id}`);
  return data as ContentPage;
}

export async function fetchCmsCatalog() {
  const { data } = await api.get('/admin/cms/catalog');
  return data as { templates: import('@/types').CmsTemplateMeta[]; section_types: import('@/types').CmsSectionTypeMeta[] };
}

export async function saveCmsPage(body: Partial<ContentPage> & { sections?: import('@/types').CmsSection[] }) {
  const payload = {
    ...body,
    published: body.published,
  };
  const { data } = body.id
    ? await api.patch(`/admin/cms/${body.id}`, payload)
    : await api.post('/admin/cms', payload);
  return data as ContentPage;
}

export async function deleteCmsPage(id: number) {
  const { data } = await api.delete(`/admin/cms/${id}`);
  return data as { ok: boolean };
}

export async function listCmsMedia() {
  const { data } = await api.get('/admin/cms/media');
  return data as import('@/types').MediaAsset[];
}

export async function uploadCmsMedia(file: File, stateCode?: string) {
  const form = new FormData();
  form.append('file', file);
  if (stateCode) form.append('state_code', stateCode);
  const { data } = await api.post('/admin/cms/media', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data as import('@/types').MediaAsset;
}

export async function listProgramSubmissions() {
  const { data } = await api.get('/admin/programs');
  return data as Array<Record<string, unknown>>;
}

export async function listFeaturedPosts() {
  const { data } = await api.get('/admin/featured');
  return data as FeaturedPost[];
}

export async function saveFeaturedPost(body: Partial<FeaturedPost>) {
  const { data } = body.id
    ? await api.patch(`/admin/featured/${body.id}`, body)
    : await api.post('/admin/featured', body);
  return data as FeaturedPost;
}

export async function fetchAnalytics(): Promise<AnalyticsSummary> {
  const { data } = await api.get('/admin/analytics');
  return data;
}

export async function downloadAnalyticsCsv(): Promise<Blob> {
  const { data } = await api.get('/admin/analytics/export.csv', { responseType: 'blob' });
  return data as Blob;
}

export async function listCertifications() {
  const { data } = await api.get('/admin/certifications');
  return data as CertificationCatalogItem[];
}

export async function saveCertification(body: Partial<CertificationCatalogItem>) {
  const { data } = body.id
    ? await api.patch(`/admin/certifications/${body.id}`, body)
    : await api.post('/admin/certifications', body);
  return data as CertificationCatalogItem;
}

export async function listLocations() {
  const { data } = await api.get('/admin/locations');
  return data as LocationItem[];
}

export async function saveLocation(body: Partial<LocationItem>) {
  const { data } = body.id
    ? await api.patch(`/admin/locations/${body.id}`, body)
    : await api.post('/admin/locations', body);
  return data as LocationItem;
}

export async function listAdminJurisdictions() {
  const { data } = await api.get('/admin/jurisdictions');
  return data as Jurisdiction[];
}

export async function nationalMapData() {
  const { data } = await api.get('/admin/map');
  return data as {
    jurisdictions: Array<{ code: string; name: string; individuals: number; jobs: number }>;
  };
}
