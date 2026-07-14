import { Router } from 'express';
import { authenticate, authorize, optionalAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import {
  applySchema,
  createJobSchema,
  idParamSchema,
  listJobsQuerySchema,
  updateJobSchema,
} from './jobs.schema';
import { jobsController } from './jobs.controller';

const router = Router();

/**
 * @openapi
 * /jobs:
 *   get:
 *     tags: [Jobs]
 *     summary: List jobs with pagination, filtering, sorting and search
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 10 } }
 *       - { in: query, name: search, schema: { type: string } }
 *       - { in: query, name: location, schema: { type: string } }
 *       - { in: query, name: workMode, schema: { type: string, enum: [ONSITE, REMOTE, HYBRID] } }
 *       - { in: query, name: employmentType, schema: { type: string, enum: [FULL_TIME, PART_TIME, CONTRACT, INTERNSHIP, TEMPORARY] } }
 *       - { in: query, name: skills, schema: { type: string }, description: "Comma-separated" }
 *       - { in: query, name: sortBy, schema: { type: string, enum: [createdAt, salaryMax, deadline, title] } }
 *       - { in: query, name: sortOrder, schema: { type: string, enum: [asc, desc] } }
 *     responses:
 *       200: { description: Paginated job list }
 */
router.get('/', optionalAuth, validate({ query: listJobsQuerySchema }), jobsController.list);

// Saved jobs (candidate) — must be declared before '/:id'.
/**
 * @openapi
 * /jobs/saved/list:
 *   get:
 *     tags: [Jobs]
 *     summary: List the current candidate's saved jobs
 *     security: [{ bearerAuth: [] }]
 */
router.get('/saved/list', authenticate, authorize('CANDIDATE'), jobsController.savedList);

/**
 * @openapi
 * /jobs/{id}:
 *   get:
 *     tags: [Jobs]
 *     summary: Get a single job by id
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 */
router.get('/:id', validate({ params: idParamSchema }), jobsController.getOne);

/**
 * @openapi
 * /jobs:
 *   post:
 *     tags: [Jobs]
 *     summary: Create a job (Employer/Admin)
 *     security: [{ bearerAuth: [] }]
 */
router.post(
  '/',
  authenticate,
  authorize('EMPLOYER', 'ADMIN'),
  validate({ body: createJobSchema }),
  jobsController.create,
);

/**
 * @openapi
 * /jobs/{id}:
 *   put:
 *     tags: [Jobs]
 *     summary: Update a job (owner Employer/Admin)
 *     security: [{ bearerAuth: [] }]
 */
router.put(
  '/:id',
  authenticate,
  authorize('EMPLOYER', 'ADMIN'),
  validate({ params: idParamSchema, body: updateJobSchema }),
  jobsController.update,
);

/**
 * @openapi
 * /jobs/{id}:
 *   delete:
 *     tags: [Jobs]
 *     summary: Delete a job (owner Employer/Admin)
 *     security: [{ bearerAuth: [] }]
 */
router.delete(
  '/:id',
  authenticate,
  authorize('EMPLOYER', 'ADMIN'),
  validate({ params: idParamSchema }),
  jobsController.remove,
);

/**
 * @openapi
 * /jobs/{id}/close:
 *   patch:
 *     tags: [Jobs]
 *     summary: Close a job (owner Employer/Admin)
 *     security: [{ bearerAuth: [] }]
 */
router.patch(
  '/:id/close',
  authenticate,
  authorize('EMPLOYER', 'ADMIN'),
  validate({ params: idParamSchema }),
  jobsController.close,
);

/**
 * @openapi
 * /jobs/{id}/applicants:
 *   get:
 *     tags: [Jobs]
 *     summary: List applicants for a job (owner Employer/Admin)
 *     security: [{ bearerAuth: [] }]
 */
router.get(
  '/:id/applicants',
  authenticate,
  authorize('EMPLOYER', 'ADMIN'),
  validate({ params: idParamSchema }),
  jobsController.applicants,
);

/**
 * @openapi
 * /jobs/{id}/apply:
 *   post:
 *     tags: [Jobs]
 *     summary: Apply to a job (Candidate). Optionally includes resumeText for AI matching.
 *     security: [{ bearerAuth: [] }]
 */
router.post(
  '/:id/apply',
  authenticate,
  authorize('CANDIDATE'),
  validate({ params: idParamSchema, body: applySchema }),
  jobsController.apply,
);

/**
 * @openapi
 * /jobs/{id}/save:
 *   post:
 *     tags: [Jobs]
 *     summary: Save a job (Candidate)
 *     security: [{ bearerAuth: [] }]
 */
router.post(
  '/:id/save',
  authenticate,
  authorize('CANDIDATE'),
  validate({ params: idParamSchema }),
  jobsController.save,
);

router.delete(
  '/:id/save',
  authenticate,
  authorize('CANDIDATE'),
  validate({ params: idParamSchema }),
  jobsController.unsave,
);

export default router;
