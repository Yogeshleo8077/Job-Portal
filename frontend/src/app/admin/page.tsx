'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Protected } from '@/components/Protected';
import type { DashboardStats } from '@/lib/types';

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card">
      <p className="text-3xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

function BarList({
  title,
  items,
}: {
  title: string;
  items: { name: string; count: number }[];
}) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <div className="card">
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <div className="mt-3 space-y-2">
        {items.length === 0 && <p className="text-sm text-slate-400">No data yet.</p>}
        {items.map((i) => (
          <div key={i.name}>
            <div className="flex justify-between text-sm">
              <span className="text-slate-700">{i.name}</span>
              <span className="text-slate-400">{i.count}</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-brand-500"
                style={{ width: `${(i.count / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [scraping, setScraping] = useState(false);
  const [scrapeMsg, setScrapeMsg] = useState('');

  async function load() {
    setStats(await api<DashboardStats>('/dashboard'));
  }
  useEffect(() => {
    load().catch(() => {});
  }, []);

  async function runScrape() {
    setScraping(true);
    setScrapeMsg('');
    try {
      const res = await api<{
        summary: { added: number; duplicatesSkipped: number; errors: number };
      }>('/scrape/jobs', { method: 'POST', body: {} });
      setScrapeMsg(
        `Added ${res.summary.added}, skipped ${res.summary.duplicatesSkipped} duplicates, ${res.summary.errors} errors.`,
      );
      await load();
    } catch (err) {
      setScrapeMsg((err as Error).message);
    } finally {
      setScraping(false);
    }
  }

  if (!stats) return <p className="py-20 text-center text-slate-400">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <button className="btn-primary" onClick={runScrape} disabled={scraping}>
          {scraping ? 'Scraping…' : 'Run job scraper'}
        </button>
      </div>

      {scrapeMsg && (
        <div className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
          {scrapeMsg}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total users" value={stats.totals.users} />
        <StatCard label="Candidates" value={stats.totals.candidates} />
        <StatCard label="Employers" value={stats.totals.employers} />
        <StatCard label="Companies" value={stats.totals.companies} />
        <StatCard label="Jobs" value={stats.totals.jobs} />
        <StatCard label="Open jobs" value={stats.totals.openJobs} />
        <StatCard label="Applications" value={stats.totals.applications} />
        <StatCard label="Scraped jobs" value={stats.totals.scrapedJobs} />
      </div>

      <div className="card bg-brand-600 text-white">
        <p className="text-sm text-brand-100">Jobs scraped today</p>
        <p className="text-4xl font-bold">{stats.jobsScrapedToday}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <BarList title="Top skills" items={stats.topSkills} />
        <BarList title="Top companies" items={stats.topCompanies} />
        <BarList title="Top locations" items={stats.topLocations} />
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Protected roles={['ADMIN']}>
      <AdminDashboard />
    </Protected>
  );
}
