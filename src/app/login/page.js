'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/tec/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error || 'Invalid email or password');
        return;
      }

      localStorage.setItem('tecFormLoggedIn', 'true');
      localStorage.setItem('tecFormUser', JSON.stringify(data.user));
      localStorage.setItem('tecFormEmail', data.user.email);
      router.push('/');
    } catch {
      setError('Unable to connect to the login service');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-[#efeeea] px-4">
      <div className="w-full max-w-md rounded-3xl border border-[#d8d4cc] bg-white p-8 shadow-[0_16px_40px_rgba(31,42,68,0.08)]">
        <div className="mb-6 flex items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#991b1e] text-white shadow-md">
            <ShieldCheck className="h-7 w-7" />
          </div>
        </div>

        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#991b1e]">
            TEC Portal
          </p>
          <h1 className="mt-3 text-3xl font-bold text-[#1f2a44]">Welcome</h1>
          <p className="mt-2 text-sm text-[#5d677d]">
            Sign in with your TEC account credentials to access the form.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#546077]">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              className="w-full rounded-xl border border-[#d6d2ca] bg-[#faf8f5] px-3 py-2 text-sm text-[#1f2a44] focus:border-[#991b1e] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#991b1e]"
              placeholder="name@uwimona.edu.jm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[#546077]">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className="w-full rounded-xl border border-[#d6d2ca] bg-[#faf8f5] px-3 py-2 text-sm text-[#1f2a44] focus:border-[#991b1e] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#991b1e]"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#991b1e] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#7f1719] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Checking...' : 'Login'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
