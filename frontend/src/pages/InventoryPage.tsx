import { useMemo } from 'react';
import { BedDouble, Building2 } from 'lucide-react';
import { useInventory } from '../hooks/useOperations';

const bedTone = (status?: string) => {
  if (status === 'available') return 'bg-emerald-400/15 text-emerald-200';
  if (status === 'reserved') return 'bg-amber-400/15 text-amber-200';
  if (status === 'occupied') return 'bg-rose-400/15 text-rose-200';
  return 'bg-white/10 text-slate-300';
};

export default function InventoryPage() {
  const { data: inventory = [], isLoading } = useInventory();

  const grouped = useMemo(() => {
    const map = new Map<string, { name: string; rooms: any[] }>();
    (inventory as any[]).forEach((room) => {
      const propertyId = room.property_id;
      const propertyName = room.properties?.name ?? room.property_id;
      if (!map.has(propertyId)) {
        map.set(propertyId, { name: propertyName, rooms: [] });
      }
      map.get(propertyId)!.rooms.push(room);
    });
    return Array.from(map.entries()).map(([id, value]) => ({ id, ...value }));
  }, [inventory]);

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">CRM</p>
          <h1 className="mt-2 text-2xl font-bold text-white">Inventory</h1>
          <p className="mt-2 text-sm text-slate-400">Rooms, beds, and availability.</p>
        </div>
      </header>

      {isLoading ? (
        <div className="card-surface p-6 text-sm text-slate-400">Loading inventory...</div>
      ) : grouped.length === 0 ? (
        <div className="card-surface p-6 text-sm text-slate-400">No inventory available.</div>
      ) : (
        <div className="space-y-4">
          {grouped.map((property) => (
            <div key={property.id} className="card-surface p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 p-2 text-cyan-200">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">{property.name}</h2>
                  <p className="text-xs text-slate-400">Rooms: {property.rooms.length}</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {property.rooms.map((room: any) => (
                  <div key={room.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-white">Room {room.room_type}</p>
                        <p className="text-xs text-slate-400">Status: {room.status ?? 'available'}</p>
                      </div>
                      <div className="inline-flex items-center gap-2 text-xs text-slate-300">
                        <BedDouble className="h-4 w-4" />
                        {(room.beds ?? []).length} beds
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(room.beds ?? []).length === 0 ? (
                        <span className="text-xs text-slate-500">No beds added yet.</span>
                      ) : (
                        (room.beds ?? []).map((bed: any, index: number) => (
                          <span key={bed.id ?? index} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${bedTone(bed.status)}`}>
                            Bed {bed.bed_number ?? index + 1}: {bed.status ?? 'unknown'}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
