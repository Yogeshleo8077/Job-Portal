import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import { errorHandler, notFoundHandler } from './middleware/error';

import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/users.routes';
import jobRoutes from './modules/jobs/jobs.routes';
import applicationRoutes from './modules/applications/applications.routes';
import scraperRoutes from './modules/scraper/scraper.routes';
import adminRoutes from './modules/admin/admin.routes';
import aiRoutes from './modules/ai/ai.routes';

export function createApp(): Express {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  if (!env.isProd) app.use(morgan('dev'));

  // Bonus: rate limiting.
  app.use(
    '/api',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: env.isProd ? 300 : 1000,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // Health check
  app.get('/api/health', (_req, res) =>
    res.json({ success: true, status: 'ok', time: new Date().toISOString() }),
  );

  // Swagger docs
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));

  // Routes (Module 3 REST API surface)
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/jobs', jobRoutes);
  app.use('/api/applications', applicationRoutes);
  app.use('/api/scrape', scraperRoutes);
  app.use('/api/dashboard', adminRoutes);
  app.use('/api/ai', aiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
