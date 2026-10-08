import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { CmsPageRenderer } from '@/components/oww/CmsPageRenderer';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DEFAULT_STATE } from '@/lib/constants';
import { getBlogPost } from '@/services/publicService';
import type { ContentPage } from '@/types';

function formatDate(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function BlogPostPage() {
  const params = useParams();
  const state = (params.state || DEFAULT_STATE).toLowerCase();
  const slug = params.slug || '';
  const [page, setPage] = useState<ContentPage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    void getBlogPost(state, slug)
      .then(setPage)
      .catch(() => {
        setPage(null);
        setError('Post not found.');
      });
  }, [state, slug]);

  if (error) {
    return (
      <div className="space-y-4">
        <p className="text-lg text-slate-700">{error}</p>
        <Button variant="outline" className="min-h-[44px] text-base" asChild>
          <Link to={`/${state}/blog`}>Back to blog</Link>
        </Button>
      </div>
    );
  }

  if (!page) {
    return <p className="text-lg text-slate-600">Loading post…</p>;
  }

  const dateLabel = formatDate(page.published_at);
  const meta = [dateLabel, page.author_name].filter(Boolean).join(' · ');
  const hasHero = (page.sections || []).some(s => s.type === 'hero');

  return (
    <div className="space-y-8">
      <Button variant="ghost" className="min-h-[44px] px-0 text-base text-sky-800" asChild>
        <Link to={`/${state}/blog`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to blog
        </Link>
      </Button>

      {!hasHero ? (
        <OwwPageHero
          eyebrow={meta || `${state.toUpperCase()} blog`}
          title={page.title}
          description={page.excerpt || page.summary || undefined}
        />
      ) : null}

      {(page.tags || []).length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {(page.tags || []).map(tag => (
            <Link key={tag} to={`/${state}/blog?tag=${encodeURIComponent(tag)}`}>
              <Badge variant="secondary" className="text-sm font-normal">
                {tag}
              </Badge>
            </Link>
          ))}
        </div>
      ) : null}

      {hasHero && meta ? (
        <p className="text-base text-slate-600">{meta}</p>
      ) : null}

      <CmsPageRenderer page={page} state={state} />
    </div>
  );
}
