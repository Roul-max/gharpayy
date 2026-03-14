import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodTypeAny } from 'zod';
import { logger } from '../observability/logger.js';

export const validate = (schema: ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('Validation failed', {
          path: req.path,
          issues: error.issues,
          request_id: (req as any).requestId ?? null
        });
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          error_code: 'VALIDATION_ERROR',
          errors: error.issues,
        });
      }
      return next(error);
    }
  };
};
