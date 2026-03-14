import { supabase } from '../../config/supabase.js';

export const bookingsRepository = {
  list() {
    return supabase.from('bookings').select('*').order('created_at', { ascending: false });
  }
};
