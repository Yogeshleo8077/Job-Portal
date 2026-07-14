import { NextFunction, Request, Response } from 'express';
import { AnyZodObject, ZodEffects } from 'zod';

type Schema = AnyZodObject | ZodEffects<AnyZodObject>;

// Validates & coerces req.body / req.query / req.params against a Zod schema.
export const validate =
  (schema: { body?: Schema; query?: Schema; params?: Schema }) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (schema.body) req.body = schema.body.parse(req.body);
    if (schema.query) Object.assign(req.query, schema.query.parse(req.query));
    if (schema.params) req.params = schema.params.parse(req.params) as typeof req.params;
    next();
  };
