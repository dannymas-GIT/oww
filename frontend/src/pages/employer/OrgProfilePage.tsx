import { useEffect, useState } from 'react';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { getMyOrg, saveMyOrg } from '@/services/orgService';

export default function OrgProfilePage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [city, setCity] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    void getMyOrg()
      .then(o => {
        setName(o.name || '');
        setDescription(o.description || '');
        setWebsite(o.website || '');
        setCity(o.city || '');
      })
      .catch(() => undefined);
  }, []);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      await saveMyOrg({ name, description, website, city, answers: {} });
      setStatus('Organization saved.');
    } catch {
      setStatus('Could not save organization.');
    }
  }

  return (
    <div className="space-y-6">
      <OwwPageHero eyebrow="Employer" title="Organization profile" description="Public employer details used on the companies directory and job posts." />
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={onSave} className="grid max-w-2xl gap-4">
            <div className="space-y-2">
              <Label className="text-base" htmlFor="name">Name</Label>
              <Input id="name" className="min-h-[44px] text-base" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-base" htmlFor="city">City</Label>
              <Input id="city" className="min-h-[44px] text-base" value={city} onChange={e => setCity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-base" htmlFor="website">Website</Label>
              <Input id="website" className="min-h-[44px] text-base" value={website} onChange={e => setWebsite(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-base" htmlFor="desc">Description</Label>
              <Textarea id="desc" className="min-h-[120px] text-base" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            {status ? <p className="text-base text-emerald-700">{status}</p> : null}
            <Button type="submit" className="min-h-[44px] w-fit text-base">Save</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
