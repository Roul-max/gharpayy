import { describe, expect, it, vi, beforeEach } from 'vitest';
import { paymentsService } from './service.js';

vi.mock('./repository.js', () => {
  return {
    paymentsRepository: {
      findIntentByReservationAndIdempotency: vi.fn(),
      createIntent: vi.fn(),
      getIntentByProviderIntentId: vi.fn(),
      updateIntentStatus: vi.fn(),
      upsertWebhookEvent: vi.fn(),
      createPaymentEvent: vi.fn(),
      finalizeSuccessfulPayment: vi.fn(),
      failReservationAndReleaseLock: vi.fn(),
      markWebhookProcessed: vi.fn(),
      upsertPaymentTransaction: vi.fn()
    }
  };
});

const repo = await import('./repository.js');

describe('paymentsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects invalid Razorpay payment signatures', async () => {
    process.env.RAZORPAY_KEY_SECRET = 'secret';

    await expect(
      paymentsService.confirmRazorpayPayment({
        reservation_id: '11111111-1111-1111-1111-111111111111',
        order_id: 'order_123',
        payment_id: 'pay_123',
        signature: 'bad-signature'
      })
    ).rejects.toThrow('Invalid Razorpay payment signature');
  });

  it('processes webhook success idempotently', async () => {
    (repo.paymentsRepository as any).upsertWebhookEvent.mockResolvedValue({ id: 'wh_1', processed: false });
    (repo.paymentsRepository as any).getIntentByProviderIntentId.mockResolvedValue({
      id: 'pi_1',
      reservation_id: 'res_1',
      amount: 12000,
      status: 'created'
    });
    (repo.paymentsRepository as any).updateIntentStatus.mockResolvedValue({ id: 'pi_1', status: 'succeeded' });
    (repo.paymentsRepository as any).finalizeSuccessfulPayment.mockResolvedValue({ id: 'bk_1' });
    (repo.paymentsRepository as any).createPaymentEvent.mockResolvedValue({ id: 'evt_1' });
    (repo.paymentsRepository as any).markWebhookProcessed.mockResolvedValue(undefined);

    const result = await paymentsService.handleWebhook({
      provider: 'razorpay',
      provider_event_id: 'evt_1',
      event_type: 'payment.captured',
      payload: {
        payload: {
          payment: { entity: { order_id: 'order_123', id: 'pay_123' } }
        }
      }
    });

    expect(result.received).toBe(true);
    expect(repo.paymentsRepository.finalizeSuccessfulPayment).toHaveBeenCalled();
  });
});
