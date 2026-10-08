import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { getMyOrg, saveMyOrg } from '@/services/orgService';
import { fetchRoleCatalog } from '@/services/adminService';
import { titleCase } from '@/lib/format';
import { cn } from '@/lib/utils';

const ROLE_CHIP: Record<string, string> = {
  utility_admin: 'bg-sky-100 text-sky-900',
  utility_manager: 'bg-cyan-100 text-cyan-900',
  employer: 'bg-teal-100 text-teal-900',
  employer_admin: 'bg-teal-100 text-teal-900',
  employer_member: 'bg-teal-50 text-teal-800',
};

export default function OrgProfilePage() {
  const { user, isUtilityAdmin, isUtilityManager } = useAuth();
  const isUtility = isUtilityAdmin || isUtilityManager;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [city, setCity] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [roleLabels, setRoleLabels] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    void getMyOrg()
      .then(o => {
        setName(o.name || '');
        setDescription(o.description || '');
        setWebsite(o.website || '');
        setCity(o.city || '');
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
      await saveMyOrg({ name, description, website, city, answers: {} });
      setStatus(isUtility ? 'Utility profile saved.' : 'Organization saved.');
    } catch {
      setStatus(isUtility ? 'Could not save utility profile.' : 'Could not save organization.');
    }
  }

  return (
    <div className="space-y-6">
      <OwwPageHero
        eyebrow={isUtility ? 'Utility' : 'Employer'}
        title={isUtility ? 'Utility profile' : 'Organization profile'}
        description={
          isUtility
            ? 'Your utility’s public details and the OWW roles on your account. Invite managers and team members from Water Workforce 360.'
            : 'Public employer details used on the companies directory and job posts.'
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
    </div>
  );
}
