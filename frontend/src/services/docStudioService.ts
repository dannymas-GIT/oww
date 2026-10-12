/** OWW Document Studio API client. */
import { api } from '@/lib/api';

const BASE = '/doc-studio';

export interface DocStudioAccess {
  scope: string;
  scope_label: string;
  can_view: boolean;
  can_author: boolean;
  can_publish: boolean;
  can_manage_folders: boolean;
  roles: string[];
}

export interface DocFolder {
  id: string;
  scope: string;
  parent_id?: string | null;
  name: string;
  description?: string | null;
  sort_order: number;
  is_system: boolean;
  document_count: number;
  created_at?: string | null;
}

export interface DocSummary {
  id: string;
  title?: string | null;
  scope: string;
  folder_id?: string | null;
  doc_type: string;
  status: string;
  summary?: string | null;
  tags?: string[] | null;
  template_id?: string | null;
  version_no: number;
  word_count: number;
  content_page_id?: number | null;
  social_post_id?: number | null;
  updated_at?: string | null;
  created_at?: string | null;
  published_at?: string | null;
}

export interface DocDetail extends DocSummary {
  content_markdown?: string | null;
  content_json?: Record<string, unknown> | null;
}

export interface DocVersion {
  id: string;
  document_id: string;
  version_no: number;
  title?: string | null;
  note?: string | null;
  kind: string;
  created_at?: string | null;
  content_markdown?: string | null;
}

export interface DocAsset {
  id: string;
  document_id?: string | null;
  scope: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  url: string;
  created_at?: string | null;
}

export const UNFILED = '__unfiled__';
export const ALL_DOCS = '__all__';

export async function fetchAccess(scope?: string) {
  const { data } = await api.get(`${BASE}/access`, { params: scope ? { scope } : undefined });
  return data as DocStudioAccess;
}

export async function listFolders(scope?: string) {
  const { data } = await api.get(`${BASE}/folders`, { params: scope ? { scope } : undefined });
  return data as DocFolder[];
}

export async function createFolder(body: { name: string; description?: string }, scope?: string) {
  const { data } = await api.post(`${BASE}/folders`, body, { params: scope ? { scope } : undefined });
  return data as DocFolder;
}

export async function listDocuments(params?: {
  folder_id?: string;
  q?: string;
  status?: string;
  scope?: string;
}) {
  const { scope, ...rest } = params || {};
  const { data } = await api.get(`${BASE}/documents`, {
    params: { ...rest, ...(scope ? { scope } : {}) },
  });
  return data as DocSummary[];
}

export async function getDocument(id: string, scope?: string) {
  const { data } = await api.get(`${BASE}/documents/${id}`, { params: scope ? { scope } : undefined });
  return data as DocDetail;
}

export async function createDocument(
  body: {
    title?: string;
    folder_id?: string | null;
    content_markdown?: string;
    template_id?: string;
    tags?: string[];
    content_page_id?: number;
    social_post_id?: number;
    summary?: string;
  },
  scope?: string
) {
  const { data } = await api.post(`${BASE}/documents`, body, { params: scope ? { scope } : undefined });
  return data as DocDetail;
}

export async function saveContent(
  id: string,
  body: {
    title?: string;
    content_markdown?: string;
    content_json?: Record<string, unknown>;
    kind?: 'autosave' | 'manual' | 'publish';
    note?: string;
  },
  scope?: string
) {
  const { data } = await api.put(`${BASE}/documents/${id}/content`, body, {
    params: scope ? { scope } : undefined,
  });
  return data as DocDetail;
}

export async function updateDocument(
  id: string,
  body: Partial<DocSummary>,
  scope?: string
) {
  const { data } = await api.patch(`${BASE}/documents/${id}`, body, {
    params: scope ? { scope } : undefined,
  });
  return data as DocDetail;
}

export async function deleteDocument(id: string, scope?: string) {
  await api.delete(`${BASE}/documents/${id}`, { params: scope ? { scope } : undefined });
}

export async function listVersions(id: string, scope?: string) {
  const { data } = await api.get(`${BASE}/documents/${id}/versions`, {
    params: scope ? { scope } : undefined,
  });
  return data as DocVersion[];
}

export async function restoreVersion(docId: string, versionId: string, scope?: string) {
  const { data } = await api.post(
    `${BASE}/documents/${docId}/versions/${versionId}/restore`,
    {},
    { params: scope ? { scope } : undefined }
  );
  return data as DocDetail;
}

export async function uploadAsset(file: File, documentId?: string | null, scope?: string) {
  const form = new FormData();
  form.append('file', file);
  if (documentId) form.append('document_id', documentId);
  const { data } = await api.post(`${BASE}/assets`, form, {
    params: scope ? { scope } : undefined,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data as DocAsset;
}

export async function listAssets(documentId?: string, scope?: string) {
  const { data } = await api.get(`${BASE}/assets`, {
    params: { ...(documentId ? { document_id: documentId } : {}), ...(scope ? { scope } : {}) },
  });
  return data as DocAsset[];
}

export async function openFromCmsPage(pageId: number, scope?: string) {
  const { data } = await api.post(
    `${BASE}/from-page/${pageId}`,
    {},
    { params: scope ? { scope } : undefined }
  );
  return data as DocDetail;
}

export async function publishToCms(
  docId: string,
  body: {
    content_page_id?: number;
    create_blog?: boolean;
    title?: string;
    state_code?: string;
    publish?: boolean;
  },
  scope?: string
) {
  const { data } = await api.post(`${BASE}/documents/${docId}/publish-cms`, body, {
    params: scope ? { scope } : undefined,
  });
  return data as {
    document_id: string;
    content_page_id: number;
    slug: string;
    published: boolean;
    url: string;
  };
}

export async function publishToSocial(
  docId: string,
  body: { platforms: string[]; publish?: boolean; link_url?: string },
  scope?: string
) {
  const { data } = await api.post(`${BASE}/documents/${docId}/publish-social`, body, {
    params: scope ? { scope } : undefined,
  });
  return data as Record<string, unknown>;
}

/** Absolute URL for asset file (axios base may be relative). */
export function assetFileUrl(assetId: string): string {
  return `/api/v1/doc-studio/assets/${assetId}/file`;
}
