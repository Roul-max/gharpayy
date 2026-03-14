import { supabase } from '../config/supabase.js';
import { logger } from '../observability/logger.js';
import { operationsService } from '../services/operationsService.js';

const WORKER_INTERVAL_MS = Number(process.env.LEAD_QUEUE_WORKER_MS ?? 1500);
const BATCH_SIZE = Number(process.env.LEAD_QUEUE_BATCH_SIZE ?? 10);

type LeadCapturePayload = {
  name: string;
  phone: string;
  email?: string;
  source?: string;
  city?: string;
  area?: string;
  budget?: number;
  gender?: string;
  sharing_type?: string;
};

export async function enqueueLeadCapture(payload: LeadCapturePayload) {
  const { error } = await supabase
    .from('lead_capture_queue')
    .insert([{
      payload,
      status: 'pending',
      attempts: 0,
      available_at: new Date().toISOString()
    }]);
  if (error) throw error;
}

async function processQueueBatch() {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('lead_capture_queue')
    .select('id, payload, attempts')
    .eq('status', 'pending')
    .lte('available_at', now)
    .order('id', { ascending: true })
    .limit(BATCH_SIZE);

  if (error) throw error;
  if (!data || data.length === 0) return;

  for (const row of data) {
    const { error: lockError } = await supabase
      .from('lead_capture_queue')
      .update({ status: 'processing', updated_at: now })
      .eq('id', row.id)
      .eq('status', 'pending');

    if (lockError) {
      logger.warn('Queue lock failed', { id: row.id, error: lockError.message });
      continue;
    }

    try {
      await operationsService.processQueuedLead(row.payload as LeadCapturePayload);
      await supabase
        .from('lead_capture_queue')
        .update({ status: 'done', updated_at: new Date().toISOString() })
        .eq('id', row.id);
    } catch (err: any) {
      const attempts = Number(row.attempts ?? 0) + 1;
      const backoffSeconds = Math.min(300, Math.pow(2, attempts));
      await supabase
        .from('lead_capture_queue')
        .update({
          status: 'pending',
          attempts,
          last_error: err?.message ?? 'unknown_error',
          available_at: new Date(Date.now() + backoffSeconds * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', row.id);
    }
  }
}

export function startLeadCaptureQueueWorker() {
  const enabled = process.env.ENABLE_LEAD_CAPTURE_QUEUE_WORKER === 'true';
  if (!enabled) return;

  logger.info('Lead capture queue worker started', {
    interval_ms: WORKER_INTERVAL_MS,
    batch_size: BATCH_SIZE
  });

  setInterval(() => {
    processQueueBatch().catch((err) => {
      logger.error('Lead capture queue worker error', { error: err?.message ?? err });
    });
  }, WORKER_INTERVAL_MS);
}
