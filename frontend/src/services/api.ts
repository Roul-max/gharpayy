import type {
  Lead,
  Paginated,
  Owner,
  Property,
  Visit,
  Booking,
  FollowUp,
  Notification,
  PublicCaptureRequest,
  PublicVisitRequest,
  PublicChatRequest
} from '@shared/types/api';

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication required');
  }
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${url}`, { ...options, headers });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 409) {
      throw { isDuplicate: true, existingLead: errorData.existing_lead, message: errorData.message || errorData.error };
    }
    throw new Error(errorData.message || errorData.error || 'API request failed');
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  auth: {
    login: (data: { email: string; password: string }) =>
      fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(async (res) => {
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(payload.error || payload.message || 'Login failed');
        }
        return payload;
      }),
    resetPassword: (email: string) =>
      fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      }).then(async (res) => {
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(payload.error || payload.message || 'Reset request failed');
        }
        return payload;
      }),
    logout: () => fetchWithAuth('/auth/logout', { method: 'POST' }),
    me: () => fetchWithAuth('/auth/me'),
  },
  leads: {
    getAll: (): Promise<Lead[]> => fetchWithAuth('/leads'),
    getById: (id: string): Promise<Lead> => fetchWithAuth(`/leads/${id}`),
    create: (data: Partial<Lead>): Promise<Lead> => fetchWithAuth('/leads', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Lead>): Promise<Lead> => fetchWithAuth(`/leads/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string): Promise<void> => fetchWithAuth(`/leads/${id}`, { method: 'DELETE' }),
    merge: (id: string, data: Partial<Lead>): Promise<Lead> => fetchWithAuth(`/leads/${id}/merge`, { method: 'POST', body: JSON.stringify(data) }),
    bulkImport: (leads: Partial<Lead>[]): Promise<{ inserted: number }> =>
      fetchWithAuth('/leads/bulk', { method: 'POST', body: JSON.stringify({ leads }) }),
    getActivities: (id: string): Promise<any[]> => fetchWithAuth(`/leads/${id}/activities`),
    getAgents: (): Promise<any[]> => fetchWithAuth('/leads/meta/agents'),
  },
  matching: {
    getMatches: (leadId: string) => fetchWithAuth(`/matching/lead/${leadId}`),
  },
  analytics: {
    getAgentPerformance: () => fetchWithAuth('/analytics/agent-performance'),
  },
  messages: {
    getByLead: (leadId: string) => fetchWithAuth(`/messages/lead/${leadId}`),
    send: (leadId: string, message: string, channel: string) => fetchWithAuth(`/messages/lead/${leadId}`, {
      method: 'POST',
      body: JSON.stringify({ message, channel }),
    }),
  },
  settings: {
    getSettings: () => fetchWithAuth('/settings'),
    updateSettings: (data: {
      auto_assign: boolean;
      visit_reminders: boolean;
      daily_digest: boolean;
      desktop_notifications: boolean;
      compact_sidebar: boolean;
      timezone: string;
      language: string;
      crm_landing_page: string;
    }) =>
      fetchWithAuth('/settings', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    getProfile: () => fetchWithAuth('/settings/profile'),
    updateProfile: (data: { full_name: string; avatar_url: string | null }) =>
      fetchWithAuth('/settings/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },
  operations: {
    visits: {
      list: (params: Record<string, string | number> = {}): Promise<Paginated<Visit>> => {
        const query = new URLSearchParams(params as Record<string, string>).toString();
        return fetchWithAuth(`/visits${query ? `?${query}` : ''}`);
      },
      create: (data: Partial<Visit>): Promise<Visit> => fetchWithAuth('/visits', { method: 'POST', body: JSON.stringify(data) }),
      updateOutcome: (id: string, data: Partial<Visit>): Promise<Visit> =>
        fetchWithAuth(`/visits/${id}/outcome`, { method: 'PATCH', body: JSON.stringify(data) }),
    },
    bookings: {
      list: (params: Record<string, string | number> = {}): Promise<Paginated<Booking>> => {
        const query = new URLSearchParams(params as Record<string, string>).toString();
        return fetchWithAuth(`/bookings${query ? `?${query}` : ''}`);
      },
    },
    properties: {
      list: (params: Record<string, string | number> = {}): Promise<Paginated<Property>> => {
        const query = new URLSearchParams(params as Record<string, string>).toString();
        return fetchWithAuth(`/properties${query ? `?${query}` : ''}`);
      },
      create: (data: Partial<Property>): Promise<Property> => fetchWithAuth('/properties', { method: 'POST', body: JSON.stringify(data) }),
      updatePhotos: (id: string, photos: string[]): Promise<Property> =>
        fetchWithAuth(`/properties/${id}/photos`, { method: 'PATCH', body: JSON.stringify({ photos }) }),
    },
    rooms: {
      create: (data: any): Promise<any> => fetchWithAuth('/rooms', { method: 'POST', body: JSON.stringify(data) }),
      addBeds: (id: string, data: any): Promise<any> => fetchWithAuth(`/rooms/${id}/beds`, { method: 'POST', body: JSON.stringify(data) }),
      confirmStatus: (data: any): Promise<any> => fetchWithAuth('/room-status', { method: 'POST', body: JSON.stringify(data) }),
    },
    inventory: {
      list: (params: Record<string, string | number> = {}): Promise<any[]> => {
        const query = new URLSearchParams(params as Record<string, string>).toString();
        return fetchWithAuth(`/inventory${query ? `?${query}` : ''}`);
      },
    },
    owners: {
      list: (params: Record<string, string | number> = {}): Promise<Paginated<Owner>> => {
        const query = new URLSearchParams(params as Record<string, string>).toString();
        return fetchWithAuth(`/owners${query ? `?${query}` : ''}`);
      },
      create: (data: Partial<Owner>): Promise<Owner> => fetchWithAuth('/owners', { method: 'POST', body: JSON.stringify(data) }),
    },
    effort: {
      get: (propertyId?: string) => fetchWithAuth(`/effort${propertyId ? `?propertyId=${propertyId}` : ''}`),
    },
    zones: {
      list: () => fetchWithAuth('/zones'),
      create: (data: any) => fetchWithAuth('/zones', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: string, data: any) => fetchWithAuth(`/zones/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    },
    followUps: {
      list: (params: Record<string, string | number> = {}): Promise<Paginated<FollowUp>> => {
        const query = new URLSearchParams(params as Record<string, string>).toString();
        return fetchWithAuth(`/follow-ups${query ? `?${query}` : ''}`);
      },
      create: (data: Partial<FollowUp>): Promise<FollowUp> => fetchWithAuth('/follow-ups', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: string, data: Partial<FollowUp>): Promise<FollowUp> =>
        fetchWithAuth(`/follow-ups/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    },
    notifications: {
      list: (): Promise<{ data: Notification[]; unreadCount: number }> => fetchWithAuth('/notifications'),
      markRead: (id: string): Promise<Notification> => fetchWithAuth(`/notifications/${id}/read`, { method: 'PATCH' }),
    },
    ownerAlerts: {
      get: () => fetchWithAuth('/owner-alerts'),
    },
    automation: {
      run: (job: 'soft-locks' | 'lead-scores' | 'follow-ups' | 'inventory-health' | 'notification-fanout' | 'analytics-rollups' | 'all') =>
        fetchWithAuth('/automation/run', { method: 'POST', body: JSON.stringify({ job }) }),
    },
  },
  public: {
    listProperties: (params: Record<string, string> = {}) => {
      const query = new URLSearchParams(params).toString();
      return fetch(`${API_URL}/public/properties${query ? `?${query}` : ''}`).then(async (res) => {
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload.message || payload.error || 'Unable to load properties');
        return payload;
      });
    },
    getProperty: (id: string) => fetch(`${API_URL}/public/properties/${id}`).then(async (res) => {
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.message || payload.error || 'Unable to load property');
      return payload;
    }),
    getStats: () => fetch(`${API_URL}/public/stats`).then(async (res) => {
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.message || payload.error || 'Unable to load stats');
      return payload;
    }),
    captureLead: (data: PublicCaptureRequest) => fetch(`${API_URL}/public/capture`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(async (res) => {
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.message || payload.error || 'Unable to submit lead');
      return payload;
    }),
    requestVisit: (data: PublicVisitRequest) => fetch(`${API_URL}/public/visit-request`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(async (res) => {
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.message || payload.error || 'Unable to request visit');
      return payload;
    }),
    chat: (data: PublicChatRequest) => fetch(`${API_URL}/public/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(async (res) => {
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.message || payload.error || 'Unable to send chat');
      return payload;
    }),
    createReservation: (data: { name: string; phone: string; email?: string; bed_id: string; property_id?: string; captchaToken?: string }) =>
      fetch(`${API_URL}/public/reservations`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(async (res) => {
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          const details = Array.isArray(payload?.errors) ? payload.errors.map((err: any) => err?.message).filter(Boolean).join(', ') : '';
          throw new Error(payload.message || payload.error || details || 'Unable to create reservation');
        }
        return payload;
      }),
    createPaymentIntent: (data: { reservation_id: string; amount: number; currency: string }) =>
      fetch(`${API_URL}/payments/public-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservation_id: data.reservation_id, provider: 'razorpay', amount: data.amount, currency: data.currency })
      }).then(async (res) => {
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload.message || payload.error || 'Unable to create payment intent');
        return payload;
      }),
    confirmPayment: (data: { reservation_id: string; order_id: string; payment_id: string; signature: string }) =>
      fetch(`${API_URL}/payments/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'razorpay', ...data })
      }).then(async (res) => {
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload.message || payload.error || 'Payment confirmation failed');
        return payload;
      }),
    assistant: (data: { message: string; property_id?: string; page?: string }) =>
      fetch(`${API_URL}/public/assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(async (res) => {
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(payload.error || payload.message || 'Assistant request failed');
        }
        return payload;
      }),
  }
};

export const storageApi = {
  signedUpload: (data: { bucket: 'property-images' | 'owner-documents' | 'user-avatars'; folder: string; filename: string; contentType: string; expiresIn?: number }) =>
    fetchWithAuth('/storage/signed-upload', { method: 'POST', body: JSON.stringify(data) })
};
