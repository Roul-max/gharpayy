import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export function useAgentPerformance() {
  return useQuery({
    queryKey: ['agent-performance'],
    queryFn: () => api.analytics.getAgentPerformance(),
  });
}
