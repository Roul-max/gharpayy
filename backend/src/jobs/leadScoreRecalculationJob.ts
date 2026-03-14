import { supabase } from '../config/supabase.js';
import { logger } from '../observability/logger.js';

export async function runLeadScoreRecalculationJob() {
  logger.info('Running lead score recalculation job');
  try {
    // 1. Get all active leads
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, status, created_at, last_activity_at, lead_score')
      .not('status', 'in', '("booked", "lost")');

    if (leadsError || !leads) {
      throw new Error('Failed to fetch leads');
    }

    for (const lead of leads) {
      let newScore = lead.lead_score;
      const now = new Date();
      const lastActivity = new Date(lead.last_activity_at || lead.created_at);
      const daysSinceActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

      // Decrease score by 5 for every 3 days of inactivity
      if (daysSinceActivity >= 3) {
        newScore -= Math.floor(daysSinceActivity / 3) * 5;
      }

      // Ensure score stays within 0-100
      newScore = Math.max(0, Math.min(100, newScore));

      if (newScore !== lead.lead_score) {
        await supabase
          .from('leads')
          .update({ lead_score: newScore })
          .eq('id', lead.id);
        
        // Log activity
        await supabase.from('lead_activities').insert([{
          lead_id: lead.id,
          action: 'score_changed',
          details: { from: lead.lead_score, to: newScore, reason: 'inactivity' }
        }]);
      }
    }
    
    logger.info('Lead score recalculation completed');
  } catch (error) {
    logger.error('Error running lead score recalculation job', { error: (error as Error).message });
    throw error;
  }
}
