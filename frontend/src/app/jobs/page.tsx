'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Job, Paginated } from '@/lib/types';
import { JobCard } from '@/components/JobCard';

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [meta, setMeta] = useState<Paginated<Job>['meta'] | null>(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [workMode, setWorkMode] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<Paginated<Job>>('/jobs', {
        auth: false,
        query: { search, workMode, employmentType, sortBy, page, limit: 9 },
      });
      setJobs(res.data);
      setMeta(res.meta);
    } finally {
      setLoading(false);
    }
  }, [search, workMode, employmentType, sortBy, page]);

  useEffect(() => {
    const t = setTimeout(load, 250); // debounce search
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Browse Jobs</h1>
        <p className="text-sm text-slate-500">
          {meta ? `${meta.total} open roles` : 'Loading…'}
        </p>
      </div>

      {/* Filters */}
      <div className="card grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          className="input"
          placeholder="Search title, company…"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
        <select
          className="input"
          value={workMode}
          onChange={(e) => {
            setPage(1);
            setWorkMode(e.target.value);
          }}
        >
          <option value="">Any work mode</option>
          <option value="ONSITE">On-site</option>
          <option value="REMOTE">Remote</option>
          <option value="HYBRID">Hybrid</option>
        </select>
        <select
          className="input"
          value={employmentType}
          onChange={(e) => {
            setPage(1);
            setEmploymentType(e.target.value);
          }}
        >
          <option value="">Any type</option>
          <option value="FULL_TIME">Full-time</option>
          <option value="PART_TIME">Part-time</option>
          <option value="CONTRACT">Contract</option>
          <option value="INTERNSHIP">Internship</option>
        </select>
        <select className="input" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="createdAt">Newest</option>
          <option value="salaryMax">Highest salary</option>
          <option value="title">Title (A–Z)</option>
        </select>
      </div>

      {loading ? (
        <p className="py-16 text-center text-slate-400">Loading jobs…</p>
      ) : jobs.length === 0 ? (
        <p className="py-16 text-center text-slate-400">No jobs match your filters.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            className="btn-ghost"
            disabled={!meta.hasPrev}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span className="text-sm text-slate-500">
            Page {meta.page} of {meta.totalPages}
          </span>
          <button
            className="btn-ghost"
            disabled={!meta.hasNext}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
