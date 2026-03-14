import { useMemo, useState } from 'react';
import { ArrowUpDown, BedDouble, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useBookings } from '../../hooks/useOperations';
import DataTable from '../../components/crm/DataTable';
import KpiCard from '../../components/crm/KpiCard';
import { getLeadDisplayName } from '../../utils/leadDisplay';

type SortKey = 'date' | 'status';

const statusBadge = (status?: string) => {
  const value = status ?? 'pending';
  if (['confirmed', 'checked_in'].includes(value)) return 'badge badge--success';
  if (['pending'].includes(value)) return 'badge badge--warning';
  if (['cancelled'].includes(value)) return 'badge badge--danger';
  return 'badge';
};

export default function BookingsPage() {
  const { data, isLoading } = useBookings();
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const bookings = data?.data ?? [];

  const filtered = useMemo(() => {
    return bookings.filter((booking: any) => {
      const leadName = getLeadDisplayName(booking.leads);
      const haystack = `${leadName} ${booking.properties?.name ?? ''}`.toLowerCase();
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

  const stats = useMemo(() => {
    let confirmed = 0;
    let pending = 0;
    let cancelled = 0;
    bookings.forEach((booking: any) => {
      const status = booking.status ?? 'pending';
      if (['confirmed', 'checked_in'].includes(status)) confirmed += 1;
      else if (status === 'cancelled') cancelled += 1;
      else pending += 1;
    });
    return { total: bookings.length, confirmed, pending, cancelled };
  }, [bookings]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <div className="page-shell">
      <div className="page-card">
        <div className="page-header">
          <div>
            <p className="page-header__eyebrow">Bookings</p>
            <h1 className="page-header__title mt-2">Bookings Overview</h1>
            <p className="page-header__subtitle">Monitor booking status and payment health.</p>
          </div>
          <div className="page-actions">
            <input
              className="input-modern w-full max-w-sm"
              placeholder="Search lead or property"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Total Bookings" value={stats.total} icon={<BedDouble className="h-5 w-5" />} tone="bg-cyan-400/15 text-cyan-200" hint="Live" />
        <KpiCard title="Confirmed" value={stats.confirmed} icon={<CheckCircle2 className="h-5 w-5" />} tone="bg-emerald-400/15 text-emerald-200" hint="Live" />
        <KpiCard title="Pending" value={stats.pending} icon={<Clock className="h-5 w-5" />} tone="bg-amber-400/15 text-amber-200" hint="Live" />
        <KpiCard title="Cancelled" value={stats.cancelled} icon={<XCircle className="h-5 w-5" />} tone="bg-rose-400/15 text-rose-200" hint="Live" />
      </div>

      <DataTable
        columns={[
          {
            key: 'lead',
            label: 'Lead',
            className: 'font-semibold text-white',
            render: (booking: any) => getLeadDisplayName(booking.leads)
          },
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
                <span className={statusBadge(booking.status)}>
                  {booking.status ?? 'pending'}
                </span>
                <span className={statusBadge(booking.payment_status)}>
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
