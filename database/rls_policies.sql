-- database/rls_policies.sql

-- Role helpers
CREATE OR REPLACE FUNCTION public.has_role(required_role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = required_role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$ SELECT public.has_role('admin'::public.app_role); $$;

CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$ SELECT public.has_role('manager'::public.app_role); $$;

CREATE OR REPLACE FUNCTION public.is_agent()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$ SELECT public.has_role('agent'::public.app_role); $$;

CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$ SELECT public.has_role('owner'::public.app_role); $$;

CREATE OR REPLACE FUNCTION public.current_owner_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.id FROM public.owners o
  WHERE o.user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_agent_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id FROM public.agents a
  WHERE a.user_id = auth.uid()
  LIMIT 1;
$$;

-- Enable + force RLS (deny-by-default unless policy grants access)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soft_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_status_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_webhooks ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings FORCE ROW LEVEL SECURITY;
ALTER TABLE public.owners FORCE ROW LEVEL SECURITY;
ALTER TABLE public.agents FORCE ROW LEVEL SECURITY;
ALTER TABLE public.properties FORCE ROW LEVEL SECURITY;
ALTER TABLE public.rooms FORCE ROW LEVEL SECURITY;
ALTER TABLE public.beds FORCE ROW LEVEL SECURITY;
ALTER TABLE public.leads FORCE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities FORCE ROW LEVEL SECURITY;
ALTER TABLE public.visits FORCE ROW LEVEL SECURITY;
ALTER TABLE public.reservations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.soft_locks FORCE ROW LEVEL SECURITY;
ALTER TABLE public.team_queues FORCE ROW LEVEL SECURITY;
ALTER TABLE public.zones FORCE ROW LEVEL SECURITY;
ALTER TABLE public.room_status_log FORCE ROW LEVEL SECURITY;
ALTER TABLE public.bookings FORCE ROW LEVEL SECURITY;
ALTER TABLE public.conversations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.messages FORCE ROW LEVEL SECURITY;
ALTER TABLE public.notifications FORCE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_reminders FORCE ROW LEVEL SECURITY;
ALTER TABLE public.chat_threads FORCE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants FORCE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log FORCE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.payment_intents FORCE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events FORCE ROW LEVEL SECURITY;
ALTER TABLE public.refunds FORCE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events FORCE ROW LEVEL SECURITY;
ALTER TABLE public.payment_webhooks FORCE ROW LEVEL SECURITY;

-- Drop previous policies so rules are explicit
DO $$
DECLARE
  p RECORD;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'profiles','user_settings','owners','agents','properties','rooms','beds','leads','lead_activities','visits','reservations','soft_locks','team_queues','zones','room_status_log','bookings',
'conversations','messages','notifications','follow_up_reminders','chat_threads','chat_participants','activity_log','payment_transactions','payment_intents','payment_events','refunds','webhook_events','payment_webhooks'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
  END LOOP;
END $$;

-- Profiles and settings
CREATE POLICY profiles_self_or_admin ON public.profiles
FOR SELECT
USING (auth.uid() = id OR public.is_admin() OR public.is_manager());

CREATE POLICY settings_self_or_admin ON public.user_settings
FOR ALL
USING (auth.uid() = user_id OR public.is_admin() OR public.is_manager())
WITH CHECK (auth.uid() = user_id OR public.is_admin() OR public.is_manager());

-- Owners and agents
CREATE POLICY owners_self_or_admin ON public.owners
FOR SELECT
USING (user_id = auth.uid() OR public.is_admin() OR public.is_manager());

CREATE POLICY agents_self_or_admin ON public.agents
FOR SELECT
USING (user_id = auth.uid() OR public.is_admin() OR public.is_manager());

-- Zones and team queues (routing metadata)
CREATE POLICY zones_read_policy ON public.zones
FOR SELECT
USING (public.is_admin() OR public.is_manager() OR public.is_agent() OR public.is_owner());

CREATE POLICY zones_write_policy ON public.zones
FOR ALL
USING (public.is_admin() OR public.is_manager())
WITH CHECK (public.is_admin() OR public.is_manager());

CREATE POLICY team_queues_read_policy ON public.team_queues
FOR SELECT
USING (public.is_admin() OR public.is_manager());

CREATE POLICY team_queues_write_policy ON public.team_queues
FOR ALL
USING (public.is_admin() OR public.is_manager())
WITH CHECK (public.is_admin() OR public.is_manager());

-- Properties: owners only own properties, agents only assigned-lead properties, admins/managers all
CREATE POLICY properties_owner_or_assigned_agent_or_admin ON public.properties
FOR SELECT
USING (
  public.is_admin() OR public.is_manager()
  OR owner_id = public.current_owner_id()
  OR id IN (
    SELECT l.property_id
    FROM public.leads l
    WHERE l.assigned_agent_id = public.current_agent_id()
  )
);

CREATE POLICY properties_owner_write_or_admin ON public.properties
FOR ALL
USING (public.is_admin() OR public.is_manager() OR owner_id = public.current_owner_id())
WITH CHECK (public.is_admin() OR public.is_manager() OR owner_id = public.current_owner_id());

-- Rooms and beds inherit property ownership scope
CREATE POLICY rooms_owner_or_assigned_agent_or_admin ON public.rooms
FOR SELECT
USING (
  public.is_admin() OR public.is_manager()
  OR property_id IN (
    SELECT p.id FROM public.properties p
    WHERE p.owner_id = public.current_owner_id()
  )
  OR property_id IN (
    SELECT l.property_id
    FROM public.leads l
    WHERE l.assigned_agent_id = public.current_agent_id()
  )
);

CREATE POLICY rooms_owner_write_or_admin ON public.rooms
FOR ALL
USING (
  public.is_admin() OR public.is_manager()
  OR property_id IN (
    SELECT p.id FROM public.properties p
    WHERE p.owner_id = public.current_owner_id()
  )
)
WITH CHECK (
  public.is_admin() OR public.is_manager()
  OR property_id IN (
    SELECT p.id FROM public.properties p
    WHERE p.owner_id = public.current_owner_id()
  )
);

CREATE POLICY beds_owner_or_assigned_agent_or_admin ON public.beds
FOR SELECT
USING (
  public.is_admin() OR public.is_manager()
  OR room_id IN (
    SELECT r.id FROM public.rooms r
    INNER JOIN public.properties p ON p.id = r.property_id
    WHERE p.owner_id = public.current_owner_id()
  )
  OR room_id IN (
    SELECT r.id FROM public.rooms r
    INNER JOIN public.leads l ON l.property_id = r.property_id
    WHERE l.assigned_agent_id = public.current_agent_id()
  )
);

CREATE POLICY beds_owner_write_or_admin ON public.beds
FOR ALL
USING (
  public.is_admin() OR public.is_manager()
  OR room_id IN (
    SELECT r.id FROM public.rooms r
    INNER JOIN public.properties p ON p.id = r.property_id
    WHERE p.owner_id = public.current_owner_id()
  )
)
WITH CHECK (
  public.is_admin() OR public.is_manager()
  OR room_id IN (
    SELECT r.id FROM public.rooms r
    INNER JOIN public.properties p ON p.id = r.property_id
    WHERE p.owner_id = public.current_owner_id()
  )
);

-- Leads: assigned agents, property owners, admin/manager
CREATE POLICY leads_visibility_policy ON public.leads
FOR SELECT
USING (
  public.is_admin() OR public.is_manager()
  OR assigned_agent_id = public.current_agent_id()
  OR property_id IN (
    SELECT p.id FROM public.properties p
    WHERE p.owner_id = public.current_owner_id()
  )
);

CREATE POLICY leads_write_policy ON public.leads
FOR ALL
USING (
  public.is_admin() OR public.is_manager()
  OR (public.is_agent() AND (assigned_agent_id = public.current_agent_id() OR assigned_agent_id IS NULL))
)
WITH CHECK (
  public.is_admin() OR public.is_manager()
  OR (public.is_agent() AND (assigned_agent_id = public.current_agent_id() OR assigned_agent_id IS NULL))
);

-- Lead activities: scoped to lead visibility
CREATE POLICY lead_activities_visibility_policy ON public.lead_activities
FOR SELECT
USING (
  public.is_admin() OR public.is_manager()
  OR lead_id IN (
    SELECT l.id
    FROM public.leads l
    WHERE l.assigned_agent_id = public.current_agent_id()
       OR l.property_id IN (
        SELECT p.id FROM public.properties p
        WHERE p.owner_id = public.current_owner_id()
       )
  )
);

CREATE POLICY lead_activities_write_policy ON public.lead_activities
FOR ALL
USING (
  public.is_admin() OR public.is_manager()
  OR (public.is_agent() AND lead_id IN (
    SELECT l.id FROM public.leads l WHERE l.assigned_agent_id = public.current_agent_id()
  ))
)
WITH CHECK (
  public.is_admin() OR public.is_manager()
  OR (public.is_agent() AND lead_id IN (
    SELECT l.id FROM public.leads l WHERE l.assigned_agent_id = public.current_agent_id()
  ))
);

-- Visits: assigned agents, property owners, admin/manager
CREATE POLICY visits_visibility_policy ON public.visits
FOR SELECT
USING (
  public.is_admin() OR public.is_manager()
  OR lead_id IN (SELECT l.id FROM public.leads l WHERE l.assigned_agent_id = public.current_agent_id())
  OR property_id IN (SELECT p.id FROM public.properties p WHERE p.owner_id = public.current_owner_id())
);

CREATE POLICY visits_write_policy ON public.visits
FOR ALL
USING (
  public.is_admin() OR public.is_manager()
  OR (public.is_agent() AND lead_id IN (SELECT l.id FROM public.leads l WHERE l.assigned_agent_id = public.current_agent_id()))
)
WITH CHECK (
  public.is_admin() OR public.is_manager()
  OR (public.is_agent() AND lead_id IN (SELECT l.id FROM public.leads l WHERE l.assigned_agent_id = public.current_agent_id()))
);

-- Reservations and soft locks
CREATE POLICY reservations_visibility_policy ON public.reservations
FOR SELECT
USING (
  public.is_admin() OR public.is_manager()
  OR lead_id IN (SELECT l.id FROM public.leads l WHERE l.assigned_agent_id = public.current_agent_id())
  OR bed_id IN (
    SELECT b.id
    FROM public.beds b
    INNER JOIN public.rooms r ON r.id = b.room_id
    INNER JOIN public.properties p ON p.id = r.property_id
    WHERE p.owner_id = public.current_owner_id()
  )
);

CREATE POLICY reservations_write_policy ON public.reservations
FOR ALL
USING (
  public.is_admin() OR public.is_manager()
  OR (public.is_agent() AND lead_id IN (SELECT l.id FROM public.leads l WHERE l.assigned_agent_id = public.current_agent_id()))
)
WITH CHECK (
  public.is_admin() OR public.is_manager()
  OR (public.is_agent() AND lead_id IN (SELECT l.id FROM public.leads l WHERE l.assigned_agent_id = public.current_agent_id()))
);

CREATE POLICY soft_locks_internal_rw ON public.soft_locks
FOR ALL
USING (public.is_admin() OR public.is_manager() OR public.is_agent())
WITH CHECK (public.is_admin() OR public.is_manager() OR public.is_agent());

-- Conversations: assigned agents, property owners, admin/manager
CREATE POLICY conversations_visibility_policy ON public.conversations
FOR SELECT
USING (
  public.is_admin() OR public.is_manager()
  OR lead_id IN (SELECT l.id FROM public.leads l WHERE l.assigned_agent_id = public.current_agent_id())
  OR lead_id IN (
    SELECT l.id FROM public.leads l
    WHERE l.property_id IN (SELECT p.id FROM public.properties p WHERE p.owner_id = public.current_owner_id())
  )
);

CREATE POLICY conversations_write_policy ON public.conversations
FOR ALL
USING (public.is_admin() OR public.is_manager() OR public.is_agent())
WITH CHECK (public.is_admin() OR public.is_manager() OR public.is_agent());

-- Follow-up reminders: assigned agents, admin/manager
CREATE POLICY follow_up_reminders_visibility_policy ON public.follow_up_reminders
FOR SELECT
USING (
  public.is_admin() OR public.is_manager()
  OR assigned_agent_id = public.current_agent_id()
  OR created_by = auth.uid()
);

CREATE POLICY follow_up_reminders_write_policy ON public.follow_up_reminders
FOR ALL
USING (
  public.is_admin() OR public.is_manager()
  OR (public.is_agent() AND (assigned_agent_id = public.current_agent_id() OR assigned_agent_id IS NULL))
)
WITH CHECK (
  public.is_admin() OR public.is_manager()
  OR (public.is_agent() AND (assigned_agent_id = public.current_agent_id() OR assigned_agent_id IS NULL))
);

-- Room status log: property owners and admin/manager
CREATE POLICY room_status_log_visibility_policy ON public.room_status_log
FOR SELECT
USING (
  public.is_admin() OR public.is_manager()
  OR room_id IN (
    SELECT r.id
    FROM public.rooms r
    INNER JOIN public.properties p ON p.id = r.property_id
    WHERE p.owner_id = public.current_owner_id()
  )
);

CREATE POLICY room_status_log_write_policy ON public.room_status_log
FOR ALL
USING (
  public.is_admin() OR public.is_manager()
  OR room_id IN (
    SELECT r.id
    FROM public.rooms r
    INNER JOIN public.properties p ON p.id = r.property_id
    WHERE p.owner_id = public.current_owner_id()
  )
)
WITH CHECK (
  public.is_admin() OR public.is_manager()
  OR room_id IN (
    SELECT r.id
    FROM public.rooms r
    INNER JOIN public.properties p ON p.id = r.property_id
    WHERE p.owner_id = public.current_owner_id()
  )
);

-- Bookings: owner sees only own properties, agent sees only assigned leads, admin/manager all
CREATE POLICY bookings_visibility_policy ON public.bookings
FOR SELECT
USING (
  public.is_admin() OR public.is_manager()
  OR property_id IN (
    SELECT p.id FROM public.properties p
    WHERE p.owner_id = public.current_owner_id()
  )
  OR lead_id IN (
    SELECT l.id FROM public.leads l
    WHERE l.assigned_agent_id = public.current_agent_id()
  )
);

CREATE POLICY bookings_write_policy ON public.bookings
FOR ALL
USING (
  public.is_admin() OR public.is_manager()
  OR property_id IN (
    SELECT p.id FROM public.properties p
    WHERE p.owner_id = public.current_owner_id()
  )
)
WITH CHECK (
  public.is_admin() OR public.is_manager()
  OR property_id IN (
    SELECT p.id FROM public.properties p
    WHERE p.owner_id = public.current_owner_id()
  )
);

-- Messages: restrict to lead-assigned agents, property owners, admin/manager
CREATE POLICY messages_visibility_policy ON public.messages
FOR SELECT
USING (
  public.is_admin() OR public.is_manager()
  OR conversation_id IN (
    SELECT c.id FROM public.conversations c
    INNER JOIN public.leads l ON l.id = c.lead_id
    WHERE l.assigned_agent_id = public.current_agent_id()
  )
  OR conversation_id IN (
    SELECT c.id FROM public.conversations c
    INNER JOIN public.leads l ON l.id = c.lead_id
    INNER JOIN public.properties p ON p.id = l.property_id
    WHERE p.owner_id = public.current_owner_id()
  )
);

CREATE POLICY messages_write_policy ON public.messages
FOR ALL
USING (
  public.is_admin() OR public.is_manager() OR public.is_agent() OR public.is_owner()
)
WITH CHECK (
  public.is_admin() OR public.is_manager() OR public.is_agent() OR public.is_owner()
);

-- Chat threads: visibility for admins, managers, lead-assigned agents, and related owners
CREATE POLICY chat_threads_visibility_policy ON public.chat_threads
FOR SELECT
USING (
  public.is_admin() OR public.is_manager()
  OR agent_id = public.current_agent_id()
  OR owner_id = public.current_owner_id()
  OR lead_id IN (
    SELECT l.id FROM public.leads l
    WHERE l.assigned_agent_id = public.current_agent_id()
  )
);

CREATE POLICY chat_threads_write_policy ON public.chat_threads
FOR ALL
USING (
  public.is_admin() OR public.is_manager() OR public.is_agent() OR public.is_owner()
)
WITH CHECK (
  public.is_admin() OR public.is_manager() OR public.is_agent() OR public.is_owner()
);

CREATE POLICY chat_participants_policy ON public.chat_participants
FOR ALL
USING (
  public.is_admin() OR public.is_manager() OR user_id = auth.uid()
)
WITH CHECK (
  public.is_admin() OR public.is_manager() OR user_id = auth.uid()
);

-- Notifications: only inbox owner or admin/manager
CREATE POLICY notifications_inbox_policy ON public.notifications
FOR SELECT
USING (user_id = auth.uid() OR public.is_admin() OR public.is_manager());

CREATE POLICY notifications_update_policy ON public.notifications
FOR UPDATE
USING (user_id = auth.uid() OR public.is_admin() OR public.is_manager())
WITH CHECK (user_id = auth.uid() OR public.is_admin() OR public.is_manager());

CREATE POLICY notifications_insert_policy ON public.notifications
FOR INSERT
WITH CHECK (public.is_admin() OR public.is_manager() OR user_id = auth.uid());

-- Activity log: admins/managers full visibility; actors can read own entries
CREATE POLICY activity_log_read_policy ON public.activity_log
FOR SELECT
USING (public.is_admin() OR public.is_manager() OR actor_user_id = auth.uid());

CREATE POLICY activity_log_write_policy ON public.activity_log
FOR INSERT
WITH CHECK (public.is_admin() OR public.is_manager() OR actor_user_id = auth.uid());

-- Payment transactions: admin/manager only
CREATE POLICY payment_transactions_policy ON public.payment_transactions
FOR ALL
USING (public.is_admin() OR public.is_manager())
WITH CHECK (public.is_admin() OR public.is_manager());

-- Payments: owner/agent visibility scoped by reservation + admin/manager global
CREATE POLICY payment_intents_visibility_policy ON public.payment_intents
FOR SELECT
USING (
  public.is_admin() OR public.is_manager()
  OR reservation_id IN (
    SELECT r.id FROM public.reservations r
    INNER JOIN public.beds b ON b.id = r.bed_id
    INNER JOIN public.rooms rm ON rm.id = b.room_id
    INNER JOIN public.properties p ON p.id = rm.property_id
    WHERE p.owner_id = public.current_owner_id()
  )
  OR reservation_id IN (
    SELECT r.id FROM public.reservations r
    INNER JOIN public.leads l ON l.id = r.lead_id
    WHERE l.assigned_agent_id = public.current_agent_id()
  )
);

CREATE POLICY payment_intents_write_policy ON public.payment_intents
FOR ALL
USING (public.is_admin() OR public.is_manager())
WITH CHECK (public.is_admin() OR public.is_manager());

CREATE POLICY payment_events_policy ON public.payment_events
FOR ALL
USING (
  public.is_admin() OR public.is_manager()
  OR payment_intent_id IN (
    SELECT pi.id FROM public.payment_intents pi
    WHERE pi.reservation_id IN (
      SELECT r.id FROM public.reservations r
      INNER JOIN public.beds b ON b.id = r.bed_id
      INNER JOIN public.rooms rm ON rm.id = b.room_id
      INNER JOIN public.properties p ON p.id = rm.property_id
      WHERE p.owner_id = public.current_owner_id()
    )
  )
)
WITH CHECK (public.is_admin() OR public.is_manager());

CREATE POLICY refunds_policy ON public.refunds
FOR ALL
USING (
  public.is_admin() OR public.is_manager()
  OR payment_intent_id IN (
    SELECT pi.id FROM public.payment_intents pi
    WHERE pi.reservation_id IN (
      SELECT r.id FROM public.reservations r
      INNER JOIN public.beds b ON b.id = r.bed_id
      INNER JOIN public.rooms rm ON rm.id = b.room_id
      INNER JOIN public.properties p ON p.id = rm.property_id
      WHERE p.owner_id = public.current_owner_id()
    )
  )
)
WITH CHECK (public.is_admin() OR public.is_manager());

CREATE POLICY webhook_events_policy ON public.webhook_events
FOR ALL
USING (public.is_admin() OR public.is_manager())
WITH CHECK (public.is_admin() OR public.is_manager());

CREATE POLICY payment_webhooks_policy ON public.payment_webhooks
FOR ALL
USING (public.is_admin() OR public.is_manager())
WITH CHECK (public.is_admin() OR public.is_manager());
