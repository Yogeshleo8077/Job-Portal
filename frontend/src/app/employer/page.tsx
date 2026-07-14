'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { Protected } from '@/components/Protected';
import type { Application, Job } from '@/lib/types';
import { formatSalary, timeAgo } from '@/lib/format';

const emptyForm = {
  title: '',
  description: '',
  location: '',
  workMode: 'ONSITE',
  employmentType: 'FULL_TIME',
  salaryMin: '',
  salaryMax: '',
  experienceMin: '',
  experienceMax: '',
  skills: '',
  benefits: '',
};

function EmployerDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [applicantsFor, setApplicantsFor] = useState<Job | null>(null);
  const [applicants, setApplicants] = useState<Application[]>([]);

  const load = useCallback(async () => {
    // Employer sees all statuses of their own jobs — the API scopes by ownership on writes,
    // but listing is public, so we request all statuses and rely on postedBy on the card.
    const me = await api<{ id: string; companyId?: string | null }>('/users/me');
    const res = await api<{ data: Job[] }>('/jobs', {
      query: { companyId: me.companyId ?? '', status: '', limit: 100 },
    });
    setJobs(res.data);
  }, []);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
    setError('');
  }

  function openEdit(job: Job) {
    setForm({
      title: job.title,
      description: job.description,
      location: job.location,
      workMode: job.workMode,
      employmentType: job.employmentType,
      salaryMin: job.salaryMin?.toString() ?? '',
      salaryMax: job.salaryMax?.toString() ?? '',
      experienceMin: job.experienceMin?.toString() ?? '',
      experienceMax: job.experienceMax?.toString() ?? '',
      skills: job.skills.join(', '),
      benefits: job.benefits.join(', '),
    });
    setEditingId(job.id);
    setShowForm(true);
    setError('');
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const payload = {
      title: form.title,
      description: form.description,
      location: form.location,
      workMode: form.workMode,
      employmentType: form.employmentType,
      salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
      salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
      experienceMin: form.experienceMin ? Number(form.experienceMin) : undefined,
      experienceMax: form.experienceMax ? Number(form.experienceMax) : undefined,
      skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
      benefits: form.benefits.split(',').map((s) => s.trim()).filter(Boolean),
    };
    try {
      if (editingId) {
        await api(`/jobs/${editingId}`, { method: 'PUT', body: payload });
      } else {
        await api('/jobs', { method: 'POST', body: payload });
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  async function closeJob(id: string) {
    await api(`/jobs/${id}/close`, { method: 'PATCH' });
    await load();
  }
  async function deleteJob(id: string) {
    if (!confirm('Delete this job? This cannot be undone.')) return;
    await api(`/jobs/${id}`, { method: 'DELETE' });
    await load();
  }
  async function viewApplicants(job: Job) {
    setApplicantsFor(job);
    const res = await api<Application[]>(`/jobs/${job.id}/applicants`);
    setApplicants(res);
  }
  async function setStatus(appId: string, status: string) {
    await api(`/applications/${appId}/status`, { method: 'PATCH', body: { status } });
    if (applicantsFor) await viewApplicants(applicantsFor);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Employer Dashboard</h1>
        <button className="btn-primary" onClick={openCreate}>
          + Post a job
        </button>
      </div>

      {/* Job form */}
      {showForm && (
        <div className="card">
          <h2 className="font-semibold">{editingId ? 'Edit job' : 'New job'}</h2>
          {error && (
            <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Title</label>
              <input
                className="input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <textarea
                className="input min-h-24"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Location</label>
              <input
                className="input"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Work mode</label>
                <select
                  className="input"
                  value={form.workMode}
                  onChange={(e) => setForm({ ...form, workMode: e.target.value })}
                >
                  <option value="ONSITE">On-site</option>
                  <option value="REMOTE">Remote</option>
                  <option value="HYBRID">Hybrid</option>
                </select>
              </div>
              <div>
                <label className="label">Type</label>
                <select
                  className="input"
                  value={form.employmentType}
                  onChange={(e) => setForm({ ...form, employmentType: e.target.value })}
                >
                  <option value="FULL_TIME">Full-time</option>
                  <option value="PART_TIME">Part-time</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="INTERNSHIP">Internship</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Salary min</label>
                <input
                  type="number"
                  className="input"
                  value={form.salaryMin}
                  onChange={(e) => setForm({ ...form, salaryMin: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Salary max</label>
                <input
                  type="number"
                  className="input"
                  value={form.salaryMax}
                  onChange={(e) => setForm({ ...form, salaryMax: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Exp min (yrs)</label>
                <input
                  type="number"
                  className="input"
                  value={form.experienceMin}
                  onChange={(e) => setForm({ ...form, experienceMin: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Exp max (yrs)</label>
                <input
                  type="number"
                  className="input"
                  value={form.experienceMax}
                  onChange={(e) => setForm({ ...form, experienceMax: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="label">Skills (comma-separated)</label>
              <input
                className="input"
                value={form.skills}
                onChange={(e) => setForm({ ...form, skills: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Benefits (comma-separated)</label>
              <input
                className="input"
                value={form.benefits}
                onChange={(e) => setForm({ ...form, benefits: e.target.value })}
              />
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <button className="btn-primary" disabled={busy}>
                {busy ? 'Saving…' : editingId ? 'Update job' : 'Create job'}
              </button>
              <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Job list */}
      <div className="space-y-3">
        {jobs.length === 0 && <p className="text-slate-400">No jobs posted yet.</p>}
        {jobs.map((job) => (
          <div key={job.id} className="card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-900">{job.title}</h3>
                <p className="text-sm text-slate-500">
                  {job.location} · {formatSalary(job.salaryMin, job.salaryMax, job.currency)} ·{' '}
                  {timeAgo(job.createdAt)}
                </p>
                <div className="mt-1 flex gap-2">
                  <span
                    className={`badge ${job.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100'}`}
                  >
                    {job.status}
                  </span>
                  <span className="badge">{job._count?.applications ?? 0} applicants</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="btn-ghost" onClick={() => viewApplicants(job)}>
                  Applicants
                </button>
                <button className="btn-ghost" onClick={() => openEdit(job)}>
                  Edit
                </button>
                {job.status === 'OPEN' && (
                  <button className="btn-ghost" onClick={() => closeJob(job.id)}>
                    Close
                  </button>
                )}
                <button
                  className="btn-ghost text-red-600"
                  onClick={() => deleteJob(job.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Applicants modal */}
      {applicantsFor && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setApplicantsFor(null)}
        >
          <div
            className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Applicants — {applicantsFor.title}</h2>
              <button className="btn-ghost" onClick={() => setApplicantsFor(null)}>
                Close
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {applicants.length === 0 && (
                <p className="text-slate-400">No applicants yet.</p>
              )}
              {applicants.map((a) => (
                <div key={a.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{a.candidate?.name}</p>
                      <p className="text-sm text-slate-500">{a.candidate?.email}</p>
                    </div>
                    {a.matchScore != null && (
                      <span className="badge bg-brand-50 text-brand-700">
                        AI {a.matchScore}/100
                      </span>
                    )}
                  </div>
                  {a.candidate?.skills && a.candidate.skills.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {a.candidate.skills.map((s) => (
                        <span key={s} className="badge">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  {a.matchNotes && (
                    <p className="mt-2 text-sm text-slate-600">{a.matchNotes}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {['REVIEWING', 'SHORTLISTED', 'REJECTED', 'HIRED'].map((s) => (
                      <button
                        key={s}
                        className={`btn text-xs ${a.status === s ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setStatus(a.id, s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Protected roles={['EMPLOYER', 'ADMIN']}>
      <EmployerDashboard />
    </Protected>
  );
}
