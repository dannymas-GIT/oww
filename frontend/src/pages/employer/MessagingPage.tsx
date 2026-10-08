import { useEffect, useState } from 'react';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { OwwEmptyState } from '@/components/oww/OwwEmptyState';
import { SampleBadge, SampleDataBanner } from '@/components/oww/SampleDataBanner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSamplePack } from '@/hooks/useSamplePack';
import { listThreads } from '@/services/messagingService';
import type { MessageThread } from '@/types';
import { formatDate } from '@/lib/format';

export default function MessagingPage() {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const sample = useSamplePack('messages');

  async function load() {
    try {
      setThreads(await listThreads());
      await sample.refresh();
    } catch {
      setThreads([]);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showingSample = sample.showingSample || threads.some(t => t.is_sample || t.showing_sample);

  return (
    <div className="space-y-6">
      <OwwPageHero eyebrow="Employer" title="Messaging" description="Conversations with candidates and partners." />
      {showingSample ? (
        <SampleDataBanner
          section="message"
          clearing={sample.clearing}
          onClear={async () => {
            await sample.clear();
            await load();
          }}
        />
      ) : null}
      {threads.length === 0 ? (
        <OwwEmptyState title="No message threads yet" description="Start outreach from candidate search or applications." />
      ) : (
        <div className="grid gap-3">
          {threads.map(t => (
            <Card key={t.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex flex-wrap items-center gap-2 font-display text-lg">
                  {t.subject}
                  {t.is_sample ? <SampleBadge /> : null}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-base text-slate-700">
                {t.peer_name ? <p className="font-medium text-oww-navy">With {t.peer_name}</p> : null}
                {t.preview ? <p className="leading-relaxed text-slate-600">{t.preview}</p> : null}
                <p className="text-sm text-slate-500">
                  Last activity {formatDate(t.last_message_at)}
                  {t.unread ? ` · ${t.unread} unread` : ''}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
