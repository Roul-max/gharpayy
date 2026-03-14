import { useMemo } from 'react';
import { BedDouble, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useInventory } from '../../hooks/useOperations';
import AvailabilityMatrix from '../../components/crm/AvailabilityMatrix';
import KpiCard from '../../components/crm/KpiCard';

export default function AvailabilityPage() {
  const { data: inventory = [], isLoading } = useInventory();

  const rows = useMemo(() => {
    return (inventory as any[]).map((room) => ({
      id: room.id,
      label: `${room.properties?.name ?? room.property_id} - ${room.room_type}`,
      beds: (room.beds ?? []).map((bed: any, index: number) => ({
        id: bed.id ?? `${room.id}-bed-${index}`,
        status: bed.status
      }))
    }));
  }, [inventory]);

  const stats = useMemo(() => {
    let available = 0;
    let reserved = 0;
    let occupied = 0;
    let total = 0;
    rows.forEach((row) => {
      row.beds.forEach((bed) => {
        total += 1;
        if (bed.status === 'available') available += 1;
        if (bed.status === 'reserved') reserved += 1;
        if (bed.status === 'occupied' || bed.status === 'booked') occupied += 1;
      });
    });
    return { total, available, reserved, occupied };
  }, [rows]);

  return (
    <div className="page-shell">
      <div className="page-card">
        <div className="page-header">
          <div>
            <p className="page-header__eyebrow">Availability</p>
            <h1 className="page-header__title mt-2">Bed Availability Matrix</h1>
            <p className="page-header__subtitle">Visualize room and bed occupancy status at a glance.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Total Beds" value={stats.total} icon={<BedDouble className="h-5 w-5" />} tone="bg-cyan-400/15 text-cyan-200" hint="Live" />
        <KpiCard title="Available" value={stats.available} icon={<CheckCircle2 className="h-5 w-5" />} tone="bg-emerald-400/15 text-emerald-200" hint="Live" />
        <KpiCard title="Reserved" value={stats.reserved} icon={<Clock className="h-5 w-5" />} tone="bg-amber-400/15 text-amber-200" hint="Live" />
        <KpiCard title="Occupied" value={stats.occupied} icon={<XCircle className="h-5 w-5" />} tone="bg-rose-400/15 text-rose-200" hint="Live" />
      </div>

      <div className="card-surface p-5">
        <AvailabilityMatrix rows={rows} isLoading={isLoading} />
      </div>
    </div>
  );
}
