import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BellRing, Send, Users } from 'lucide-react';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { SortableTableHead } from '@/components/oww/SortableTableHead';
import { TableSearchFilter } from '@/components/oww/TableSearchFilter';
import { OwwEmptyState } from '@/components/oww/OwwEmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTableControls } from '@/hooks/useTableControls';
import { rowValue } from '@/lib/tableControls';
import { createCommunication, fetchRoleCatalog, listCommunications, previewAudience, sendCommunication, sendRenewalNotices } from '@/services/adminService';
import { formatDate, titleCase } from '@/lib/format';
import type { Communication, CommunicationAudience, RoleCatalogEntry } from '@/types';
import { cn } from '@/lib/utils';

const MEMBERSHIP_FILTERS: Array<{ id: NonNullable<CommunicationAudience['membership_status']>; label: string }> = [
  { id: 'any', label: 'Any membership state' },
  { id: 'active', label: 'Active members' },
  { id: 'expiring', label: 'Expiring soon' },
  { id: 'expired', label: 'Expired / lapsed' },
  { id: 'none', label: 'No membership' },
];

export default function AdminCommunicationsPage() {
  const [rows, setRows] = useState<Communication[]>([]);
  const [roles, setRoles] = useState<RoleCatalogEntry[]>([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [channel, setChannel] = useState<'email' | 'sms'>('email');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [membershipStatus, setMembershipStatus] = useState<NonNullable<CommunicationAudience['membership_status']>>('any');
  const [expiringDays, setExpiringDays] = useState('30');
  const [preview, setPreview] = useState<{ count: number; sample: Array<{ name: string; email: string }> } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setRows(await listCommunications());
    } catch {
      setRows([]);
    }
  }
  useEffect(() => {
    void load();
    fetchRoleCatalog().then(r => setRoles(r.roles)).catch(() => setRoles([]));
  }, []);

  const audience: CommunicationAudience = useMemo(
    () => ({
      roles: selectedRoles.length ? selectedRoles : undefined,
      membership_status: membershipStatus,
      expiring_days: membershipStatus === 'expiring' ? Number(expiringDays) || 30 : undefined,
    }),
    [selectedRoles, membershipStatus, expiringDays]
  );

  useEffect(() => {
    let alive = true;
    const t = window.setTimeout(() => {
      previewAudience({ subject: subject || '-', body: body || '-', channel, audience })
        .then(p => alive && setPreview(p))
        .catch(() => alive && setPreview(null));
    }, 250);
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, [audience, channel, subject, body]);

  const table = useTableControls({
    rows,
    getValue: useMemo(() => (row: Communication, key: string) => (key === 'sent_at' ? row.sent_at || row.created_at : rowValue(row, key)), []),
    getSearchText: useMemo(() => (row: Communication) => [row.subject, row.status, row.channel, ...(row.audience.roles || [])].filter(Boolean).join(' '), []),
    initialSortKey: 'sent_at',
    initialSortDir: 'desc',
  });

  async function submit(sendNow: boolean) {
    setError(null);
    setMsg(null);
    if (!subject.trim() || !body.trim()) {
      setError('Subject and message are required.');
      return;
    }
    setBusy(sendNow ? 'send' : 'draft');
    try {
      const c = await createCommunication({ subject, body, channel, audience });
      if (sendNow) {
        const sent = await sendCommunication(c.id);
        setMsg(`Sent to ${sent.recipient_count} recipient${sent.recipient_count === 1 ? '' : 's'}.`);
      } else {
        setMsg('Draft saved.');
      }
      setSubject('');
      setBody('');
      await load();
    } catch {
      setError('Could not save the message.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <OwwPageHero
        eyebrow="Administration"
        title="Communications portal"
        description="Reach members by role and membership state — welcome new utilities, remind lapsing employers, brief ambassadors."
        actions={
          <>
            <Button
              className="min-h-[44px] bg-oww-cyan text-base text-white hover:bg-sky-700"
              disabled={busy === 'renewal'}
              onClick={async () => {
                setBusy('renewal');
                setError(null);
                try {
                  const c = await sendRenewalNotices(30);
                  setMsg(`Renewal notices sent to ${c.recipient_count} member${c.recipient_count === 1 ? '' : 's'} expiring within 30 days.`);
                  await load();
                } catch {
                  setError('Could not send renewal notices.');
                } finally {
                  setBusy(null);
                }
              }}
            >
              <BellRing className="mr-2 h-5 w-5" aria-hidden />
              Send 30-day renewal notices
            </Button>
            <Button variant="outline" className="min-h-[44px] border-white/40 bg-white/10 text-base text-white hover:bg-white/20" asChild>
              <Link to="/admin">Back to dashboard</Link>
            </Button>
          </>
        }
      />

      {msg ? <p className="rounded-lg bg-emerald-50 p-3 text-base text-emerald-900">{msg}</p> : null}
      {error ? <p className="rounded-lg bg-rose-50 p-3 text-base text-rose-800">{error}</p> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <section className="min-w-0 space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-display text-xl font-semibold text-oww-navy">Compose</h2>
          <div className="flex gap-2" role="radiogroup" aria-label="Channel">
            {(['email', 'sms'] as const).map(c => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={channel === c}
                onClick={() => setChannel(c)}
                className={cn('min-h-[44px] rounded-lg border px-4 text-base font-medium', channel === c ? 'border-oww-cyan bg-sky-50 text-oww-navy' : 'border-slate-200 text-slate-600')}
              >
                {c === 'email' ? 'Email' : 'SMS'}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-base">Subject</Label>
            <Input id="subject" className="min-h-[44px] text-base" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Membership renewal reminder" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="body" className="text-base">Message</Label>
            <Textarea id="body" rows={7} className="text-base" value={body} onChange={e => setBody(e.target.value)} placeholder="Hi {{name}}, …" />
            <p className="text-sm text-slate-500">Use {'{{name}}'} to personalize.</p>
          </div>

          <fieldset className="space-y-3">
            <legend className="text-base font-semibold text-oww-navy">Audience</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {roles.map(r => {
                const checked = selectedRoles.includes(r.code);
                return (
                  <label key={r.code} className={cn('flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-base', checked ? 'border-oww-cyan bg-sky-50' : 'border-slate-200')}>
                    <input
                      type="checkbox"
                      className="h-5 w-5 rounded border-slate-300 text-oww-cyan"
                      checked={checked}
                      onChange={e => setSelectedRoles(prev => (e.target.checked ? [...prev, r.code] : prev.filter(x => x !== r.code)))}
                    />
                    <span>{r.label}</span>
                  </label>
                );
              })}
            </div>
            <p className="text-sm text-slate-500">Leave all roles unchecked to include everyone matching the membership filter.</p>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <select
                aria-label="Membership state"
                className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 text-base"
                value={membershipStatus}
                onChange={e => setMembershipStatus(e.target.value as typeof membershipStatus)}
              >
                {MEMBERSHIP_FILTERS.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
              {membershipStatus === 'expiring' ? (
                <Input aria-label="Expiring within days" type="number" min={1} className="min-h-[44px] w-32 text-base" value={expiringDays} onChange={e => setExpiringDays(e.target.value)} />
              ) : null}
            </div>
          </fieldset>

          <div className="space-y-3 rounded-lg bg-slate-50 p-3">
            <div className="flex items-start gap-2 text-base text-slate-700">
              <Users className="mt-0.5 h-5 w-5 shrink-0 text-oww-cyan" aria-hidden />
              {preview ? (
                <p>
                  <strong>{preview.count}</strong> recipient{preview.count === 1 ? '' : 's'}
                  {preview.sample.length ? <span className="block text-sm text-slate-500">e.g. {preview.sample.map(s => s.name).join(', ')}</span> : null}
                </p>
              ) : (
                <p>Calculating audience…</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="min-h-[44px] text-base" disabled={!!busy} onClick={() => submit(false)}>
                Save draft
              </Button>
              <Button className="min-h-[44px] bg-oww-cyan text-base text-white hover:bg-sky-700" disabled={!!busy || !preview?.count} onClick={() => submit(true)}>
                <Send className="mr-2 h-4 w-4" aria-hidden />
                {busy === 'send' ? 'Sending…' : 'Send now'}
              </Button>
            </div>
          </div>
        </section>

        <section className="min-w-0 space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold text-oww-navy">History ({table.totalCount})</h2>
            <p className="text-sm text-slate-600">Filtered ({table.resultCount}) · All ({table.totalCount})</p>
          </div>
          <TableSearchFilter value={table.filter} onChange={table.setFilter} resultCount={table.resultCount} totalCount={table.totalCount} />
          {table.totalCount === 0 ? (
            <OwwEmptyState title="No communications yet" description="Send your first message from the composer." />
          ) : table.resultCount === 0 ? (
            <OwwEmptyState title="No messages match your filter" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHead column="subject" label="Subject" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                    <SortableTableHead column="status" label="Status" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                    <SortableTableHead column="recipient_count" label="Sent to" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} align="right" />
                    <SortableTableHead column="sent_at" label="Date" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {table.rows.map(c => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <p className="text-base font-medium">{c.subject}</p>
                        <p className="text-sm text-slate-500">
                          {titleCase(c.channel)}
                          {c.audience.roles?.length ? ` · ${c.audience.roles.map(titleCase).join(', ')}` : ''}
                          {c.audience.membership_status && c.audience.membership_status !== 'any' ? ` · ${titleCase(c.audience.membership_status)}` : ''}
                        </p>
                      </TableCell>
                      <TableCell>
                        <span className={cn('rounded-full px-2.5 py-0.5 text-sm font-semibold', c.status === 'sent' ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-100 text-slate-700')}>{titleCase(c.status)}</span>
                      </TableCell>
                      <TableCell className="text-right text-base">{c.recipient_count}</TableCell>
                      <TableCell className="text-base">{formatDate(c.sent_at || c.created_at)}</TableCell>
                      <TableCell>
                        {c.status === 'draft' ? (
                          <Button
                            variant="outline"
                            className="min-h-[44px] text-base"
                            disabled={busy === `send-${c.id}`}
                            onClick={async () => {
                              setBusy(`send-${c.id}`);
                              try {
                                const sent = await sendCommunication(c.id);
                                setMsg(`Sent “${sent.subject}” to ${sent.recipient_count}.`);
                                await load();
                              } finally {
                                setBusy(null);
                              }
                            }}
                          >
                            Send
                          </Button>
                        ) : (
                          <span className="text-sm text-slate-500">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
