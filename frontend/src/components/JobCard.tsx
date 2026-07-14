import Link from 'next/link';
import type { Job } from '@/lib/types';
import { employmentTypeLabel, formatSalary, timeAgo, workModeLabel } from '@/lib/format';

export function JobCard({ job }: { job: Job }) {
  return (
    <Link href={`/jobs/${job.id}`} className="card block transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{job.title}</h3>
          <p className="text-sm text-slate-500">
            {job.company?.name} · {job.location}
          </p>
        </div>
        {job.status !== 'OPEN' && (
          <span className="badge bg-red-100 text-red-700">{job.status}</span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="badge">{workModeLabel[job.workMode]}</span>
        <span className="badge">{employmentTypeLabel[job.employmentType]}</span>
        <span className="badge bg-emerald-100 text-emerald-700">
          {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
        </span>
      </div>

      {job.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {job.skills.slice(0, 5).map((s) => (
            <span key={s} className="badge bg-brand-50 text-brand-700">
              {s}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
        <span>{timeAgo(job.createdAt)}</span>
        {typeof job._count?.applications === 'number' && (
          <span>{job._count.applications} applicant(s)</span>
        )}
      </div>
    </Link>
  );
}
