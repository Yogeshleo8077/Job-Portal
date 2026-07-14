import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok } from '../../utils/response';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';

const router = Router();

/**
 * @openapi
 * /applications:
 *   get:
 *     tags: [Applications]
 *     summary: List the current candidate's applications
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of applications with job info }
 */
router.get(
  '/',
  authenticate,
  authorize('CANDIDATE'),
  asyncHandler(async (req, res) => {
    const apps = await prisma.application.findMany({
      where: { candidateId: req.user!.sub },
      orderBy: { createdAt: 'desc' },
      include: {
        job: {
          include: {
            company: { select: { id: true, name: true, logoUrl: true } },
          },
        },
      },
    });
    return ok(res, apps);
  }),
);

const updateStatusSchema = z.object({
  status: z.enum(['APPLIED', 'REVIEWING', 'SHORTLISTED', 'REJECTED', 'HIRED']),
});

/**
 * @openapi
 * /applications/{id}/status:
 *   patch:
 *     tags: [Applications]
 *     summary: Update an application's status (Employer/Admin who owns the job)
 *     security: [{ bearerAuth: [] }]
 */
router.patch(
  '/:id/status',
  authenticate,
  authorize('EMPLOYER', 'ADMIN'),
  validate({ body: updateStatusSchema }),
  asyncHandler(async (req, res) => {
    const app = await prisma.application.findUnique({
      where: { id: req.params.id },
      include: { job: true },
    });
    if (!app) throw ApiError.notFound('Application not found');
    if (req.user!.role !== 'ADMIN' && app.job.postedById !== req.user!.sub) {
      throw ApiError.forbidden('You can only manage applicants for your own jobs');
    }
    const updated = await prisma.application.update({
      where: { id: req.params.id },
      data: { status: req.body.status },
    });
    return ok(res, updated);
  }),
);

export default router;
