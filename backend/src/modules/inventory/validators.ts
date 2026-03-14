import { z } from 'zod';

export const createPropertySchema = z.object({
  body: z.object({
    name: z.string().min(2),
    owner_id: z.string().uuid().optional(),
    zone_id: z.string().uuid().optional().nullable(),
    city: z.string().min(2),
    area: z.string().min(2),
    address: z.string().min(5),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
    photos: z.array(z.string().url()).optional(),
    amenities: z.array(z.string()).optional(),
    gender_allowed: z.enum(['male', 'female', 'any']),
    total_rooms: z.number().int().min(0).optional(),
    total_beds: z.number().int().min(0).optional()
  })
});

export const createRoomSchema = z.object({
  body: z.object({
    property_id: z.string().uuid(),
    room_type: z.string().min(1),
    bed_count: z.number().int().min(1).max(20),
    status: z.enum(['available', 'maintenance', 'occupied']).optional(),
    price: z.number().int().positive().optional()
  })
});

export const addBedsSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    count: z.number().int().min(1).max(20)
  })
});

export const confirmRoomStatusSchema = z.object({
  body: z.object({
    room_id: z.string().uuid(),
    owner_id: z.string().uuid().optional(),
    status: z.enum(['available', 'maintenance', 'occupied'])
  })
});

export const updatePropertyPhotosSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    photos: z.array(z.string().min(1))
  })
});
