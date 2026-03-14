export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  source: string;
  status: string;
  lead_score: number;
  assigned_agent_id?: string;
  property_id?: string;
  city?: string;
  area?: string;
  budget?: string;
  gender?: string;
  sharing_type?: string;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  name: string;
  owner_id: string;
  city: string;
  area: string;
  gender: string;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  property_id: string;
  room_number: string;
  sharing_type: string;
  price: number;
  created_at: string;
  updated_at: string;
}

export interface Bed {
  id: string;
  room_id: string;
  bed_number: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  lead_id: string;
  bed_id: string;
  status: string;
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Reservation {
  id: string;
  lead_id: string;
  bed_id: string;
  expires_at: string;
  status: string;
  created_at: string;
  updated_at: string;
}
