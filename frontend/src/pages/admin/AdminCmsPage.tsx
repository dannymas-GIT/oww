import { useEffect, useState } from 'react';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { OwwEmptyState } from '@/components/oww/OwwEmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { listCmsPages } from '@/services/adminService';
import type { ContentPage } from '@/types';

export default function AdminCmsPage() {
  const [pages, setPages] = useState<ContentPage[]>([]);
  useEffect(() => {
    void listCmsPages().then(setPages).catch(() => setPages([]));
  }, []);
  return (
    <div className="space-y-6">
      <OwwPageHero eyebrow="Administration" title="CMS pages" description="Role- and jurisdiction-scoped content pages." />
      {pages.length === 0 ? (
        <OwwEmptyState title="No CMS pages yet" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {pages.map(p => (
            <Card key={p.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                <CardTitle className="font-display text-lg">{p.title}</CardTitle>
                <Badge variant="secondary">{p.published ? 'Published' : 'Draft'}</Badge>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">
                /{p.slug} · {p.state_code || 'all'}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
