import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Gift, KeyRound, Lock, LockOpen, Plus, Shield, UserRoundPen } from 'lucide-react';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { SortableTableHead } from '@/components/oww/SortableTableHead';
import { TableSearchFilter } from '@/components/oww/TableSearchFilter';
import { OwwEmptyState } from '@/components/oww/OwwEmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTableControls } from '@/hooks/useTableControls';
import { rowValue } from '@/lib/tableControls';
import { useAuth } from '@/context/AuthContext';
import {
  compMembership,
  createUser,
  fetchRoleCatalog,
  listOrganizations,
  listOrgUsers,
  listUsers,
  resetUserPassword,
  setUserRoles,
  updateUser,
} from '@/services/adminService';
import type { OrgOption, OwwUser, RoleCatalogEntry } from '@/types';
import { initials, titleCase } from '@/lib/format';
import { cn } from '@/lib/utils';

const TIER_LABEL: Record<RoleCatalogEntry['tier'], string> = {
  national: 'National (platform)',
  state: 'State',
  utility: 'Utility / employer',
  community: 'Community',
};
const TIER_ORDER: RoleCatalogEntry['tier'][] = ['national', 'state', 'utility', 'community'];

const ROLE_CHIP: Record<string, string> = {
  platform_admin: 'bg-oww-navy text-white',
  platform_editor: 'bg-sky-100 text-sky-900',
  platform_ops: 'bg-cyan-100 text-cyan-900',
  platform_manager: 'bg-indigo-100 text-indigo-900',
  state_admin: 'bg-indigo-100 text-indigo-900',
  utility_admin: 'bg-sky-100 text-sky-900',
  utility_manager: 'bg-cyan-100 text-cyan-900',
  employer: 'bg-teal-100 text-teal-900',
  employer_member: 'bg-teal-50 text-teal-800',
  educator: 'bg-violet-100 text-violet-900',
  ambassador: 'bg-amber-100 text-amber-900',
  student: 'bg-lime-100 text-lime-900',
  individual: 'bg-slate-100 text-slate-700',
};

function RoleChip({ code, label }: { code: string; label?: string }) {
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-semibold', ROLE_CHIP[code] ?? 'bg-slate-100 text-slate-700')}>{label ?? titleCase(code)}</span>;
}

function RoleCheckboxes({
  catalog,
  assignable,
  value,
  onChange,
}: {
  catalog: RoleCatalogEntry[];
  assignable: Set<string>;
  value: string[];
  onChange: (roles: string[]) => void;
}) {
  return (
    <div className="space-y-4">
      {TIER_ORDER.map(tier => {
        const roles = catalog.filter(r => r.tier === tier);
        if (!roles.length) return null;
        return (
          <fieldset key={tier} className="space-y-2">
            <legend className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              {TIER_LABEL[tier]}
              {roles.every(r => r.locked) ? <Lock className="h-3.5 w-3.5" aria-label="Locked tier" /> : null}
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {roles.map(r => {
                const checked = value.includes(r.code);
                const disabled = !assignable.has(r.code) && !checked;
                return (
                  <label
                    key={r.code}
                    className={cn(
                      'flex min-h-[56px] cursor-pointer items-start gap-3 rounded-lg border px-3 py-2',
                      checked ? 'border-oww-cyan bg-sky-50' : 'border-slate-200',
                      disabled || (r.locked && !assignable.has(r.code)) ? 'cursor-not-allowed opacity-60' : ''
                    )}
                  >
                    <input
                      type="checkbox"
                      className="mt-1 h-5 w-5 rounded border-slate-300 text-oww-cyan"
                      checked={checked}
                      disabled={disabled || (r.locked && !assignable.has(r.code))}
                      onChange={e => onChange(e.target.checked ? [...value, r.code] : value.filter(x => x !== r.code))}
                    />
                    <span>
                      <span className="flex items-center gap-1 text-base font-medium text-slate-800">
                        {r.label}
                        {r.locked ? <Lock className="h-3.5 w-3.5 text-slate-500" aria-hidden /> : null}
                      </span>
                      <span className="block text-sm text-slate-500">{r.description}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}

export default function AdminUsersPage() {
  const { user: me, isPlatformAdmin, isStateAdmin } = useAuth();
  const isGlobalAdmin = isPlatformAdmin || isStateAdmin;
  const [tab, setTab] = useState<'users' | 'roles'>('users');
  const [rows, setRows] = useState<OwwUser[]>([]);
  const [catalog, setCatalog] = useState<RoleCatalogEntry[]>([]);
  const [assignable, setAssignable] = useState<Set<string>>(new Set());
  const [orgs, setOrgs] = useState<OrgOption[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // dialogs
  const [addOpen, setAddOpen] = useState(false);
  const [rolesTarget, setRolesTarget] = useState<OwwUser | null>(null);
  const [resetTarget, setResetTarget] = useState<OwwUser | null>(null);
  const [compTarget, setCompTarget] = useState<OwwUser | null>(null);
  const [form, setForm] = useState({ username: '', email: '', full_name: '', phone: '', org_id: '', roles: [] as string[], temporary_password: '' });
  const [rolesDraft, setRolesDraft] = useState<string[]>([]);
  const [newPassword, setNewPassword] = useState('');
  const [compDays, setCompDays] = useState('365');
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{ username: string; temporary_password: string } | null>(null);

  async function load() {
    try {
      setRows(isGlobalAdmin ? await listUsers() : await listOrgUsers());
    } catch {
      setRows([]);
    }
  }
  useEffect(() => {
    void load();
    fetchRoleCatalog()
      .then(r => {
        setCatalog(r.roles);
        setAssignable(new Set(r.assignable));
      })
      .catch(() => setCatalog([]));
    if (isGlobalAdmin) listOrganizations().then(setOrgs).catch(() => setOrgs([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGlobalAdmin]);

  const orgName = useMemo(() => new Map(orgs.map(o => [o.id, o.name])), [orgs]);
  const roleLabel = useMemo(() => new Map(catalog.map(r => [r.code, r.label])), [catalog]);

  const table = useTableControls({
    rows,
    getValue: useMemo(
      () => (row: OwwUser, key: string) => {
        if (key === 'roles') return (row.roles || []).join(', ');
        if (key === 'is_active') return row.is_active === false ? 0 : 1;
        if (key === 'org') return row.org_id ? orgName.get(row.org_id) ?? `#${row.org_id}` : '';
        return rowValue(row, key);
      },
      [orgName]
    ),
    getSearchText: useMemo(
      () => (row: OwwUser) => [row.full_name, row.username, row.email, row.org_id ? orgName.get(row.org_id) : '', ...(row.roles || [])].filter(Boolean).join(' '),
      [orgName]
    ),
    initialSortKey: 'full_name',
  });

  function flash(text: string) {
    setMsg(text);
    setError(null);
    window.setTimeout(() => setMsg(null), 6000);
  }
  function fail(text: string) {
    setError(text);
    setMsg(null);
  }

  return (
    <div className="space-y-6">
      <OwwPageHero
        eyebrow="Administration"
        title="Users & access"
        description={
          isPlatformAdmin
            ? 'Platform staff with permissions on OWW (admin, editor, ops, manager). Soft-deactivate preferred over delete. Only platform administrators can create accounts and delegate roles. Candidates, hirers, ambassadors, and educators live under People directories.'
            : isGlobalAdmin
              ? 'Platform staff accounts. Creating users on OWW is limited to platform administrators. Audience directories are under People.'
              : 'View your organization’s OWW accounts. Invite managers and team members from Water Workforce 360 after you open it from the hiring workspace.'
        }
        badges={
          <span className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/30">
            National → State → Utility hierarchy · mirrors WW360
          </span>
        }
        actions={
          isPlatformAdmin ? (
            <Button
              className="min-h-[44px] bg-oww-cyan text-base text-white hover:bg-sky-700"
              data-tour="users-add"
              onClick={() => {
                setForm({ username: '', email: '', full_name: '', phone: '', org_id: me?.org_id ? String(me.org_id) : '', roles: [], temporary_password: '' });
                setCreated(null);
                setAddOpen(true);
              }}
            >
              <Plus className="mr-2 h-5 w-5" aria-hidden />
              Add user
            </Button>
          ) : null
        }
      />

      {msg ? <p className="rounded-lg bg-emerald-50 p-3 text-base text-emerald-900">{msg}</p> : null}
      {error ? <p className="rounded-lg bg-rose-50 p-3 text-base text-rose-800">{error}</p> : null}

      <div role="tablist" aria-label="Users and roles" className="flex gap-1 border-b border-slate-200" data-tour="users-tabs">
        {(
          [
            { id: 'users', label: 'Users' },
            { id: 'roles', label: 'Roles & permissions' },
          ] as const
        ).map(t => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn('min-h-[44px] border-b-2 px-4 text-base font-medium transition', tab === t.id ? 'border-oww-cyan text-oww-navy' : 'border-transparent text-slate-600 hover:text-oww-navy')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'users' ? (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold">Users ({table.totalCount})</h2>
            <p className="text-sm text-slate-600">
              Filtered ({table.resultCount}) · All ({table.totalCount})
            </p>
          </div>
          <TableSearchFilter value={table.filter} onChange={table.setFilter} resultCount={table.resultCount} totalCount={table.totalCount} />
          {table.totalCount === 0 ? (
            <OwwEmptyState title="No users in dataset" />
          ) : table.resultCount === 0 ? (
            <OwwEmptyState title="No users match your filter" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHead column="full_name" label="User" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                    <SortableTableHead column="roles" label="Roles" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                    {isGlobalAdmin ? <SortableTableHead column="org" label="Organization" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} /> : null}
                    <SortableTableHead column="is_active" label="Status" sortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {table.rows.map(u => {
                    const inactive = u.is_active === false;
                    const protectedUser = (u.roles || []).some(r => r === 'platform_admin' || r === 'state_admin');
                    const canEdit = isPlatformAdmin || (!protectedUser && (isStateAdmin || !!me?.org_id));
                    return (
                      <TableRow key={u.id} className={inactive ? 'opacity-60' : undefined}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-100 text-base font-semibold text-sky-900">{initials(u.full_name || u.username)}</span>
                            <div>
                              <p className="text-base font-medium">{u.full_name || u.username}</p>
                              <p className="text-sm text-slate-500">
                                {u.username} · {u.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(u.roles || []).map(r => (
                              <RoleChip key={r} code={r} label={roleLabel.get(r)} />
                            ))}
                          </div>
                        </TableCell>
                        {isGlobalAdmin ? <TableCell className="text-base">{u.org_id ? orgName.get(u.org_id) ?? `#${u.org_id}` : '—'}</TableCell> : null}
                        <TableCell>
                          <span className={cn('inline-flex rounded-full px-3 py-1 text-sm font-semibold', inactive ? 'bg-slate-200 text-slate-700' : 'bg-emerald-100 text-emerald-900')}>{inactive ? 'Inactive' : 'Active'}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              className="min-h-[44px] min-w-[44px]"
                              aria-label={`Edit roles for ${u.username}`}
                              title="Roles"
                              disabled={!canEdit}
                              onClick={() => {
                                setRolesTarget(u);
                                setRolesDraft(u.roles || []);
                              }}
                            >
                              <Shield className="h-5 w-5" />
                            </Button>
                            {isGlobalAdmin ? (
                              <Button type="button" variant="ghost" className="min-h-[44px] min-w-[44px]" aria-label={`Reset password for ${u.username}`} title="Reset password" disabled={!canEdit} onClick={() => setResetTarget(u)}>
                                <KeyRound className="h-5 w-5" />
                              </Button>
                            ) : null}
                            {isPlatformAdmin && (u.roles || []).some(r => ['employer', 'employer_member', 'utility_admin', 'utility_manager'].includes(r)) ? (
                              <Button type="button" variant="ghost" className="min-h-[44px] min-w-[44px]" aria-label={`Grant complimentary membership to ${u.username}`} title="Comp membership" onClick={() => setCompTarget(u)}>
                                <Gift className="h-5 w-5" />
                              </Button>
                            ) : null}
                            {isGlobalAdmin ? (
                              <Button
                                type="button"
                                variant="ghost"
                                className="min-h-[44px] min-w-[44px]"
                                aria-label={inactive ? `Reactivate ${u.username}` : `Deactivate ${u.username}`}
                                title={inactive ? 'Reactivate' : 'Deactivate'}
                                disabled={!canEdit || u.id === me?.id}
                                onClick={async () => {
                                  try {
                                    await updateUser(u.id, { is_active: inactive });
                                    flash(`${u.username} ${inactive ? 'reactivated' : 'deactivated'}.`);
                                    await load();
                                  } catch {
                                    fail('Could not update the account.');
                                  }
                                }}
                              >
                                {inactive ? <LockOpen className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-lg text-slate-700">
            National and State tiers are locked system roles. Utility administrators fine-tune only their own utility’s managers and team members. The same
            vocabulary is used by Water Workforce 360, so accounts can federate later.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {TIER_ORDER.map(tier => {
              const roles = catalog.filter(r => r.tier === tier);
              const locked = roles.length > 0 && roles.every(r => r.locked);
              return (
                <section key={tier} className={cn('rounded-xl border bg-white p-5 shadow-sm', locked ? 'border-slate-300 bg-slate-50' : 'border-slate-200')}>
                  <h3 className="flex items-center gap-2 font-display text-xl font-semibold text-oww-navy">
                    {TIER_LABEL[tier]}
                    {locked ? <Lock className="h-4 w-4 text-slate-500" aria-label="Locked" /> : null}
                  </h3>
                  <ul className="mt-3 space-y-3">
                    {roles.map(r => (
                      <li key={r.code} className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <RoleChip code={r.code} label={r.label} />
                            <span className="text-sm text-slate-500">{r.category}</span>
                          </div>
                          <p className="mt-1 text-base text-slate-700">{r.description}</p>
                        </div>
                        <span className={cn('shrink-0 rounded-full px-2.5 py-0.5 text-sm font-medium', assignable.has(r.code) ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600')}>
                          {assignable.has(r.code) ? 'You can assign' : 'Read-only'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
          <p className="text-sm text-slate-500">
            Membership entitlements (job posting, candidate search) are enforced by plan, not role — see <Link to="/admin/memberships" className="underline">Memberships</Link>.
          </p>
        </div>
      )}

      {/* Add user */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Add user</DialogTitle>
            <DialogDescription className="text-base">A temporary password is generated; the user must change it on first sign-in.</DialogDescription>
          </DialogHeader>
          {created ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-base text-emerald-900">
                <p className="font-semibold">Account created for {created.username}.</p>
                <p className="mt-2">
                  Temporary password: <code className="rounded bg-white px-2 py-1 font-mono text-base">{created.temporary_password}</code>
                </p>
                <p className="mt-2 text-sm">Share it securely. It is shown only once.</p>
              </div>
              <DialogFooter>
                <Button className="min-h-[44px] text-base" onClick={() => setAddOpen(false)}>
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={async e => {
                e.preventDefault();
                if (!form.roles.length) {
                  fail('Select at least one role.');
                  return;
                }
                setBusy(true);
                try {
                  const res = await createUser({
                    username: form.username.trim(),
                    email: form.email.trim(),
                    full_name: form.full_name.trim() || undefined,
                    phone: form.phone.trim() || undefined,
                    roles: form.roles,
                    org_id: form.org_id ? Number(form.org_id) : undefined,
                    temporary_password: form.temporary_password || undefined,
                  });
                  setCreated({ username: res.username, temporary_password: res.temporary_password });
                  flash(`Created ${res.username}.`);
                  await load();
                } catch (err) {
                  const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
                  fail(typeof detail === 'string' ? detail : 'Could not create the user.');
                } finally {
                  setBusy(false);
                }
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-base">Full name</Label>
                  <Input id="full_name" className="min-h-[44px] text-base" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-base">Username</Label>
                  <Input id="username" required className="min-h-[44px] text-base" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base">Email</Label>
                  <Input id="email" type="email" required className="min-h-[44px] text-base" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-base">Phone (optional)</Label>
                  <Input id="phone" className="min-h-[44px] text-base" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                {isGlobalAdmin ? (
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="org" className="text-base">Organization (utility / employer roles)</Label>
                    <select id="org" className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-base" value={form.org_id} onChange={e => setForm({ ...form, org_id: e.target.value })}>
                      <option value="">— None —</option>
                      {orgs.map(o => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="temp" className="text-base">Temporary password (optional — generated if blank)</Label>
                  <Input id="temp" className="min-h-[44px] text-base" value={form.temporary_password} onChange={e => setForm({ ...form, temporary_password: e.target.value })} />
                </div>
              </div>
              <RoleCheckboxes catalog={catalog} assignable={assignable} value={form.roles} onChange={roles => setForm({ ...form, roles })} />
              <DialogFooter>
                <Button type="button" variant="outline" className="min-h-[44px] text-base" onClick={() => setAddOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={busy} className="min-h-[44px] bg-oww-cyan text-base text-white hover:bg-sky-700">
                  {busy ? 'Creating…' : 'Create user'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit roles */}
      <Dialog open={!!rolesTarget} onOpenChange={o => !o && setRolesTarget(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Roles — {rolesTarget?.full_name || rolesTarget?.username}</DialogTitle>
            <DialogDescription className="text-base">Locked tiers cannot be granted or removed by utility or state administrators.</DialogDescription>
          </DialogHeader>
          <RoleCheckboxes catalog={catalog} assignable={assignable} value={rolesDraft} onChange={setRolesDraft} />
          <DialogFooter>
            <Button variant="outline" className="min-h-[44px] text-base" onClick={() => setRolesTarget(null)}>
              Cancel
            </Button>
            <Button
              className="min-h-[44px] bg-oww-cyan text-base text-white hover:bg-sky-700"
              disabled={busy || !rolesDraft.length}
              onClick={async () => {
                if (!rolesTarget) return;
                setBusy(true);
                try {
                  await setUserRoles(rolesTarget.id, rolesDraft);
                  flash(`Roles updated for ${rolesTarget.username}.`);
                  setRolesTarget(null);
                  await load();
                } catch (err) {
                  const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
                  fail(typeof detail === 'string' ? detail : 'Could not update roles.');
                } finally {
                  setBusy(false);
                }
              }}
            >
              <UserRoundPen className="mr-2 h-4 w-4" aria-hidden />
              {busy ? 'Saving…' : 'Save roles'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset password */}
      <Dialog open={!!resetTarget} onOpenChange={o => !o && setResetTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Reset password — {resetTarget?.username}</DialogTitle>
            <DialogDescription className="text-base">Admin resets are audited. The password is never logged.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="newpw" className="text-base">New password</Label>
            <Input id="newpw" type="text" className="min-h-[44px] text-base" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" className="min-h-[44px] text-base" onClick={() => setResetTarget(null)}>
              Cancel
            </Button>
            <Button
              className="min-h-[44px] bg-oww-cyan text-base text-white hover:bg-sky-700"
              disabled={busy || newPassword.length < 8}
              onClick={async () => {
                if (!resetTarget) return;
                setBusy(true);
                try {
                  await resetUserPassword(resetTarget.id, newPassword);
                  flash(`Password reset for ${resetTarget.username}.`);
                  setResetTarget(null);
                  setNewPassword('');
                } catch {
                  fail('Could not reset the password.');
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? 'Saving…' : 'Reset password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comp membership */}
      <Dialog open={!!compTarget} onOpenChange={o => !o && setCompTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Complimentary membership — {compTarget?.username}</DialogTitle>
            <DialogDescription className="text-base">Grants paid-tier access without checkout (sponsors, pilots, NYSAWWA partners). Logged to billing events.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="compdays" className="text-base">Days</Label>
            <Input id="compdays" type="number" min={1} className="min-h-[44px] text-base" value={compDays} onChange={e => setCompDays(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" className="min-h-[44px] text-base" onClick={() => setCompTarget(null)}>
              Cancel
            </Button>
            <Button
              className="min-h-[44px] bg-oww-cyan text-base text-white hover:bg-sky-700"
              disabled={busy}
              onClick={async () => {
                if (!compTarget) return;
                setBusy(true);
                try {
                  await compMembership(compTarget.id, { days: Number(compDays) || 365 });
                  flash(`Complimentary membership granted to ${compTarget.username}.`);
                  setCompTarget(null);
                } catch {
                  fail('Could not grant membership.');
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Gift className="mr-2 h-4 w-4" aria-hidden />
              {busy ? 'Granting…' : 'Grant'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
