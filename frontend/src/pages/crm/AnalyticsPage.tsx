import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { useAgentPerformance } from '../../hooks/useAgentPerformance';
import { useLeads } from '../../hooks/useLeads';
import { useBookings, useVisits } from '../../hooks/useOperations';
import { SkeletonChart } from '../../components/SkeletonLoaders';
import ChartCard from '../../components/crm/ChartCard';

const PIE_COLORS = ['#22d3ee', '#38bdf8', '#818cf8', '#f59e0b', '#f43f5e'];

export default function AnalyticsPage() {
  const { data: leads = [], isLoading: loadingLeads } = useLeads();
  const { data: visitsData, isLoading: loadingVisits } = useVisits();
  const { data: bookingsData, isLoading: loadingBookings } = useBookings();
  const { data: performanceData, isLoading: loadingPerformance } = useAgentPerformance();

  const visits = visitsData?.data ?? [];
  const bookings = bookingsData?.data ?? [];
  const agents = performanceData?.agents ?? [];

  const leadsBySource = useMemo(() => {
    const map = new Map<string, number>();
    (leads as any[]).forEach((lead) => {
      const key = lead.source ?? 'other';
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [leads]);

  const funnelData = useMemo(() => {
    return [
      { name: 'Leads', value: leads.length },
      { name: 'Visits', value: visits.length },
      { name: 'Bookings', value: bookings.length }
    ];
  }, [leads.length, visits.length, bookings.length]);

  const bookingsPerWeek = useMemo(() => {
    const weeks = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - index * 7);
      return { label: `W-${6 - index}`, start: new Date(date) };
    }).reverse();

    return weeks.map((week) => {
      const start = new Date(week.start);
      const end = new Date(week.start);
      end.setDate(end.getDate() + 7);
      const count = bookings.filter((booking: any) => {
        const date = new Date(booking.created_at ?? booking.move_in_date);
        return date >= start && date < end;
      }).length;
      return { name: week.label, bookings: count };
    });
  }, [bookings]);

  const agentPerformance = useMemo(() => {
    return agents.map((agent: any) => ({
      name: agent.agent_name ?? 'Agent',
      leads: agent.leads ?? 0,
      visits: agent.visits ?? 0,
      bookings: agent.bookings ?? 0
    }));
  }, [agents]);

  const loading = loadingLeads || loadingVisits || loadingBookings || loadingPerformance;

  return (
    <div className="page-shell">
      <div className="page-card">
        <div className="page-header">
          <div>
            <p className="page-header__eyebrow">Analytics</p>
            <h1 className="page-header__title mt-2">Performance Analytics</h1>
            <p className="page-header__subtitle">Lead sources, conversion funnel, and agent impact.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Leads by Source" subtitle="Distribution of inbound sources.">
          <div className="mt-2 h-72 min-h-[240px] min-w-0">
            {loading ? (
              <SkeletonChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
                <PieChart>
                  <Pie data={leadsBySource} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
                    {leadsBySource.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15,23,42,0.95)',
                      border: '1px solid rgba(148,163,184,0.25)',
                      borderRadius: '10px',
                      color: '#e2e8f0'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        <ChartCard title="Lead Conversion Funnel" subtitle="Leads to visits to bookings.">
          <div className="mt-2 h-72 min-h-[240px] min-w-0">
            {loading ? (
              <SkeletonChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
                <BarChart data={funnelData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15,23,42,0.95)',
                      border: '1px solid rgba(148,163,184,0.25)',
                      borderRadius: '10px',
                      color: '#e2e8f0'
                    }}
                  />
                  <Bar dataKey="value" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Bookings per Week" subtitle="Weekly booking velocity.">
          <div className="mt-2 h-72 min-h-[240px] min-w-0">
            {loading ? (
              <SkeletonChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
                <LineChart data={bookingsPerWeek}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15,23,42,0.95)',
                      border: '1px solid rgba(148,163,184,0.25)',
                      borderRadius: '10px',
                      color: '#e2e8f0'
                    }}
                  />
                  <Line type="monotone" dataKey="bookings" stroke="#22d3ee" strokeWidth={3} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        <ChartCard title="Agent Performance" subtitle="Leads, visits, and bookings by agent.">
          <div className="mt-2 h-72 min-h-[240px] min-w-0">
            {loading ? (
              <SkeletonChart />
            ) : agentPerformance.length === 0 ? (
              <p className="text-sm text-slate-400">No agent performance data.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
                <BarChart data={agentPerformance}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15,23,42,0.95)',
                      border: '1px solid rgba(148,163,184,0.25)',
                      borderRadius: '10px',
                      color: '#e2e8f0'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="leads" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="visits" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="bookings" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

