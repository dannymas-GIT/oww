import { Link } from 'react-router-dom';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { OwwSection } from '@/components/oww/OwwSection';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CmsCardItem, CmsMediaItem, CmsSection, CmsStatItem, ContentPage } from '@/types';

function resolveHref(href: string | undefined, state: string): string {
  if (!href) return '#';
  return href.replace(/\{state\}/gi, state);
}

function isInternal(href: string): boolean {
  return href.startsWith('/') && !href.startsWith('//');
}

function CtaLink({
  href,
  label,
  variant = 'default',
}: {
  href?: string;
  label?: string;
  variant?: 'default' | 'outline' | 'secondary';
}) {
  if (!label || !href) return null;
  const resolved = href;
  if (isInternal(resolved)) {
    return (
      <Button className="min-h-[44px] text-base" variant={variant === 'default' ? 'default' : variant} asChild>
        <Link to={resolved}>{label}</Link>
      </Button>
    );
  }
  return (
    <Button className="min-h-[44px] text-base" variant={variant === 'default' ? 'default' : variant} asChild>
      <a href={resolved} target="_blank" rel="noreferrer">
        {label}
      </a>
    </Button>
  );
}

function MediaBlock({
  url,
  mediaType,
  caption,
  className,
}: {
  url?: string;
  mediaType?: string;
  caption?: string;
  className?: string;
}) {
  if (!url) return null;
  const kind = (mediaType || '').toLowerCase();
  return (
    <figure className={className}>
      {kind.startsWith('video') || /\.(mp4|webm|ogg)(\?|$)/i.test(url) ? (
        <video className="w-full rounded-xl" controls src={url} />
      ) : kind.startsWith('audio') || /\.(mp3|wav|ogg)(\?|$)/i.test(url) ? (
        <audio className="w-full" controls src={url} />
      ) : kind.includes('pdf') || kind === 'document' ? (
        <a className="text-base font-semibold text-oww-cyan underline" href={url} target="_blank" rel="noreferrer">
          {caption || 'Open document'}
        </a>
      ) : (
        <img className="w-full rounded-xl object-cover" src={url} alt={caption || ''} />
      )}
      {caption ? <figcaption className="mt-2 text-sm text-slate-600">{caption}</figcaption> : null}
    </figure>
  );
}

export function CmsSectionView({
  section,
  state,
  interactive = true,
}: {
  section: CmsSection;
  state: string;
  /** When false, links/CTAs do not navigate (admin live canvas). */
  interactive?: boolean;
}) {
  const type = section.type;
  const body = (() => {

  if (type === 'hero') {
    return (
      <div className="space-y-4">
        <OwwPageHero
          eyebrow={section.eyebrow || undefined}
          title={section.headline || 'One Water Workforce'}
          description={section.subhead || undefined}
          actions={
            <div className="flex flex-wrap gap-2">
              <CtaLink href={resolveHref(section.cta_href, state)} label={section.cta_label} />
              <CtaLink
                href={resolveHref(section.cta2_href, state)}
                label={section.cta2_label}
                variant="outline"
              />
            </div>
          }
        />
        {section.media_url ? (
          <MediaBlock url={section.media_url} mediaType={section.media_type} className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-2" />
        ) : null}
      </div>
    );
  }

  if (type === 'stats') {
    const items = (section.items || []) as CmsStatItem[];
    return (
      <OwwSection title={section.title || 'At a glance'} description={section.description}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, idx) => (
            <div key={`${item.label}-${idx}`} className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="font-display text-3xl font-semibold text-oww-navy">{item.value}</p>
              <p className="mt-1 text-base font-semibold text-slate-800">{item.label}</p>
              {item.detail ? <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.detail}</p> : null}
            </div>
          ))}
        </div>
      </OwwSection>
    );
  }

  if (type === 'rich_text') {
    return (
      <OwwSection title={section.title || undefined}>
        <div
          className="prose prose-slate max-w-none rounded-xl border border-slate-200 bg-white p-6 text-lg leading-relaxed text-slate-700"
          dangerouslySetInnerHTML={{ __html: section.html || '' }}
        />
      </OwwSection>
    );
  }

  if (type === 'cards') {
    const items = (section.items || []) as CmsCardItem[];
    return (
      <OwwSection title={section.title || 'Explore'} description={section.description}>
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item, idx) => (
            <Card key={`${item.title}-${idx}`} className="border-slate-200">
              <CardHeader>
                <CardTitle className="font-display text-xl text-oww-navy">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-base text-slate-700">{item.body}</p>
                {item.href ? (
                  <CtaLink href={resolveHref(item.href, state)} label="Open" variant="outline" />
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      </OwwSection>
    );
  }

  if (type === 'media_gallery') {
    const items = (section.items || []) as CmsMediaItem[];
    return (
      <OwwSection title={section.title || 'Media'} description={section.description}>
        <div className="grid gap-4 md:grid-cols-2">
          {items
            .filter(i => i.url)
            .map((item, idx) => (
              <MediaBlock
                key={`${item.url}-${idx}`}
                url={item.url}
                mediaType={item.media_type}
                caption={item.caption}
              />
            ))}
        </div>
      </OwwSection>
    );
  }

  if (type === 'quote') {
    return (
      <OwwSection title="Voices from the field">
        <blockquote className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-lg leading-relaxed text-slate-800">“{section.quote}”</p>
          <footer className="mt-3 text-sm text-slate-600">
            — {section.author}
            {section.role ? `, ${section.role}` : ''}
            {section.organization ? ` · ${section.organization}` : ''}
          </footer>
        </blockquote>
      </OwwSection>
    );
  }

  if (type === 'cta_band') {
    return (
      <OwwPageHero
        eyebrow="Next step"
        title={section.title || 'Continue'}
        description={section.body || undefined}
        actions={<CtaLink href={resolveHref(section.cta_href, state)} label={section.cta_label} />}
      />
    );
  }

  return null;
  })();

  if (!interactive) {
    return <div className="pointer-events-none select-none">{body}</div>;
  }
  return body;
}

export function CmsPageRenderer({ page, state }: { page: ContentPage; state: string }) {
  const sections = page.sections || [];
  return (
    <div className="space-y-10">
      {sections.map((section, idx) => (
        <CmsSectionView key={`${section.type}-${idx}`} section={section} state={state} />
      ))}
    </div>
  );
}
