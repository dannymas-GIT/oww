import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DEFAULT_STATE } from '@/lib/constants';
import { submitInterest } from '@/services/publicService';

const schema = z.object({
  first_name: z.string().min(1, 'Required'),
  last_name: z.string().min(1, 'Required'),
  email: z.string().email(),
  phone: z.string().optional(),
  organization: z.string().optional(),
  pathway: z.string().min(1),
  county: z.string().optional(),
  hear_about: z.string().optional(),
  message: z.string().optional(),
  consent_contact: z.boolean().refine(v => v, 'Consent is required'),
});

type FormValues = z.infer<typeof schema>;

export default function InterestFormPage() {
  const params = useParams();
  const [sp] = useSearchParams();
  const state = (params.state || DEFAULT_STATE).toLowerCase();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      organization: '',
      pathway: sp.get('pathway') || 'career',
      county: '',
      hear_about: '',
      message: '',
      consent_contact: false,
    },
  });

  async function onSubmit(values: FormValues) {
    setError(null);
    try {
      await submitInterest({ ...values, state_code: state.toUpperCase() });
      setDone(true);
    } catch {
      setError('Submission failed. Please try again.');
    }
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" className="min-h-[44px] px-0 text-base text-sky-800" asChild>
        <Link to={`/${state}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {state.toUpperCase()} home
        </Link>
      </Button>
      <OwwPageHero
        eyebrow="Connect"
        title="Express interest"
        description="Tell us how you want to engage. Fields mirror the statewide outreach intake so partners can follow up."
      />
      <Card>
        <CardContent className="pt-6">
          {done ? (
            <div className="space-y-3 text-lg">
              <p className="font-semibold text-navy">Thank you — we received your interest.</p>
              <p className="text-slate-600">A partner will follow up using the contact details you provided.</p>
              <Button className="min-h-[44px] text-base" asChild>
                <Link to={`/${state}`}>Return home</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5 md:grid-cols-2">
              {(
                [
                  ['first_name', 'First name', 'text'],
                  ['last_name', 'Last name', 'text'],
                  ['email', 'Email', 'email'],
                  ['phone', 'Phone', 'tel'],
                  ['organization', 'Organization (optional)', 'text'],
                  ['county', 'County', 'text'],
                  ['hear_about', 'How did you hear about OWW?', 'text'],
                ] as const
              ).map(([name, label, type]) => (
                <div key={name} className="space-y-2">
                  <Label htmlFor={name} className="text-base">
                    {label}
                  </Label>
                  <Input
                    id={name}
                    type={type}
                    className="min-h-[44px] text-base"
                    {...form.register(name)}
                  />
                  {form.formState.errors[name] ? (
                    <p className="text-sm text-red-700">{String(form.formState.errors[name]?.message)}</p>
                  ) : null}
                </div>
              ))}
              <div className="space-y-2">
                <Label className="text-base">Pathway</Label>
                <Select
                  value={form.watch('pathway')}
                  onValueChange={v => form.setValue('pathway', v, { shouldValidate: true })}
                >
                  <SelectTrigger className="min-h-[44px] text-base">
                    <SelectValue placeholder="Select pathway" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="career">Start a Career</SelectItem>
                    <SelectItem value="hire">Hire Talent</SelectItem>
                    <SelectItem value="educate">Educate & Train</SelectItem>
                    <SelectItem value="ambassador">Be an Ambassador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="message" className="text-base">
                  Message / goals
                </Label>
                <Textarea id="message" className="min-h-[120px] text-base" {...form.register('message')} />
              </div>
              <div className="flex items-start gap-3 md:col-span-2">
                <Checkbox
                  id="consent"
                  checked={form.watch('consent_contact')}
                  onCheckedChange={v => form.setValue('consent_contact', v === true, { shouldValidate: true })}
                  className="mt-1"
                />
                <Label htmlFor="consent" className="text-base font-normal leading-relaxed">
                  I consent to be contacted by One Water Workforce partners about opportunities, events, and matching.
                </Label>
              </div>
              {form.formState.errors.consent_contact ? (
                <p className="text-sm text-red-700 md:col-span-2">
                  {String(form.formState.errors.consent_contact.message)}
                </p>
              ) : null}
              {error ? <p className="text-base text-red-700 md:col-span-2">{error}</p> : null}
              <div className="md:col-span-2">
                <Button type="submit" className="min-h-[44px] text-base" disabled={form.formState.isSubmitting}>
                  Submit interest
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
