import { supabase } from '../config/supabase.js';
import { hasDatabasePool, queryWithTrace } from '../config/db.js';

export async function matchBedsForLead(leadId: string) {
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (leadError || !lead) {
    throw new Error('Lead not found');
  }

  if (hasDatabasePool()) {
    const budgetMin = lead.budget ? Math.max(0, Number(lead.budget) - 3000) : null;
    const budgetMax = lead.budget ? Number(lead.budget) + 3000 : null;

    const sql = `
      SELECT
        p.name AS property_name,
        p.area,
        r.id AS room_id,
        r.room_type,
        b.id AS bed_id,
        r.price,
        (
          CASE WHEN $2::text IS NOT NULL AND lower(p.city) = lower($2::text) THEN 40 ELSE 0 END +
          CASE WHEN $3::text IS NOT NULL AND lower(p.area) = lower($3::text) THEN 20 ELSE 0 END +
          CASE WHEN $4::text IS NULL OR $4::text = 'any' THEN 5
               WHEN p.gender_allowed = 'any' OR p.gender_allowed = $4::text THEN 10
               ELSE -20 END +
          CASE WHEN $5::text IS NOT NULL AND lower(r.room_type) = lower($5::text) THEN 10 ELSE 0 END +
          CASE WHEN $6::numeric IS NULL OR r.price IS NULL THEN 0
               WHEN r.price BETWEEN $6::numeric AND $7::numeric THEN 15
               WHEN r.price <= $7::numeric THEN 6
               ELSE -10 END +
          5
        )::int AS match_score
      FROM properties p
      INNER JOIN rooms r ON r.property_id = p.id
      INNER JOIN beds b ON b.room_id = r.id
      WHERE b.status = 'available'
        AND ($2::text IS NULL OR p.city ILIKE '%' || $2::text || '%')
        AND ($3::text IS NULL OR p.area ILIKE '%' || $3::text || '%')
        AND ($4::text IS NULL OR $4::text = 'any' OR p.gender_allowed IN ('any', $4::text))
        AND ($6::numeric IS NULL OR r.price <= $7::numeric + 2000)
      ORDER BY match_score DESC, p.updated_at DESC NULLS LAST, p.created_at DESC
      LIMIT 20
    `;

    const { rows } = await queryWithTrace<any>(
      sql,
      [
        lead.id,
        lead.city ?? null,
        lead.area ?? null,
        lead.gender ?? null,
        lead.sharing_type ?? null,
        budgetMin,
        budgetMax
      ],
      'matching.top_beds'
    );

    return rows.map((row: any) => ({
      property_name: row.property_name,
      room_id: row.room_id,
      room_type: row.room_type,
      bed_id: row.bed_id,
      match_score: row.match_score,
      price: row.price ? Number(row.price) : null,
      area: row.area
    }));
  }

  // Fallback for environments without DATABASE_URL.
  let propertyQuery = supabase
    .from('properties')
    .select('id, name, city, area, gender_allowed, rooms(id, room_type, bed_count, price, beds(id, status))')
    .limit(120);
  if (lead.city) propertyQuery = propertyQuery.ilike('city', `%${lead.city}%`);
  if (lead.area) propertyQuery = propertyQuery.ilike('area', `%${lead.area}%`);
  if (lead.gender && lead.gender !== 'any') propertyQuery = propertyQuery.in('gender_allowed', ['any', lead.gender]);

  const { data: properties, error: propError } = await propertyQuery;
  if (propError || !properties) throw new Error('Failed to fetch properties');

  const matches: any[] = [];
  for (const property of properties) {
    for (const room of property.rooms || []) {
      for (const bed of room.beds || []) {
        if (bed.status !== 'available') continue;
        matches.push({
          property_name: property.name,
          room_id: room.id,
          room_type: room.room_type,
          bed_id: bed.id,
          match_score: 50,
          price: Number((room as any).price ?? 0) || null,
          area: property.area
        });
      }
    }
  }
  return matches.slice(0, 20);
}
