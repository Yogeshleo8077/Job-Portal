import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok } from '../../utils/response';
import { paginated } from '../../utils/response';
import { scraperService } from './scraper.service';

const router = Router();

const scrapeBodySchema = z.object({
  sources: z.array(z.string()).optional(),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
});

/**
 * @openapi
 * /scrape/jobs:
 *   post:
 *     tags: [Scraper]
 *     summary: Scrape jobs from public sources (Admin). Returns jobs added, duplicates skipped, errors.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sources:
 *                 type: array
 *                 items: { type: string, enum: [remoteok, arbeitnow] }
 *     responses:
 *       200: { description: Per-source scrape report }
 */
router.post(
  '/jobs',
  authenticate,
  authorize('ADMIN'),
  validate({ body: scrapeBodySchema }),
  asyncHandler(async (req, res) => {
    const reports = await scraperService.run(req.body.sources);
    const summary = reports.reduce(
      (acc, r) => ({
        added: acc.added + r.added,
        duplicatesSkipped: acc.duplicatesSkipped + r.duplicatesSkipped,
        errors: acc.errors + r.errors.length,
      }),
      { added: 0, duplicatesSkipped: 0, errors: 0 },
    );
    return ok(res, { summary, reports, sources: scraperService.availableSources() });
  }),
);

/**
 * @openapi
 * /scrape/jobs:
 *   get:
 *     tags: [Scraper]
 *     summary: List scraped jobs (paginated, searchable)
 */
router.get(
  '/jobs',
  validate({ query: listQuerySchema }),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as z.infer<typeof listQuerySchema>;
    const { data, total } = await scraperService.list(q.page, q.limit, q.search);
    return paginated(res, data, q.page, q.limit, total);
  }),
);

export default router;
