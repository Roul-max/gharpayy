import { supabase } from '../config/supabase.js';

export async function getAgentPerformance() {
  // 1. Get all agents
  const { data: agents, error: agentsError } = await supabase
    .from('agents')
    .select('id, name');

  if (agentsError || !agents) {
    throw new Error('Failed to fetch agents');
  }

  const performanceData = [];

  for (const agent of agents) {
    // 2. Get leads assigned to agent
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, created_at, first_response_at')
      .eq('assigned_agent_id', agent.id);

    const leadsCount = leads ? leads.length : 0;

    // 3. Get visits scheduled by agent's leads
    const leadIds = leads ? leads.map(l => l.id) : [];
    let visitsCount = 0;
    if (leadIds.length > 0) {
      const { count: vCount } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .in('lead_id', leadIds);
      visitsCount = vCount || 0;
    }

    // 4. Get bookings closed by agent's leads
    let bookingsCount = 0;
    if (leadIds.length > 0) {
      const { count: bCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .in('lead_id', leadIds);
      bookingsCount = bCount || 0;
    }

    // 5. Calculate conversion rate
    const conversionRate = leadsCount > 0 ? (bookingsCount / leadsCount) * 100 : 0;

    // 6. Calculate average response time (in hours)
    let totalResponseTimeMs = 0;
    let respondedLeadsCount = 0;

    if (leads) {
      for (const lead of leads) {
        if (lead.first_response_at && lead.created_at) {
          const responseTimeMs = new Date(lead.first_response_at).getTime() - new Date(lead.created_at).getTime();
          if (responseTimeMs > 0) {
            totalResponseTimeMs += responseTimeMs;
            respondedLeadsCount++;
          }
        }
      }
    }

    const avgResponseTimeHours = respondedLeadsCount > 0 
      ? (totalResponseTimeMs / respondedLeadsCount) / (1000 * 60 * 60) 
      : 0;

    performanceData.push({
      agent_name: agent.name,
      leads: leadsCount,
      visits: visitsCount,
      bookings: bookingsCount,
      conversion_rate: parseFloat(conversionRate.toFixed(2)),
      avg_response_time_hours: parseFloat(avgResponseTimeHours.toFixed(2))
    });
  }

  return performanceData;
}
