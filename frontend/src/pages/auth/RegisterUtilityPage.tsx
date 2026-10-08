import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DEFAULT_STATE } from '@/lib/constants';

export default function RegisterUtilityPage() {
  const { registerUtilityAdmin } = useAuth();
  const navigate = useNavigate();
  const [utilityName, setUtilityName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [stateCode, setStateCode] = useState(DEFAULT_STATE.toUpperCase());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await registerUtilityAdmin({
        utility_name: utilityName.trim(),
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        state_code: stateCode.trim().toUpperCase() || 'NY',
      });
      navigate('/employer', { replace: true });
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
        description="Minimal signup for water utilities. You get a complimentary demo membership so you can open Water Workforce 360 right away."
      />
      <Card className="mx-auto max-w-lg border-slate-200">
        <CardHeader>
          <CardTitle className="font-display text-xl text-oww-navy">Register as utility admin</CardTitle>
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
            <Button type="submit" className="min-h-[44px] w-full text-base" disabled={busy}>
              {busy ? 'Creating account…' : 'Create account'}
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
