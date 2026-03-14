import { supabase } from '../config/supabase.js';

export async function detectDuplicateLead(phone: string, email?: string) {
  let query = supabase
    .from('leads')
    .select('id, name, source, city, area, budget, gender, sharing_type, email');
  
  if (email) {
    query = query.or(`phone.eq.${phone},email.eq.${email}`);
  } else {
    query = query.eq('phone', phone);
  }

  const { data, error } = await query.limit(1);

  if (error) {
    console.error('Error detecting duplicate lead:', error);
    return null;
  }

  if (data && data.length > 0) {
    return data[0];
  }

  return null;
}
