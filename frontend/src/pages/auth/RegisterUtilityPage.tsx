import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DEFAULT_STATE } from '@/lib/constants';
import { cn } from '@/lib/utils';

const STEPS = [
  { n: 1, label: 'Utility & account' },
  { n: 2, label: 'Payment' },
  { n: 3, label: 'Done' },
] as const;

export default function RegisterUtilityPage() {
  const { registerUtilityAdmin } = useAuth();
  const navigate = useNavigate();
  const [utilityName, setUtilityName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [stateCode, setStateCode] = useState(DEFAULT_STATE.toUpperCase());
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const data = await registerUtilityAdmin({
        utility_name: utilityName.trim(),
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        state_code: stateCode.trim().toUpperCase() || 'NY',
        phone: phone.trim() || undefined,
        website: website.trim() || undefined,
        job_title: jobTitle.trim() || undefined,
      });
      const checkout = data.checkout;
      if (checkout?.mode === 'stripe' && checkout.url) {
        window.location.assign(checkout.url);
        return;
      }
      if (checkout?.mode === 'free') {
        navigate(`/billing/success?flow=register&review=${data.review_required ? '1' : '0'}`, { replace: true });
        return;
      }
      const sessionId = checkout?.session_id;
      const path =
        checkout?.url ||
        (sessionId
          ? `/billing/sample-checkout?session_id=${encodeURIComponent(sessionId)}&flow=register`
          : '/pricing');
      navigate(path, { replace: true });
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Could not create your account. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <OwwPageHero
        eyebrow="Utility administrators"
        title="Create your utility account"
        description="Register your utility, choose the Utility membership, and pay with the sample checkout. You can open Water Workforce 360 after payment — your jurisdiction partner may review new accounts afterward."
      />

      <ol className="mx-auto flex max-w-lg flex-wrap items-center justify-center gap-2" aria-label="Registration steps">
        {STEPS.map((s, idx) => (
          <li key={s.n} className="flex items-center gap-2">
            <span
              className={cn(
                'inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-full px-2 text-sm font-semibold',
                s.n === 1 ? 'bg-oww-cyan text-white' : 'bg-slate-200 text-slate-600'
              )}
            >
              {s.n}
            </span>
            <span className={cn('text-base', s.n === 1 ? 'font-semibold text-oww-navy' : 'text-slate-500')}>{s.label}</span>
            {idx < STEPS.length - 1 ? <span className="mx-1 text-slate-300" aria-hidden>
              →
            </span> : null}
          </li>
        ))}
      </ol>

      <Card className="mx-auto max-w-lg border-slate-200">
        <CardHeader>
          <CardTitle className="font-display text-xl text-oww-navy">Step 1 — Utility &amp; account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="utility_name" className="text-base">
                Utility / organization name
              </Label>
              <Input
                id="utility_name"
                required
                className="min-h-[44px] text-base"
                value={utilityName}
                onChange={e => setUtilityName(e.target.value)}
                autoComplete="organization"
                placeholder="Example Water Department"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-base">
                Your full name
              </Label>
              <Input
                id="full_name"
                required
                className="min-h-[44px] text-base"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job_title" className="text-base">
                Job title <span className="font-normal text-slate-500">(optional)</span>
              </Label>
              <Input
                id="job_title"
                className="min-h-[44px] text-base"
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
                placeholder="Utility superintendent"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base">
                Work email
              </Label>
              <Input
                id="email"
                type="email"
                required
                className="min-h-[44px] text-base"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-base">
                Phone <span className="font-normal text-slate-500">(optional)</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                className="min-h-[44px] text-base"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                autoComplete="tel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website" className="text-base">
                Website <span className="font-normal text-slate-500">(optional)</span>
              </Label>
              <Input
                id="website"
                type="url"
                className="min-h-[44px] text-base"
                value={website}
                onChange={e => setWebsite(e.target.value)}
                placeholder="https://"
                autoComplete="url"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-base">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                className="min-h-[44px] text-base"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state_code" className="text-base">
                State
              </Label>
              <Input
                id="state_code"
                required
                maxLength={2}
                className="min-h-[44px] text-base uppercase"
                value={stateCode}
                onChange={e => setStateCode(e.target.value.toUpperCase())}
                autoComplete="address-level1"
              />
            </div>
            <p className="text-sm text-slate-600">
              Next you will pay for the Utility membership (sample checkout — no real charge). Team members and managers
              are invited later from Water Workforce 360.
            </p>
            <Button type="submit" className="min-h-[44px] w-full text-base" disabled={busy}>
              {busy ? 'Creating account…' : 'Continue to payment'}
            </Button>
          </form>
          {error ? <p className="mt-4 text-base text-red-700">{error}</p> : null}
          <p className="mt-6 text-center text-base text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-sky-700 underline-offset-2 hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
