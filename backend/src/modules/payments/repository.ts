import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '../../config/supabase.js';
import { hasDatabasePool, queryWithTrace, withDbClient } from '../../config/db.js';

function isConflict(error: PostgrestError | null) {
  return error?.code === '23505';
}

export const paymentsRepository = {
  async getReservationForPayment(reservationId: string) {
    if (hasDatabasePool()) {
      return withDbClient(async (client) => {
        const res = await queryWithTrace<any>(
          `SELECT r.id, r.status, r.hold_expires_at, rm.price
           FROM reservations r
           INNER JOIN beds b ON b.id = r.bed_id
           INNER JOIN rooms rm ON rm.id = b.room_id
           WHERE r.id = $1`,
          [reservationId],
          'payments.reservation.fetch',
          client
        );
        return res.rows[0] ?? null;
      });
    }

    const { data, error } = await supabase
      .from('reservations')
      .select('id, status, hold_expires_at, beds(room_id, rooms(price))')
      .eq('id', reservationId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const price = (data as any).beds?.rooms?.price ?? null;
    return {
      id: data.id,
      status: data.status,
      hold_expires_at: data.hold_expires_at,
      price
    };
  },

  async findIntentByReservationAndIdempotency(reservationId: string, idempotencyKey?: string) {
    if (!idempotencyKey) return null;
    const { data, error } = await supabase
      .from('payment_intents')
      .select('*')
      .eq('reservation_id', reservationId)
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
  },

  async createIntent(data: {
    reservation_id: string;
    provider: 'stripe' | 'razorpay';
    provider_intent_id: string;
    amount: number;
    currency: string;
    idempotency_key?: string;
  }) {
    const { data: row, error } = await supabase
      .from('payment_intents')
      .insert([
        {
          reservation_id: data.reservation_id,
          provider: data.provider,
          provider_intent_id: data.provider_intent_id,
          amount: data.amount,
          currency: data.currency,
          idempotency_key: data.idempotency_key ?? null,
          status: 'created'
        }
      ])
      .select('*')
      .single();
    if (error) throw error;
    return row;
  },

  async getIntentByProviderIntentId(providerIntentId: string) {
    const { data, error } = await supabase
      .from('payment_intents')
      .select('*')
      .eq('provider_intent_id', providerIntentId)
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
  },

  async getIntentById(paymentIntentId: string) {
    const { data, error } = await supabase
      .from('payment_intents')
      .select('*')
      .eq('id', paymentIntentId)
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
  },

  async getIntentByReservation(reservationId: string) {
    const { data, error } = await supabase
      .from('payment_intents')
      .select('*')
      .eq('reservation_id', reservationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
  },

  async getLatestSuccessfulTransaction(reservationId: string) {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('reservation_id', reservationId)
      .eq('status', 'success')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
  },

  async updateIntentStatus(paymentIntentId: string, status: 'created' | 'requires_action' | 'succeeded' | 'failed' | 'cancelled') {
    const { data, error } = await supabase
      .from('payment_intents')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', paymentIntentId)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  async upsertWebhookEvent(input: {
    provider: 'stripe' | 'razorpay';
    provider_event_id: string;
    event_type: string;
    payload: unknown;
  }) {
    const payload = {
      provider: input.provider,
      provider_event_id: input.provider_event_id,
      event_type: input.event_type,
      payload: input.payload ?? {},
      processed: false
    };

    const { data, error } = await supabase
      .from('payment_webhooks')
      .upsert(payload, { onConflict: 'provider,provider_event_id', ignoreDuplicates: false })
      .select('*')
      .single();

    if (error && !isConflict(error)) throw error;

    if (!data) {
      const { data: existing, error: existingError } = await supabase
        .from('payment_webhooks')
        .select('*')
        .eq('provider', input.provider)
        .eq('provider_event_id', input.provider_event_id)
        .single();
      if (existingError) throw existingError;
      return existing;
    }

    return data;
  },

  async markWebhookProcessed(webhookEventId: string) {
    const { error } = await supabase
      .from('payment_webhooks')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('id', webhookEventId);
    if (error) throw error;
  },

  async upsertPaymentTransaction(input: {
    reservation_id: string;
    amount: number;
    gateway_transaction_id: string;
    status: 'pending' | 'success' | 'failed';
  }) {
    const { data: existing, error: existingError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('gateway_transaction_id', input.gateway_transaction_id)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing) return existing;

    const payload = {
      reservation_id: input.reservation_id,
      amount: input.amount,
      gateway_transaction_id: input.gateway_transaction_id,
      status: input.status
    };

    const { data, error } = await supabase
      .from('payment_transactions')
      .insert([payload])
      .select('*')
      .single();
    if (error && !isConflict(error)) throw error;
    return data ?? null;
  },

  async createPaymentEvent(input: {
    payment_intent_id: string;
    provider_event_id: string;
    event_type: string;
    payload: unknown;
  }) {
    const { data, error } = await supabase
      .from('payment_events')
      .insert([
        {
          payment_intent_id: input.payment_intent_id,
          provider_event_id: input.provider_event_id,
          event_type: input.event_type,
          payload: input.payload ?? {}
        }
      ])
      .select('*')
      .single();

    if (error && !isConflict(error)) throw error;
    if (data) return data;

    const { data: existing, error: existingError } = await supabase
      .from('payment_events')
      .select('*')
      .eq('payment_intent_id', input.payment_intent_id)
      .eq('provider_event_id', input.provider_event_id)
      .eq('event_type', input.event_type)
      .maybeSingle();
    if (existingError) throw existingError;
    return existing;
  },

  async createRefund(input: {
    payment_intent_id: string;
    provider_refund_id: string | null;
    amount: number;
    status: 'pending' | 'succeeded' | 'failed';
    reason?: string | null;
  }) {
    const { data, error } = await supabase
      .from('refunds')
      .insert([
        {
          payment_intent_id: input.payment_intent_id,
          provider_refund_id: input.provider_refund_id,
          amount: input.amount,
          status: input.status,
          reason: input.reason ?? null
        }
      ])
      .select('*')
      .single();
    if (error && !isConflict(error)) throw error;
    return data ?? null;
  },

  async updateRefundStatus(input: {
    provider_refund_id: string;
    status: 'pending' | 'succeeded' | 'failed';
  }) {
    const { data, error } = await supabase
      .from('refunds')
      .update({ status: input.status, updated_at: new Date().toISOString() })
      .eq('provider_refund_id', input.provider_refund_id)
      .select('*')
      .single();
    if (error) throw error;
    return data ?? null;
  },

  async markReservationRefunded(reservationId: string) {
    if (hasDatabasePool()) {
      return withDbClient(async (client) => {
        await queryWithTrace('BEGIN', [], 'payments.refund.tx.begin', client);
        try {
          const reservationRes = await queryWithTrace<any>(
            `SELECT r.id, r.bed_id
             FROM reservations r
             WHERE r.id = $1
             FOR UPDATE`,
            [reservationId],
            'payments.refund.reservation.lock',
            client
          );
          const reservation = reservationRes.rows[0];
          if (!reservation) {
            await queryWithTrace('ROLLBACK', [], 'payments.refund.tx.rollback', client);
            return null;
          }

          await queryWithTrace(
            `UPDATE bookings SET status = 'cancelled', payment_status = 'refunded', updated_at = NOW()
             WHERE reservation_id = $1`,
            [reservationId],
            'payments.refund.booking.update',
            client
          );

          await queryWithTrace(
            `UPDATE reservations SET status = 'cancelled', payment_status = 'refunded', updated_at = NOW()
             WHERE id = $1`,
            [reservationId],
            'payments.refund.reservation.update',
            client
          );

          await queryWithTrace(
            `UPDATE beds SET status = 'available', updated_at = NOW()
             WHERE id = $1`,
            [reservation.bed_id],
            'payments.refund.bed.update',
            client
          );

          await queryWithTrace('COMMIT', [], 'payments.refund.tx.commit', client);
          return true;
        } catch (error) {
          await queryWithTrace('ROLLBACK', [], 'payments.refund.tx.rollback', client);
          throw error;
        }
      });
    }

    const { data: reservation } = await supabase
      .from('reservations')
      .select('id, bed_id')
      .eq('id', reservationId)
      .maybeSingle();
    if (!reservation) return null;

    await Promise.all([
      supabase.from('bookings').update({ status: 'cancelled', payment_status: 'refunded', updated_at: new Date().toISOString() }).eq('reservation_id', reservationId),
      supabase.from('reservations').update({ status: 'cancelled', payment_status: 'refunded', updated_at: new Date().toISOString() }).eq('id', reservationId),
      supabase.from('beds').update({ status: 'available', updated_at: new Date().toISOString() }).eq('id', reservation.bed_id)
    ]);

    return true;
  },

  async finalizeSuccessfulPayment(input: { reservationId: string; paymentIntentId: string; moveInDate?: string }) {
    if (hasDatabasePool()) {
      return withDbClient(async (client) => {
        await queryWithTrace('BEGIN', [], 'payments.tx.begin', client);
        try {
          const reservationRes = await queryWithTrace<any>(
            `SELECT r.id, r.lead_id, r.bed_id, r.status, b.room_id, rm.property_id
             FROM reservations r
             INNER JOIN beds b ON b.id = r.bed_id
             INNER JOIN rooms rm ON rm.id = b.room_id
             WHERE r.id = $1
             FOR UPDATE`,
            [input.reservationId],
            'payments.reservation.lock',
            client
          );

          const reservation = reservationRes.rows[0];
          if (!reservation) {
            throw new Error('Reservation not found for payment finalization');
          }

          const existingBookingRes = await queryWithTrace<any>(
            `SELECT * FROM bookings
             WHERE bed_id = $1
               AND status IN ('pending', 'confirmed', 'checked_in')
             ORDER BY created_at DESC
             LIMIT 1`,
            [reservation.bed_id],
            'payments.booking.find_existing',
            client
          );

          if (existingBookingRes.rows[0]) {
            await queryWithTrace(
              `UPDATE bookings SET payment_status = 'paid', updated_at = NOW() WHERE id = $1`,
              [existingBookingRes.rows[0].id],
              'payments.booking.update_status',
              client
            );
            await queryWithTrace(
              `UPDATE reservations SET status = 'confirmed', payment_status = 'paid', updated_at = NOW() WHERE id = $1`,
              [reservation.id],
              'payments.reservation.update_status',
              client
            );
            await queryWithTrace('COMMIT', [], 'payments.tx.commit', client);
            return existingBookingRes.rows[0];
          }

          const moveInDate = input.moveInDate ?? new Date().toISOString().slice(0, 10);
          const bookingRes = await queryWithTrace<any>(
            `INSERT INTO bookings (reservation_id, lead_id, property_id, room_id, bed_id, status, payment_status, move_in_date)
             VALUES ($1, $2, $3, $4, $5, 'confirmed', 'paid', $6::date)
             RETURNING *`,
            [reservation.id, reservation.lead_id, reservation.property_id, reservation.room_id, reservation.bed_id, moveInDate],
            'payments.booking.insert',
            client
          );

          await queryWithTrace(
            `UPDATE beds SET status = 'booked', updated_at = NOW()
             WHERE id = $1`,
            [reservation.bed_id],
            'payments.bed.update',
            client
          );

          await queryWithTrace(
            `UPDATE reservations
             SET status = 'confirmed', payment_status = 'paid', updated_at = NOW()
             WHERE id = $1`,
            [reservation.id],
            'payments.reservation.confirm',
            client
          );

          await queryWithTrace(
            `DELETE FROM soft_locks WHERE reservation_id = $1`,
            [reservation.id],
            'payments.soft_lock.release',
            client
          );

          await queryWithTrace('COMMIT', [], 'payments.tx.commit', client);
          return bookingRes.rows[0];
        } catch (error) {
          await queryWithTrace('ROLLBACK', [], 'payments.tx.rollback', client);
          throw error;
        }
      });
    }

    // Supabase fallback: idempotent sequence without explicit SQL transaction.
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select('id, lead_id, bed_id, beds(room_id, rooms(property_id))')
      .eq('id', input.reservationId)
      .single();
    if (reservationError) throw reservationError;

    const { data: existingBooking } = await supabase
      .from('bookings')
      .select('*')
      .eq('bed_id', reservation.bed_id)
      .in('status', ['pending', 'confirmed', 'checked_in'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existingBooking) {
      await supabase
        .from('bookings')
        .update({ payment_status: 'paid', updated_at: new Date().toISOString() })
        .eq('id', existingBooking.id);
      await supabase
        .from('reservations')
        .update({ status: 'confirmed', payment_status: 'paid', updated_at: new Date().toISOString() })
        .eq('id', reservation.id);
      return existingBooking;
    }


    const roomId = (reservation as any).beds?.room_id;
    const propertyId = (reservation as any).beds?.rooms?.property_id;

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert([
        {
          reservation_id: reservation.id,
          lead_id: reservation.lead_id,
          property_id: propertyId,
          room_id: roomId,
          bed_id: reservation.bed_id,
          status: 'confirmed',
          payment_status: 'paid',
          move_in_date: input.moveInDate ?? new Date().toISOString().slice(0, 10)
        }
      ])
      .select('*')
      .single();

    if (bookingError) throw bookingError;

    await Promise.all([
      supabase.from('beds').update({ status: 'booked' }).eq('id', reservation.bed_id),
      supabase.from('reservations').update({ status: 'confirmed', payment_status: 'paid', updated_at: new Date().toISOString() }).eq('id', reservation.id),
      supabase.from('soft_locks').delete().eq('reservation_id', reservation.id)
    ]);

    return booking;
  },

  async failReservationAndReleaseLock(reservationId: string) {
    const { data: reservation, error } = await supabase
      .from('reservations')
      .select('id, bed_id')
      .eq('id', reservationId)
      .maybeSingle();
    if (error) throw error;
    if (!reservation) return;

    await Promise.all([
      supabase.from('reservations').update({ status: 'cancelled', payment_status: 'failed', updated_at: new Date().toISOString() }).eq('id', reservationId),
      supabase.from('soft_locks').delete().eq('reservation_id', reservationId),
      supabase.from('beds').update({ status: 'available', updated_at: new Date().toISOString() }).eq('id', reservation.bed_id)
    ]);
  }
};
