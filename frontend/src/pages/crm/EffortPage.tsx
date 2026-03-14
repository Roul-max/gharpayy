import { useMemo } from 'react';
import { useAgentPerformance } from '../../hooks/useAgentPerformance';
import { useLeads } from '../../hooks/useLeads';
import { useBookings, useEffortDashboard, useProperties, useVisits } from '../../hooks/useOperations';
import { Funnel, FunnelChart, LabelList, ResponsiveContainer, Tooltip } from 'recharts';
import { SkeletonTable } from '../../components/SkeletonLoaders';
import ChartCard from '../../components/crm/ChartCard';
import KpiCard from '../../components/crm/KpiCard';

const calcRate = (num: number, den: number) => (den ? ((num / den) * 100).toFixed(1) : '0.0');

export default function EffortPage() {
  const { data: leads = [], isLoading: loadingLeads } = useLeads();
  const { data: visitsData, isLoading: loadingVisits } = useVisits();
  const { data: bookingsData, isLoading: loadingBookings } = useBookings();
  const { data: properties } = useProperties();
  const { data: effortData, isLoading: loadingEffort } = useEffortDashboard();
  const { data: performanceData, isLoading: loadingPerformance } = useAgentPerformance();

  const visits = visitsData?.data ?? [];
  const bookings = bookingsData?.data ?? [];
  const agents = performanceData?.agents ?? [];

  const propertyMetrics = useMemo(() => {
    const list = Array.isArray(effortData) ? effortData : [];
    if (list.length > 0) return list;

    const map = new Map<string, { id: string; name: string; leads: number; visits: number; bookings: number }>();
    (properties?.data ?? []).forEach((property: any) => {
      map.set(property.id, { id: property.id, name: property.name, leads: 0, visits: 0, bookings: 0 });
    });
    (visits as any[]).forEach((visit) => {
      const key = visit.property_id;
      if (!map.has(key)) map.set(key, { id: key, name: visit.properties?.name ?? key, leads: 0, visits: 0, bookings: 0 });
      map.get(key)!.visits += 1;
    });
    (bookings as any[]).forEach((booking) => {
      const key = booking.property_id;
      if (!map.has(key)) map.set(key, { id: key, name: booking.properties?.name ?? key, leads: 0, visits: 0, bookings: 0 });
      map.get(key)!.bookings += 1;
    });
    return Array.from(map.values());
  }, [effortData, properties?.data, visits, bookings]);

  const totals = {
    leads: leads.length,
    visits: visits.length,
    bookings: bookings.length
  };

  return (
    <div className="page-shell">
      <div className="page-card">
        <div className="page-header">
          <div>
            <p className="page-header__eyebrow">Effort Analytics</p>
            <h1 className="page-header__title mt-2">Effort Funnel</h1>
            <p className="page-header__subtitle">Track lead-to-visit and visit-to-booking effort across properties and agents.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard title="Leads" value={totals.leads} tone="bg-cyan-400/15 text-cyan-200" hint="Live" />
        <KpiCard title="Visits" value={totals.visits} tone="bg-amber-400/15 text-amber-200" hint="Live" />
        <KpiCard title="Bookings" value={totals.bookings} tone="bg-emerald-400/15 text-emerald-200" hint="Live" />
        <KpiCard title="Conversion Rate" value={`${calcRate(totals.bookings, totals.leads)}%`} tone="bg-violet-400/15 text-violet-200" hint="Live" />
      </div>

      <ChartCard title="Funnel Conversion" subtitle="Lead to visit to booking performance.">
        <div className="h-72 w-full min-h-[240px] min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
            <FunnelChart>
              <Tooltip
                contentStyle={{
                  background: 'rgba(15,23,42,0.95)',
                  border: '1px solid rgba(148,163,184,0.25)',
                  borderRadius: '10px',
                  color: '#e2e8f0'
                }}
              />
              <Funnel
                dataKey="value"
                data={[
                  { name: 'Leads', value: totals.leads },
                  { name: 'Visits', value: totals.visits },
                  { name: 'Bookings', value: totals.bookings }
                ]}
                isAnimationActive
              >
                <LabelList position="right" fill="#e2e8f0" stroke="none" dataKey="name" />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <div className="card-surface overflow-hidden">
        <div className="border-b border-white/10 p-5">
          <h2 className="text-lg font-semibold text-white">Per Property Funnel</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="table-modern text-left text-sm">
            <thead>
              <tr>
                <th>Property</th>
                <th>Leads</th>
                <th>Visits</th>
                <th>Bookings</th>
                <th>Conversion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loadingEffort ? (
                <tr>
                  <td colSpan={5} className="p-6">
                    <SkeletonTable />
                  </td>
                </tr>
              ) : propertyMetrics.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-slate-400">No property metrics available.</td>
                </tr>
              ) : (
                propertyMetrics.map((property: any) => (
                  <tr key={property.id} className="hover:bg-white/5">
                    <td className="font-semibold text-[var(--text)]">{property.name ?? property.property_name ?? property.id}</td>
                    <td>{property.leads ?? 0}</td>
                    <td>{property.visits ?? 0}</td>
                    <td>{property.bookings ?? 0}</td>
                    <td className="text-cyan-200">{calcRate(property.bookings ?? 0, property.leads ?? 0)}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card-surface overflow-hidden">
        <div className="border-b border-white/10 p-5">
          <h2 className="text-lg font-semibold text-white">Per Agent Funnel</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="table-modern text-left text-sm">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Leads</th>
                <th>Visits</th>
                <th>Bookings</th>
                <th>Conversion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loadingPerformance ? (
                <tr>
                  <td colSpan={5} className="p-6">
                    <SkeletonTable />
                  </td>
                </tr>
              ) : agents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-slate-400">No agent metrics available.</td>
                </tr>
              ) : (
                agents.map((agent: any, index: number) => (
                  <tr key={agent.id ?? index} className="hover:bg-white/5">
                    <td className="font-semibold text-[var(--text)]">{agent.agent_name ?? 'Agent'}</td>
                    <td>{agent.leads ?? 0}</td>
                    <td>{agent.visits ?? 0}</td>
                    <td>{agent.bookings ?? 0}</td>
                    <td className="text-cyan-200">{calcRate(agent.bookings ?? 0, agent.leads ?? 0)}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

