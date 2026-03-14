import { supabase } from '../../config/supabase.js';

export const analyticsRepository = {
  listAgents() {
    return supabase.from('agents').select('id, name');
  }
};
