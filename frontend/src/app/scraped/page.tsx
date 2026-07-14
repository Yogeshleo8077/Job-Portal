'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Paginated } from '@/lib/types';
import { timeAgo } from '@/lib/format';

interface ScrapedJob {
  id: string;
  source: string;
  sourceUrl: string;
  title: string;
  company: string;
  location?: string | null;
  skills: string[];
  scrapedAt: string;
}

export default function ScrapedPage() {
  const [jobs, setJobs] = useState<ScrapedJob[]>([]);
  const [meta, setMeta] = useState<Paginated<ScrapedJob>['meta'] | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<Paginated<ScrapedJob>>('/scrape/jobs', {
        auth: false,
        query: { search, page, limit: 12 },
      });
      setJobs(res.data);
      setMeta(res.meta);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Aggregated Jobs</h1>
        <p className="text-sm text-slate-500">
          Roles scraped from public sources ({meta?.total ?? 0} total).
        </p>
      </div>

      <input
        className="input max-w-md"
        placeholder="Search scraped jobs…"
        value={search}
        onChange={(e) => {
          setPage(1);
          setSearch(e.target.value);
        }}
      />

      {loading ? (
        <p className="py-16 text-center text-slate-400">Loading…</p>
      ) : jobs.length === 0 ? (
        <p className="py-16 text-center text-slate-400">
          No scraped jobs yet. An admin can run the scraper from the admin dashboard.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((j) => (
            <a
              key={j.id}
              href={j.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="card block transition hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-slate-900">{j.title}</h3>
                <span className="badge">{j.source}</span>
              </div>
              <p className="text-sm text-slate-500">
                {j.company}
                {j.location ? ` · ${j.location}` : ''}
              </p>
              {j.skills.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {j.skills.slice(0, 4).map((s) => (
                    <span key={s} className="badge bg-brand-50 text-brand-700">
                      {s}
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-2 text-xs text-slate-400">Scraped {timeAgo(j.scrapedAt)}</p>
            </a>
          ))}
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button className="btn-ghost" disabled={!meta.hasPrev} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <span className="text-sm text-slate-500">
            Page {meta.page} of {meta.totalPages}
          </span>
          <button className="btn-ghost" disabled={!meta.hasNext} onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}
