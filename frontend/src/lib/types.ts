export type Role = 'ADMIN' | 'EMPLOYER' | 'CANDIDATE';
export type WorkMode = 'ONSITE' | 'REMOTE' | 'HYBRID';
export type EmploymentType =
  | 'FULL_TIME'
  | 'PART_TIME'
  | 'CONTRACT'
  | 'INTERNSHIP'
  | 'TEMPORARY';
export type JobStatus = 'OPEN' | 'CLOSED' | 'DRAFT';
export type ApplicationStatus =
  | 'APPLIED'
  | 'REVIEWING'
  | 'SHORTLISTED'
  | 'REJECTED'
  | 'HIRED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  companyId?: string | null;
  headline?: string | null;
  bio?: string | null;
  skills?: string[];
  resumeUrl?: string | null;
  location?: string | null;
  company?: { id: string; name: string } | null;
}

export interface Company {
  id: string;
  name: string;
  logoUrl?: string | null;
  location?: string | null;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  workMode: WorkMode;
  employmentType: EmploymentType;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency: string;
  experienceMin?: number | null;
  experienceMax?: number | null;
  skills: string[];
  benefits: string[];
  deadline?: string | null;
  status: JobStatus;
  company: Company;
  postedBy?: { id: string; name: string };
  _count?: { applications: number };
  createdAt: string;
}

export interface Application {
  id: string;
  status: ApplicationStatus;
  coverLetter?: string | null;
  matchScore?: number | null;
  matchNotes?: string | null;
  createdAt: string;
  job: Job;
  candidate?: {
    id: string;
    name: string;
    email: string;
    headline?: string | null;
    skills?: string[];
    resumeUrl?: string | null;
  };
}

export interface Paginated<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface DashboardStats {
  totals: {
    users: number;
    candidates: number;
    employers: number;
    jobs: number;
    openJobs: number;
    companies: number;
    applications: number;
    scrapedJobs: number;
  };
  jobsScrapedToday: number;
  topSkills: { name: string; count: number }[];
  topCompanies: { name: string; count: number }[];
  topLocations: { name: string; count: number }[];
}
