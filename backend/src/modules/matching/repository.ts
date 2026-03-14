import { supabase } from '../../config/supabase.js';

export const matchingRepository = {
  getLead(leadId: string) {
    return supabase.from('leads').select('*').eq('id', leadId).single();
  }
};
