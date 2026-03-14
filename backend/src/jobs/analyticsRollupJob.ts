import { supabase } from '../config/supabase.js';
import { logger } from '../observability/logger.js';

export async function runAnalyticsRollupJob() {
  const today = new Date().toISOString().slice(0, 10);
  logger.info('Running analytics rollup job', { day: today });

  const [leadsRes, bookingsRes, visitsRes] = await Promise.all([
    supabase.from('leads').select('id', { count: 'exact', head: true }),
    supabase.from('bookings').select('id', { count: 'exact', head: true }),
    supabase.from('visits').select('id', { count: 'exact', head: true })
  ]);

  if (leadsRes.error) throw leadsRes.error;
  if (bookingsRes.error) throw bookingsRes.error;
  if (visitsRes.error) throw visitsRes.error;

  await supabase.from('activity_log').insert([
    {
      action: 'analytics_rollup',
      entity_type: 'system',
      before_state: null,
      after_state: {
        date: today,
        total_leads: leadsRes.count ?? 0,
        total_bookings: bookingsRes.count ?? 0,
        total_visits: visitsRes.count ?? 0
      }
    }
  ]);

  logger.info('Analytics rollup completed', {
    date: today,
    total_leads: leadsRes.count ?? 0,
    total_bookings: bookingsRes.count ?? 0,
    total_visits: visitsRes.count ?? 0
  });
}
