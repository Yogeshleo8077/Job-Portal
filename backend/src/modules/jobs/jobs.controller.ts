import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { created, ok, paginated } from '../../utils/response';
import { ListJobsQuery } from './jobs.schema';
import { jobsService } from './jobs.service';

export const jobsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListJobsQuery;
    const { data, total } = await jobsService.list(query);
    return paginated(res, data, query.page, query.limit, total);
  }),

  getOne: asyncHandler(async (req: Request, res: Response) => {
    const job = await jobsService.getById(req.params.id);
    return ok(res, job);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const job = await jobsService.create(req.user!, req.body);
    return created(res, job);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const job = await jobsService.update(req.user!, req.params.id, req.body);
    return ok(res, job);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const result = await jobsService.remove(req.user!, req.params.id);
    return ok(res, result);
  }),

  close: asyncHandler(async (req: Request, res: Response) => {
    const job = await jobsService.close(req.user!, req.params.id);
    return ok(res, job);
  }),

  applicants: asyncHandler(async (req: Request, res: Response) => {
    const list = await jobsService.applicants(req.user!, req.params.id);
    return ok(res, list);
  }),

  apply: asyncHandler(async (req: Request, res: Response) => {
    const application = await jobsService.apply(req.user!, req.params.id, req.body);
    return created(res, application);
  }),

  save: asyncHandler(async (req: Request, res: Response) => {
    const saved = await jobsService.save(req.user!, req.params.id);
    return created(res, saved);
  }),

  unsave: asyncHandler(async (req: Request, res: Response) => {
    const result = await jobsService.unsave(req.user!, req.params.id);
    return ok(res, result);
  }),

  savedList: asyncHandler(async (req: Request, res: Response) => {
    const list = await jobsService.savedList(req.user!);
    return ok(res, list);
  }),
};
