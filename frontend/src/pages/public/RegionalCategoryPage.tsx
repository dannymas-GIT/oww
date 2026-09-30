import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DEFAULT_STATE } from '@/lib/constants';
import { titleCase } from '@/lib/format';
import { listResources } from '@/services/publicService';

export default function RegionalCategoryPage() {
  const params = useParams();
  const state = (params.state || DEFAULT_STATE).toLowerCase();
  const category = params.category || 'resources';
  const [items, setItems] = useState<Array<{ id: number; title: string; url?: string; category?: string }>>([]);

  useEffect(() => {
    void listResources({ state, category }).then(setItems).catch(() => setItems([]));
  }, [state, category]);

  return (
    <div className="space-y-6">
      <Button variant="ghost" className="min-h-[44px] px-0 text-base text-sky-800" asChild>
        <Link to={`/${state}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {state.toUpperCase()} home
        </Link>
      </Button>
      <OwwPageHero
        eyebrow="Regional content"
        title={titleCase(category)}
        description={`Curated ${titleCase(category).toLowerCase()} for ${state.toUpperCase()}.`}
      />
      <div className="grid gap-4 md:grid-cols-2">
        {items.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-lg text-slate-600">No items published in this category yet.</CardContent>
          </Card>
        ) : (
          items.map(item => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle className="font-display text-lg">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                {item.url ? (
                  <Button variant="outline" className="min-h-[44px] text-base" asChild>
                    <a href={item.url} target="_blank" rel="noreferrer">
                      Open resource
                    </a>
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
