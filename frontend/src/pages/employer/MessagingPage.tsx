import { useEffect, useState } from 'react';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { OwwEmptyState } from '@/components/oww/OwwEmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { listThreads } from '@/services/messagingService';
import type { MessageThread } from '@/types';
import { formatDate } from '@/lib/format';

export default function MessagingPage() {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  useEffect(() => {
    void listThreads().then(setThreads).catch(() => setThreads([]));
  }, []);
  return (
    <div className="space-y-6">
      <OwwPageHero eyebrow="Employer" title="Messaging" description="Conversations with candidates and partners." />
      {threads.length === 0 ? (
        <OwwEmptyState title="No message threads yet" description="Start outreach from candidate search or applications." />
      ) : (
        <div className="grid gap-3">
          {threads.map(t => (
            <Card key={t.id}>
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-lg">{t.subject}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">
                Last activity {formatDate(t.last_message_at)}
                {t.unread ? ` · ${t.unread} unread` : ''}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
