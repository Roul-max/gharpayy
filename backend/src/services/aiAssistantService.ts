import { supabase } from '../config/supabase.js';
import { logger } from '../observability/logger.js';
import OpenAI from 'openai';
import { operationsService } from './operationsService.js';

type AssistantPayload = {
  message: string;
  property_id?: string;
  page?: string;
};

function fallbackReply(message: string, propertyName?: string) {
  const lower = message.toLowerCase();

  if (lower.includes('visit')) {
    return 'You can schedule a visit directly from the property page. Share your preferred date and contact details, and the team can follow up quickly.';
  }

  if (lower.includes('price') || lower.includes('rent') || lower.includes('budget')) {
    return propertyName
      ? `${propertyName} shows room-level pricing on the listing page. If you share your budget, I can help you narrow down the right options.`
      : 'You can compare room-level pricing on each listing. If you share your budget and preferred area, I can help you shortlist options.';
  }

  if (lower.includes('book') || lower.includes('reserve')) {
    return 'To reserve, select a room and continue to the lead capture/reservation step. The system can hold availability briefly while your request is processed.';
  }

  if (lower.includes('area') || lower.includes('location') || lower.includes('near')) {
    return propertyName
      ? `${propertyName} includes location details and map context on the page. If you tell me your preferred commute or landmark, I can guide you better.`
      : 'Tell me your preferred area, office, college, or commute requirement, and I can guide you toward the right property options.';
  }

  return 'I can help with pricing, visit scheduling, booking steps, room availability, and shortlist guidance. Tell me your budget, area, gender preference, and move-in timeline.';
}

async function getPropertyContext(propertyId?: string) {
  if (!propertyId) return null;

  const { data, error } = await supabase
    .from('properties')
    .select('id, name, city, area, gender_allowed, amenities, rooms(room_type, bed_count, beds(status))')
    .eq('id', propertyId)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

type LocationIndex = {
  cities: string[];
  areas: string[];
  fetchedAt: number;
};

let locationIndex: LocationIndex | null = null;

async function loadLocationIndex() {
  const now = Date.now();
  if (locationIndex && now - locationIndex.fetchedAt < 10 * 60 * 1000) {
    return locationIndex;
  }

  const { data, error } = await supabase
    .from('properties')
    .select('city, area')
    .limit(500);

  if (error || !data) {
    return locationIndex ?? { cities: [], areas: [], fetchedAt: now };
  }

  const cities = Array.from(new Set(data.map((row: any) => String(row.city ?? '').trim()).filter(Boolean)));
  const areas = Array.from(new Set(data.map((row: any) => String(row.area ?? '').trim()).filter(Boolean)));

  locationIndex = { cities, areas, fetchedAt: now };
  return locationIndex;
}

function extractBudgetBucket(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes('under 10k') || lower.includes('below 10k') || lower.includes('< 10k')) return 'under10k';
  if (lower.includes('10k-15k') || lower.includes('10k to 15k') || lower.includes('10k – 15k')) return '10k-15k';
  if (lower.includes('above 15k') || lower.includes('over 15k') || lower.includes('> 15k')) return 'above15k';

  const match = lower.match(/(\d{2,3})(\s*k)?/i);
  if (!match) return undefined;
  const raw = Number(match[1]);
  const value = match[2] ? raw * 1000 : raw;

  if (value < 10000) return 'under10k';
  if (value <= 15000) return '10k-15k';
  return 'above15k';
}

function extractGender(message: string) {
  const lower = message.toLowerCase();
  if (/(female|women|woman|girl)/.test(lower)) return 'female';
  if (/(male|men|man|boy)/.test(lower)) return 'male';
  return undefined;
}

async function extractLocationFilters(message: string) {
  const index = await loadLocationIndex();
  const lower = message.toLowerCase();
  const tokens = lower.split(/[^a-z0-9]+/).filter((token) => token.length >= 3);

  const cityMatch =
    index.cities.find((city) => lower.includes(city.toLowerCase())) ||
    index.cities.find((city) => tokens.some((token) => city.toLowerCase().includes(token)));
  const areaMatch =
    index.areas.find((area) => lower.includes(area.toLowerCase())) ||
    index.areas.find((area) => tokens.some((token) => area.toLowerCase().includes(token)));

  return {
    city: cityMatch,
    area: areaMatch
  };
}

async function findSuggestedProperties(message: string) {
  const cleaned = message.trim();
  if (!cleaned) return [];
  const tokens = cleaned
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((token) => token.length >= 3)
    .slice(0, 8);

  if (tokens.length === 0) return [];

  const { data, error } = await supabase
    .from('properties')
    .select('id, name, city, area, gender_allowed')
    .or(tokens.map((token) => `city.ilike.%${token}%,area.ilike.%${token}%,name.ilike.%${token}%`).join(','))
    .limit(5);

  if (error || !data) return [];
  return data;
}

export const aiAssistantService = {
  async reply(payload: AssistantPayload) {
    const debugEnabled = process.env.AI_ASSISTANT_DEBUG === 'true';
    const logContent = process.env.AI_ASSISTANT_LOG_CONTENT === 'true';
    const startedAt = Date.now();
    const property = await getPropertyContext(payload.property_id);
    const propertyName = property?.name;
    const gender = extractGender(payload.message);
    const budget = extractBudgetBucket(payload.message);
    const locations = await extractLocationFilters(payload.message);
    let suggested: Array<any> = [];

    try {
      const search = await operationsService.listPublicProperties({
        city: locations.city,
        area: locations.area,
        gender,
        budget,
        pageSize: 5
      });
      suggested = search.data ?? [];
    } catch {
      suggested = await findSuggestedProperties(payload.message);
    }
    const groqKey = process.env.GROQ_API_KEY;
    const model = process.env.GROQ_MODEL || 'llama-3.1-70b-versatile';
    const baseURL = process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1';

    if (debugEnabled) {
      logger.info('AI assistant env check', {
        has_groq_key: Boolean(groqKey),
        using_key: groqKey ? 'GROQ_API_KEY' : 'none',
        key_length: groqKey ? groqKey.length : 0,
        base_url: baseURL,
        node_env: process.env.NODE_ENV ?? 'unknown'
      });
    }

    if (!groqKey) {
      if (debugEnabled) {
        logger.info('AI assistant fallback (missing API key)', {
          property_id: payload.property_id ?? null,
          page: payload.page ?? null,
          message_length: payload.message?.length ?? 0
        });
        if (logContent) {
          logger.info('AI assistant message preview', {
            preview: payload.message?.slice(0, 200) ?? ''
          });
        }
      }
      return {
        answer: fallbackReply(payload.message, propertyName),
        source: 'fallback',
        error_type: 'missing_key'
      };
    }

    try {
      if (debugEnabled) {
        logger.info('AI assistant request start', {
          provider: 'groq',
          model,
          property_id: payload.property_id ?? null,
          page: payload.page ?? null,
          message_length: payload.message?.length ?? 0
        });
        if (logContent) {
          logger.info('AI assistant message preview', {
            preview: payload.message?.slice(0, 200) ?? ''
          });
        }
      }

      const propertyContext = property
        ? `Property context:
- Name: ${property.name}
- City: ${property.city}
- Area: ${property.area}
- Gender Allowed: ${property.gender_allowed}
- Amenities: ${(property.amenities ?? []).join(', ') || 'Not listed'}
`
        : 'No property-specific context provided.';
      const suggestedContext = suggested.length
        ? `Suggested properties from database:
${suggested
  .map((item) => {
    const location = `${item.city ?? 'Unknown city'}, ${item.area ?? 'Unknown area'}`;
    const price = item.starts_from ? ` | starts from ₹${item.starts_from}` : '';
    return `- ${item.name} (${location})${price} [id: ${item.id}]`;
  })
  .join('\n')}`
        : 'No matching properties found in database.';

      const prompt = `You are Gharpayy's website assistant for PG booking support.
Be concise, practical, and sales-assistive.
Do not invent prices, availability, or policies.
If exact data is missing, say so and guide the user to the next step.
Keep replies under 120 words.
If you mention a property, it must be one of the Suggested properties list.
If the Suggested list is empty, ask for city/area, budget, and gender preference.

${propertyContext}

${suggestedContext}

Current page: ${payload.page ?? 'unknown'}
User question: ${payload.message}`;

      const client = new OpenAI({ apiKey: groqKey, baseURL });
      const response = await client.responses.create({
        model,
        input: prompt
      });

      const answer = response.output_text?.trim() || fallbackReply(payload.message, propertyName);

      if (debugEnabled) {
        logger.info('AI assistant response success', {
          provider: 'groq',
          model,
          duration_ms: Date.now() - startedAt,
          answer_length: answer.length,
          used_fallback: !response.output_text
        });
        if (logContent) {
          logger.info('AI assistant prompt preview', {
            preview: prompt.slice(0, 400)
          });
          logger.info('AI assistant answer preview', {
            preview: answer.slice(0, 400)
          });
        }
      }

      return {
        answer,
        source: 'groq'
      };
    } catch (error: any) {
      const rawMessage = error?.message ?? String(error);
      const normalized = rawMessage.toLowerCase();
      const isQuota =
        normalized.includes('quota') ||
        normalized.includes('billing') ||
        normalized.includes('insufficient_quota') ||
        normalized.includes('429');
      if (debugEnabled) {
        logger.error('AI assistant response error', {
          provider: 'groq',
          model,
          duration_ms: Date.now() - startedAt,
          error: rawMessage
        });
      }
      return {
        answer: fallbackReply(payload.message, propertyName),
        source: 'fallback',
        error_type: isQuota ? 'quota' : 'unknown_error'
      };
    }
  }
};
