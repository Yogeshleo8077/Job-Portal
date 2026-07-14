import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { JwtPayload } from '../../utils/jwt';
import { aiService } from '../ai/ai.service';
import { CreateJobInput, ListJobsQuery } from './jobs.schema';

const jobInclude = {
  company: { select: { id: true, name: true, logoUrl: true, location: true } },
  postedBy: { select: { id: true, name: true } },
  _count: { select: { applications: true } },
} satisfies Prisma.JobInclude;

export const jobsService = {
  async list(query: ListJobsQuery) {
    const {
      page,
      limit,
      search,
      location,
      workMode,
      employmentType,
      skills,
      minSalary,
      maxExperience,
      status,
      companyId,
      sortBy,
      sortOrder,
    } = query;

    const where: Prisma.JobWhereInput = {};

    // Public listing defaults to OPEN jobs unless a specific status is requested.
    where.status = status ?? 'OPEN';
    if (companyId) where.companyId = companyId;
    if (location) where.location = { contains: location, mode: 'insensitive' };
    if (workMode) where.workMode = workMode;
    if (employmentType) where.employmentType = employmentType;
    if (skills?.length) where.skills = { hasSome: skills };
    if (minSalary !== undefined) where.salaryMax = { gte: minSalary };
    if (maxExperience !== undefined) where.experienceMin = { lte: maxExperience };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { company: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [total, data] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.findMany({
        where,
        include: jobInclude,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { data, total };
  },

  async getById(id: string) {
    const job = await prisma.job.findUnique({ where: { id }, include: jobInclude });
    if (!job) throw ApiError.notFound('Job not found');
    return job;
  },

  async create(user: JwtPayload, input: CreateJobInput) {
    // Resolve which company the job belongs to.
    let companyId = input.companyId;
    if (user.role === 'EMPLOYER') {
      const employer = await prisma.user.findUnique({ where: { id: user.sub } });
      if (!employer?.companyId) {
        throw ApiError.badRequest(
          'Your account is not linked to a company. Update your profile / company first.',
        );
      }
      companyId = employer.companyId;
    }
    if (!companyId) throw ApiError.badRequest('companyId is required');

    return prisma.job.create({
      data: {
        ...input,
        companyId,
        postedById: user.sub,
      },
      include: jobInclude,
    });
  },

  async update(user: JwtPayload, id: string, input: Prisma.JobUpdateInput) {
    await this.assertOwnership(user, id);
    return prisma.job.update({ where: { id }, data: input, include: jobInclude });
  },

  async remove(user: JwtPayload, id: string) {
    await this.assertOwnership(user, id);
    await prisma.job.delete({ where: { id } });
    return { message: 'Job deleted' };
  },

  async close(user: JwtPayload, id: string) {
    await this.assertOwnership(user, id);
    return prisma.job.update({
      where: { id },
      data: { status: 'CLOSED' },
      include: jobInclude,
    });
  },

  // Applicants for a given job (employer/admin only).
  async applicants(user: JwtPayload, id: string) {
    await this.assertOwnership(user, id);
    return prisma.application.findMany({
      where: { jobId: id },
      orderBy: [{ matchScore: 'desc' }, { createdAt: 'desc' }],
      include: {
        candidate: {
          select: { id: true, name: true, email: true, headline: true, skills: true, resumeUrl: true },
        },
      },
    });
  },

  async apply(
    user: JwtPayload,
    jobId: string,
    body: { coverLetter?: string; resumeUrl?: string; resumeText?: string },
  ) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw ApiError.notFound('Job not found');
    if (job.status !== 'OPEN') throw ApiError.badRequest('This job is no longer accepting applications');

    const existing = await prisma.application.findUnique({
      where: { jobId_candidateId: { jobId, candidateId: user.sub } },
    });
    if (existing) throw ApiError.conflict('You have already applied to this job');

    // Bonus: AI resume matching — score the candidate against the job at apply time.
    let matchScore: number | undefined;
    let matchNotes: string | undefined;
    if (body.resumeText || body.resumeUrl) {
      const candidate = await prisma.user.findUnique({ where: { id: user.sub } });
      const result = await aiService.matchResume({
        jobTitle: job.title,
        jobDescription: job.description,
        jobSkills: job.skills,
        resumeText: body.resumeText,
        candidateSkills: candidate?.skills ?? [],
      });
      matchScore = result?.score;
      matchNotes = result?.summary;
    }

    return prisma.application.create({
      data: {
        jobId,
        candidateId: user.sub,
        coverLetter: body.coverLetter,
        resumeUrl: body.resumeUrl,
        matchScore,
        matchNotes,
      },
    });
  },

  // ---- Saved jobs ----
  async save(user: JwtPayload, jobId: string) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw ApiError.notFound('Job not found');
    return prisma.savedJob.upsert({
      where: { jobId_candidateId: { jobId, candidateId: user.sub } },
      update: {},
      create: { jobId, candidateId: user.sub },
    });
  },

  async unsave(user: JwtPayload, jobId: string) {
    await prisma.savedJob
      .delete({ where: { jobId_candidateId: { jobId, candidateId: user.sub } } })
      .catch(() => undefined);
    return { message: 'Removed from saved jobs' };
  },

  async savedList(user: JwtPayload) {
    const saved = await prisma.savedJob.findMany({
      where: { candidateId: user.sub },
      orderBy: { createdAt: 'desc' },
      include: { job: { include: jobInclude } },
    });
    return saved.map((s) => s.job);
  },

  async assertOwnership(user: JwtPayload, jobId: string) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw ApiError.notFound('Job not found');
    if (user.role === 'ADMIN') return job;
    if (job.postedById !== user.sub) {
      throw ApiError.forbidden('You can only manage jobs you posted');
    }
    return job;
  },
};
