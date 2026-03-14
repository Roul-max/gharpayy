import crypto from 'crypto';
import { randomUUID } from 'crypto';
import { paymentsRepository } from './repository.js';
import { cacheDelete, cacheDeleteByPrefix } from '../../cache/cache.js';
import { AppError } from '../../utils/errors.js';
import { logger } from '../../observability/logger.js';

type PaymentProvider = 'stripe' | 'razorpay';

class PaymentError extends AppError {
  constructor(message: string, statusCode = 400, errorCode = 'PAYMENT_ERROR') {
    super(message, statusCode, errorCode);
  }
}

function getHeaderValue(value?: string | string[] | null) {
  if (!value) return '';
  return Array.isArray(value) ? value[0] ?? '' : value;
}

function safeEqualHex(a: string, b: string) {
  const left = Buffer.from(a, 'hex');
  const right = Buffer.from(b, 'hex');
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function verifyStripeSignature(rawBody: string, signatureHeader: string, secret: string) {
  const pairs = signatureHeader.split(',').map((item) => item.trim());
  const timestamp = pairs.find((item) => item.startsWith('t='))?.split('=')[1];
  const signatures = pairs.filter((item) => item.startsWith('v1=')).map((item) => item.split('=')[1]);
  if (!timestamp || signatures.length === 0) return false;

  const payload = `${timestamp}.${rawBody}`;
  const digest = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return signatures.some((sig) => safeEqualHex(sig, digest));
}

function verifyRazorpaySignature(rawBody: string, signatureHeader: string, secret: string) {
  const digest = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return safeEqualHex(signatureHeader, digest);
}

function verifyRazorpayPaymentSignature(orderId: string, paymentId: string, signature: string, secret: string) {
  const digest = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
  return safeEqualHex(signature, digest);
}

function inferPaymentIntentId(provider: PaymentProvider, payload: any) {
  if (provider === 'stripe') {
    return payload?.data?.object?.id ?? payload?.data?.object?.payment_intent ?? payload?.payment_intent_id ?? null;
  }
  return (
    payload?.payload?.payment?.entity?.order_id ??
    payload?.payload?.order?.entity?.id ??
    payload?.order_id ??
    payload?.payload?.payment?.entity?.id ??
    payload?.payment?.id ??
    payload?.payment_id ??
    null
  );
}

function inferRefundId(provider: PaymentProvider, payload: any) {
  if (provider === 'stripe') {
    return payload?.data?.object?.id ?? payload?.data?.object?.refund_id ?? payload?.refund_id ?? null;
  }
  return (
    payload?.payload?.refund?.entity?.id ??
    payload?.refund_id ??
    payload?.payload?.refund?.id ??
    null
  );
}

function mapIntentStatus(eventType: string): 'succeeded' | 'failed' | 'cancelled' | 'requires_action' | 'created' {
  const normalized = eventType.toLowerCase();
  if (normalized.includes('succeeded') || normalized.includes('captured') || normalized.includes('paid')) return 'succeeded';
  if (normalized.includes('failed')) return 'failed';
  if (normalized.includes('cancel') || normalized.includes('expired')) return 'cancelled';
  if (normalized.includes('action') || normalized.includes('requires')) return 'requires_action';
  return 'created';
}

function mapRefundStatus(eventType: string): 'pending' | 'succeeded' | 'failed' {
  const normalized = eventType.toLowerCase();
  if (normalized.includes('failed')) return 'failed';
  if (normalized.includes('processed') || normalized.includes('succeeded')) return 'succeeded';
  return 'pending';
}

export const paymentsService = {
  async createPaymentIntent(input: {
    reservation_id: string;
    provider: PaymentProvider;
    amount: number;
    currency: string;
    idempotencyKey?: string;
  }) {
    logger.info('Payment intent creation started', {
      reservation_id: input.reservation_id,
      provider: input.provider,
      amount: input.amount,
      currency: input.currency,
      idempotency_key_present: !!input.idempotencyKey
    });

    const reservation = await paymentsRepository.getReservationForPayment(input.reservation_id);
    if (!reservation) {
      throw new PaymentError('Reservation not found', 404, 'RESERVATION_NOT_FOUND');
    }
    logger.info('Payment reservation fetched', {
      reservation_id: reservation.id,
      status: reservation.status,
      hold_expires_at: reservation.hold_expires_at ?? null,
      price: reservation.price ?? null
    });

    if (reservation.status !== 'pending') {
      throw new PaymentError('Reservation not payable', 409, 'RESERVATION_NOT_PAYABLE');
    }
    if (reservation.hold_expires_at && new Date(reservation.hold_expires_at) < new Date()) {
      throw new PaymentError('Reservation hold expired', 410, 'RESERVATION_EXPIRED');
    }
    const reservationAmount = Number(reservation.price ?? 0);
    if (!reservationAmount || Number.isNaN(reservationAmount)) {
      throw new PaymentError('Reservation amount unavailable', 400, 'RESERVATION_AMOUNT_MISSING');
    }
    if (input.amount && Math.round(input.amount) !== Math.round(reservationAmount)) {
      throw new PaymentError('Payment amount mismatch', 400, 'PAYMENT_AMOUNT_MISMATCH');
    }

    const existingIntent = await paymentsRepository.findIntentByReservationAndIdempotency(
      input.reservation_id,
      input.idempotencyKey
    );
    if (existingIntent) {
      logger.info('Existing payment intent reused', {
        reservation_id: input.reservation_id,
        payment_intent_id: existingIntent.id,
        provider_intent_id: existingIntent.provider_intent_id,
        provider: existingIntent.provider,
        amount: existingIntent.amount,
        currency: existingIntent.currency
      });
      return {
        intent: existingIntent,
        checkout: input.provider === 'razorpay'
          ? {
            provider: 'razorpay',
            key_id: process.env.RAZORPAY_KEY_ID ?? '',
            order_id: existingIntent.provider_intent_id,
            amount: existingIntent.amount,
            currency: existingIntent.currency
          }
          : null
      };
    }

    const normalizedAmount = reservationAmount;
    let providerIntentId = `${input.provider}_${randomUUID()}`;
    let checkout: null | { provider: 'razorpay'; key_id: string; order_id: string; amount: number; currency: string } = null;

    if (input.provider === 'razorpay') {
      const keyId = process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!keyId || !keySecret) {
        logger.error('Razorpay keys missing', {
          key_id_present: !!keyId,
          key_secret_present: !!keySecret
        });
        throw new PaymentError('Razorpay keys not configured', 500, 'RAZORPAY_CONFIG_ERROR');
      }

      logger.info('Creating Razorpay order', {
        reservation_id: input.reservation_id,
        amount: Math.round(normalizedAmount * 100),
        currency: input.currency
      });

      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: Math.round(normalizedAmount * 100),
          currency: input.currency,
          receipt: input.reservation_id,
          payment_capture: 1
        })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        logger.error('Razorpay order creation failed', {
          status: response.status,
          status_text: response.statusText,
          error_body: errorBody
        });
        throw new PaymentError(`Razorpay order creation failed: ${errorBody}`, 502, 'RAZORPAY_ORDER_FAILED');
      }
      const order = await response.json();
      logger.info('Razorpay order created', {
        order_id: order?.id ?? null,
        amount: order?.amount ?? null,
        currency: order?.currency ?? null
      });
      providerIntentId = order.id;
      checkout = {
        provider: 'razorpay',
        key_id: keyId,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency
      };
    }

    const intent = await paymentsRepository.createIntent({
      reservation_id: input.reservation_id,
      provider: input.provider,
      provider_intent_id: providerIntentId,
      amount: normalizedAmount,
      currency: input.currency,
      idempotency_key: input.idempotencyKey
    });
    logger.info('Payment intent created', {
      payment_intent_id: intent.id,
      reservation_id: intent.reservation_id,
      provider: intent.provider,
      provider_intent_id: intent.provider_intent_id,
      amount: intent.amount,
      currency: intent.currency
    });
    return { intent, checkout };
  },

  verifyWebhook(input: {
    provider: PaymentProvider;
    rawBody: string;
    stripeSignature?: string | string[];
    razorpaySignature?: string | string[];
  }) {
    const stripeSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const razorpaySecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (input.provider === 'stripe') {
      if (!stripeSecret) {
        if (process.env.NODE_ENV === 'production') {
          throw new PaymentError('Missing Stripe webhook secret', 500, 'WEBHOOK_CONFIG_ERROR');
        }
        return true;
      }
      const signature = getHeaderValue(input.stripeSignature);
      if (!signature || !verifyStripeSignature(input.rawBody, signature, stripeSecret)) {
        throw new PaymentError('Invalid Stripe webhook signature', 401, 'WEBHOOK_SIGNATURE_INVALID');
      }
      return true;
    }

    if (!razorpaySecret) {
      if (process.env.NODE_ENV === 'production') {
        throw new PaymentError('Missing Razorpay webhook secret', 500, 'WEBHOOK_CONFIG_ERROR');
      }
      return true;
    }
    const signature = getHeaderValue(input.razorpaySignature);
    if (!signature || !verifyRazorpaySignature(input.rawBody, signature, razorpaySecret)) {
      throw new PaymentError('Invalid Razorpay webhook signature', 401, 'WEBHOOK_SIGNATURE_INVALID');
    }
    return true;
  },

  async handleWebhook(input: {
    provider: PaymentProvider;
    provider_event_id: string;
    event_type: string;
    payload: unknown;
  }) {
    const webhook = await paymentsRepository.upsertWebhookEvent(input);
    if (webhook.processed) {
      return { received: true, duplicate: true, webhook_id: webhook.id };
    }

    const payload = input.payload as any;

    const normalizedEvent = input.event_type.toLowerCase();
    if (normalizedEvent.includes('refund')) {
      const refundId = inferRefundId(input.provider, payload);
      const providerIntentId = inferPaymentIntentId(input.provider, payload);
      if (refundId && providerIntentId) {
        const intent = await paymentsRepository.getIntentByProviderIntentId(providerIntentId);
        if (intent) {
          await paymentsRepository.updateRefundStatus({
            provider_refund_id: refundId,
            status: mapRefundStatus(input.event_type)
          });
          if (mapRefundStatus(input.event_type) === 'succeeded') {
            await paymentsRepository.markReservationRefunded(intent.reservation_id);
            await Promise.all([
              cacheDeleteByPrefix('public:properties:'),
              cacheDeleteByPrefix('public:property:'),
              cacheDelete('public:stats')
            ]);
          }
        }
      }

      await paymentsRepository.markWebhookProcessed(webhook.id);
      return { received: true, duplicate: false, webhook_id: webhook.id };
    }
    const providerIntentId = inferPaymentIntentId(input.provider, payload);
    if (!providerIntentId) {
      throw new PaymentError('Provider intent id missing in webhook payload', 400, 'PAYMENT_INTENT_NOT_FOUND');
    }

    const gatewayTransactionId =
      payload?.payload?.payment?.entity?.id ??
      payload?.payment_id ??
      payload?.id ??
      providerIntentId;

    const intent = await paymentsRepository.getIntentByProviderIntentId(providerIntentId);
    if (!intent) {
      throw new PaymentError('Payment intent not found', 404, 'PAYMENT_INTENT_NOT_FOUND');
    }

    await paymentsRepository.createPaymentEvent({
      payment_intent_id: intent.id,
      provider_event_id: input.provider_event_id,
      event_type: input.event_type,
      payload: input.payload
    });

    const targetStatus = mapIntentStatus(input.event_type);
    const updatedIntent = await paymentsRepository.updateIntentStatus(intent.id, targetStatus);

    let booking: unknown = null;
    if (targetStatus === 'succeeded') {
      booking = await paymentsRepository.finalizeSuccessfulPayment({ reservationId: intent.reservation_id, paymentIntentId: intent.id });
      await paymentsRepository.upsertPaymentTransaction({
        reservation_id: intent.reservation_id,
        amount: Number(intent.amount),
        gateway_transaction_id: gatewayTransactionId,
        status: 'success'
      });
      await Promise.all([
        cacheDeleteByPrefix('public:properties:'),
        cacheDeleteByPrefix('public:property:'),
        cacheDelete('public:stats')
      ]);
    } else if (targetStatus === 'failed' || targetStatus === 'cancelled') {
      await paymentsRepository.failReservationAndReleaseLock(intent.reservation_id);
      await paymentsRepository.upsertPaymentTransaction({
        reservation_id: intent.reservation_id,
        amount: Number(intent.amount),
        gateway_transaction_id: gatewayTransactionId,
        status: 'failed'
      });
    }

    await paymentsRepository.markWebhookProcessed(webhook.id);

    return {
      received: true,
      duplicate: false,
      webhook_id: webhook.id,
      payment_intent_id: updatedIntent.id,
      payment_status: updatedIntent.status,
      booking
    };
  }
  ,

  async confirmRazorpayPayment(input: {
    reservation_id: string;
    order_id: string;
    payment_id: string;
    signature: string;
  }) {
    logger.info('Payment confirm start', {
      reservation_id: input.reservation_id,
      order_id: input.order_id,
      payment_id: input.payment_id,
      signature_present: !!input.signature,
      signature_len: input.signature?.length ?? 0
    });

    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!razorpaySecret) {
      throw new PaymentError('Razorpay key secret not configured', 500, 'RAZORPAY_CONFIG_ERROR');
    }

    if (!verifyRazorpayPaymentSignature(input.order_id, input.payment_id, input.signature, razorpaySecret)) {
      logger.warn('Payment signature verification failed', {
        order_id: input.order_id,
        payment_id: input.payment_id
      });
      throw new PaymentError('Invalid Razorpay payment signature', 401, 'PAYMENT_SIGNATURE_INVALID');
    }

    const intent = await paymentsRepository.getIntentByProviderIntentId(input.order_id);
    if (!intent) {
      logger.warn('Payment intent not found for order', { order_id: input.order_id });
      throw new PaymentError('Payment intent not found', 404, 'PAYMENT_INTENT_NOT_FOUND');
    }

    if (intent.status === 'succeeded') {
      logger.info('Payment already confirmed', { payment_intent_id: intent.id });
      return { confirmed: true, booking: null, payment_status: intent.status };
    }

    logger.info('Payment intent found', { payment_intent_id: intent.id, status: intent.status });
    await paymentsRepository.createPaymentEvent({
      payment_intent_id: intent.id,
      provider_event_id: input.payment_id,
      event_type: 'razorpay.payment.captured',
      payload: { payment_id: input.payment_id, order_id: input.order_id }
    });

    const updatedIntent = await paymentsRepository.updateIntentStatus(intent.id, 'succeeded');
    logger.info('Payment intent marked succeeded', { payment_intent_id: updatedIntent.id });
    const booking = await paymentsRepository.finalizeSuccessfulPayment({
      reservationId: intent.reservation_id,
      paymentIntentId: intent.id
    });

    await paymentsRepository.upsertPaymentTransaction({
      reservation_id: intent.reservation_id,
      amount: Number(intent.amount),
      gateway_transaction_id: input.payment_id,
      status: 'success'
    });
    await Promise.all([
      cacheDeleteByPrefix('public:properties:'),
      cacheDeleteByPrefix('public:property:'),
      cacheDelete('public:stats')
    ]);
    logger.info('Payment confirmation complete', { payment_intent_id: updatedIntent.id });

    return {
      confirmed: true,
      booking,
      payment_intent_id: updatedIntent.id,
      payment_status: updatedIntent.status
    };
  },

  async requestRefund(input: {
    provider: PaymentProvider;
    payment_intent_id?: string;
    reservation_id?: string;
    amount?: number;
    reason?: string;
  }) {
    const intent = input.payment_intent_id
      ? await paymentsRepository.getIntentById(input.payment_intent_id)
      : input.reservation_id
        ? await paymentsRepository.getIntentByReservation(input.reservation_id)
        : null;

    if (!intent) {
      throw new PaymentError('Payment intent not found', 404, 'PAYMENT_INTENT_NOT_FOUND');
    }
    if (intent.status !== 'succeeded') {
      throw new PaymentError('Only successful payments can be refunded', 409, 'PAYMENT_NOT_REFUNDABLE');
    }

    const transaction = await paymentsRepository.getLatestSuccessfulTransaction(intent.reservation_id);
    if (!transaction?.gateway_transaction_id) {
      throw new PaymentError('Payment transaction not found', 404, 'PAYMENT_TRANSACTION_NOT_FOUND');
    }

    const amount = input.amount ?? Number(intent.amount);
    if (!amount || Number.isNaN(amount) || amount <= 0) {
      throw new PaymentError('Refund amount invalid', 400, 'REFUND_AMOUNT_INVALID');
    }
    if (amount > Number(intent.amount)) {
      throw new PaymentError('Refund amount exceeds payment', 400, 'REFUND_AMOUNT_EXCEEDS_PAYMENT');
    }

    if (input.provider !== 'razorpay') {
      throw new PaymentError('Unsupported refund provider', 400, 'REFUND_PROVIDER_UNSUPPORTED');
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw new PaymentError('Razorpay keys not configured', 500, 'RAZORPAY_CONFIG_ERROR');
    }

    const response = await fetch(`https://api.razorpay.com/v1/payments/${transaction.gateway_transaction_id}/refund`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100),
        notes: input.reason ? { reason: input.reason } : undefined
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new PaymentError(`Razorpay refund failed: ${errorBody}`, 502, 'RAZORPAY_REFUND_FAILED');
    }

    const refund = await response.json();
    const providerRefundId = refund?.id ?? null;
    const status = refund?.status === 'processed' ? 'succeeded' : refund?.status === 'failed' ? 'failed' : 'pending';

    const refundRecord = await paymentsRepository.createRefund({
      payment_intent_id: intent.id,
      provider_refund_id: providerRefundId,
      amount,
      status,
      reason: input.reason ?? null
    });

    if (status === 'succeeded') {
      await paymentsRepository.markReservationRefunded(intent.reservation_id);
      await Promise.all([
        cacheDeleteByPrefix('public:properties:'),
        cacheDeleteByPrefix('public:property:'),
        cacheDelete('public:stats')
      ]);
    }

    return { refund: refundRecord, provider_refund: refund };
  }
};
