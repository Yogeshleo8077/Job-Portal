import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok } from '../../utils/response';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { aiService } from './ai.service';

const router = Router();

const matchSchema = z.object({
  jobId: z.string().min(1),
  resumeText: z.string().max(20000).optional(),
});

/**
 * @openapi
 * /ai/match:
 *   post:
 *     tags: [AI]
 *     summary: AI Resume Matching — score the current candidate against a job (bonus feature)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [jobId]
 *             properties:
 *               jobId: { type: string }
 *               resumeText: { type: string }
 *     responses:
 *       200: { description: Match score and summary }
 */
router.post(
  '/match',
  authenticate,
  validate({ body: matchSchema }),
  asyncHandler(async (req, res) => {
    const job = await prisma.job.findUnique({ where: { id: req.body.jobId } });
    if (!job) throw ApiError.notFound('Job not found');

    const candidate = await prisma.user.findUnique({ where: { id: req.user!.sub } });

    const result = await aiService.matchResume({
      jobTitle: job.title,
      jobDescription: job.description,
      jobSkills: job.skills,
      candidateSkills: candidate?.skills ?? [],
      resumeText: req.body.resumeText,
    });

    return ok(res, { ...result, aiEnabled: aiService.isEnabled() });
  }),
);

export default router;
