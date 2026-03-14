import { supabase } from '../config/supabase.js';

const MOCK_FULL_NAMES: Record<string, string> = {
  '11111111-1111-1111-1111-111111111111': 'Admin User',
  '22222222-2222-2222-2222-222222222222': 'Manager User',
  '33333333-3333-3333-3333-333333333333': 'Agent User',
  '44444444-4444-4444-4444-444444444444': 'Owner User'
};

function fallbackName(userId: string, email?: string) {
  if (MOCK_FULL_NAMES[userId]) return MOCK_FULL_NAMES[userId];
  if (email) return email.split('@')[0];
  return 'Gharpayy User';
}

const DEFAULT_SETTINGS = {
  auto_assign: true,
  visit_reminders: true,
  daily_digest: true,
  desktop_notifications: true,
  compact_sidebar: false,
  timezone: 'Asia/Kolkata',
  language: 'en-IN',
  crm_landing_page: '/dashboard'
};

export async function getUserProfile(userId: string, email?: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, updated_at, created_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return {
      id: userId,
      full_name: fallbackName(userId, email),
      avatar_url: null,
      updated_at: null,
      created_at: null
    };
  }

  return data;
}

export async function upsertUserProfile(
  userId: string,
  payload: { full_name?: string; avatar_url?: string | null },
  email?: string
) {
  const record = {
    id: userId,
    full_name: payload.full_name ?? fallbackName(userId, email),
    avatar_url: payload.avatar_url ?? null,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(record, { onConflict: 'id' })
    .select('id, full_name, avatar_url, updated_at, created_at')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getUserSettings(userId: string) {
  const { data, error } = await supabase
    .from('user_settings')
    .select('user_id, auto_assign, visit_reminders, daily_digest, desktop_notifications, compact_sidebar, timezone, language, crm_landing_page, updated_at, created_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data
    ? data
    : {
        user_id: userId,
        ...DEFAULT_SETTINGS,
        updated_at: null,
        created_at: null
      };
}

export async function upsertUserSettings(
  userId: string,
  payload: Partial<typeof DEFAULT_SETTINGS>
) {
  const record = {
    user_id: userId,
    auto_assign: payload.auto_assign ?? DEFAULT_SETTINGS.auto_assign,
    visit_reminders: payload.visit_reminders ?? DEFAULT_SETTINGS.visit_reminders,
    daily_digest: payload.daily_digest ?? DEFAULT_SETTINGS.daily_digest,
    desktop_notifications: payload.desktop_notifications ?? DEFAULT_SETTINGS.desktop_notifications,
    compact_sidebar: payload.compact_sidebar ?? DEFAULT_SETTINGS.compact_sidebar,
    timezone: payload.timezone ?? DEFAULT_SETTINGS.timezone,
    language: payload.language ?? DEFAULT_SETTINGS.language,
    crm_landing_page: payload.crm_landing_page ?? DEFAULT_SETTINGS.crm_landing_page,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('user_settings')
    .upsert(record, { onConflict: 'user_id' })
    .select('user_id, auto_assign, visit_reminders, daily_digest, desktop_notifications, compact_sidebar, timezone, language, crm_landing_page, updated_at, created_at')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
