import { supabase } from '../config/supabase.js';
import { logger } from '../observability/logger.js';

export async function runInventoryHealthJob() {
  logger.info('Running inventory health job');
  
  try {
    // Find rooms that haven't been confirmed in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // We need to check the latest confirmation for each room
    // A simpler approach: get all rooms, then check their latest log
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id, property_id, properties(owner_id)');
      
    if (roomsError || !rooms) {
      throw new Error('Failed to fetch rooms');
    }

    for (const room of rooms) {
      const ownerId = (room.properties as any)?.owner_id;
      if (!ownerId) continue;

      const { data: owner } = await supabase
        .from('owners')
        .select('user_id')
        .eq('id', ownerId)
        .maybeSingle();

      const { data: latestLog, error: logError } = await supabase
        .from('room_status_log')
        .select('confirmed_at')
        .eq('room_id', room.id)
        .order('confirmed_at', { ascending: false })
        .limit(1)
        .single();

      let needsConfirmation = false;

      if (!latestLog || logError) {
        // Never confirmed
        needsConfirmation = true;
      } else {
        const lastConfirmed = new Date(latestLog.confirmed_at);
        if (lastConfirmed < sevenDaysAgo) {
          needsConfirmation = true;
        }
      }

      if (needsConfirmation) {
        if (owner?.user_id) {
          await supabase.from('notifications').insert([
            {
              user_id: owner.user_id,
              title: 'Room status confirmation needed',
              body: `Room ${room.id} requires a fresh availability confirmation.`,
              type: 'inventory',
              entity_type: 'room',
              entity_id: room.id
            }
          ]);
        }
        logger.info('Owner inventory confirmation reminder sent', { owner_id: ownerId, room_id: room.id });
      }
    }
    
    logger.info('Inventory health job completed');
  } catch (error) {
    logger.error('Error running inventory health job', { error: (error as Error).message });
    throw error;
  }
}
