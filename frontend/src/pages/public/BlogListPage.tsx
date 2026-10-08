import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { OwwEmptyState } from '@/components/oww/OwwEmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DEFAULT_STATE } from '@/lib/constants';
import { listBlogPosts } from '@/services/publicService';
import type { BlogPostCard } from '@/types';

function formatDate(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function BlogListPage() {
  const params = useParams();
  const state = (params.state || DEFAULT_STATE).toLowerCase();
  const [searchParams, setSearchParams] = useSearchParams();
  const tag = searchParams.get('tag') || undefined;
  const [items, setItems] = useState<BlogPostCard[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    void listBlogPosts(state, { tag, limit: 50 })
      .then(res => {
        setItems(res.items || []);
        setTotal(res.total || 0);
      })
      .catch(() => {
        setItems([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [state, tag]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    items.forEach(p => (p.tags || []).forEach(t => set.add(t)));
    return Array.from(set).sort();
  }, [items]);

  return (
    <div className="space-y-6">
      <OwwPageHero
        eyebrow={`${state.toUpperCase()} updates`}
        title="Blog"
        description="Running topics, program updates, and stories from the water workforce community."
      />

      {tag ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-base text-slate-700">
            Showing posts tagged <span className="font-semibold text-oww-navy">{tag}</span>
          </p>
          <Button
            variant="outline"
            className="min-h-[44px] text-base"
            onClick={() => setSearchParams({})}
          >
            Clear filter
          </Button>
        </div>
      ) : null}

      {!tag && allTags.length > 0 ? (
        <div className="flex flex-wrap gap-2" aria-label="Filter by tag">
          {allTags.map(t => (
            <Button
              key={t}
              variant="outline"
              className="min-h-[44px] text-base"
              onClick={() => setSearchParams({ tag: t })}
            >
              {t}
            </Button>
          ))}
        </div>
      ) : null}

      {loading ? (
        <p className="text-lg text-slate-600">Loading posts…</p>
      ) : items.length === 0 ? (
        <OwwEmptyState
          title="No posts yet"
          description="Check back soon for updates and running topics from this state."
        />
      ) : (
        <div className="space-y-4">
          <p className="text-base text-slate-600">
            {total} post{total === 1 ? '' : 's'}
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {items.map(post => {
              const dateLabel = formatDate(post.published_at);
              return (
                <Card key={post.id} className="border-slate-200 overflow-hidden">
                  {post.cover_image_url ? (
                    <Link to={`/${state}/blog/${post.slug}`} className="block">
                      <img
                        src={post.cover_image_url}
                        alt=""
                        className="h-40 w-full object-cover"
                      />
                    </Link>
                  ) : null}
                  <CardHeader className="space-y-2">
                    <p className="text-sm text-slate-600">
                      {[dateLabel, post.author_name].filter(Boolean).join(' · ')}
                    </p>
                    <CardTitle className="font-display text-xl text-oww-navy">
                      <Link to={`/${state}/blog/${post.slug}`} className="hover:underline">
                        {post.title}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {post.excerpt ? (
                      <p className="text-base leading-relaxed text-slate-700">{post.excerpt}</p>
                    ) : null}
                    {(post.tags || []).length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {post.tags.map(t => (
                          <Badge
                            key={t}
                            variant="secondary"
                            className="cursor-pointer text-sm font-normal"
                            onClick={() => setSearchParams({ tag: t })}
                          >
                            {t}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                    <Button variant="outline" className="min-h-[44px] text-base" asChild>
                      <Link to={`/${state}/blog/${post.slug}`}>Read more</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
