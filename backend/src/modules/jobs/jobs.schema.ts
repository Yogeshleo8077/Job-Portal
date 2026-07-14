import { z } from 'zod';

const workMode = z.enum(['ONSITE', 'REMOTE', 'HYBRID']);
const employmentType = z.enum([
  'FULL_TIME',
  'PART_TIME',
  'CONTRACT',
  'INTERNSHIP',
  'TEMPORARY',
]);

export const createJobSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(20),
  location: z.string().min(2),
  workMode: workMode.default('ONSITE'),
  employmentType: employmentType.default('FULL_TIME'),
  salaryMin: z.number().int().nonnegative().optional(),
  salaryMax: z.number().int().nonnegative().optional(),
  currency: z.string().default('INR'),
  experienceMin: z.number().int().nonnegative().optional(),
  experienceMax: z.number().int().nonnegative().optional(),
  skills: z.array(z.string()).default([]),
  benefits: z.array(z.string()).default([]),
  deadline: z.coerce.date().optional(),
  companyId: z.string().optional(), // admins may specify; employers default to own
});

export const updateJobSchema = createJobSchema.partial().extend({
  status: z.enum(['OPEN', 'CLOSED', 'DRAFT']).optional(),
});

// Query params for GET /jobs — pagination, filtering, sorting, search.
export const listJobsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(), // matches title / description / company
  location: z.string().optional(),
  workMode: workMode.optional(),
  employmentType: employmentType.optional(),
  skills: z
    .string()
    .optional()
    .transform((s) => (s ? s.split(',').map((x) => x.trim()).filter(Boolean) : undefined)),
  minSalary: z.coerce.number().int().optional(),
  maxExperience: z.coerce.number().int().optional(),
  status: z.enum(['OPEN', 'CLOSED', 'DRAFT']).optional(),
  companyId: z.string().optional(),
  sortBy: z.enum(['createdAt', 'salaryMax', 'deadline', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const idParamSchema = z.object({ id: z.string().min(1) });

export const applySchema = z.object({
  coverLetter: z.string().max(5000).optional(),
  resumeUrl: z.string().url().optional(),
  resumeText: z.string().max(20000).optional(), // used for AI matching
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type ListJobsQuery = z.infer<typeof listJobsQuerySchema>;
