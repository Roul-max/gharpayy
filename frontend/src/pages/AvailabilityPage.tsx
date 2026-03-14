import { useMemo } from 'react';
import { useInventory } from '../hooks/useOperations';
import AvailabilityMatrix from '../components/crm/AvailabilityMatrix';

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

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">CRM</p>
          <h1 className="mt-2 text-2xl font-bold text-white">Availability</h1>
          <p className="mt-2 text-sm text-slate-400">Live bed availability matrix.</p>
        </div>
      </header>

      <div className="card-surface p-5">
        <AvailabilityMatrix rows={rows} isLoading={isLoading} />
      </div>
    </div>
  );
}
