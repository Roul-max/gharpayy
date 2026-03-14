import { supabase } from '../config/supabase.js';

async function run() {
  const { data: latest, error: fetchError } = await supabase
    .from('leads')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(10);

  if (fetchError) {
    console.error('Failed to fetch latest leads', fetchError);
    process.exit(1);
  }

  const keepIds = (latest ?? []).map((row) => row.id);
  if (keepIds.length === 0) {
    console.log('No leads found; nothing to prune.');
    return;
  }

  const { error: deleteError } = await supabase
    .from('leads')
    .delete()
    .not('id', 'in', `(${keepIds.join(',')})`);

  if (deleteError) {
    console.error('Failed to delete old leads', deleteError);
    process.exit(1);
  }

  console.log(`Kept ${keepIds.length} newest leads; deleted the rest.`);
}

run().catch((err) => {
  console.error('Prune leads failed', err);
  process.exit(1);
});
