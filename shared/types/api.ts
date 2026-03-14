export type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  message?: string;
  error_code?: string;
  request_id?: string | null;
};

export type Paginated<T> = {
  data: T[];
  count?: number;
  page?: number;
  pageSize?: number;
  nextCursor?: string | null;
};

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'requirement_collected'
  | 'property_suggested'
  | 'visit_scheduled'
  | 'visit_completed'
  | 'booked'
  | 'lost';

export type Lead = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  source?: string | null;
  status: LeadStatus;
  lead_score?: number | null;
  assigned_agent_id?: string | null;
  property_id?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type Property = {
  id: string;
  name: string;
  city?: string | null;
  area?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  gender_allowed?: string | null;
  photos?: string[] | null;
  amenities?: string[] | null;
};

export type Room = {
  id: string;
  property_id: string;
  room_type: string;
  bed_count: number;
  status: string;
  price?: number | null;
};

export type Bed = {
  id: string;
  room_id: string;
  status: string;
  current_tenant_name?: string | null;
  move_in_date?: string | null;
};

export type Visit = {
  id: string;
  lead_id: string;
  property_id: string;
  scheduled_at: string;
  visit_status?: string | null;
  outcome?: string | null;
};

export type Booking = {
  id: string;
  lead_id: string;
  property_id: string;
  room_id?: string | null;
  bed_id?: string | null;
  status: string;
  move_in_date?: string | null;
};

export type Owner = {
  id: string;
  user_id?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
};

export type FollowUp = {
  id: string;
  lead_id: string;
  assigned_agent_id?: string | null;
  title: string;
  note?: string | null;
  due_at: string;
  status?: string | null;
  priority?: string | null;
};

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  body?: string | null;
  type?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  is_read?: boolean | null;
  created_at?: string;
};

export type PublicCaptureRequest = {
  name: string;
  phone: string;
  email?: string;
  source?: string;
  city?: string;
  area?: string;
  budget?: number;
  gender?: string;
  sharing_type?: string;
};

export type PublicVisitRequest = {
  name: string;
  phone: string;
  property_id: string;
  scheduled_at: string;
  notes?: string;
};

export type PublicChatRequest = {
  name: string;
  phone: string;
  message: string;
  property_id?: string;
};

