'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CANDIDATE' as 'CANDIDATE' | 'EMPLOYER',
    companyName: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        companyName: form.role === 'EMPLOYER' ? form.companyName : undefined,
      });
      router.push(user.role === 'EMPLOYER' ? '/employer' : '/candidate');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card">
        <h1 className="text-xl font-bold text-slate-900">Create your account</h1>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => set('role', 'CANDIDATE')}
              className={`btn ${form.role === 'CANDIDATE' ? 'btn-primary' : 'btn-ghost'}`}
            >
              I'm a Candidate
            </button>
            <button
              type="button"
              onClick={() => set('role', 'EMPLOYER')}
              className={`btn ${form.role === 'EMPLOYER' ? 'btn-primary' : 'btn-ghost'}`}
            >
              I'm an Employer
            </button>
          </div>

          <div>
            <label className="label">Full name</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              required
            />
          </div>
          {form.role === 'EMPLOYER' && (
            <div>
              <label className="label">Company name</label>
              <input
                className="input"
                value={form.companyName}
                onChange={(e) => set('companyName', e.target.value)}
                required
              />
            </div>
          )}
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              minLength={8}
              required
            />
            <p className="mt-1 text-xs text-slate-400">At least 8 characters.</p>
          </div>
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? 'Creating…' : 'Create account'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-brand-600">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
