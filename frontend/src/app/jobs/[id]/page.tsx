'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Job } from '@/lib/types';
import { employmentTypeLabel, formatSalary, timeAgo, workModeLabel } from '@/lib/format';

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  // Apply form state
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [applyMsg, setApplyMsg] = useState('');
  const [applyErr, setApplyErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api<Job>(`/jobs/${id}`, { auth: false })
      .then(setJob)
      .finally(() => setLoading(false));
  }, [id]);

  async function apply(e: React.FormEvent) {
    e.preventDefault();
    setApplyErr('');
    setApplyMsg('');
    setBusy(true);
    try {
      const res = await api<{ matchScore?: number | null; matchNotes?: string | null }>(
        `/jobs/${id}/apply`,
        { method: 'POST', body: { coverLetter, resumeText } },
      );
      setApplyMsg(
        res.matchScore != null
          ? `Application submitted! AI match score: ${res.matchScore}/100.`
          : 'Application submitted!',
      );
    } catch (err) {
      setApplyErr((err as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleSave() {
    try {
      if (saved) {
        await api(`/jobs/${id}/save`, { method: 'DELETE' });
        setSaved(false);
      } else {
        await api(`/jobs/${id}/save`, { method: 'POST' });
        setSaved(true);
      }
    } catch {
      /* ignore */
    }
  }

  if (loading) return <p className="py-20 text-center text-slate-400">Loading…</p>;
  if (!job) return <p className="py-20 text-center text-slate-400">Job not found.</p>;

  const isCandidate = user?.role === 'CANDIDATE';

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        <Link href="/jobs" className="text-sm text-brand-600">
          ← Back to jobs
        </Link>

        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{job.title}</h1>
              <p className="mt-1 text-slate-500">
                {job.company?.name} · {job.location}
              </p>
            </div>
            {isCandidate && (
              <button onClick={toggleSave} className="btn-ghost">
                {saved ? '★ Saved' : '☆ Save'}
              </button>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="badge">{workModeLabel[job.workMode]}</span>
            <span className="badge">{employmentTypeLabel[job.employmentType]}</span>
            <span className="badge bg-emerald-100 text-emerald-700">
              {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
            </span>
            {(job.experienceMin != null || job.experienceMax != null) && (
              <span className="badge">
                {job.experienceMin ?? 0}–{job.experienceMax ?? '+'} yrs exp
              </span>
            )}
            <span className="badge">Posted {timeAgo(job.createdAt)}</span>
          </div>

          <div className="prose prose-sm mt-6 max-w-none whitespace-pre-wrap text-slate-700">
            {job.description}
          </div>

          {job.skills.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-900">Skills</h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {job.skills.map((s) => (
                  <span key={s} className="badge bg-brand-50 text-brand-700">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {job.benefits.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-900">Benefits</h3>
              <ul className="mt-2 list-inside list-disc text-sm text-slate-600">
                {job.benefits.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Apply panel */}
      <div className="lg:col-span-1">
        <div className="card sticky top-20">
          <h2 className="font-semibold text-slate-900">Apply for this role</h2>

          {!user && (
            <p className="mt-3 text-sm text-slate-500">
              Please{' '}
              <Link href="/login" className="text-brand-600">
                log in
              </Link>{' '}
              as a candidate to apply.
            </p>
          )}

          {user && !isCandidate && (
            <p className="mt-3 text-sm text-slate-500">
              Only candidate accounts can apply to jobs.
            </p>
          )}

          {isCandidate && (
            <form onSubmit={apply} className="mt-4 space-y-3">
              {applyMsg && (
                <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {applyMsg}
                </div>
              )}
              {applyErr && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {applyErr}
                </div>
              )}
              <div>
                <label className="label">Cover letter (optional)</label>
                <textarea
                  className="input min-h-20"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Resume text (for AI matching)</label>
                <textarea
                  className="input min-h-28"
                  placeholder="Paste your resume — we'll score your fit with AI."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                />
              </div>
              <button className="btn-primary w-full" disabled={busy || !!applyMsg}>
                {busy ? 'Submitting…' : applyMsg ? 'Applied' : 'Submit application'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
