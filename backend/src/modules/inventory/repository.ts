import { supabase } from '../../config/supabase.js';

export const inventoryRepository = {
  listRooms() {
    return supabase.from('rooms').select('*, beds(*)');
  }
};
