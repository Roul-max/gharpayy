import { useMemo, useState } from 'react';
import { BedDouble, Filter } from 'lucide-react';
import { useInventory, useProperties } from '../hooks/useOperations';

export default function MatchingPage() {
  const { data: inventory = [], isLoading } = useInventory();
  const { data: propertiesData } = useProperties();

  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [budget, setBudget] = useState('');
  const [gender, setGender] = useState('any');
  const [sharingType, setSharingType] = useState('any');

  const properties = propertiesData?.data ?? [];

  const propertyMap = useMemo(() => {
    const map = new Map<string, any>();
    properties.forEach((property: any) => map.set(property.id, property));
    return map;
  }, [properties]);

  const beds = useMemo(() => {
    const available: Array<any> = [];
    (inventory as any[]).forEach((room) => {
      const prop = propertyMap.get(room.property_id) ?? {};
      (room.beds ?? []).forEach((bed: any) => {
        available.push({ bed, room, property: prop });
      });
    });
    return available;
  }, [inventory, propertyMap]);

  const filtered = useMemo(() => {
    const maxBudget = budget ? Number(budget) : undefined;
    return beds.filter(({ bed, room, property }) => {
      if (bed.status && bed.status !== 'available') return false;
      if (city && String(property.city ?? '').toLowerCase() !== city.toLowerCase()) return false;
      if (area && String(property.area ?? '').toLowerCase() !== area.toLowerCase()) return false;
      if (gender !== 'any' && String(property.gender_allowed ?? 'any') !== gender) return false;
      if (sharingType !== 'any' && String(room.sharing_type ?? 'any') !== sharingType) return false;
      if (maxBudget && Number(room.price ?? bed.price ?? 0) > maxBudget) return false;
      return true;
    });
  }, [beds, budget, city, area, gender, sharingType]);

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">CRM</p>
          <h1 className="mt-2 text-2xl font-bold text-white">Matching</h1>
          <p className="mt-2 text-sm text-slate-400">Match leads to best-fit beds.</p>
        </div>
      </header>

      <div className="card-surface p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Filter className="h-4 w-4 text-cyan-200" />
          Filters
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input className="input-modern" placeholder="City" value={city} onChange={(event) => setCity(event.target.value)} />
          <input className="input-modern" placeholder="Area" value={area} onChange={(event) => setArea(event.target.value)} />
          <input
            className="input-modern"
            placeholder="Budget (monthly)"
            type="number"
            value={budget}
            onChange={(event) => setBudget(event.target.value)}
          />
          <select className="select-modern" value={gender} onChange={(event) => setGender(event.target.value)}>
            <option value="any">Any Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          <select className="select-modern" value={sharingType} onChange={(event) => setSharingType(event.target.value)}>
            <option value="any">Any Sharing</option>
            <option value="single">Single</option>
            <option value="double">Double</option>
            <option value="triple">Triple</option>
          </select>
        </div>
      </div>

      <div className="card-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recommended Beds</h2>
          <span className="text-xs text-slate-400">{filtered.length} results</span>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {isLoading ? (
            [...Array(6)].map((_, index) => (
              <div key={index} className="h-28 rounded-xl bg-white/5 animate-pulse" />
            ))
          ) : filtered.length === 0 ? (
            <p className="text-sm text-slate-400">No matching beds found. Adjust filters to broaden results.</p>
          ) : (
            filtered.map(({ bed, room, property }, index) => (
              <div key={bed.id ?? index} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">{property.name ?? 'Property'}</p>
                  <span className="rounded-full bg-emerald-400/15 px-2 py-1 text-xs font-semibold text-emerald-200">Available</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">{property.area ?? property.city ?? '-'}</p>
                <div className="mt-3 flex items-center justify-between text-sm text-slate-200">
                  <span className="inline-flex items-center gap-1">
                    <BedDouble className="h-4 w-4" />
                    {room.room_type ?? 'Room'} - Bed {bed.bed_number ?? bed.name ?? ''}
                  </span>
                  <span className="text-cyan-200">Rs {room.price ?? bed.price ?? '-'}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
