import { useEffect, useState } from 'react';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { OwwSection } from '@/components/oww/OwwSection';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchTaxonomy } from '@/services/taxonomyService';
import { getMyProfile, saveMyProfile } from '@/services/profileService';
import type { TaxonomyCategory } from '@/types';

export default function IndividualProfilePage() {
  const [categories, setCategories] = useState<TaxonomyCategory[]>([]);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [displayName, setDisplayName] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    void fetchTaxonomy()
      .then(t => setCategories(t.categories || []))
      .catch(() => setCategories([]));
    void getMyProfile()
      .then(p => {
        setDisplayName(p.display_name || '');
        const next: Record<string, string[]> = {};
        Object.entries(p.answers || {}).forEach(([k, v]) => {
          next[k] = Array.isArray(v) ? (v as string[]) : v != null ? [String(v)] : [];
        });
        setAnswers(next);
      })
      .catch(() => undefined);
  }, []);

  function toggle(catId: string, optionId: string, multi?: boolean) {
    setAnswers(prev => {
      const cur = prev[catId] || [];
      if (!multi) return { ...prev, [catId]: [optionId] };
      return {
        ...prev,
        [catId]: cur.includes(optionId) ? cur.filter(x => x !== optionId) : [...cur, optionId],
      };
    });
  }

  async function onSave() {
    setStatus(null);
    try {
      await saveMyProfile({ display_name: displayName, answers });
      setStatus('Profile saved.');
    } catch {
      setStatus('Could not save profile.');
    }
  }

  return (
    <div className="space-y-6">
      <OwwPageHero
        eyebrow="Candidate profile"
        title="Individual questionnaire"
        description="Seventeen shared categories power matching with employers. Answer what you can today — you can refine later."
        actions={
          <Button className="min-h-[44px] text-base" onClick={onSave}>
            Save profile
          </Button>
        }
      />
      <div className="max-w-md space-y-2">
        <Label htmlFor="display" className="text-base">
          Display name
        </Label>
        <Input
          id="display"
          className="min-h-[44px] text-base"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
        />
      </div>
      {status ? <p className="text-base text-emerald-700">{status}</p> : null}
      <OwwSection>
        <div className="space-y-4">
          {(categories.length
            ? categories
            : [
                {
                  id: 'career_area',
                  label: 'Career area',
                  multi: true,
                  options: [
                    { id: 'drinking_water_treatment', label: 'Drinking water treatment' },
                    { id: 'wastewater_treatment', label: 'Wastewater treatment' },
                  ],
                },
              ]
          ).map(cat => (
            <Card key={cat.id}>
              <CardHeader>
                <CardTitle className="font-display text-lg">{cat.label}</CardTitle>
                {cat.individual_prompt ? (
                  <p className="text-base text-slate-600">{cat.individual_prompt}</p>
                ) : null}
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {cat.options.map(opt => {
                  const checked = (answers[cat.id] || []).includes(opt.id);
                  return (
                    <label key={opt.id} className="flex min-h-[44px] items-start gap-3 text-base">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggle(cat.id, opt.id, cat.multi !== false)}
                        className="mt-1"
                      />
                      <span>{opt.label}</span>
                    </label>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      </OwwSection>
    </div>
  );
}
