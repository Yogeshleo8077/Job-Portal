import { Response } from 'express';

export interface Paginated<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const ok = <T>(res: Response, data: T, status = 200) =>
  res.status(status).json({ success: true, data });

export const created = <T>(res: Response, data: T) => ok(res, data, 201);

export const paginated = <T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number,
) => {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const payload: Paginated<T> = {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
  return res.status(200).json({ success: true, ...payload });
};
