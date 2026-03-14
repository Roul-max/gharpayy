import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { jsonResponse, logEvent, parseJson, withRetry } from '../_shared/utils.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(supabaseUrl, serviceRole, {
  auth: { persistSession: false }
});

Deno.serve(async (req) => {
  const { payload, error } = await parseJson(req);
  if (error) return jsonResponse(400, { error });

  const reservationId = payload?.reservation_id;
  const status = payload?.status;
  if (!reservationId || !status) {
    return jsonResponse(400, { error: 'reservation_id and status are required' });
  }

  try {
    await withRetry(async () => {
      const { error: updateError } = await supabase
        .from('reservations')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', reservationId);
      if (updateError) throw updateError;
    });

    logEvent('reservation_webhook.processed', { reservation_id: reservationId, status });
    return jsonResponse(200, { success: true });
  } catch (err: any) {
    logEvent('reservation_webhook.failed', { message: err?.message ?? 'update failed' });
    return jsonResponse(500, { error: 'Unable to process reservation webhook' });
  }
});

