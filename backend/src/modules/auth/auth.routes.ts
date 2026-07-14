import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authController } from './auth.controller';
import {
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
} from './auth.schema';

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new Candidate or Employer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string, example: Jane Doe }
 *               email: { type: string, example: jane@example.com }
 *               password: { type: string, example: Password123 }
 *               role: { type: string, enum: [CANDIDATE, EMPLOYER], example: CANDIDATE }
 *               companyName: { type: string, example: Acme Inc }
 *     responses:
 *       201: { description: Registered, returns user + tokens }
 *       409: { description: Email already exists }
 */
router.post('/register', validate({ body: registerSchema }), authController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in and receive access + refresh tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: admin@jobportal.dev }
 *               password: { type: string, example: Admin@12345 }
 *     responses:
 *       200: { description: Logged in }
 *       401: { description: Invalid credentials }
 */
router.post('/login', validate({ body: loginSchema }), authController.login);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Exchange a refresh token for a new access token
 */
router.post('/refresh', validate({ body: refreshSchema }), authController.refresh);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset token
 */
router.post(
  '/forgot-password',
  validate({ body: forgotPasswordSchema }),
  authController.forgotPassword,
);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password using a valid reset token
 */
router.post(
  '/reset-password',
  validate({ body: resetPasswordSchema }),
  authController.resetPassword,
);

export default router;
