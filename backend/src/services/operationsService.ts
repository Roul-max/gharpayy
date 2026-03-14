import { supabase } from '../config/supabase.js';
import { detectDuplicateLead } from '../utils/duplicateLeadDetector.js';
import { automationQueue, enqueueNotification } from '../queue/index.js';
import { cacheDelete, cacheDeleteByPrefix } from '../cache/cache.js';
import { hasDatabasePool, queryWithTrace, withDbClient } from '../config/db.js';

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;
const PUBLIC_PAGE_SIZE = 24;
const PUBLIC_MAX_PAGE_SIZE = 30;

type AccessContext = {
  userId?: string;
  roles?: string[];
};

function getPagination(page?: number, pageSize?: number) {
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(pageSize) || DEFAULT_PAGE_SIZE));
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;
  return { from, to, safePage, safePageSize };
}

function normalizePhone(phone?: string) {
  return String(phone ?? '').replace(/\D/g, '');
}

function hasRole(context: AccessContext | undefined, allowedRoles: string[]) {
  const roles = context?.roles ?? [];
  return roles.some((role) => allowedRoles.includes(role));
}

function decodePublicCursor(cursor?: string) {
  if (!cursor) return null;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64').toString('utf8')) as { created_at: string; id: string };
    if (!parsed.created_at || !parsed.id) return null;
    return parsed;
  } catch {
    return null;
  }
}

function encodePublicCursor(createdAt: string, id: string) {
  return Buffer.from(JSON.stringify({ created_at: createdAt, id })).toString('base64');
}

function buildMapClusters(rows: Array<{ latitude: number | null; longitude: number | null }>) {
  const byCell = new Map<string, { lat: number; lng: number; count: number }>();
  for (const row of rows) {
    if (row.latitude == null || row.longitude == null) continue;
    const lat = Number(row.latitude.toFixed(2));
    const lng = Number(row.longitude.toFixed(2));
    const key = `${lat}:${lng}`;
    const existing = byCell.get(key);
    if (existing) {
      existing.count += 1;
      continue;
    }
    byCell.set(key, { lat, lng, count: 1 });
  }
  return Array.from(byCell.values());
}

async function invalidatePublicCache() {
  await Promise.all([
    cacheDeleteByPrefix('public:properties:'),
    cacheDeleteByPrefix('public:property:'),
    cacheDelete('public:stats')
  ]);
}

async function getOwnerRecord(userId?: string) {
  if (!userId) return null;

  const { data, error } = await supabase
    .from('owners')
    .select('id, user_id, name, email')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

async function getOwnerPropertyIds(userId?: string) {
  const owner = await getOwnerRecord(userId);
  if (!owner) return [];

  const { data, error } = await supabase
    .from('properties')
    .select('id')
    .eq('owner_id', owner.id);

  if (error) throw error;
  return (data ?? []).map((row: any) => row.id);
}

async function routeLeadToAgent(area?: string, city?: string) {
  const normalizedArea = area?.trim().toLowerCase();
  const normalizedCity = city?.trim().toLowerCase();

  const { data: zones, error: zonesError } = await supabase
    .from('zones')
    .select('id, name, areas')
    .limit(200);

  if (zonesError) throw zonesError;

  const matchedZone = (zones ?? []).find((zone: any) => {
    const areas = Array.isArray(zone.areas) ? zone.areas : [];
    return areas.some((entry: string) => {
      const normalizedEntry = String(entry).trim().toLowerCase();
      return normalizedEntry === normalizedArea || normalizedEntry === normalizedCity;
    });
  });

  if (matchedZone) {
    const { data: queueRows, error: queueError } = await supabase
      .from('team_queues')
      .select('agent_id, agents(id, is_active)')
      .eq('zone_id', matchedZone.id);

    if (queueError) throw queueError;

    const queuedAgentId = (queueRows ?? [])
      .filter((row: any) => row.agents?.is_active !== false)
      .map((row: any) => row.agent_id)
      .filter(Boolean)[0];

    if (queuedAgentId) return queuedAgentId;
  }

  const { data: agents, error: agentsError } = await supabase
    .from('agents')
    .select('id')
    .eq('is_active', true)
    .eq('role', 'agent')
    .order('name', { ascending: true })
    .limit(1);

  if (agentsError) throw agentsError;
  return agents?.[0]?.id ?? null;
}

async function createNotificationForAgent(agentId: string | null, title: string, body: string, entityType: string, entityId: string) {
  if (!agentId) return;

  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .select('user_id')
    .eq('id', agentId)
    .maybeSingle();

  if (agentError) throw agentError;
  if (!agent?.user_id) return;

  await enqueueNotification({
    user_id: agent.user_id,
    title,
    body,
    type: 'lead',
    entity_type: entityType,
    entity_id: entityId
  });
}

async function logLeadActivity(leadId: string, action: string, details: Record<string, unknown>) {
  await supabase.from('lead_activities').insert([{
    lead_id: leadId,
    action,
    details
  }]);
}

function runInBackground(task: Promise<unknown>, label: string) {
  task.catch((error) => {
    console.error(`Background task failed: ${label}`, error);
  });
}

async function upsertPublicLead(payload: {
  name: string;
  phone: string;
  email?: string;
  source?: string;
  city?: string;
  area?: string;
  budget?: number;
  gender?: string;
  sharing_type?: string;
}) {
  const normalizedPhone = normalizePhone(payload.phone);
  const normalizedEmail = payload.email?.trim().toLowerCase();
  const duplicate = await detectDuplicateLead(normalizedPhone, normalizedEmail);

  if (duplicate) {
    const updatePayload: Record<string, unknown> = {
      name: payload.name || duplicate.name,
      source: payload.source ?? duplicate.source,
      city: payload.city ?? duplicate.city,
      area: payload.area ?? duplicate.area,
      budget: payload.budget ?? duplicate.budget,
      gender: payload.gender ?? duplicate.gender,
      sharing_type: payload.sharing_type ?? duplicate.sharing_type,
      email: normalizedEmail ?? duplicate.email,
      last_activity_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('leads')
      .update(updatePayload)
      .eq('id', duplicate.id)
      .select('id, name, source, city, area, assigned_agent_id, email')
      .single();

    if (error) throw error;

    runInBackground(
      logLeadActivity(data.id, 'duplicate_lead_refreshed', {
        source: payload.source ?? 'website',
        phone: normalizedPhone
      }),
      'duplicate_lead_refreshed'
    );

    return { lead: data, isNew: false };
  }

  const { data, error } = await supabase
    .from('leads')
    .insert([{
      ...payload,
      phone: normalizedPhone,
      email: normalizedEmail,
      source: payload.source ?? 'landing_page',
      status: 'new',
      lead_score: 25,
      assigned_agent_id: null,
      first_response_at: null
    }])
    .select('id, name, source, city, area, assigned_agent_id, email')
    .single();

  if (error) throw error;

  runInBackground(
    logLeadActivity(data.id, 'lead_captured_public', {
      source: data.source,
      city: data.city,
      area: data.area
    }),
    'lead_captured_public'
  );

  runInBackground(
    (async () => {
      const assignedAgentId = await routeLeadToAgent(payload.area, payload.city);
      if (!assignedAgentId) return;

      await supabase
        .from('leads')
        .update({ assigned_agent_id: assignedAgentId })
        .eq('id', data.id);

      await createNotificationForAgent(
        assignedAgentId,
        'New inbound lead',
        `${data.name} requested help from ${data.source ?? 'website'}`,
        'lead',
        data.id
      );
    })(),
    'route_lead_to_agent'
  );

  return { lead: data, isNew: true };
}

export const operationsService = {
  async listPublicProperties(params: {
    city?: string;
    area?: string;
    gender?: string;
    budget?: string;
    page?: number;
    pageSize?: number;
    cursor?: string;
    minLat?: number;
    maxLat?: number;
    minLng?: number;
    maxLng?: number;
  }) {
    const safePageSize = Math.min(PUBLIC_MAX_PAGE_SIZE, Math.max(1, Number(params.pageSize) || PUBLIC_PAGE_SIZE));
    const cursor = decodePublicCursor(params.cursor);
    const budgetRange = params.budget === 'under10k'
      ? { min: 0, max: 9999 }
      : params.budget === '10k-15k'
        ? { min: 10000, max: 15000 }
        : params.budget === 'above15k'
          ? { min: 15001, max: null as number | null }
          : null;

    if (hasDatabasePool()) {
      const values: Array<string | number | null> = [];
      const conditions: string[] = [];
      let index = 1;

      if (params.city) {
        conditions.push(`p.city ILIKE $${index++}`);
        values.push(`%${params.city}%`);
      }
      if (params.area) {
        conditions.push(`p.area ILIKE $${index++}`);
        values.push(`%${params.area}%`);
      }
      if (params.gender && params.gender !== 'any') {
        conditions.push(`p.gender_allowed IN ('any', $${index++})`);
        values.push(params.gender);
      }
      if (params.minLat != null) {
        conditions.push(`p.latitude >= $${index++}`);
        values.push(params.minLat);
      }
      if (params.maxLat != null) {
        conditions.push(`p.latitude <= $${index++}`);
        values.push(params.maxLat);
      }
      if (params.minLng != null) {
        conditions.push(`p.longitude >= $${index++}`);
        values.push(params.minLng);
      }
      if (params.maxLng != null) {
        conditions.push(`p.longitude <= $${index++}`);
        values.push(params.maxLng);
      }
      if (cursor) {
        conditions.push(`(p.created_at, p.id) < ($${index++}::timestamptz, $${index++}::uuid)`);
        values.push(cursor.created_at, cursor.id);
      }

      const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const budgetWhere = budgetRange
        ? budgetRange.max == null
          ? `AND coalesce(room_stats.starts_from, 99999999) >= ${budgetRange.min}`
          : `AND coalesce(room_stats.starts_from, 99999999) BETWEEN ${budgetRange.min} AND ${budgetRange.max}`
        : '';

      const sql = `
        WITH base AS (
          SELECT
            p.id,
            p.name,
            p.city,
            p.area,
            p.address,
            p.latitude,
            p.longitude,
            p.gender_allowed,
            p.photos,
            p.created_at
          FROM properties p
          ${whereSql}
          ORDER BY p.created_at DESC, p.id DESC
          LIMIT ${safePageSize + 1}
        ),
        room_stats AS (
          SELECT
            r.property_id,
            MIN(r.price) AS starts_from,
            COUNT(b.id) AS total_beds,
            COUNT(*) FILTER (WHERE b.status = 'available') AS vacant_beds
          FROM rooms r
          LEFT JOIN beds b ON b.room_id = r.id
          WHERE r.property_id IN (SELECT id FROM base)
          GROUP BY r.property_id
        )
        SELECT
          base.*,
          coalesce(room_stats.starts_from, NULL) AS starts_from,
          coalesce(room_stats.total_beds, 0) AS total_beds,
          coalesce(room_stats.vacant_beds, 0) AS vacant_beds
        FROM base
        LEFT JOIN room_stats ON room_stats.property_id = base.id
        WHERE 1 = 1
          ${budgetWhere}
        ORDER BY base.created_at DESC, base.id DESC
      `;

      const { rows } = await queryWithTrace<any>(sql, values, 'public.properties.list');
      const hasNext = rows.length > safePageSize;
      const data = rows.slice(0, safePageSize).map((row: any) => ({
        id: row.id,
        name: row.name,
        city: row.city,
        area: row.area,
        address: row.address,
        latitude: row.latitude,
        longitude: row.longitude,
        gender_allowed: row.gender_allowed,
        starts_from: row.starts_from ? Number(row.starts_from) : null,
        total_beds: Number(row.total_beds ?? 0),
        vacant_beds: Number(row.vacant_beds ?? 0),
        cover_photo: Array.isArray(row.photos) && row.photos.length > 0 ? row.photos[0] : null
      }));

      const last = data[data.length - 1] as { id: string } | undefined;
      const lastRaw = rows[Math.min(rows.length, safePageSize) - 1] as { created_at: string; id: string } | undefined;

      return {
        data,
        pageSize: safePageSize,
        nextCursor: hasNext && last && lastRaw ? encodePublicCursor(lastRaw.created_at, last.id) : null,
        clusters: buildMapClusters(data),
        count: data.length
      };
    }

    // Supabase fallback keeps compatibility when DATABASE_URL is not configured.
    let query = supabase
      .from('properties')
      .select('id, name, city, area, address, latitude, longitude, gender_allowed, photos, rooms(price, beds(id, status)), created_at')
      .order('created_at', { ascending: false })
      .limit(safePageSize + 1);

    if (params.city) query = query.ilike('city', `%${params.city}%`);
    if (params.area) query = query.ilike('area', `%${params.area}%`);
    if (params.gender && params.gender !== 'any') query = query.in('gender_allowed', ['any', params.gender]);
    if (params.minLat != null) query = query.gte('latitude', params.minLat);
    if (params.maxLat != null) query = query.lte('latitude', params.maxLat);
    if (params.minLng != null) query = query.gte('longitude', params.minLng);
    if (params.maxLng != null) query = query.lte('longitude', params.maxLng);
    if (cursor) query = query.lt('created_at', cursor.created_at);

    const { data, error } = await query;
    if (error) throw error;

    const normalized = (data ?? []).map((property: any) => {
      const beds = (property.rooms ?? []).flatMap((room: any) => room.beds ?? []);
      const prices = (property.rooms ?? [])
        .map((room: any) => Number(room.price))
        .filter((value: number) => Number.isFinite(value) && value > 0);
      return {
        id: property.id,
        name: property.name,
        city: property.city,
        area: property.area,
        address: property.address,
        latitude: property.latitude,
        longitude: property.longitude,
        gender_allowed: property.gender_allowed,
        starts_from: prices.length > 0 ? Math.min(...prices) : null,
        total_beds: beds.length,
        vacant_beds: beds.filter((bed: any) => bed.status === 'available').length,
        cover_photo: Array.isArray(property.photos) && property.photos.length > 0 ? property.photos[0] : null,
        created_at: property.created_at
      };
    });

    const filtered = budgetRange
      ? normalized.filter((item) => {
          const amount = item.starts_from ?? Number.MAX_SAFE_INTEGER;
          if (budgetRange.max == null) return amount >= budgetRange.min;
          return amount >= budgetRange.min && amount <= budgetRange.max;
        })
      : normalized;
    const hasNext = filtered.length > safePageSize;
    const pageData = filtered.slice(0, safePageSize);
    const last = pageData[pageData.length - 1];

    return {
      data: pageData.map(({ created_at, ...card }) => card),
      pageSize: safePageSize,
      nextCursor: hasNext && last ? encodePublicCursor(last.created_at, last.id) : null,
      clusters: buildMapClusters(pageData),
      count: pageData.length
    };
  },

  async getPublicPropertyById(propertyId: string) {
    const { data, error } = await supabase
      .from('properties')
      .select('id, name, city, area, address, latitude, longitude, gender_allowed, photos, amenities, owners(id, name, phone), rooms(*, beds(id, status, current_tenant_name, move_in_date))')
      .eq('id', propertyId)
      .single();

    if (error) throw error;
    return data;
  },

  async getPublicStats() {
    const [
      propertiesRes,
      ownersRes,
      leadsRes,
      bedsRes
    ] = await Promise.all([
      supabase.from('properties').select('id', { count: 'exact', head: true }),
      supabase.from('owners').select('id', { count: 'exact', head: true }),
      supabase.from('leads').select('id', { count: 'exact', head: true }),
      supabase.from('beds').select('id, status')
    ]);

    if (propertiesRes.error) throw propertiesRes.error;
    if (ownersRes.error) throw ownersRes.error;
    if (leadsRes.error) throw leadsRes.error;
    if (bedsRes.error) throw bedsRes.error;

    const totalBeds = (bedsRes.data ?? []).length;
    const vacantBeds = (bedsRes.data ?? []).filter((b: any) => b.status === 'available').length;

    return {
      properties: propertiesRes.count ?? 0,
      owners: ownersRes.count ?? 0,
      leads: leadsRes.count ?? 0,
      totalBeds,
      vacantBeds
    };
  },

  async listVisits(params: { page?: number; pageSize?: number; status?: string; leadId?: string }) {
    const { from, to } = getPagination(params.page, params.pageSize);
    let query = supabase
      .from('visits')
      .select('*, leads(id, name, phone), properties(id, name, city, area)', { count: 'exact' })
      .order('scheduled_at', { ascending: false })
      .range(from, to);

    if (params.status) query = query.eq('visit_status', params.status);
    if (params.leadId) query = query.eq('lead_id', params.leadId);

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data ?? [], count: count ?? 0 };
  },

  async createVisit(payload: { lead_id: string; property_id: string; scheduled_at: string; visit_status?: string }) {
    const { data, error } = await supabase
      .from('visits')
      .insert([
        {
          lead_id: payload.lead_id,
          property_id: payload.property_id,
          scheduled_at: payload.scheduled_at,
          visit_status: payload.visit_status ?? 'scheduled'
        }
      ])
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  async updateVisitOutcome(visitId: string, payload: { outcome: 'booked' | 'considering' | 'not_interested'; visit_status?: 'completed' | 'cancelled' | 'scheduled' }) {
    const { data, error } = await supabase
      .from('visits')
      .update({
        outcome: payload.outcome,
        visit_status: payload.visit_status ?? 'completed'
      })
      .eq('id', visitId)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  async listBookings(params: { page?: number; pageSize?: number; status?: string; userId?: string; roles?: string[] }) {
    const { from, to } = getPagination(params.page, params.pageSize);
    let query = supabase
      .from('bookings')
      .select('*, leads(id, name, phone), properties(id, name, city, area), rooms(id, room_type), beds(id, status)', { count: 'exact' })
      .order('move_in_date', { ascending: false })
      .range(from, to);

    if (params.status) query = query.eq('status', params.status);
    if (hasRole(params, ['owner']) && !hasRole(params, ['admin', 'manager'])) {
      const propertyIds = await getOwnerPropertyIds(params.userId);
      if (propertyIds.length === 0) return { data: [], count: 0 };
      query = query.in('property_id', propertyIds);
    }

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data ?? [], count: count ?? 0 };
  },

  async listProperties(params: { page?: number; pageSize?: number; city?: string; area?: string; ownerId?: string; userId?: string; roles?: string[] }) {
    const { from, to } = getPagination(params.page, params.pageSize);
    let query = supabase
      .from('properties')
      .select('*, owners(id, name, email, phone), zones(id, name)', { count: 'exact' })
      .order('id', { ascending: false })
      .range(from, to);

    if (params.city) query = query.ilike('city', `%${params.city}%`);
    if (params.area) query = query.ilike('area', `%${params.area}%`);
    if (params.ownerId) query = query.eq('owner_id', params.ownerId);
    if (hasRole(params, ['owner']) && !hasRole(params, ['admin', 'manager'])) {
      const owner = await getOwnerRecord(params.userId);
      if (!owner) return { data: [], count: 0 };
      query = query.eq('owner_id', owner.id);
    }

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data ?? [], count: count ?? 0 };
  },

  async createProperty(payload: Record<string, unknown>, context?: AccessContext) {
    const insertPayload = { ...payload };
    if (hasRole(context, ['owner']) && !hasRole(context, ['admin', 'manager'])) {
      const owner = await getOwnerRecord(context?.userId);
      if (!owner) throw new Error('Owner profile not found');
      insertPayload.owner_id = owner.id;
    }

    const { data, error } = await supabase
      .from('properties')
      .insert([insertPayload])
      .select('*')
      .single();
    if (error) throw error;
    await invalidatePublicCache();
    return data;
  },

  async updatePropertyPhotos(propertyId: string, photos: string[], context?: AccessContext) {
    if (hasRole(context, ['owner']) && !hasRole(context, ['admin', 'manager'])) {
      const owner = await getOwnerRecord(context?.userId);
      if (!owner) throw new Error('Owner profile not found');
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .select('id')
        .eq('id', propertyId)
        .eq('owner_id', owner.id)
        .maybeSingle();
      if (propertyError) throw propertyError;
      if (!property) throw new Error('You can only update your own property');
    }

    const { data, error } = await supabase
      .from('properties')
      .update({ photos, updated_at: new Date().toISOString() })
      .eq('id', propertyId)
      .select('*')
      .single();
    if (error) throw error;
    await invalidatePublicCache();
    return data;
  },

  async createRoom(payload: { property_id: string; room_type: string; bed_count: number; status?: string }, context?: AccessContext) {
    if (hasRole(context, ['owner']) && !hasRole(context, ['admin', 'manager'])) {
      const owner = await getOwnerRecord(context?.userId);
      if (!owner) throw new Error('Owner profile not found');
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .select('id')
        .eq('id', payload.property_id)
        .eq('owner_id', owner.id)
        .maybeSingle();

      if (propertyError) throw propertyError;
      if (!property) throw new Error('You can only add rooms to your own properties');
    }

    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .insert([
        {
          property_id: payload.property_id,
          room_type: payload.room_type,
          bed_count: payload.bed_count,
          status: payload.status ?? 'available'
        }
      ])
      .select('*')
      .single();

    if (roomError) throw roomError;

    const bedsToInsert = Array.from({ length: Math.max(0, Number(payload.bed_count) || 0) }, () => ({
      room_id: room.id,
      status: 'available'
    }));

    if (bedsToInsert.length > 0) {
      const { error: bedsError } = await supabase.from('beds').insert(bedsToInsert);
      if (bedsError) throw bedsError;
    }

    await invalidatePublicCache();
    return room;
  },

  async addBedsToRoom(payload: { room_id: string; count: number }, context?: AccessContext) {
    if (hasRole(context, ['owner']) && !hasRole(context, ['admin', 'manager'])) {
      const owner = await getOwnerRecord(context?.userId);
      if (!owner) throw new Error('Owner profile not found');
      const { data: roomAccess, error: roomAccessError } = await supabase
        .from('rooms')
        .select('id, properties!inner(owner_id)')
        .eq('id', payload.room_id)
        .eq('properties.owner_id', owner.id)
        .maybeSingle();

      if (roomAccessError) throw roomAccessError;
      if (!roomAccess) throw new Error('You can only update rooms in your own properties');
    }

    const count = Math.max(1, Math.min(20, Number(payload.count) || 1));
    const bedsToInsert = Array.from({ length: count }, () => ({
      room_id: payload.room_id,
      status: 'available'
    }));

    const { data, error } = await supabase.from('beds').insert(bedsToInsert).select('*');
    if (error) throw error;

    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('bed_count')
      .eq('id', payload.room_id)
      .single();
    if (!roomError && room) {
      await supabase
        .from('rooms')
        .update({ bed_count: Number(room.bed_count ?? 0) + count })
        .eq('id', payload.room_id);
    }

    await invalidatePublicCache();
    return data ?? [];
  },

  async listInventory(params: { propertyId?: string; userId?: string; roles?: string[] }) {
    let query = supabase
      .from('rooms')
      .select('id, property_id, room_type, bed_count, status, properties(id, name, city, area), beds(id, status, current_tenant_name, move_in_date)')
      .order('id', { ascending: false });

    if (params.propertyId) query = query.eq('property_id', params.propertyId);
    if (hasRole(params, ['owner']) && !hasRole(params, ['admin', 'manager'])) {
      const propertyIds = await getOwnerPropertyIds(params.userId);
      if (propertyIds.length === 0) return [];
      query = query.in('property_id', propertyIds);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },

  async confirmRoomStatus(payload: { room_id: string; owner_id?: string; status: string }, context?: AccessContext) {
    const owner = hasRole(context, ['owner']) && !hasRole(context, ['admin', 'manager'])
      ? await getOwnerRecord(context?.userId)
      : payload.owner_id
        ? { id: payload.owner_id }
        : await getOwnerRecord(context?.userId);

    if (!owner?.id) throw new Error('Owner profile not found');

    const { data, error } = await supabase
      .from('room_status_log')
      .insert([
        {
          room_id: payload.room_id,
          owner_id: owner.id,
          status: payload.status
        }
      ])
      .select('*')
      .single();
    if (error) throw error;

    await supabase
      .from('rooms')
      .update({ status: payload.status })
      .eq('id', payload.room_id);

    await invalidatePublicCache();
    return data;
  },

  async listOwners(params: { page?: number; pageSize?: number }) {
    const { from, to } = getPagination(params.page, params.pageSize);
    const { data, error, count } = await supabase
      .from('owners')
      .select('id, user_id, name, email, phone, properties(id)', { count: 'exact' })
      .order('name', { ascending: true })
      .range(from, to);
    if (error) throw error;
    return { data: data ?? [], count: count ?? 0 };
  },

  async createOwner(payload: { user_id?: string; name: string; email: string; phone?: string }) {
    const { data, error } = await supabase
      .from('owners')
      .insert([payload])
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  async getEffortDashboard(propertyId?: string, context?: AccessContext) {
    if (propertyId) {
      const { data, error } = await supabase.rpc('get_property_effort', { p_property_id: propertyId });
      if (!error) return data ?? [];
    }

    let query = supabase
      .from('properties')
      .select('id, name, city, area, total_beds, total_rooms')
      .order('name', { ascending: true });

    if (hasRole(context, ['owner']) && !hasRole(context, ['admin', 'manager'])) {
      const owner = await getOwnerRecord(context?.userId);
      if (!owner) return [];
      query = query.eq('owner_id', owner.id);
    }

    const { data: properties, error } = await query;
    if (error) throw error;

    return properties ?? [];
  },

  async listZones() {
    const { data, error } = await supabase
      .from('zones')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async createZone(payload: { name: string; areas?: string[]; agent_count?: number; is_active?: boolean }) {
    const { data, error } = await supabase
      .from('zones')
      .insert([
        {
          name: payload.name,
          areas: payload.areas ?? [],
          agent_count: payload.agent_count ?? 1,
          is_active: payload.is_active ?? true
        }
      ])
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  async updateZone(zoneId: string, payload: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('zones')
      .update(payload)
      .eq('id', zoneId)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  async listFollowUps(params: { userId?: string; page?: number; pageSize?: number; status?: string; assignedAgentId?: string }) {
    const { from, to } = getPagination(params.page, params.pageSize);
    let query = supabase
      .from('follow_up_reminders')
      .select('*, leads(id, name, phone, status), agents(id, name)', { count: 'exact' })
      .order('due_at', { ascending: true })
      .range(from, to);

    if (params.status) query = query.eq('status', params.status);
    if (params.assignedAgentId) query = query.eq('assigned_agent_id', params.assignedAgentId);

    const { data, error, count } = await query;
    if (error) {
      if (error.code === '42P01') return { data: [], count: 0 };
      throw error;
    }
    return { data: data ?? [], count: count ?? 0 };
  },

  async createFollowUp(payload: {
    lead_id: string;
    assigned_agent_id?: string;
    title: string;
    note?: string;
    due_at: string;
    priority?: 'low' | 'medium' | 'high';
    created_by?: string;
  }) {
    const { data, error } = await supabase
      .from('follow_up_reminders')
      .insert([
        {
          lead_id: payload.lead_id,
          assigned_agent_id: payload.assigned_agent_id ?? null,
          title: payload.title,
          note: payload.note ?? null,
          due_at: payload.due_at,
          priority: payload.priority ?? 'medium',
          created_by: payload.created_by ?? null
        }
      ])
      .select('*')
      .single();
    if (error) throw error;

    if (payload.assigned_agent_id) {
      const { data: agent } = await supabase
        .from('agents')
        .select('user_id')
        .eq('id', payload.assigned_agent_id)
        .maybeSingle();

      if (agent?.user_id) {
        await supabase.from('notifications').insert([
          {
            user_id: agent.user_id,
            title: 'Follow-up assigned',
            body: payload.title,
            type: 'follow_up',
            entity_type: 'lead',
            entity_id: payload.lead_id
          }
        ]);
      }
    }

    return data;
  },

  async updateFollowUp(id: string, payload: Record<string, unknown>) {
    const updatePayload: Record<string, unknown> = {
      ...payload,
      updated_at: new Date().toISOString()
    };

    if (payload.status === 'completed') {
      updatePayload.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('follow_up_reminders')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  async listNotifications(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(25);
    if (error) {
      if (error.code === '42P01') return { data: [], unreadCount: 0 };
      throw error;
    }
    return {
      data: data ?? [],
      unreadCount: (data ?? []).filter((item: any) => !item.is_read).length
    };
  },

  async markNotificationRead(id: string, userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  async runAutomation(job: 'soft-locks' | 'lead-scores' | 'follow-ups' | 'inventory-health' | 'notification-fanout' | 'analytics-rollups' | 'all') {
    const toRun = job === 'all' ? ['soft-lock-cleanup', 'lead-score-recalculation', 'follow-up-reminders', 'inventory-health', 'notification-fanout', 'analytics-rollups'] : [
      job === 'soft-locks' ? 'soft-lock-cleanup' :
      job === 'lead-scores' ? 'lead-score-recalculation' :
      job === 'follow-ups' ? 'follow-up-reminders' :
      job === 'notification-fanout' ? 'notification-fanout' :
      job === 'analytics-rollups' ? 'analytics-rollups' :
      'inventory-health'
    ];
    for (const task of toRun) {
      await automationQueue.add(task, {}, {
        attempts: 5,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: 500,
        removeOnFail: 1000
      });
    }
    return {
      success: true,
      executed: toRun,
      executed_at: new Date().toISOString()
    };
  },

  async getOwnerAlerts(context?: AccessContext) {
    const owner = await getOwnerRecord(context?.userId);
    if (!owner) {
      return {
        alerts: [],
        summary: { staleRooms: 0, unreadNotifications: 0, lowAvailabilityRooms: 0, newBookings: 0, unreadMessages: 0 }
      };
    }

    const propertyIds = await getOwnerPropertyIds(context?.userId);
    if (propertyIds.length === 0) {
      return {
        alerts: [],
        summary: { staleRooms: 0, unreadNotifications: 0, lowAvailabilityRooms: 0, newBookings: 0, unreadMessages: 0 }
      };
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [{ data: rooms }, { data: notifications }, { data: statusLogs }, { data: recentBookings }] = await Promise.all([
      supabase.from('rooms').select('id, property_id, room_type, beds(id, status)').in('property_id', propertyIds),
      supabase.from('notifications').select('id, is_read').eq('user_id', owner.user_id),
      supabase.from('room_status_log').select('room_id, confirmed_at').gte('confirmed_at', sevenDaysAgo)
      ,
      supabase
        .from('bookings')
        .select('id, property_id, created_at')
        .in('property_id', propertyIds)
        .gte('created_at', twentyFourHoursAgo)
    ]);

    const { data: conversations } = await supabase
      .from('conversations')
      .select('id, lead_id, leads(property_id)')
      .in('leads.property_id', propertyIds);
    const conversationIds = (conversations ?? []).map((row: any) => row.id).filter(Boolean);
    const unreadMessages = conversationIds.length === 0
      ? []
      : (await supabase
        .from('messages')
        .select('id, conversation_id, created_at')
        .in('conversation_id', conversationIds)
        .gte('created_at', sevenDaysAgo)).data ?? [];

    const confirmedRoomIds = new Set((statusLogs ?? []).map((row: any) => row.room_id));
    const staleRooms = (rooms ?? []).filter((room: any) => !confirmedRoomIds.has(room.id));
    const lowAvailabilityRooms = (rooms ?? []).filter((room: any) => {
      const beds = room.beds ?? [];
      const available = beds.filter((bed: any) => bed.status === 'available').length;
      return beds.length > 0 && available <= 1;
    });
    const unreadNotifications = (notifications ?? []).filter((n: any) => !n.is_read).length;
    const newBookings = (recentBookings ?? []).length;
    const unreadMessagesCount = (unreadMessages ?? []).length;

    const alerts = [
      ...staleRooms.slice(0, 10).map((room: any) => ({
        type: 'stale_room_confirmation',
        title: `Room ${room.room_type} needs confirmation`,
        room_id: room.id,
        property_id: room.property_id
      })),
      ...lowAvailabilityRooms.slice(0, 10).map((room: any) => ({
        type: 'low_availability',
        title: `Low availability in room ${room.room_type}`,
        room_id: room.id,
        property_id: room.property_id
      })),
      ...(recentBookings ?? []).slice(0, 10).map((booking: any) => ({
        type: 'new_booking',
        title: 'New booking received',
        booking_id: booking.id,
        property_id: booking.property_id
      })),
      ...(unreadMessages ?? []).slice(0, 10).map((message: any) => ({
        type: 'unread_message',
        title: 'New unread message',
        conversation_id: message.conversation_id
      }))
    ];

    return {
      alerts,
      summary: {
        staleRooms: staleRooms.length,
        unreadNotifications,
        lowAvailabilityRooms: lowAvailabilityRooms.length,
        newBookings,
        unreadMessages: unreadMessagesCount
      }
    };
  },

  async publicCaptureLead(payload: { name: string; phone: string; email?: string; source?: string; city?: string; area?: string; budget?: number; gender?: string; sharing_type?: string }) {
    if (process.env.ENABLE_LEAD_CAPTURE_QUEUE === 'true') {
      const { enqueueLeadCapture } = await import('../queue/leadCaptureQueue.js');
      await enqueueLeadCapture(payload);
      return {
        queued: true,
        lead: null,
        deduplicated: null
      };
    }

    const result = await upsertPublicLead(payload);
    return {
      lead: result.lead,
      deduplicated: !result.isNew
    };
  },

  async processQueuedLead(payload: { name: string; phone: string; email?: string; source?: string; city?: string; area?: string; budget?: number; gender?: string; sharing_type?: string }) {
    const result = await upsertPublicLead(payload);
    return {
      lead: result.lead,
      deduplicated: !result.isNew
    };
  },

  async publicVisitRequest(payload: { name: string; phone: string; property_id: string; scheduled_at: string; notes?: string }) {
    const leadResult = await upsertPublicLead({
      name: payload.name,
      phone: payload.phone,
      source: 'website'
    });
    const lead = leadResult.lead;

    const { data, error } = await supabase
      .from('visits')
      .insert([
        {
          lead_id: lead.id,
          property_id: payload.property_id,
          scheduled_at: payload.scheduled_at,
          visit_status: 'scheduled'
        }
      ])
      .select('*')
      .single();
    if (error) throw error;

    await logLeadActivity(lead.id, 'visit_requested_public', {
      notes: payload.notes ?? null,
      scheduled_at: payload.scheduled_at,
      property_id: payload.property_id
    });

    if (lead.assigned_agent_id) {
      await createNotificationForAgent(
        lead.assigned_agent_id,
        'New visit request',
        `${lead.name} requested a site visit`,
        'visit',
        data.id
      );
    }

    await supabase.from('follow_up_reminders').insert([{
      lead_id: lead.id,
      assigned_agent_id: lead.assigned_agent_id ?? null,
      title: `Confirm visit for ${lead.name}`,
      note: payload.notes ?? 'Public visit request received from website',
      due_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      priority: 'high',
      status: 'pending'
    }]);

    return { lead, visit: data, deduplicated: !leadResult.isNew };
  },

  async publicChatMessage(payload: { name: string; phone: string; message: string; property_id?: string }) {
    const leadResult = await upsertPublicLead({
      name: payload.name,
      phone: payload.phone,
      source: 'website'
    });
    const lead = leadResult.lead;

    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('lead_id', lead.id)
      .maybeSingle();

    let conversationId = existingConversation?.id;
    if (!conversationId) {
      const { data: createdConversation, error: conversationError } = await supabase
        .from('conversations')
        .insert([{ lead_id: lead.id, agent_id: null }])
        .select('id')
        .single();
      if (conversationError) throw conversationError;
      conversationId = createdConversation.id;
    }

    const { data: message, error } = await supabase
      .from('messages')
      .insert([
        {
          conversation_id: conversationId,
          sender_id: lead.id,
          message: payload.message,
          channel: 'website_chat'
        }
      ])
      .select('*')
      .single();
    if (error) throw error;

    await logLeadActivity(lead.id, 'chat_message_public', {
      property_id: payload.property_id ?? null
    });

    if (lead.assigned_agent_id) {
      await createNotificationForAgent(
        lead.assigned_agent_id,
        'New website chat',
        `${lead.name} sent a website message`,
        'conversation',
        conversationId
      );
    }

    return { lead, message, deduplicated: !leadResult.isNew };
  }
  ,

  async publicCreateReservation(payload: { name: string; phone: string; email?: string; bed_id: string; property_id?: string }) {
    const leadResult = await upsertPublicLead({
      name: payload.name,
      phone: payload.phone,
      email: payload.email,
      source: 'website'
    });
    const lead = leadResult.lead;

    const holdExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    if (hasDatabasePool()) {
      return withDbClient(async (client) => {
        await queryWithTrace('BEGIN', [], 'reservations.tx.begin', client);
        try {
          const bedRes = await queryWithTrace<any>(
            `SELECT b.id, b.status, r.price, r.room_type, r.property_id
             FROM beds b
             INNER JOIN rooms r ON r.id = b.room_id
             WHERE b.id = $1
             FOR UPDATE`,
            [payload.bed_id],
            'reservations.bed.lock',
            client
          );
          const bed = bedRes.rows[0];
          if (!bed || bed.status !== 'available') {
            const existingRes = await queryWithTrace<any>(
              `SELECT *
               FROM reservations
               WHERE bed_id = $1
                 AND lead_id = $2
                 AND status = 'pending'
                 AND hold_expires_at > NOW()
               ORDER BY created_at DESC
               LIMIT 1`,
              [payload.bed_id, lead.id],
              'reservations.existing',
              client
            );
            const existing = existingRes.rows[0];
            if (existing) {
              await queryWithTrace('COMMIT', [], 'reservations.tx.commit', client);
              return {
                reservation: existing,
                lead,
                amount: Number(bed?.price ?? 0),
                currency: 'INR',
                room_type: bed?.room_type,
                property_id: bed?.property_id
              };
            }
            throw new Error('Bed is not available for reservation');
          }

          const reservationRes = await queryWithTrace<any>(
            `INSERT INTO reservations (lead_id, bed_id, status, payment_status, hold_expires_at)
             VALUES ($1, $2, 'pending', 'pending', $3::timestamptz)
             RETURNING *`,
            [lead.id, payload.bed_id, holdExpiresAt],
            'reservations.insert',
            client
          );

          await queryWithTrace(
            `INSERT INTO soft_locks (reservation_id, bed_id, expires_at)
             VALUES ($1, $2, $3::timestamptz)`,
            [reservationRes.rows[0].id, payload.bed_id, holdExpiresAt],
            'reservations.soft_lock',
            client
          );

          await queryWithTrace(
            `UPDATE beds SET status = 'reserved', updated_at = NOW() WHERE id = $1`,
            [payload.bed_id],
            'reservations.bed.reserve',
            client
          );

          await queryWithTrace('COMMIT', [], 'reservations.tx.commit', client);

          return {
            reservation: reservationRes.rows[0],
            lead,
            amount: Number(bed.price ?? 0),
            currency: 'INR',
            room_type: bed.room_type,
            property_id: bed.property_id
          };
        } catch (error) {
          await queryWithTrace('ROLLBACK', [], 'reservations.tx.rollback', client);
          throw error;
        }
      });
    }

    const { data: bed, error: bedError } = await supabase
      .from('beds')
      .select('id, status, rooms(price, room_type, property_id)')
      .eq('id', payload.bed_id)
      .single();
    if (bedError) throw bedError;
    if (!bed || (bed as any).status !== 'available') {
      const { data: existing } = await supabase
        .from('reservations')
        .select('*')
        .eq('bed_id', payload.bed_id)
        .eq('lead_id', lead.id)
        .eq('status', 'pending')
        .gt('hold_expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existing) {
        return {
          reservation: existing,
          lead,
          amount: Number((bed as any)?.rooms?.price ?? 0),
          currency: 'INR',
          room_type: (bed as any)?.rooms?.room_type,
          property_id: (bed as any)?.rooms?.property_id
        };
      }
      throw new Error('Bed is not available for reservation');
    }

    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .insert([{
        lead_id: lead.id,
        bed_id: payload.bed_id,
        status: 'pending',
        payment_status: 'pending',
        hold_expires_at: holdExpiresAt
      }])
      .select('*')
      .single();
    if (reservationError) throw reservationError;

    await Promise.all([
      supabase.from('soft_locks').insert([{ reservation_id: reservation.id, bed_id: payload.bed_id, expires_at: holdExpiresAt }]),
      supabase.from('beds').update({ status: 'reserved', updated_at: new Date().toISOString() }).eq('id', payload.bed_id)
    ]);

    return {
      reservation,
      lead,
      amount: Number((bed as any).rooms?.price ?? 0),
      currency: 'INR',
      room_type: (bed as any).rooms?.room_type,
      property_id: (bed as any).rooms?.property_id
    };
  }
};
