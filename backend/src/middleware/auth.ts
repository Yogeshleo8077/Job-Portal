import { NextFunction, Request, Response } from 'express';
import { Role } from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import { JwtPayload, verifyAccessToken } from '../utils/jwt';

// Augment Express Request with the authenticated user.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// Requires a valid access token; attaches req.user.
export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Missing or malformed Authorization header');
  }
  const token = header.slice(7);
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    throw ApiError.unauthorized('Invalid or expired token');
  }
};

// Optional auth — attaches req.user if a valid token is present, but never blocks.
export const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      req.user = verifyAccessToken(header.slice(7));
    } catch {
      /* ignore — treat as anonymous */
    }
  }
  next();
};

// Role-based access control. Usage: authorize('ADMIN', 'EMPLOYER')
export const authorize =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw ApiError.unauthorized();
    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden('You do not have permission to perform this action');
    }
    next();
  };
