-- Gharpayy Production Hardening (Version 1.0 -> Next)
-- Date: March 2026

DO $$
BEGIN
  BEGIN
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
  EXCEPTION WHEN undefined_file THEN
    RAISE NOTICE 'pgcrypto extension not available; skipping.';
  END;

  BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
  EXCEPTION WHEN undefined_file THEN
    RAISE NOTICE 'pg_cron extension not available; skipping.';
  END;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'agent', 'owner');
  END IF;
END $$;

-- Note: legacy text-based role helpers are removed only in migration contexts.
-- For fresh installs, they won't exist and RLS policies from rls_policies.sql
-- should be created before running this file.

-- Backfill/ensure zones columns used by the app
ALTER TABLE public.zones
  ADD COLUMN IF NOT EXISTS agent_count INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE OR REPLACE FUNCTION public.has_role(required_role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = required_role
  );
$$;

CREATE OR REPLACE FUNCTION public.has_any_role(required_roles public.app_role[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = ANY(required_roles)
  );
$$;

-- Lock down anonymous writes to reservations and soft locks
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soft_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_status_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reservations_public_write ON public.reservations;
CREATE POLICY reservations_internal_rw ON public.reservations
FOR ALL
USING (public.has_any_role(ARRAY['admin','manager','agent']::public.app_role[]))
WITH CHECK (public.has_any_role(ARRAY['admin','manager','agent']::public.app_role[]));

DROP POLICY IF EXISTS soft_locks_internal_rw ON public.soft_locks;
CREATE POLICY soft_locks_internal_rw ON public.soft_locks
FOR ALL
USING (public.has_any_role(ARRAY['admin','manager','agent']::public.app_role[]))
WITH CHECK (public.has_any_role(ARRAY['admin','manager','agent']::public.app_role[]));

DROP POLICY IF EXISTS payment_transactions_internal_rw ON public.payment_transactions;
CREATE POLICY payment_transactions_internal_rw ON public.payment_transactions
FOR ALL
USING (public.has_any_role(ARRAY['admin','manager']::public.app_role[]))
WITH CHECK (public.has_any_role(ARRAY['admin','manager']::public.app_role[]));

DROP POLICY IF EXISTS payment_webhooks_internal_rw ON public.payment_webhooks;
CREATE POLICY payment_webhooks_internal_rw ON public.payment_webhooks
FOR ALL
USING (public.has_any_role(ARRAY['admin','manager']::public.app_role[]))
WITH CHECK (public.has_any_role(ARRAY['admin','manager']::public.app_role[]));

DROP POLICY IF EXISTS conversations_internal_rw ON public.conversations;
CREATE POLICY conversations_internal_rw ON public.conversations
FOR ALL
USING (public.has_any_role(ARRAY['admin','manager','agent']::public.app_role[]))
WITH CHECK (public.has_any_role(ARRAY['admin','manager','agent']::public.app_role[]));

DROP POLICY IF EXISTS messages_internal_rw ON public.messages;
CREATE POLICY messages_internal_rw ON public.messages
FOR ALL
USING (public.has_any_role(ARRAY['admin','manager','agent']::public.app_role[]))
WITH CHECK (public.has_any_role(ARRAY['admin','manager','agent']::public.app_role[]));

DROP POLICY IF EXISTS chat_threads_internal_rw ON public.chat_threads;
CREATE POLICY chat_threads_internal_rw ON public.chat_threads
FOR ALL
USING (public.has_any_role(ARRAY['admin','manager','agent','owner']::public.app_role[]))
WITH CHECK (public.has_any_role(ARRAY['admin','manager','agent','owner']::public.app_role[]));

DROP POLICY IF EXISTS chat_participants_internal_rw ON public.chat_participants;
CREATE POLICY chat_participants_internal_rw ON public.chat_participants
FOR ALL
USING (public.has_any_role(ARRAY['admin','manager','agent','owner']::public.app_role[]))
WITH CHECK (public.has_any_role(ARRAY['admin','manager','agent','owner']::public.app_role[]));

DROP POLICY IF EXISTS follow_up_reminders_internal_rw ON public.follow_up_reminders;
CREATE POLICY follow_up_reminders_internal_rw ON public.follow_up_reminders
FOR ALL
USING (public.has_any_role(ARRAY['admin','manager','agent']::public.app_role[]))
WITH CHECK (public.has_any_role(ARRAY['admin','manager','agent']::public.app_role[]));

DROP POLICY IF EXISTS notifications_internal_rw ON public.notifications;
CREATE POLICY notifications_internal_rw ON public.notifications
FOR ALL
USING (
  auth.uid() = user_id
  OR public.has_any_role(ARRAY['admin','manager']::public.app_role[])
)
WITH CHECK (
  auth.uid() = user_id
  OR public.has_any_role(ARRAY['admin','manager']::public.app_role[])
);

-- Operational index set for 10k+ daily traffic and CRM read paths
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_agent_id ON public.leads(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON public.lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_visits_scheduled_at ON public.visits(scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_move_in_date ON public.bookings(move_in_date DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public.bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_properties_city_area ON public.properties(city, area);
CREATE INDEX IF NOT EXISTS idx_properties_city_area_gender ON public.properties(city, area, gender_allowed);
CREATE INDEX IF NOT EXISTS idx_properties_lat_lng ON public.properties(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_beds_status ON public.beds(status);
CREATE INDEX IF NOT EXISTS idx_beds_status_room_id ON public.beds(status, room_id);
CREATE INDEX IF NOT EXISTS idx_rooms_property_id ON public.rooms(property_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_due_at ON public.follow_up_reminders(due_at ASC);
CREATE INDEX IF NOT EXISTS idx_follow_up_status ON public.follow_up_reminders(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_lead_id ON public.conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_lead_id ON public.chat_threads(lead_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_owner_id ON public.chat_threads(owner_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_agent_id ON public.chat_threads(agent_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_last_message_at ON public.chat_threads(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_participants_thread_id ON public.chat_participants(thread_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON public.chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_events_dedupe ON public.payment_events(payment_intent_id, provider_event_id, event_type);
CREATE INDEX IF NOT EXISTS idx_payment_intents_provider_intent_id ON public.payment_intents(provider_intent_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_webhooks_dedupe ON public.payment_webhooks(provider, provider_event_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_transactions_gateway_id ON public.payment_transactions(gateway_transaction_id) WHERE gateway_transaction_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_soft_locks_expires_at ON public.soft_locks(expires_at);

-- Lead capture queue for async ingestion
CREATE TABLE IF NOT EXISTS public.lead_capture_queue (
  id BIGSERIAL PRIMARY KEY,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  available_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lead_capture_queue_status_available ON public.lead_capture_queue(status, available_at);

-- Schedule background jobs (expects rpc functions or edge wrappers)
-- Replace function names with deployed function endpoints if needed.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'gharpayy-soft-lock-cleanup') THEN
      PERFORM cron.schedule(
        'gharpayy-soft-lock-cleanup',
        '*/5 * * * *',
        $cron$SELECT public.cleanup_expired_soft_locks();$cron$
      );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'gharpayy-lead-score-refresh') THEN
      PERFORM cron.schedule(
        'gharpayy-lead-score-refresh',
        '0 * * * *',
        $cron$SELECT public.recalculate_lead_scores();$cron$
      );
    END IF;
  ELSE
    RAISE NOTICE 'pg_cron extension not enabled; skipping cron schedules.';
  END IF;
END $$;

-- Supabase Storage buckets (skip when storage schema is unavailable)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES
      ('property-images', 'property-images', true),
      ('owner-documents', 'owner-documents', false),
      ('user-avatars', 'user-avatars', true)
    ON CONFLICT (id) DO NOTHING;
  ELSE
    RAISE NOTICE 'storage schema not available; skipping bucket creation.';
  END IF;
END $$;
