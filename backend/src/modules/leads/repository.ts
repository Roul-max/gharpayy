import { supabase } from '../../config/supabase.js';

export const leadsRepository = {
  list() {
    return supabase.from('leads').select('*').order('created_at', { ascending: false });
  }
};
