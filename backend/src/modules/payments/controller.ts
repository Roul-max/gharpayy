import { NextFunction, Request, Response } from 'express';
import { paymentsService } from './service.js';
import { logger } from '../../observability/logger.js';
import { AppError, isAppError } from '../../utils/errors.js';

export const paymentsController = {
  async createIntent(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info('Payment intent request received', {
        reservation_id: req.body?.reservation_id,
        provider: req.body?.provider,
        amount: req.body?.amount,
        currency: req.body?.currency ?? 'INR',
        idempotency_key_present: !!req.header('Idempotency-Key'),
        request_id: (req as any).requestId ?? null
      });

      const result = await paymentsService.createPaymentIntent({
        reservation_id: req.body.reservation_id,
        provider: req.body.provider,
        amount: req.body.amount,
        currency: req.body.currency ?? 'INR',
        idempotencyKey: req.header('Idempotency-Key') ?? undefined
      });

      logger.info('Payment intent response ready', {
        reservation_id: req.body?.reservation_id,
        provider: req.body?.provider,
        has_checkout: !!result?.checkout,
        checkout_provider: result?.checkout?.provider ?? null,
        order_id: result?.checkout?.order_id ?? null,
        payment_intent_id: result?.intent?.id ?? null,
        request_id: (req as any).requestId ?? null
      });

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  async webhook(req: Request, res: Response, next: NextFunction) {
    try {
      const provider =
        req.body?.provider ??
        (req.header('x-razorpay-signature') ? 'razorpay' : req.header('stripe-signature') ? 'stripe' : 'razorpay');

      const payload = req.body?.payload ?? req.body ?? {};
      const providerEventId =
        req.body?.provider_event_id ??
        req.body?.id ??
        payload?.payload?.payment?.entity?.id ??
        payload?.payload?.order?.entity?.id ??
        `${provider}-${Date.now()}`;

      const eventType =
        req.body?.event_type ??
        req.body?.event ??
        req.body?.type ??
        payload?.event ??
        'payment.unknown';

      paymentsService.verifyWebhook({
        provider,
        rawBody: (req as any).rawBody ?? JSON.stringify(req.body ?? {}),
        stripeSignature: req.header('stripe-signature'),
        razorpaySignature: req.header('x-razorpay-signature')
      });

      logger.info('Payment webhook verified', {
        provider,
        provider_event_id: providerEventId,
        event_type: eventType,
        request_id: (req as any).requestId ?? null
      });

      const result = await paymentsService.handleWebhook({
        provider,
        provider_event_id: providerEventId,
        event_type: eventType,
        payload
      });
      res.json(result);
    } catch (error) {
      logger.warn('Payment webhook verification failed', {
        provider: req.body?.provider ?? null,
        error: error instanceof Error ? error.message : 'unknown_error',
        request_id: (req as any).requestId ?? null
      });
      next(error);
    }
  }
  ,

  async confirm(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await paymentsService.confirmRazorpayPayment({
        reservation_id: req.body.reservation_id,
        order_id: req.body.order_id,
        payment_id: req.body.payment_id,
        signature: req.body.signature
      });
      res.json(result);
    } catch (error) {
      const rawError = error as any;
      const errorMessage =
        rawError?.message ??
        (typeof rawError === 'string' ? rawError : undefined) ??
        (rawError ? JSON.stringify(rawError) : 'unknown_error');
      logger.error('Payment confirmation failed', {
        reservation_id: req.body?.reservation_id,
        order_id: req.body?.order_id,
        payment_id: req.body?.payment_id,
        error: errorMessage,
        error_type: typeof rawError,
        request_id: (req as any).requestId ?? null
      });
      if (isAppError(error)) {
        next(error);
        return;
      }
      next(new AppError(errorMessage, 500, 'PAYMENT_CONFIRM_FAILED'));
    }
  },

  async refund(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await paymentsService.requestRefund({
        provider: req.body.provider ?? 'razorpay',
        payment_intent_id: req.body.payment_intent_id,
        reservation_id: req.body.reservation_id,
        amount: req.body.amount,
        reason: req.body.reason
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
};
