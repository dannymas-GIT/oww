import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { OwwPageHero } from '@/components/oww/OwwPageHero';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ProfilePage() {
  const { user, changePassword } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (window.location.hash === '#password') {
      document.getElementById('password')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    if (next !== confirm) {
      setError('New password and confirmation do not match.');
      return;
    }
    try {
      const res = await changePassword({
        current_password: current,
        new_password: next,
        confirm_password: confirm,
      });
      setMessage(res.message || 'Password updated.');
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch {
      setError('Could not change password. Check your current password and try again.');
    }
  }

  const displayName = user?.full_name?.trim() || user?.username || 'there';

  return (
    <div className="space-y-6">
      <OwwPageHero
        eyebrow="Account"
        title={`Welcome, ${displayName}`}
        description="Your account details and password. The name below is how you appear across One Water Workforce."
      />
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-lg">
          <p>
            <span className="text-slate-500">Display name:</span>{' '}
            <span className="font-semibold text-oww-navy">{user?.full_name?.trim() || '—'}</span>
          </p>
          <p>
            <span className="text-slate-500">Username:</span> {user?.username}
          </p>
          <p>
            <span className="text-slate-500">Email:</span> {user?.email || '—'}
          </p>
          <p>
            <span className="text-slate-500">Jurisdiction:</span> {user?.jurisdiction_code || 'NY'}
          </p>
          <div className="flex flex-wrap gap-2" aria-label="Roles">
            {(user?.roles || []).map(r => (
              <Badge key={r} variant="secondary" className="text-sm">
                {r}
              </Badge>
            ))}
          </div>
          <div className="pt-2">
            <Button variant="outline" className="min-h-[44px] text-base" asChild>
              <Link to="/billing">Billing &amp; membership</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card id="password">
        <CardHeader>
          <CardTitle className="font-display text-xl">Change password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="max-w-md space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current" className="text-base">
                Current password
              </Label>
              <Input
                id="current"
                type="password"
                required
                className="min-h-[44px] text-base"
                value={current}
                onChange={e => setCurrent(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new" className="text-base">
                New password
              </Label>
              <Input
                id="new"
                type="password"
                required
                className="min-h-[44px] text-base"
                value={next}
                onChange={e => setNext(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-base">
                Confirm new password
              </Label>
              <Input
                id="confirm"
                type="password"
                required
                className="min-h-[44px] text-base"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            {message ? <p className="text-base text-emerald-700">{message}</p> : null}
            {error ? <p className="text-base text-red-700">{error}</p> : null}
            <Button type="submit" className="min-h-[44px] text-base">
              Update password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
