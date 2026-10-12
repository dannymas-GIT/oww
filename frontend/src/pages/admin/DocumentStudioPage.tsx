/**
 * OWW Document Studio — folders · documents · WYSIWYG · versions · screenshots.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  FilePlus2,
  History,
  Loader2,
  Megaphone,
  RefreshCw,
  Save,
  Send,
} from 'lucide-react';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { StudioEditor, type StudioEditorHandle } from '@/components/doc-studio/StudioEditor';
import { FolderTree, ALL_DOCS, UNFILED } from '@/components/doc-studio/FolderTree';
import { DocumentList } from '@/components/doc-studio/DocumentList';
import { VersionHistoryPanel } from '@/components/doc-studio/VersionHistoryPanel';
import { NewDocumentDialog } from '@/components/doc-studio/NewDocumentDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { OwwStudioCategory } from '@/config/owwStudioTemplates';
import * as api from '@/services/docStudioService';
import type { DocDetail, DocFolder, DocSummary, DocVersion } from '@/services/docStudioService';

const AUTOSAVE_MS = 2500;

const FOLDER_HINTS: Partial<Record<OwwStudioCategory, string>> = {
  blog: 'Blog drafts',
  email: 'Email and outreach',
  outreach: 'Email and outreach',
  social: 'Social posts',
  seo: 'SEO and briefs',
  sms: 'Email and outreach',
  brief: 'General docs',
};

export default function DocumentStudioPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const editorRef = useRef<StudioEditorHandle>(null);
  const autosaveTimer = useRef<number | null>(null);

  const [access, setAccess] = useState<api.DocStudioAccess | null>(null);
  const [folders, setFolders] = useState<DocFolder[]>([]);
  const [docs, setDocs] = useState<DocSummary[]>([]);
  const [folderId, setFolderId] = useState<string | null>(ALL_DOCS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [doc, setDoc] = useState<DocDetail | null>(null);
  const [title, setTitle] = useState('');
  const [versions, setVersions] = useState<DocVersion[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'dirty' | 'saving' | 'saved' | 'error'>('idle');
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [socialPlatforms, setSocialPlatforms] = useState<string[]>(['linkedin', 'oww_blog']);
  const bootstrapped = useRef(false);

  const refreshFolders = useCallback(async () => {
    const [acc, folds] = await Promise.all([api.fetchAccess(), api.listFolders()]);
    setAccess(acc);
    setFolders(folds);
  }, []);

  const refreshDocs = useCallback(async (fid: string | null) => {
    const params =
      fid === ALL_DOCS || !fid
        ? {}
        : fid === UNFILED
          ? { folder_id: UNFILED }
          : { folder_id: fid };
    const list = await api.listDocuments(params);
    setDocs(list);
  }, []);

  const openDoc = useCallback(async (id: string) => {
    setBusy(true);
    setError(null);
    try {
      const detail = await api.getDocument(id);
      setDoc(detail);
      setSelectedId(id);
      setTitle(detail.title || 'Untitled');
      editorRef.current?.setMarkdown(detail.content_markdown || '');
      setSaveState('idle');
      const vers = await api.listVersions(id);
      setVersions(vers);
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.set('doc', id);
        return next;
      });
    } catch {
      setError('Could not open document.');
    } finally {
      setBusy(false);
    }
  }, [setSearchParams]);

  useEffect(() => {
    void refreshFolders().catch(() => setError('Could not load Document Studio.'));
  }, [refreshFolders]);

  useEffect(() => {
    void refreshDocs(folderId).catch(() => setError('Could not list documents.'));
  }, [folderId, refreshDocs]);

  // Deep links: ?doc= ?content_page= ?template= ?intent=
  useEffect(() => {
    if (bootstrapped.current) return;
    const docParam = searchParams.get('doc');
    const pageParam = searchParams.get('content_page');
    const templateParam = searchParams.get('template');
    const intent = searchParams.get('intent');

    void (async () => {
      try {
        await refreshFolders();
        if (docParam) {
          bootstrapped.current = true;
          await openDoc(docParam);
          return;
        }
        if (pageParam) {
          bootstrapped.current = true;
          const created = await api.openFromCmsPage(Number(pageParam));
          await refreshDocs(ALL_DOCS);
          await openDoc(created.id);
          setFlash('Opened CMS page body in Document Studio — edit in place, then Publish to site.');
          return;
        }
        if (templateParam || intent === 'social') {
          bootstrapped.current = true;
          setNewOpen(true);
          if (intent === 'social') {
            const socialFolder = (await api.listFolders()).find(f => f.name === 'Social posts');
            if (socialFolder) setFolderId(socialFolder.id);
          }
        }
        bootstrapped.current = true;
      } catch {
        bootstrapped.current = true;
      }
    })();
  }, [searchParams, openDoc, refreshFolders, refreshDocs]);

  function scheduleAutosave() {
    setSaveState('dirty');
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    autosaveTimer.current = window.setTimeout(() => {
      void persist('autosave');
    }, AUTOSAVE_MS);
  }

  async function persist(kind: 'autosave' | 'manual' | 'publish') {
    if (!doc) return;
    setSaveState('saving');
    try {
      const md = editorRef.current?.getMarkdown() ?? doc.content_markdown ?? '';
      const saved = await api.saveContent(doc.id, {
        title: title.trim() || 'Untitled',
        content_markdown: md,
        kind,
      });
      setDoc(saved);
      setSaveState('saved');
      if (kind !== 'autosave') {
        const vers = await api.listVersions(doc.id);
        setVersions(vers);
        await refreshDocs(folderId);
      }
    } catch {
      setSaveState('error');
      setError('Save failed.');
    }
  }

  async function onCreateFromTemplate(payload: {
    title: string;
    templateId?: string;
    bodyHtml: string;
    folderHint?: OwwStudioCategory;
  }) {
    setBusy(true);
    try {
      await refreshFolders();
      const folds = await api.listFolders();
      const hintName = payload.folderHint ? FOLDER_HINTS[payload.folderHint] : undefined;
      let folder =
        (hintName ? folds.find(f => f.name === hintName) : undefined) ||
        (folderId && folderId !== ALL_DOCS && folderId !== UNFILED
          ? folds.find(f => f.id === folderId)
          : undefined);
      const created = await api.createDocument({
        title: payload.title,
        folder_id: folder?.id,
        content_markdown: payload.bodyHtml,
        template_id: payload.templateId,
        tags: payload.templateId ? [payload.templateId] : undefined,
      });
      await refreshDocs(folderId);
      await openDoc(created.id);
      setFlash(`Opened “${created.title}” — edit in place in Document Studio.`);
    } catch {
      setError('Could not create document.');
    } finally {
      setBusy(false);
    }
  }

  async function onPublishCms() {
    if (!doc) return;
    setBusy(true);
    setError(null);
    try {
      await persist('manual');
      const result = await api.publishToCms(doc.id, {
        content_page_id: doc.content_page_id || undefined,
        create_blog: !doc.content_page_id,
        title: title.trim() || undefined,
        publish: true,
      });
      setFlash(`Published to site (${result.url}).`);
      await openDoc(doc.id);
    } catch {
      setError('Publish to site failed.');
    } finally {
      setBusy(false);
    }
  }

  async function onPublishSocial() {
    if (!doc) return;
    setBusy(true);
    setError(null);
    try {
      await persist('manual');
      await api.publishToSocial(doc.id, {
        platforms: socialPlatforms,
        publish: true,
      });
      setFlash('Published to social destinations.');
    } catch {
      setError('Social publish failed.');
    } finally {
      setBusy(false);
    }
  }

  function togglePlatform(p: string) {
    setSocialPlatforms(prev => (prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]));
  }

  return (
    <div className="space-y-4">
      <OwwPageHero
        eyebrow="Administration"
        title="Document Studio"
        description="Folders, in-place WYSIWYG editing, versions, media, and screen grab — for blogs, pages, social drafts, and docs."
        actions={
          <>
            <Button
              className="min-h-[44px] bg-oww-cyan text-base text-white hover:bg-sky-700"
              onClick={() => setNewOpen(true)}
              disabled={!access?.can_author}
            >
              <FilePlus2 className="mr-2 h-4 w-4" />
              New document
            </Button>
            <Button
              variant="outline"
              className="min-h-[44px] border-white/40 bg-white/10 text-base text-white hover:bg-white/20"
              onClick={() => void refreshFolders().then(() => refreshDocs(folderId))}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </>
        }
      />

      {flash ? <p className="rounded-lg bg-emerald-50 p-3 text-base text-emerald-900">{flash}</p> : null}
      {error ? <p className="rounded-lg bg-rose-50 p-3 text-base text-rose-800">{error}</p> : null}

      <div className="grid min-h-[70vh] gap-4 lg:grid-cols-[220px_260px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="mb-2 px-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {access?.scope_label || 'Library'}
          </p>
          <FolderTree
            folders={folders}
            selectedId={folderId}
            onSelect={id => {
              setFolderId(id);
              setSelectedId(null);
              setDoc(null);
            }}
          />
        </aside>

        <aside className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-3 py-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Documents
          </div>
          <DocumentList documents={docs} selectedId={selectedId} onSelect={id => void openDoc(id)} />
        </aside>

        <section className="flex min-w-0 flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
          {!doc ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
              <p className="text-lg text-slate-700">Select a document or create one to edit in place.</p>
              <Button className="min-h-[44px] text-base" onClick={() => setNewOpen(true)}>
                New document
              </Button>
              <Button variant="outline" className="min-h-[44px] text-base" asChild>
                <Link to="/admin/cms">CMS pages &amp; blog list</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[12rem] flex-1 space-y-1">
                  <Label className="text-base">Title</Label>
                  <Input
                    className="min-h-[44px] text-base"
                    value={title}
                    onChange={e => {
                      setTitle(e.target.value);
                      scheduleAutosave();
                    }}
                  />
                </div>
                <p className="pb-2 text-sm text-slate-500">
                  {saveState === 'saving' || busy ? (
                    <span className="inline-flex items-center gap-1">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
                    </span>
                  ) : saveState === 'dirty' ? (
                    'Unsaved changes'
                  ) : saveState === 'saved' ? (
                    'Saved'
                  ) : saveState === 'error' ? (
                    'Save error'
                  ) : (
                    `v${doc.version_no}`
                  )}
                </p>
              </div>

              <StudioEditor
                key={doc.id}
                ref={editorRef}
                documentId={doc.id}
                initialMarkdown={doc.content_markdown || ''}
                onChange={() => scheduleAutosave()}
                onUploadError={msg => setError(msg)}
              />

              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                <Button
                  type="button"
                  className="min-h-[44px] text-base"
                  disabled={busy}
                  onClick={() => void persist('manual')}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save version
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-[44px] text-base"
                  onClick={() => setShowVersions(v => !v)}
                >
                  <History className="mr-2 h-4 w-4" />
                  Versions
                </Button>
                <Button
                  type="button"
                  className="min-h-[44px] bg-oww-cyan text-base text-white hover:bg-sky-700"
                  disabled={busy}
                  onClick={() => void onPublishCms()}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Publish to site
                </Button>
                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 px-3 py-1">
                  {['linkedin', 'oww_blog', 'ww360', 'facebook'].map(p => (
                    <label key={p} className="flex min-h-[44px] items-center gap-1 text-base">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={socialPlatforms.includes(p)}
                        onChange={() => togglePlatform(p)}
                      />
                      {p}
                    </label>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-[44px] text-base"
                    disabled={busy || !socialPlatforms.length}
                    onClick={() => void onPublishSocial()}
                  >
                    <Megaphone className="mr-2 h-4 w-4" />
                    Publish social
                  </Button>
                </div>
                {doc.content_page_id ? (
                  <Button variant="outline" className="min-h-[44px] text-base" asChild>
                    <Link to={`/admin/cms/${doc.content_page_id}`}>CMS layout</Link>
                  </Button>
                ) : null}
              </div>

              {showVersions ? (
                <div className="rounded-xl border border-slate-200 p-4">
                  <h3 className="mb-3 font-display text-lg text-oww-navy">Version history</h3>
                  <VersionHistoryPanel
                    versions={versions}
                    busy={busy}
                    onRestore={id => {
                      void (async () => {
                        setBusy(true);
                        try {
                          const restored = await api.restoreVersion(doc.id, id);
                          setDoc(restored);
                          setTitle(restored.title || '');
                          editorRef.current?.setMarkdown(restored.content_markdown || '');
                          setVersions(await api.listVersions(doc.id));
                          setFlash(`Restored version.`);
                        } catch {
                          setError('Restore failed.');
                        } finally {
                          setBusy(false);
                        }
                      })();
                    }}
                  />
                </div>
              ) : null}
            </>
          )}
        </section>
      </div>

      <NewDocumentDialog open={newOpen} onClose={() => setNewOpen(false)} onCreate={p => void onCreateFromTemplate(p)} />
    </div>
  );
}
