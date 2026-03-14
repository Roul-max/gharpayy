import { Funnel, FunnelChart, LabelList, ResponsiveContainer, Tooltip } from 'recharts';
import { useLeads } from '../hooks/useLeads';
import { useBookings, useVisits } from '../hooks/useOperations';
import KpiCard from '../components/crm/KpiCard';
import ChartCard from '../components/crm/ChartCard';

const calcRate = (num: number, den: number) => (den ? ((num / den) * 100).toFixed(1) : '0.0');

export default function EffortPage() {
  const { data: leads = [] } = useLeads();
  const { data: visitsData } = useVisits();
  const { data: bookingsData } = useBookings();

  const visits = visitsData?.data ?? [];
  const bookings = bookingsData?.data ?? [];

  const totals = {
    leads: leads.length,
    visits: visits.length,
    bookings: bookings.length
  };

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">CRM</p>
          <h1 className="mt-2 text-2xl font-bold text-white">Effort</h1>
          <p className="mt-2 text-sm text-slate-400">Track funnel efficiency.</p>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <KpiCard title="Leads" value={totals.leads} tone="bg-cyan-400/15 text-cyan-200" hint="Live" />
        <KpiCard title="Visits" value={totals.visits} tone="bg-amber-400/15 text-amber-200" hint="Live" />
        <KpiCard title="Bookings" value={totals.bookings} tone="bg-emerald-400/15 text-emerald-200" hint="Live" />
        <KpiCard title="Conversion Rate" value={`${calcRate(totals.bookings, totals.leads)}%`} tone="bg-violet-400/15 text-violet-200" hint="Live" />
      </section>

      <ChartCard title="Funnel Conversion" subtitle="Lead to visit to booking performance.">
        <div className="h-72 min-h-[240px]">
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
    </div>
  );
}
