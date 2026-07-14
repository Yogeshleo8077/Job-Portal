import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { created, ok } from '../../utils/response';
import { authService } from './auth.service';

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    return created(res, result);
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);
    return ok(res, result);
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.refresh(req.body.refreshToken);
    return ok(res, result);
  }),

  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.forgotPassword(req.body.email);
    return ok(res, result);
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.resetPassword(req.body.token, req.body.password);
    return ok(res, result);
  }),
};
