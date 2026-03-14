import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';
const anonKey = process.env.SUPABASE_ANON_KEY || serviceRoleKey;

const authConfig = {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
};

export const supabase = createClient(supabaseUrl, serviceRoleKey, authConfig);
export const supabaseAdmin = supabase;
export const supabaseAuth = createClient(supabaseUrl, anonKey, authConfig);
