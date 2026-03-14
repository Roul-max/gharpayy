import { supabase } from '../config/supabase.js';
import { logger } from '../observability/logger.js';

export async function runFollowUpReminderJob() {
  logger.info('Running follow-up reminder job');
  try {
    const now = new Date();
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(now.getDate() - 2);
    
    // Find leads that haven't had activity in 2 days and are not closed
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, name, assigned_agent_id, last_activity_at')
      .not('status', 'in', '("booked", "lost")')
      .lt('last_activity_at', twoDaysAgo.toISOString());

    if (leadsError || !leads) {
      throw new Error('Failed to fetch leads');
    }

    if (leads.length > 0) {
      for (const lead of leads) {
        await supabase
          .from('follow_up_reminders')
          .update({ status: 'overdue', updated_at: now.toISOString() })
          .eq('lead_id', lead.id)
          .eq('status', 'pending');

        if (lead.assigned_agent_id) {
          const { data: agent } = await supabase
            .from('agents')
            .select('user_id')
            .eq('id', lead.assigned_agent_id)
            .maybeSingle();

          if (agent?.user_id) {
            await supabase.from('notifications').insert([
              {
                user_id: agent.user_id,
                title: 'Follow-up overdue',
                body: `Lead ${lead.name} has been inactive for more than 48 hours.`,
                type: 'follow_up',
                entity_type: 'lead',
                entity_id: lead.id
              }
            ]);
          }

          logger.info('Agent follow-up reminder sent', { agent_id: lead.assigned_agent_id, lead_id: lead.id });
        }
      }
      logger.info('Follow-up reminders sent', { reminders: leads.length });
    } else {
      logger.info('No follow-up reminders needed');
    }
  } catch (error) {
    logger.error('Error running follow-up reminder job', { error: (error as Error).message });
    throw error;
  }
}
