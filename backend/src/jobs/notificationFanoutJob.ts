import { supabase } from '../config/supabase.js';
import { enqueueNotification } from '../queue/index.js';
import { logger } from '../observability/logger.js';

export async function runNotificationFanoutJob() {
  logger.info('Running notification fanout job');

  const { data: pending, error } = await supabase
    .from('notifications')
    .select('id, user_id, title, body, type, entity_type, entity_id')
    .is('read_at', null)
    .order('created_at', { ascending: true })
    .limit(50);

  if (error) throw error;

  for (const row of pending ?? []) {
    await enqueueNotification({
      user_id: row.user_id,
      title: row.title,
      body: row.body ?? undefined,
      type: row.type ?? 'info',
      entity_type: row.entity_type ?? undefined,
      entity_id: row.entity_id ?? undefined
    });
  }

  logger.info('Notification fanout completed', { enqueued: (pending ?? []).length });
}
