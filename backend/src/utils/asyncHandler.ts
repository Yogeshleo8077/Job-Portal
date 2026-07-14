import { NextFunction, Request, Response } from 'express';

// Wraps an async route handler so thrown errors flow into the central error middleware.
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
