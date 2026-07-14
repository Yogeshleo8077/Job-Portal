import type { EmploymentType, WorkMode } from './types';

export function formatSalary(min?: number | null, max?: number | null, currency = 'INR') {
  if (!min && !max) return 'Not disclosed';
  const fmt = (n: number) => {
    if (currency === 'INR') {
      if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
      return `₹${n.toLocaleString('en-IN')}`;
    }
    return `${currency} ${n.toLocaleString()}`;
  };
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt((min ?? max)!);
}

export const workModeLabel: Record<WorkMode, string> = {
  ONSITE: 'On-site',
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
};

export const employmentTypeLabel: Record<EmploymentType, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
  TEMPORARY: 'Temporary',
};

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
