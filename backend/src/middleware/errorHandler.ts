import { Request, Response, NextFunction } from 'express';
import { Sentry } from '../observability/sentry.js';
import { logger } from '../observability/logger.js';
import { snapshotMetrics } from '../observability/metrics.js';
import { toSafeError } from '../utils/errors.js';

export const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
  const safeError = toSafeError(err);
  const requestId = (req as any).requestId ?? null;
  Sentry.captureException(err);

  logger.error('Unhandled application error', {
    request_id: requestId,
    path: req.originalUrl,
    error_code: safeError.errorCode,
    message: safeError.message,
    metadata: safeError.metadata ?? null,
    stack: err instanceof Error ? err.stack : null,
    metrics: snapshotMetrics()
  });

  res.status(safeError.statusCode).json({
    success: false,
    message: safeError.message,
    error_code: safeError.errorCode,
    request_id: requestId
  });
};
