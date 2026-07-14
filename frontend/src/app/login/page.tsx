'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(email, password);
      router.push(
        user.role === 'ADMIN' ? '/admin' : user.role === 'EMPLOYER' ? '/employer' : '/candidate',
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card">
        <h1 className="text-xl font-bold text-slate-900">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-500">Log in to your account.</p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          No account?{' '}
          <Link href="/register" className="font-medium text-brand-600">
            Sign up
          </Link>
        </p>

        <div className="mt-6 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
          <p className="font-medium text-slate-600">Demo accounts (password: Password@123)</p>
          <p>admin@jobportal.dev · employer@jobportal.dev · candidate@jobportal.dev</p>
        </div>
      </div>
    </div>
  );
}
