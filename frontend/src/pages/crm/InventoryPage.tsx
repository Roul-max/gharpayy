import { useMemo } from 'react';
import { BedDouble, Building2, CheckCircle2, XCircle } from 'lucide-react';
import { useInventory } from '../../hooks/useOperations';
import KpiCard from '../../components/crm/KpiCard';

const bedTone = (status?: string) => {
  if (status === 'available') return 'badge badge--success';
  if (status === 'reserved') return 'badge badge--warning';
  if (status === 'booked') return 'badge badge--info';
  if (status === 'occupied') return 'badge badge--danger';
  return 'badge';
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

  const stats = useMemo(() => {
    let beds = 0;
    let available = 0;
    let occupied = 0;
    (inventory as any[]).forEach((room) => {
      (room.beds ?? []).forEach((bed: any) => {
        beds += 1;
        if (bed.status === 'available') available += 1;
        if (bed.status === 'occupied' || bed.status === 'booked') occupied += 1;
      });
    });
    return { properties: grouped.length, rooms: (inventory as any[]).length, beds, available, occupied };
  }, [grouped.length, inventory]);

  return (
    <div className="page-shell">
      <div className="page-card">
        <div className="page-header">
          <div>
            <p className="page-header__eyebrow">Inventory</p>
            <h1 className="page-header__title mt-2">Property Inventory</h1>
            <p className="page-header__subtitle">Explore property, room, and bed availability in one place.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Properties" value={stats.properties} icon={<Building2 className="h-5 w-5" />} tone="bg-cyan-400/15 text-cyan-200" hint="Live" />
        <KpiCard title="Rooms" value={stats.rooms} icon={<BedDouble className="h-5 w-5" />} tone="bg-sky-400/15 text-sky-200" hint="Live" />
        <KpiCard title="Available Beds" value={stats.available} icon={<CheckCircle2 className="h-5 w-5" />} tone="bg-emerald-400/15 text-emerald-200" hint="Live" />
        <KpiCard title="Occupied" value={stats.occupied} icon={<XCircle className="h-5 w-5" />} tone="bg-rose-400/15 text-rose-200" hint="Live" />
      </div>

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
                          <span key={bed.id ?? index} className={bedTone(bed.status)}>
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
