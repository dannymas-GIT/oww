import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { OwwLogo } from '@/components/oww/OwwLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { owwMission } from '@/content/owwPublicContent';
import { DEFAULT_STATE } from '@/lib/constants';
import { homeForRoles } from '@/lib/roleHome';

export default function LoginPage() {
  const { login, requestOtpCode, verifyOtpCode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fromState = (location.state as { from?: string } | null)?.from;

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [otpMessage, setOtpMessage] = useState<string | null>(null);
  const [otpDelivery, setOtpDelivery] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOtpMessage(null);
    try {
      const res = await requestOtpCode({ email });
      setOtpSent(true);
      setDevCode(res.dev_code ?? null);
      setOtpDelivery(res.delivery ?? null);
      setOtpMessage(res.message ?? null);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(
        typeof detail === 'string'
          ? detail
          : 'Could not send a one-time code. Prefer Account password, or try again.'
      );
    } finally {
      setBusy(false);
    }
  }

  async function onVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const session = await verifyOtpCode({ email, code: otp });
      const dest =
        fromState && fromState !== '/' && !/^\/(ny)?\/?$/.test(fromState)
          ? fromState
          : homeForRoles(session.user.roles);
      navigate(dest, { replace: true });
    } catch {
      setError('Invalid or expired code.');
    } finally {
      setBusy(false);
    }
  }

  async function onPasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const session = await login(username, password);
      const dest =
        fromState && fromState !== '/' && !/^\/(ny)?\/?$/.test(fromState)
          ? fromState
          : homeForRoles(session.user.roles);
      navigate(dest, { replace: true });
    } catch {
      setError('Invalid email/username or password.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-center rounded-2xl border border-slate-200 bg-white px-6 py-6">
        <OwwLogo to={`/${DEFAULT_STATE}`} size="hero" />
      </div>
      <OwwPageHero
        eyebrow="Sign in"
        title="Welcome back"
        description={`${owwMission.tagline}. Sign in with your local account password. Email one-time codes remain available for passwordless community access.`}
      />
      <Card className="mx-auto max-w-lg border-slate-200">
        <CardHeader>
          <CardTitle className="font-display text-xl text-oww-navy">Sign in to One Water Workforce</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="password">
            <TabsList className="grid h-auto w-full grid-cols-2" data-tour="login-tabs">
              <TabsTrigger value="password" className="min-h-[44px] text-base" data-tour="login-password">
                Account password
              </TabsTrigger>
              <TabsTrigger value="otp" className="min-h-[44px] text-base" data-tour="login-otp">
                Email / text code
              </TabsTrigger>
            </TabsList>
            <TabsContent value="password" className="space-y-4 pt-4">
              <form onSubmit={onPasswordLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-base">
                    Email or username
                  </Label>
                  <Input
                    id="username"
                    required
                    className="min-h-[44px] text-base"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    autoComplete="username"
                    placeholder="you@example.org"
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
                    className="min-h-[44px] text-base"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>
                <Button type="submit" className="min-h-[44px] w-full text-base" disabled={busy}>
                  Sign in
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="otp" className="space-y-4 pt-4">
              {!otpSent ? (
                <form onSubmit={onRequestOtp} className="space-y-4">
                  <p className="text-base text-slate-600">
                    Optional passwordless sign-in for community users. Prefer Account password when you have a local login.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-base">
                      Email
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
                  <Button type="submit" className="min-h-[44px] w-full text-base" disabled={busy}>
                    Send code
                  </Button>
                </form>
              ) : (
                <form onSubmit={onVerifyOtp} className="space-y-4">
                  <p className="text-base text-slate-600">
                    {otpDelivery === 'stub'
                      ? `No outbound email is configured on this environment for ${email}.`
                      : `Enter the code sent to ${email}.`}
                  </p>
                  {otpMessage ? (
                    <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                      {otpMessage}
                    </p>
                  ) : null}
                  {devCode ? (
                    <p className="rounded-md bg-sky-50 px-3 py-2 text-base text-sky-900">
                      On-screen code: <strong className="tracking-widest">{devCode}</strong>
                    </p>
                  ) : null}
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-base">
                      One-time code
                    </Label>
                    <Input
                      id="otp"
                      required
                      className="min-h-[44px] text-base"
                      value={otp}
                      onChange={e => setOtp(e.target.value)}
                      autoComplete="one-time-code"
                    />
                  </div>
                  <Button type="submit" className="min-h-[44px] w-full text-base" disabled={busy}>
                    Verify & sign in
                  </Button>
                  <Button type="button" variant="ghost" className="min-h-[44px] w-full text-base" onClick={() => setOtpSent(false)}>
                    Use a different email
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>
          {error ? <p className="mt-4 text-base text-red-700">{error}</p> : null}
          <p className="mt-6 text-center text-base text-slate-600">
            Utility administrator?{' '}
            <Link to="/register/utility" className="font-semibold text-sky-700 underline-offset-2 hover:underline">
              Create an account
            </Link>
          </p>
          <p className="mt-3 text-center text-sm text-slate-600">
            <Link to="/" className="text-sky-700 underline-offset-2 hover:underline">
              Back to home
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
