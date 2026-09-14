'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = () => {
    localStorage.setItem('tecFormLoggedIn', 'true');
    router.push('/');
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
            No credentials are required for now. Click below to access the form.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogin}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#991b1e] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#7f1719]"
        >
          Login
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
