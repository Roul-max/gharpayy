import { NextFunction, Request, Response } from 'express';
import { logger } from '../observability/logger.js';

export async function requireCaptcha(req: Request, res: Response, next: NextFunction) {
  const shouldBypass = process.env.CAPTCHA_BYPASS === 'true';
  const isDev = process.env.NODE_ENV !== 'production';
  const token = req.body?.captchaToken;

  if (isDev && token === 'bypass') {
    logger.warn('Captcha bypass token accepted (dev)', { hostname: req.hostname, path: req.path });
    return next();
  }
  if (shouldBypass) {
    logger.warn('Captcha bypass active', { hostname: req.hostname, path: req.path });
    return next();
  }

  const secret = process.env.CAPTCHA_SECRET;
  if (!secret) {
    logger.warn('Captcha secret missing, skipping verification', {
      path: req.path,
      request_id: (req as any).requestId ?? null
    });
    return next();
  }

  if (!token || typeof token !== 'string') {
    logger.warn('Captcha token missing', {
      path: req.path,
      request_id: (req as any).requestId ?? null
    });
    return res.status(400).json({ error: 'Missing captcha token' });
  }

  try {
    logger.info('Captcha verification start', {
      path: req.path,
      request_id: (req as any).requestId ?? null
    });
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: (() => {
        const params = new URLSearchParams({ secret, response: token });
        if (req.ip) params.set('remoteip', req.ip);
        return params;
      })()
    });
    const payload = (await response.json()) as { success?: boolean; ['error-codes']?: string[]; [key: string]: unknown };
    logger.info('Captcha verification result', {
      path: req.path,
      success: payload?.success ?? false,
      request_id: (req as any).requestId ?? null
    });
    if (!payload.success) {
      logger.warn('Captcha verification failed', {
        path: req.path,
        request_id: (req as any).requestId ?? null
      });
      return res.status(403).json({ error: 'Captcha verification failed' });
    }
    return next();
  } catch {
    logger.error('Captcha verification error', { path: req.path, request_id: (req as any).requestId ?? null });
    return res.status(503).json({ error: 'Captcha verification unavailable' });
  }
}
