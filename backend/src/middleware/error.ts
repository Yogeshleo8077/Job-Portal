import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { message: `Route not found: ${req.method} ${req.originalUrl}` },
  });
};

// Centralised error handler — every thrown error lands here with a consistent shape.
export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: { message: err.message, details: err.details },
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: err.flatten().fieldErrors,
      },
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[] | undefined)?.join(', ') ?? 'field';
      return res.status(409).json({
        success: false,
        error: { message: `A record with this ${target} already exists.` },
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: { message: 'Record not found.' },
      });
    }
  }

  // eslint-disable-next-line no-console
  console.error('[UnhandledError]', err);
  return res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      ...(env.isProd ? {} : { stack: (err as Error)?.stack }),
    },
  });
};
