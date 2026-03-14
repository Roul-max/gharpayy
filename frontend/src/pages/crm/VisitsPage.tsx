import { useMemo, useState } from 'react';
import { CalendarCheck, CalendarPlus, CheckCircle2, ChevronDown, Clock, Plus, X } from 'lucide-react';
import { useLeads } from '../../hooks/useLeads';
import { useCreateVisit, useProperties, useUpdateVisitOutcome, useVisits } from '../../hooks/useOperations';
import DataTable from '../../components/crm/DataTable';
import KpiCard from '../../components/crm/KpiCard';

const OUTCOMES = [
  { value: 'pending', label: 'Pending' },
  { value: 'booked', label: 'Booked' },
  { value: 'considering', label: 'Considering' },
  { value: 'not_interested', label: 'Not Interested' }
];

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

export default function VisitsPage() {
  const { data: visitsData, isLoading } = useVisits();
  const { data: leads = [] } = useLeads();
  const { data: propertiesData } = useProperties();
  const createVisit = useCreateVisit();
  const updateOutcome = useUpdateVisitOutcome();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ leadId: '', propertyId: '', scheduledAt: '' });

  const visits = visitsData?.data ?? [];
  const properties = propertiesData?.data ?? [];

  const sortedVisits = useMemo(() => {
    return [...visits].sort((a: any, b: any) => +new Date(b.scheduled_at) - +new Date(a.scheduled_at));
  }, [visits]);

  const stats = useMemo(() => {
    const now = Date.now();
    let upcoming = 0;
    let booked = 0;
    let pending = 0;
    visits.forEach((visit: any) => {
      const status = visit.visit_status ?? visit.outcome ?? 'pending';
      if (status === 'booked') booked += 1;
      if (status === 'pending') pending += 1;
      if (new Date(visit.scheduled_at).getTime() >= now) upcoming += 1;
    });
    return { total: visits.length, upcoming, booked, pending };
  }, [visits]);

  return (
    <div className="page-shell">
      <div className="page-card">
        <div className="page-header">
          <div>
            <p className="page-header__eyebrow">Visits</p>
            <h1 className="page-header__title mt-2">Visit Management</h1>
            <p className="page-header__subtitle">Track scheduled visits and update outcomes quickly.</p>
          </div>
          <div className="page-actions">
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <Plus className="h-4 w-4" />
              Schedule Visit
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Total Visits" value={stats.total} icon={<CalendarCheck className="h-5 w-5" />} tone="bg-cyan-400/15 text-cyan-200" hint="Live" />
        <KpiCard title="Upcoming" value={stats.upcoming} icon={<Clock className="h-5 w-5" />} tone="bg-sky-400/15 text-sky-200" hint="Live" />
        <KpiCard title="Booked" value={stats.booked} icon={<CheckCircle2 className="h-5 w-5" />} tone="bg-emerald-400/15 text-emerald-200" hint="Live" />
        <KpiCard title="Pending" value={stats.pending} icon={<CalendarPlus className="h-5 w-5" />} tone="bg-amber-400/15 text-amber-200" hint="Live" />
      </div>

      <DataTable
        columns={[
          { key: 'lead', label: 'Lead', className: 'font-semibold text-white', render: (visit: any) => visit.leads?.name ?? visit.lead_id },
          { key: 'property', label: 'Property', render: (visit: any) => visit.properties?.name ?? visit.property_id },
          { key: 'agent', label: 'Agent', render: (visit: any) => visit.assigned_agent ?? 'Unassigned' },
          { key: 'date', label: 'Scheduled Date', render: (visit: any) => formatDate(visit.scheduled_at) },
          {
            key: 'outcome',
            label: 'Visit Outcome',
            render: (visit: any) => (
              <div className="relative inline-flex items-center">
                <select
                  className="select-modern pr-8"
                  value={visit.visit_status ?? visit.outcome ?? 'pending'}
                  onChange={(event) =>
                    updateOutcome.mutate({
                      id: visit.id,
                      payload: { outcome: event.target.value }
                    })
                  }
                >
                  {OUTCOMES.map((outcome) => (
                    <option key={outcome.value} value={outcome.value}>
                      {outcome.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-400" />
              </div>
            )
          }
        ]}
        data={sortedVisits}
        isLoading={isLoading}
        emptyState="No visits scheduled yet."
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="modal-surface w-full max-w-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarPlus className="h-5 w-5 text-cyan-200" />
                <h2 className="text-xl font-bold text-white">Schedule Visit</h2>
              </div>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form
              className="mt-4 space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                createVisit.mutate({
                  lead_id: form.leadId,
                  property_id: form.propertyId,
                  scheduled_at: form.scheduledAt
                });
                setShowModal(false);
                setForm({ leadId: '', propertyId: '', scheduledAt: '' });
              }}
            >
              <select
                className="select-modern"
                value={form.leadId}
                onChange={(event) => setForm((prev) => ({ ...prev, leadId: event.target.value }))}
                required
              >
                <option value="">Select lead</option>
                {(leads as any[]).map((lead) => (
                  <option key={lead.id} value={lead.id}>{lead.name}</option>
                ))}
              </select>
              <select
                className="select-modern"
                value={form.propertyId}
                onChange={(event) => setForm((prev) => ({ ...prev, propertyId: event.target.value }))}
                required
              >
                <option value="">Select property</option>
                {(properties as any[]).map((property) => (
                  <option key={property.id} value={property.id}>{property.name}</option>
                ))}
              </select>
              <input
                className="input-modern"
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(event) => setForm((prev) => ({ ...prev, scheduledAt: event.target.value }))}
                required
              />
              <div className="flex justify-end gap-2">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={createVisit.isPending}>
                  {createVisit.isPending ? 'Scheduling...' : 'Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
