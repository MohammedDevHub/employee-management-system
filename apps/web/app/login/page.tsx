'use client';

import { FormEvent, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ApiError } from '@/lib/api';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      {/* Single deliberate moment of light behind the wordmark — everything else stays quiet */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[28%] h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-[120px]"
        style={{ background: 'radial-gradient(circle, #C9A24D 0%, transparent 70%)' }}
      />

      <div className="relative w-full max-w-sm">
        <div className="mb-10 text-center">
          <p className="font-display text-3xl tracking-wide text-ink">LOFA BEAUTY</p>
          <p className="mt-2 text-sm text-muted">Sign in to your business console</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-border bg-surface/80 p-8 backdrop-blur-sm"
        >
          <label className="mb-1.5 block text-sm text-muted" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-5 w-full rounded-md border border-border bg-bg px-3.5 py-2.5 text-ink placeholder:text-muted/60 focus:border-gold"
            placeholder="you@lofabeauty.com"
          />

          <label className="mb-1.5 block text-sm text-muted" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-6 w-full rounded-md border border-border bg-bg px-3.5 py-2.5 text-ink focus:border-gold"
            placeholder="••••••••"
          />

          {error && (
            <p className="mb-5 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-gold py-2.5 font-medium text-bg transition-colors hover:bg-gold-soft disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  );
}
