import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { jsonResponse, logEvent, parseJson, withRetry } from '../_shared/utils.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(supabaseUrl, serviceRole, {
  auth: { persistSession: false }
});

Deno.serve(async (req) => {
  const { payload, error } = await parseJson(req);
  if (error) {
    return jsonResponse(400, { error });
  }

  const name = payload?.name;
  const phone = payload?.phone;
  if (!name || !phone) {
    return jsonResponse(400, { error: 'name and phone are required' });
  }

  try {
    const result = await withRetry(async () => {
      const { data, error: insertError } = await supabase
        .from('leads')
        .insert([{
          name,
          phone,
          email: payload?.email ?? null,
          source: payload?.source ?? 'external_webhook',
          status: 'new'
        }])
        .select('id')
        .single();
      if (insertError) throw insertError;
      return data;
    });

    logEvent('receive_lead.success', { lead_id: result?.id, source: payload?.source ?? 'external_webhook' });
    return jsonResponse(201, { success: true, lead_id: result?.id });
  } catch (err: any) {
    logEvent('receive_lead.failed', { message: err?.message ?? 'insert failed' });
    return jsonResponse(500, { error: 'Unable to persist lead' });
  }
});

