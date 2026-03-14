import { Request, Response, NextFunction } from 'express';
import { nanoid } from 'nanoid';
import { AuthRequest } from './auth.js';
import { runWithRequestContext } from '../observability/requestContext.js';
import { observeApiLatency } from '../observability/metrics.js';
import { logger } from '../observability/logger.js';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const requestId = String(req.headers['x-request-id'] ?? nanoid(12));
  res.setHeader('x-request-id', requestId);
  (req as any).requestId = requestId;
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const authReq = req as AuthRequest & { requestId?: string };
    const isError = res.statusCode >= 500;
    observeApiLatency(duration, isError);
    const isClientOrServerError = res.statusCode >= 400;
    const isSlow = duration > 1000;
    if (isClientOrServerError || isSlow) {
      logger.info('HTTP request completed', {
        request_id: requestId,
        user_id: authReq.user?.sub ?? null,
        role: authReq.role ?? null,
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        duration_ms: duration,
        slow_request: isSlow
      });
    }
  });

  runWithRequestContext(requestId, () => next());
};
