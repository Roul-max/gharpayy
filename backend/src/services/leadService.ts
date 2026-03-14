import { supabase } from '../config/supabase.js';
import { detectDuplicateLead } from '../utils/duplicateLeadDetector.js';
import { emitRealtime } from '../realtime/socket.js';

export const leadService = {
  async getAgents() {
    const { data, error } = await supabase.from('agents').select('id, name');
    if (error) throw error;
    return data;
  },

  async getActivities(leadId: string) {
    const { data, error } = await supabase
      .from('lead_activities')
      .select('*, profiles:user_id(full_name)')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    if (error && error.code === '42P01') {
      return [];
    }
    if (error) throw error;
    return data;
  },

  async getAllLeads() {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getLeadById(id: string) {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createLead(leadData: any, userId: string, force: boolean) {
    if (!force) {
      const duplicate = await detectDuplicateLead(leadData.phone, leadData.email);
      if (duplicate) {
        return { duplicate: true, existing_lead_id: duplicate.id, existing_lead: duplicate };
      }
    }

    const { data, error } = await supabase
      .from('leads')
      .insert([
        {
          ...leadData,
          status: leadData.status || 'new',
          lead_score: leadData.lead_score || 0,
          assigned_agent_id: userId,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    emitRealtime('lead.created', { id: data.id, status: data.status, assigned_agent_id: data.assigned_agent_id });
    return { duplicate: false, data };
  },

  async mergeLead(id: string, updates: any, userId: string) {
    const { data, error } = await supabase
      .from('leads')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await supabase.from('lead_activities').insert([
      {
        lead_id: id,
        user_id: userId,
        action: 'lead_merged',
        details: { merged_data: updates },
      },
    ]);

    return data;
  },

  async updateLead(id: string, updates: any, userId: string) {
    const { data: oldLead } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    const { data, error } = await supabase
      .from('leads')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (oldLead && data) {
      const changes = [];
      if (oldLead.status !== data.status) {
        changes.push({ lead_id: data.id, user_id: userId, action: 'status_changed', details: { from: oldLead.status, to: data.status } });
      }
      if (oldLead.lead_score !== data.lead_score) {
        changes.push({ lead_id: data.id, user_id: userId, action: 'score_changed', details: { from: oldLead.lead_score, to: data.lead_score } });
      }

      if (changes.length > 0) {
        supabase.from('lead_activities').insert(changes).then(({ error }) => {
          if (error && error.code !== '42P01') console.error('Failed to log activity:', error);
        });
      }
    }

    emitRealtime('lead.updated', { id: data.id, status: data.status, lead_score: data.lead_score });
    return data;
  },

  async deleteLead(id: string) {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) throw error;
    emitRealtime('lead.deleted', { id });
  },

  async bulkImportLeads(leads: any[], userId: string) {
    const leadsToInsert = leads.map((lead) => ({
      ...lead,
      assigned_agent_id: userId,
      status: lead.status || 'new',
      lead_score: lead.lead_score || 0,
    }));

    const { data, error } = await supabase.from('leads').insert(leadsToInsert).select();
    if (error) throw error;
    return data;
  },
};
