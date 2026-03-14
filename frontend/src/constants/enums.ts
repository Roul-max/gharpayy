export const BED_STATUSES = ['available', 'reserved', 'booked', 'occupied', 'maintenance'] as const;
export type BedStatus = (typeof BED_STATUSES)[number];

export const ROOM_STATUSES = ['available', 'occupied', 'maintenance'] as const;
export type RoomStatus = (typeof ROOM_STATUSES)[number];

export const LEAD_STATUSES = [
  'new',
  'contacted',
  'requirement_collected',
  'property_suggested',
  'visit_scheduled',
  'visit_completed',
  'booked',
  'lost'
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];
