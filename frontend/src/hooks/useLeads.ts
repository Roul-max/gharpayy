import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Lead } from '../pages/crm/Leads';
import { useRealtimeSubscription } from './useRealtime';

export function useLeads() {
  useRealtimeSubscription({ table: 'leads', queryKeys: [['leads']] });
  return useQuery({
    queryKey: ['leads'],
    queryFn: () => api.leads.getAll(),
  });
}

export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: () => api.leads.getAgents(),
  });
}

export function useLeadActivities(leadId?: string) {
  return useQuery({
    queryKey: ['activities', leadId],
    queryFn: () => api.leads.getActivities(leadId!),
    enabled: !!leadId,
  });
}

export function useLeadMatches(leadId?: string) {
  return useQuery({
    queryKey: ['matches', leadId],
    queryFn: () => api.matching.getMatches(leadId!),
    enabled: !!leadId,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (lead: Partial<Lead> & { force?: boolean }) => {
      try {
        return await api.leads.create(lead);
      } catch (error: any) {
        if (error.isDuplicate) {
          throw { isDuplicate: true, existingLead: error.existingLead, newLeadData: lead };
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (lead: Partial<Lead>) => api.leads.update(lead.id!, lead),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.leads.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useMergeLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Lead> }) => api.leads.merge(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useImportLeads() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (leads: Partial<Lead>[]) => api.leads.bulkImport(leads),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}
