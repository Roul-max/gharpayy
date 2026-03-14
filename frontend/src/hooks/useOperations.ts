import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useRealtimeSubscription } from './useRealtime';

export function useVisits(params: Record<string, string | number> = {}) {
  useRealtimeSubscription({ table: 'visits', queryKeys: [['visits', params]] });
  return useQuery({
    queryKey: ['visits', params],
    queryFn: () => api.operations.visits.list(params),
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });
}

export function useBookings(params: Record<string, string | number> = {}) {
  useRealtimeSubscription({ table: 'bookings', queryKeys: [['bookings', params]] });
  return useQuery({
    queryKey: ['bookings', params],
    queryFn: () => api.operations.bookings.list(params),
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });
}

export function useProperties(params: Record<string, string | number> = {}) {
  return useQuery({
    queryKey: ['properties', params],
    queryFn: () => api.operations.properties.list(params),
  });
}

export function useInventory(params: Record<string, string | number> = {}) {
  return useQuery({
    queryKey: ['inventory', params],
    queryFn: () => api.operations.inventory.list(params),
  });
}

export function useOwners(params: Record<string, string | number> = {}) {
  return useQuery({
    queryKey: ['owners', params],
    queryFn: () => api.operations.owners.list(params),
  });
}

export function useEffortDashboard(propertyId?: string) {
  return useQuery({
    queryKey: ['effort', propertyId],
    queryFn: () => api.operations.effort.get(propertyId),
  });
}

export function useCreateVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => api.operations.visits.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
    }
  });
}

export function useUpdateVisitOutcome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => api.operations.visits.updateOutcome(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    }
  });
}

export function useCreateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => api.operations.properties.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    }
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => api.operations.rooms.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    }
  });
}

export function useAddBedsToRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => api.operations.rooms.addBeds(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    }
  });
}

export function useConfirmRoomStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => api.operations.rooms.confirmStatus(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    }
  });
}

export function useCreateOwner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => api.operations.owners.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owners'] });
    }
  });
}

export function useZones() {
  return useQuery({
    queryKey: ['zones'],
    queryFn: async () => {
      const response: any = await api.operations.zones.list();
      return Array.isArray(response) ? response : response?.data ?? [];
    },
  });
}

export function useCreateZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => api.operations.zones.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones'] });
    }
  });
}

export function useUpdateZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => api.operations.zones.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones'] });
    }
  });
}

export function useFollowUps(params: Record<string, string | number> = {}) {
  return useQuery({
    queryKey: ['follow-ups', params],
    queryFn: () => api.operations.followUps.list(params),
  });
}

export function useCreateFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => api.operations.followUps.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-ups'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
}

export function useUpdateFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => api.operations.followUps.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-ups'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
}

export function useNotifications() {
  useRealtimeSubscription({ table: 'notifications', queryKeys: [['notifications']] });
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.operations.notifications.list(),
    refetchInterval: 30000,
  });
}

export function useOwnerAlerts() {
  return useQuery({
    queryKey: ['owner-alerts'],
    queryFn: () => api.operations.ownerAlerts.get(),
    refetchInterval: 60000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.operations.notifications.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
}

export function useRunAutomation() {
  return useMutation({
    mutationFn: (job: 'soft-locks' | 'lead-scores' | 'follow-ups' | 'inventory-health' | 'notification-fanout' | 'analytics-rollups' | 'all') =>
      api.operations.automation.run(job),
  });
}
