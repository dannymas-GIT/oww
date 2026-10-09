import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { DEFAULT_STATE } from '@/lib/constants';
import { getMyOrg, saveMyOrg } from '@/services/orgService';
import { fetchRoleCatalog } from '@/services/adminService';
import { titleCase } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { PublicSharePrefs } from '@/types';

const ROLE_CHIP: Record<string, string> = {
  utility_admin: 'bg-sky-100 text-sky-900',
  utility_manager: 'bg-cyan-100 text-cyan-900',
  employer: 'bg-teal-100 text-teal-900',
  employer_admin: 'bg-teal-100 text-teal-900',
  employer_member: 'bg-teal-50 text-teal-800',
};

const DEFAULT_PREFS: PublicSharePrefs = {
  open_jobs: false,
  hires_12mo: false,
  applicants_contacted: false,
  hiring_projection: false,
  workforce_size: false,
  show_region: false,
};

const DEFAULT_LABELS: Record<keyof PublicSharePrefs, string> = {
  open_jobs: 'Open job count',
  hires_12mo: 'Hires reported (12 mo)',
  applicants_contacted: 'Applicants contacted',
  hiring_projection: 'Hiring projection (next 12 mo)',
  workforce_size: 'Approximate workforce size',
  show_region: 'Region / county on public stats',
};

export default function OrgProfilePage() {
  const { user, isUtilityAdmin, isUtilityManager } = useAuth();
  const isUtility = isUtilityAdmin || isUtilityManager;
  const [orgId, setOrgId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [city, setCity] = useState('');
  const [prefs, setPrefs] = useState<PublicSharePrefs>({ ...DEFAULT_PREFS });
  const [shareLabels, setShareLabels] = useState<Record<string, string>>(DEFAULT_LABELS);
  const [canEditShare, setCanEditShare] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [roleLabels, setRoleLabels] = useState<Map<string, string>>(new Map());
  const [state, setState] = useState(DEFAULT_STATE);

  useEffect(() => {
    void getMyOrg()
      .then(o => {
        setOrgId(o.id ?? null);
        setName(o.name || '');
        setDescription(o.description || '');
        setWebsite(o.website || '');
        setCity(o.city || '');
        setState((o.state_code || DEFAULT_STATE).toLowerCase());
        setPrefs({ ...DEFAULT_PREFS, ...(o.public_share_prefs || {}) });
        if (o.share_labels) setShareLabels({ ...DEFAULT_LABELS, ...o.share_labels });
        setCanEditShare(Boolean(o.can_edit_public_share));
      })
      .catch(() => undefined);
    fetchRoleCatalog()
      .then(r => setRoleLabels(new Map(r.roles.map(x => [x.code, x.label]))))
      .catch(() => setRoleLabels(new Map()));
  }, []);

  const displayRoles = useMemo(() => user?.roles || [], [user]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      const body: Parameters<typeof saveMyOrg>[0] = {
        name,
        description,
        website,
        city,
        answers: {},
      };
      if (canEditShare) {
        body.public_share_prefs = prefs;
      }
      await saveMyOrg(body);
      setStatus(isUtility ? 'Utility profile saved.' : 'Organization saved.');
    } catch {
      setStatus(isUtility ? 'Could not save utility profile.' : 'Could not save organization.');
    }
  }

  function togglePref(key: keyof PublicSharePrefs) {
    if (!canEditShare) return;
    setPrefs(p => ({ ...p, [key]: !p[key] }));
  }

  return (
    <div className="space-y-6">
      <OwwPageHero
        eyebrow={isUtility ? 'Utility' : 'Employer'}
        title={isUtility ? 'Utility profile' : 'Organization profile'}
        description={
          isUtility
            ? 'Your utility’s public details, optional workforce-stats sharing, and the OWW roles on your account.'
            : 'Public employer details and optional workforce-stats sharing used on the companies directory.'
        }
      />

      {isUtility ? (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="font-display text-xl text-oww-navy">Your OWW roles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-lg text-slate-700">
              Signed in as <span className="font-semibold text-oww-navy">{user?.full_name || user?.username}</span>
              {user?.email ? <span className="text-slate-600"> · {user.email}</span> : null}
            </p>
            <div className="flex flex-wrap gap-2">
              {displayRoles.length ? (
                displayRoles.map(code => (
                  <span
                    key={code}
                    className={cn(
                      'inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold',
                      ROLE_CHIP[code] ?? 'bg-slate-100 text-slate-700'
                    )}
                  >
                    {roleLabels.get(code) || titleCase(code)}
                  </span>
                ))
              ) : (
                <p className="text-base text-slate-600">No roles assigned.</p>
              )}
            </div>
            <p className="text-base text-slate-600">
              Staff accounts are managed in Water Workforce 360 after you open it from the hiring workspace — not under a Users
              area on OWW.
            </p>
            <Button variant="outline" className="min-h-[44px] text-base" asChild>
              <Link to="/profile">Account &amp; password</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl text-oww-navy">
            {isUtility ? 'Utility details' : 'Organization details'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSave} className="grid max-w-2xl gap-4">
            <div className="space-y-2">
              <Label className="text-base" htmlFor="name">
                {isUtility ? 'Utility name' : 'Name'}
              </Label>
              <Input id="name" className="min-h-[44px] text-base" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-base" htmlFor="city">
                City
              </Label>
              <Input id="city" className="min-h-[44px] text-base" value={city} onChange={e => setCity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-base" htmlFor="website">
                Website
              </Label>
              <Input id="website" className="min-h-[44px] text-base" value={website} onChange={e => setWebsite(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-base" htmlFor="desc">
                Description
              </Label>
              <Textarea
                id="desc"
                className="min-h-[120px] text-base"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
            {status ? <p className="text-base text-emerald-700">{status}</p> : null}
            <Button type="submit" className="min-h-[44px] w-fit text-base">
              Save
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-slate-200" data-tour="public-share">
        <CardHeader>
          <CardTitle className="font-display text-xl text-oww-navy">Public data sharing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg leading-relaxed text-slate-700">
            Opt in to share aggregate workforce statistics on the public workforce-stats page and your company profile.
            Everything is off by default. No candidate names or application details are ever published.
          </p>
          {!canEditShare ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-base text-amber-950">
              Only utility admins, employer admins, or platform admins can change these settings. You can still view the current
              choices.
            </p>
          ) : null}
          <ul className="space-y-2">
            {(Object.keys(DEFAULT_PREFS) as Array<keyof PublicSharePrefs>).map(key => (
              <li key={key}>
                <label className="flex min-h-[44px] cursor-pointer items-center gap-3 text-base text-slate-800">
                  <input
                    type="checkbox"
                    className="h-5 w-5"
                    checked={Boolean(prefs[key])}
                    disabled={!canEditShare}
                    onChange={() => togglePref(key)}
                  />
                  <span>{shareLabels[key] || DEFAULT_LABELS[key]}</span>
                </label>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3">
            {canEditShare ? (
              <Button
                type="button"
                className="min-h-[44px] text-base"
                onClick={() => {
                  void saveMyOrg({
                    name,
                    description,
                    website,
                    city,
                    answers: {},
                    public_share_prefs: prefs,
                  })
                    .then(() => setStatus('Public sharing preferences saved.'))
                    .catch(() => setStatus('Could not save sharing preferences.'));
                }}
              >
                Save sharing preferences
              </Button>
            ) : null}
            {orgId ? (
              <Button variant="outline" className="min-h-[44px] text-base" asChild>
                <Link to={`/${state}/companies/${orgId}?from=stats`}>Preview company page</Link>
              </Button>
            ) : null}
            <Button variant="outline" className="min-h-[44px] text-base" asChild>
              <Link to={`/${state}/workforce-stats`}>View statewide stats</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
