import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { DEFAULT_STATE } from '@/lib/constants';
import { submitProgram } from '@/services/publicService';

const schema = z.object({
  organization_name: z.string().min(1),
  contact_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  program_title: z.string().min(1),
  program_type: z.string().min(1),
  description: z.string().min(10),
  website: z.string().url().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

export default function ProgramSubmitPage() {
  const params = useParams();
  const state = (params.state || DEFAULT_STATE).toLowerCase();
  const [done, setDone] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      organization_name: '',
      contact_name: '',
      email: '',
      phone: '',
      program_title: '',
      program_type: 'training',
      description: '',
      website: '',
    },
  });

  async function onSubmit(values: FormValues) {
    await submitProgram({ ...values, state_code: state.toUpperCase() });
    setDone(true);
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
        eyebrow="Programs"
        title="Submit a program"
        description="Share training, apprenticeship, or outreach programs for review and publication."
      />
      <Card>
        <CardContent className="pt-6">
          {done ? (
            <p className="text-lg text-navy">Thanks — your program was submitted for review.</p>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
              {(
                [
                  ['organization_name', 'Organization'],
                  ['contact_name', 'Contact name'],
                  ['email', 'Email'],
                  ['phone', 'Phone'],
                  ['program_title', 'Program title'],
                  ['program_type', 'Program type'],
                  ['website', 'Website'],
                ] as const
              ).map(([name, label]) => (
                <div key={name} className="space-y-2">
                  <Label htmlFor={name} className="text-base">
                    {label}
                  </Label>
                  <Input id={name} className="min-h-[44px] text-base" {...form.register(name)} />
                </div>
              ))}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description" className="text-base">
                  Description
                </Label>
                <Textarea id="description" className="min-h-[140px] text-base" {...form.register('description')} />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" className="min-h-[44px] text-base">
                  Submit program
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
