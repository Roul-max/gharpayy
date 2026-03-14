import { supabase } from '../config/supabase.js';
import { logger } from '../observability/logger.js';
import { cacheDelete, cacheDeleteByPrefix } from '../cache/cache.js';

export async function runSoftLockCleanupJob() {
  logger.info('Running soft lock cleanup job');
  try {
    const now = new Date().toISOString();
    
    // Find expired soft locks
    const { data: expiredLocks, error: fetchError } = await supabase
      .from('soft_locks')
      .select('id, bed_id')
      .lt('expires_at', now);

    if (fetchError) throw fetchError;

    if (expiredLocks && expiredLocks.length > 0) {
      const lockIds = expiredLocks.map(l => l.id);
      const bedIds = expiredLocks.map(l => l.bed_id);

      // Delete expired locks
      const { error: deleteError } = await supabase
        .from('soft_locks')
        .delete()
        .in('id', lockIds);
      
      if (deleteError) throw deleteError;

      const { data: activeLocks } = await supabase
        .from('soft_locks')
        .select('bed_id')
        .in('bed_id', bedIds)
        .gte('expires_at', now);

      const activelyLockedBedIds = new Set((activeLocks ?? []).map((row: any) => row.bed_id));
      const releasableBedIds = bedIds.filter((bedId) => !activelyLockedBedIds.has(bedId));

      const updateError = releasableBedIds.length === 0
        ? null
        : (await supabase
          .from('beds')
          .update({ status: 'available' })
          .in('id', releasableBedIds)
          .eq('status', 'reserved')).error;

      if (updateError) throw updateError;

      if (releasableBedIds.length > 0) {
        await Promise.all([
          cacheDeleteByPrefix('public:properties:'),
          cacheDeleteByPrefix('public:property:'),
          cacheDelete('public:stats')
        ]);
      }
      
      logger.info('Soft lock cleanup completed', { expired_locks: expiredLocks.length, released_beds: releasableBedIds.length });
    } else {
      logger.info('No expired soft locks found');
    }
  } catch (error) {
    logger.error('Error running soft lock cleanup job', { error: (error as Error).message });
    throw error;
  }
}
