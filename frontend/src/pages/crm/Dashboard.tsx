import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BedDouble, CalendarCheck, Percent, Users } from 'lucide-react';
import { useLeads } from '../../hooks/useLeads';
import { useBookings, useVisits } from '../../hooks/useOperations';
import { SkeletonCard } from '../../components/SkeletonLoaders';
import KpiCard from '../../components/crm/KpiCard';
import DataTable from '../../components/crm/DataTable';
import { getLeadDisplayName } from '../../utils/leadDisplay';

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

export default function DashboardPage() {
  const { data: leads = [], isLoading: loadingLeads } = useLeads();
  const { data: visitsData, isLoading: loadingVisits } = useVisits({ pageSize: 50 });
  const { data: bookingsData, isLoading: loadingBookings } = useBookings({ pageSize: 50 });

  const visits = visitsData?.data ?? [];
  const bookings = bookingsData?.data ?? [];

  const leadNameMap = useMemo(() => {
    const map = new Map<string, string>();
    (leads as any[]).forEach((lead) => map.set(lead.id, getLeadDisplayName(lead)));
    return map;
  }, [leads]);

  const conversionRate = leads.length ? ((bookings.length / leads.length) * 100).toFixed(1) : '0.0';

  const recentLeads = useMemo(() => {
    return [...leads]
      .sort((a: any, b: any) => +new Date(b.created_at) - +new Date(a.created_at))
      .slice(0, 6);
  }, [leads]);

  const upcomingVisits = useMemo(() => {
    const now = Date.now();
    return [...visits]
      .filter((visit: any) => new Date(visit.scheduled_at).getTime() >= now)
      .sort((a: any, b: any) => +new Date(a.scheduled_at) - +new Date(b.scheduled_at))
      .slice(0, 5);
  }, [visits]);

  const recentBookings = useMemo(() => {
    return [...bookings]
      .sort((a: any, b: any) => +new Date(b.created_at ?? b.move_in_date) - +new Date(a.created_at ?? a.move_in_date))
      .slice(0, 5);
  }, [bookings]);

  const isLoading = loadingLeads || loadingVisits || loadingBookings;

  return (
    <div className="page-shell">
      <div className="page-card">
        <div className="page-header">
          <div>
            <p className="page-header__eyebrow">CRM Overview</p>
            <h1 className="page-header__title mt-2">Dashboard</h1>
            <p className="page-header__subtitle">Track performance, conversions, and immediate next steps.</p>
          </div>
          <div className="page-actions">
            <Link to="/crm/leads" className="btn-secondary">Open Leads</Link>
            <Link to="/crm/pipeline" className="btn-secondary">Pipeline</Link>
            <Link to="/crm/visits" className="btn-primary">
              Schedule Visit <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <KpiCard
              title="Total Leads"
              value={leads.length}
              icon={<Users className="h-5 w-5" />}
              tone="bg-cyan-400/15 text-cyan-200"
              hint="Live"
            />
            <KpiCard
              title="Visits Scheduled"
              value={visits.length}
              icon={<CalendarCheck className="h-5 w-5" />}
              tone="bg-amber-400/15 text-amber-200"
              hint="Live"
            />
            <KpiCard
              title="Bookings Confirmed"
              value={bookings.length}
              icon={<BedDouble className="h-5 w-5" />}
              tone="bg-emerald-400/15 text-emerald-200"
              hint="Live"
            />
            <KpiCard
              title="Conversion Rate"
              value={`${conversionRate}%`}
              icon={<Percent className="h-5 w-5" />}
              tone="bg-violet-400/15 text-violet-200"
              hint="Live"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Recent Leads</h2>
            <Link to="/crm/leads" className="text-sm text-cyan-300">View all</Link>
          </div>
          <DataTable
            columns={[
              {
                key: 'name',
                label: 'Name',
                className: 'font-semibold text-white',
                render: (lead: any) => getLeadDisplayName(lead)
              },
              { key: 'source', label: 'Source' },
              {
                key: 'status',
                label: 'Status',
                render: (lead: any) => (
                  <span className="badge">
                    {String(lead.status ?? 'new').replace('_', ' ')}
                  </span>
                )
              },
              { key: 'created_at', label: 'Created', render: (lead: any) => formatDate(lead.created_at) }
            ]}
            data={recentLeads}
            isLoading={isLoading}
            emptyState="No leads created yet."
          />
        </div>

        <div className="space-y-6">
          <div className="card-surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Upcoming Visits</h2>
              <Link to="/crm/visits" className="text-sm text-cyan-300">Open</Link>
            </div>
            <div className="mt-4 space-y-3">
              {isLoading ? (
                [...Array(3)].map((_, idx) => (
                  <div key={idx} className="h-14 rounded-xl bg-white/5 animate-pulse" />
                ))
              ) : upcomingVisits.length === 0 ? (
                <p className="text-sm text-slate-400">No upcoming visits scheduled.</p>
              ) : (
                upcomingVisits.map((visit: any) => (
                  <div key={visit.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-sm font-semibold text-white">
                      {visit.leads ? getLeadDisplayName(visit.leads) : leadNameMap.get(visit.lead_id) ?? 'Unknown lead'}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">{visit.properties?.name ?? visit.property_id ?? 'Property TBD'}</p>
                    <p className="mt-2 text-xs text-cyan-300">{formatDate(visit.scheduled_at)}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card-surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Recent Bookings</h2>
              <Link to="/crm/bookings" className="text-sm text-cyan-300">Review</Link>
            </div>
            <div className="mt-4 space-y-3">
              {isLoading ? (
                [...Array(3)].map((_, idx) => (
                  <div key={idx} className="h-12 rounded-xl bg-white/5 animate-pulse" />
                ))
              ) : recentBookings.length === 0 ? (
                <p className="text-sm text-slate-400">No bookings recorded.</p>
              ) : (
                recentBookings.map((booking: any) => (
                  <div key={booking.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {booking.leads ? getLeadDisplayName(booking.leads) : leadNameMap.get(booking.lead_id) ?? 'Unknown lead'}
                      </p>
                      <p className="text-xs text-slate-400">{booking.properties?.name ?? booking.property_id ?? 'Property TBD'}</p>
                    </div>
                    <span className="badge badge--success">
                      {booking.status ?? 'confirmed'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



