'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Protected } from '@/components/Protected';
import { JobCard } from '@/components/JobCard';
import type { Application, Job } from '@/lib/types';
import { timeAgo } from '@/lib/format';

const statusColor: Record<string, string> = {
  APPLIED: 'bg-slate-100 text-slate-700',
  REVIEWING: 'bg-amber-100 text-amber-700',
  SHORTLISTED: 'bg-blue-100 text-blue-700',
  REJECTED: 'bg-red-100 text-red-700',
  HIRED: 'bg-emerald-100 text-emerald-700',
};

function CandidateDashboard() {
  const [apps, setApps] = useState<Application[]>([]);
  const [saved, setSaved] = useState<Job[]>([]);
  const [tab, setTab] = useState<'apps' | 'saved'>('apps');

  useEffect(() => {
    api<Application[]>('/applications').then(setApps).catch(() => {});
    api<Job[]>('/jobs/saved/list').then(setSaved).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Candidate Dashboard</h1>

      <div className="flex gap-2">
        <button
          className={`btn ${tab === 'apps' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setTab('apps')}
        >
          My Applications ({apps.length})
        </button>
        <button
          className={`btn ${tab === 'saved' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setTab('saved')}
        >
          Saved Jobs ({saved.length})
        </button>
      </div>

      {tab === 'apps' ? (
        apps.length === 0 ? (
          <p className="text-slate-400">
            You haven&apos;t applied to any jobs yet.{' '}
            <Link href="/jobs" className="text-brand-600">
              Browse jobs
            </Link>
          </p>
        ) : (
          <div className="space-y-3">
            {apps.map((a) => (
              <div key={a.id} className="card flex items-center justify-between">
                <div>
                  <Link
                    href={`/jobs/${a.job.id}`}
                    className="font-semibold text-slate-900 hover:text-brand-600"
                  >
                    {a.job.title}
                  </Link>
                  <p className="text-sm text-slate-500">
                    {a.job.company?.name} · applied {timeAgo(a.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {a.matchScore != null && (
                    <span className="badge bg-brand-50 text-brand-700">
                      AI {a.matchScore}/100
                    </span>
                  )}
                  <span className={`badge ${statusColor[a.status]}`}>{a.status}</span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : saved.length === 0 ? (
        <p className="text-slate-400">No saved jobs yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {saved.map((j) => (
            <JobCard key={j.id} job={j} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Protected roles={['CANDIDATE']}>
      <CandidateDashboard />
    </Protected>
  );
}
