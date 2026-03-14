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

  const userId = payload?.user_id;
  const title = payload?.title;
  if (!userId || !title) {
    return jsonResponse(400, { error: 'user_id and title are required' });
  }

  try {
    const record = await withRetry(async () => {
      const { data, error: insertError } = await supabase
        .from('notifications')
        .insert([{
          user_id: userId,
          title,
          body: payload?.body ?? null,
          type: payload?.type ?? 'info',
          entity_type: payload?.entity_type ?? null,
          entity_id: payload?.entity_id ?? null
        }])
        .select('id')
        .single();
      if (insertError) throw insertError;
      return data;
    });

    logEvent('send_notification.success', { notification_id: record?.id, user_id: userId });
    return jsonResponse(201, { success: true, notification_id: record?.id });
  } catch (err: any) {
    logEvent('send_notification.failed', { message: err?.message ?? 'insert failed' });
    return jsonResponse(500, { error: 'Unable to persist notification' });
  }
});

