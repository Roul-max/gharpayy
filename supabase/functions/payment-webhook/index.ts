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

  const provider = payload?.provider;
  const providerEventId = payload?.provider_event_id;
  const eventType = payload?.event_type;
  if (!provider || !providerEventId || !eventType) {
    return jsonResponse(400, { error: 'provider, provider_event_id, event_type are required' });
  }

  try {
    await withRetry(async () => {
      const { error: insertError } = await supabase
        .from('webhook_events')
        .upsert({
          provider,
          provider_event_id: providerEventId,
          event_type: eventType,
          payload: payload?.payload ?? payload,
          processed: true,
          processed_at: new Date().toISOString()
        }, { onConflict: 'provider,provider_event_id' });
      if (insertError) throw insertError;
    });

    logEvent('payment_webhook.processed', { provider, provider_event_id: providerEventId, event_type: eventType });
    return jsonResponse(200, { success: true });
  } catch (err: any) {
    logEvent('payment_webhook.failed', { message: err?.message ?? 'upsert failed' });
    return jsonResponse(500, { error: 'Unable to process payment webhook' });
  }
});

