import { useEffect } from 'react';
import { notifyManager, useQueryClient } from '@tanstack/react-query';
import { supabaseClient } from '../services/supabase';

type RealtimeConfig = {
  table: string;
  schema?: string;
  queryKeys: Array<string | unknown[]>;
  onChange?: () => void;
};

let realtimeDisabled = false;

export function useRealtimeSubscription(config: RealtimeConfig) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!supabaseClient || realtimeDisabled) return;

    const channel = supabaseClient
      .channel(`realtime:${config.table}`)
      .on(
        'postgres_changes',
        { event: '*', schema: config.schema ?? 'public', table: config.table },
        () => {
          notifyManager.batch(() => {
            config.queryKeys.forEach((key) => {
              const queryKey = Array.isArray(key) ? key : [key];
              queryClient.invalidateQueries({ queryKey });
            });
          });
          config.onChange?.();
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          realtimeDisabled = true;
          supabaseClient.removeChannel(channel);
        }
      });

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [config.table, config.schema, JSON.stringify(config.queryKeys), queryClient]);
}
