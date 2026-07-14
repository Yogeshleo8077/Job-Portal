import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok } from '../../utils/response';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';

const router = Router();

const profileSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  headline: true,
  bio: true,
  skills: true,
  resumeUrl: true,
  location: true,
  companyId: true,
  company: { select: { id: true, name: true, website: true, logoUrl: true } },
  createdAt: true,
} as const;

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  headline: z.string().max(160).optional(),
  bio: z.string().max(2000).optional(),
  skills: z.array(z.string()).optional(),
  resumeUrl: z.string().url().optional(),
  location: z.string().optional(),
});

/**
 * @openapi
 * /users/me:
 *   get:
 *     tags: [Users]
 *     summary: Get the current authenticated user's profile
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: The user profile }
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      select: profileSelect,
    });
    if (!user) throw ApiError.notFound('User not found');
    return ok(res, user);
  }),
);

/**
 * @openapi
 * /users/me:
 *   put:
 *     tags: [Users]
 *     summary: Update the current user's profile
 *     security: [{ bearerAuth: [] }]
 */
router.put(
  '/me',
  authenticate,
  validate({ body: updateProfileSchema }),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.update({
      where: { id: req.user!.sub },
      data: req.body,
      select: profileSelect,
    });
    return ok(res, user);
  }),
);

export default router;
