import { useMemo, useState } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { useBookings } from '../hooks/useOperations';
import DataTable from '../components/crm/DataTable';

type SortKey = 'date' | 'status';

const statusBadge = (status?: string) => {
  const value = status ?? 'pending';
  if (['confirmed', 'checked_in'].includes(value)) return 'bg-emerald-400/15 text-emerald-200';
  if (['pending'].includes(value)) return 'bg-amber-400/15 text-amber-200';
  if (['cancelled'].includes(value)) return 'bg-rose-400/15 text-rose-200';
  return 'bg-white/10 text-slate-200';
};

export default function BookingsPage() {
  const { data, isLoading } = useBookings();
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const bookings = data?.data ?? [];

  const filtered = useMemo(() => {
    return bookings.filter((booking: any) => {
      const haystack = `${booking.leads?.name ?? ''} ${booking.properties?.name ?? ''}`.toLowerCase();
      return !query || haystack.includes(query.toLowerCase());
    });
  }, [bookings, query]);

  const sorted = useMemo(() => {
    const next = [...filtered];
    next.sort((a: any, b: any) => {
      if (sortKey === 'status') {
        return sortDir === 'asc'
          ? String(a.status).localeCompare(String(b.status))
          : String(b.status).localeCompare(String(a.status));
      }
      const aDate = new Date(a.created_at ?? a.move_in_date).getTime();
      const bDate = new Date(b.created_at ?? b.move_in_date).getTime();
      return sortDir === 'asc' ? aDate - bDate : bDate - aDate;
    });
    return next;
  }, [filtered, sortDir, sortKey]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">CRM</p>
          <h1 className="mt-2 text-2xl font-bold text-white">Bookings</h1>
          <p className="mt-2 text-sm text-slate-400">Monitor booking lifecycle.</p>
        </div>
        <input
          className="input-modern w-full max-w-sm"
          placeholder="Search lead or property"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </header>

      <DataTable
        columns={[
          { key: 'lead', label: 'Lead', className: 'font-semibold text-white', render: (booking: any) => booking.leads?.name ?? booking.lead_id },
          { key: 'property', label: 'Property', render: (booking: any) => booking.properties?.name ?? booking.property_id },
          { key: 'room', label: 'Room', render: (booking: any) => booking.room?.name ?? booking.room_id ?? '-' },
          { key: 'bed', label: 'Bed', render: (booking: any) => booking.bed?.name ?? booking.bed_id ?? '-' },
          {
            key: 'date',
            label: 'Booking Date',
            render: (booking: any) => (
              <div className="flex items-center gap-2">
                <span>{new Date(booking.created_at ?? booking.move_in_date).toLocaleDateString()}</span>
                <button type="button" onClick={() => toggleSort('date')}>
                  <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
                </button>
              </div>
            )
          },
          {
            key: 'payment',
            label: 'Payment Status',
            render: (booking: any) => (
              <div className="flex flex-wrap gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(booking.status)}`}>
                  {booking.status ?? 'pending'}
                </span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(booking.payment_status)}`}>
                  {booking.payment_status ?? 'pending'}
                </span>
              </div>
            )
          }
        ]}
        data={sorted}
        isLoading={isLoading}
        emptyState="No bookings found."
      />
    </div>
  );
}
