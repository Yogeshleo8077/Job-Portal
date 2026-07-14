'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Protected } from '@/components/Protected';
import { useAuth } from '@/lib/auth';

function ProfileForm() {
  const { user, refresh } = useAuth();
  const [form, setForm] = useState({
    name: '',
    headline: '',
    bio: '',
    location: '',
    skills: '',
    resumeUrl: '',
  });
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name ?? '',
        headline: user.headline ?? '',
        bio: user.bio ?? '',
        location: user.location ?? '',
        skills: (user.skills ?? []).join(', '),
        resumeUrl: user.resumeUrl ?? '',
      });
    }
  }, [user]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    try {
      await api('/users/me', {
        method: 'PUT',
        body: {
          name: form.name || undefined,
          headline: form.headline || undefined,
          bio: form.bio || undefined,
          location: form.location || undefined,
          resumeUrl: form.resumeUrl || undefined,
          skills: form.skills
            ? form.skills.split(',').map((s) => s.trim()).filter(Boolean)
            : [],
        },
      });
      await refresh();
      setMsg('Profile updated.');
    } catch (err) {
      setMsg((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Profile</h1>

      <div className="card">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-600 text-lg font-bold text-white">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{user?.email}</p>
            <span className="badge">{user?.role}</span>
          </div>
        </div>

        {msg && (
          <div className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {msg}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Headline</label>
            <input
              className="input"
              placeholder="e.g. Full Stack Developer"
              value={form.headline}
              onChange={(e) => setForm({ ...form, headline: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Location</label>
            <input
              className="input"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Skills (comma-separated)</label>
            <input
              className="input"
              placeholder="React, Node.js, PostgreSQL"
              value={form.skills}
              onChange={(e) => setForm({ ...form, skills: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Resume URL</label>
            <input
              className="input"
              placeholder="https://…"
              value={form.resumeUrl}
              onChange={(e) => setForm({ ...form, resumeUrl: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Bio</label>
            <textarea
              className="input min-h-24"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </div>
          <button className="btn-primary" disabled={busy}>
            {busy ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Protected>
      <ProfileForm />
    </Protected>
  );
}
