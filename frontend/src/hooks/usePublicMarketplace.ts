import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export function usePublicProperties(filters: Record<string, string>) {
  return useInfiniteQuery({
    queryKey: ['public-properties', filters],
    queryFn: ({ pageParam }) => api.public.listProperties({ ...filters, cursor: pageParam }),
    initialPageParam: '',
    getNextPageParam: (lastPage) => lastPage?.nextCursor ?? null,
  });
}

export function usePublicProperty(id?: string) {
  return useQuery({
    queryKey: ['public-property', id],
    queryFn: () => api.public.getProperty(id!),
    enabled: !!id,
  });
}

export function usePublicStats() {
  return useQuery({
    queryKey: ['public-stats'],
    queryFn: () => api.public.getStats(),
  });
}
