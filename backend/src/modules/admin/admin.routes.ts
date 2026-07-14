import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok } from '../../utils/response';
import { prisma } from '../../config/prisma';

const router = Router();

// Count occurrences across an array of string[] columns → top N.
function topN(rows: { skills?: string[] }[], key: 'skills', n = 10) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    for (const item of row[key] ?? []) {
      counts.set(item, (counts.get(item) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name, count]) => ({ name, count }));
}

/**
 * @openapi
 * /dashboard:
 *   get:
 *     tags: [Admin]
 *     summary: Admin dashboard stats — totals, jobs scraped today, top skills/companies/locations
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Aggregated platform statistics }
 */
router.get(
  '/',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (_req, res) => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalCandidates,
      totalEmployers,
      totalJobs,
      openJobs,
      totalCompanies,
      totalApplications,
      totalScraped,
      scrapedToday,
      jobsForSkills,
      topCompaniesRaw,
      topLocationsRaw,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'CANDIDATE' } }),
      prisma.user.count({ where: { role: 'EMPLOYER' } }),
      prisma.job.count(),
      prisma.job.count({ where: { status: 'OPEN' } }),
      prisma.company.count(),
      prisma.application.count(),
      prisma.scrapedJob.count(),
      prisma.scrapedJob.count({ where: { scrapedAt: { gte: startOfToday } } }),
      prisma.job.findMany({ select: { skills: true } }),
      prisma.job.groupBy({
        by: ['companyId'],
        _count: { companyId: true },
        orderBy: { _count: { companyId: 'desc' } },
        take: 10,
      }),
      prisma.job.groupBy({
        by: ['location'],
        _count: { location: true },
        orderBy: { _count: { location: 'desc' } },
        take: 10,
      }),
    ]);

    // Resolve company names for the top companies.
    const companyIds = topCompaniesRaw.map((c) => c.companyId);
    const companies = await prisma.company.findMany({
      where: { id: { in: companyIds } },
      select: { id: true, name: true },
    });
    const companyName = new Map(companies.map((c) => [c.id, c.name]));

    return ok(res, {
      totals: {
        users: totalUsers,
        candidates: totalCandidates,
        employers: totalEmployers,
        jobs: totalJobs,
        openJobs,
        companies: totalCompanies,
        applications: totalApplications,
        scrapedJobs: totalScraped,
      },
      jobsScrapedToday: scrapedToday,
      topSkills: topN(jobsForSkills, 'skills'),
      topCompanies: topCompaniesRaw.map((c) => ({
        name: companyName.get(c.companyId) ?? 'Unknown',
        count: c._count.companyId,
      })),
      topLocations: topLocationsRaw.map((l) => ({
        name: l.location,
        count: l._count.location,
      })),
    });
  }),
);

export default router;
