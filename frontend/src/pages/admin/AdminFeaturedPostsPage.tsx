import { useEffect, useState } from 'react';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { OwwEmptyState } from '@/components/oww/OwwEmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { listFeaturedPosts } from '@/services/adminService';
import type { FeaturedPost } from '@/types';

export default function AdminFeaturedPostsPage() {
  const [posts, setPosts] = useState<FeaturedPost[]>([]);
  useEffect(() => {
    void listFeaturedPosts().then(setPosts).catch(() => setPosts([]));
  }, []);
  return (
    <div className="space-y-6">
      <OwwPageHero eyebrow="Administration" title="Featured posts" description="Homepage and pathway callouts." />
      {posts.length === 0 ? (
        <OwwEmptyState title="No featured posts" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {posts.map(p => (
            <Card key={p.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                <CardTitle className="font-display text-lg">{p.title}</CardTitle>
                <Badge variant="secondary">{p.is_active ? 'Active' : 'Inactive'}</Badge>
              </CardHeader>
              <CardContent className="text-base text-slate-600">{p.body || p.url || '—'}</CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
