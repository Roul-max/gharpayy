import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus, Building2, Users, BedDouble, BarChart3 } from 'lucide-react';
import { BED_STATUSES, ROOM_STATUSES } from '../../constants/enums';
import { api, storageApi } from '../../services/api';
import {
  useVisits,
  useBookings,
  useProperties,
  useInventory,
  useOwners,
  useEffortDashboard,
  useCreateVisit,
  useUpdateVisitOutcome,
  useCreateProperty,
  useCreateOwner,
  useCreateRoom,
  useAddBedsToRoom,
  useConfirmRoomStatus
} from '../../hooks/useOperations';

function ModuleCard({
  title,
  subtitle,
  icon: Icon,
  children
}: {
  title: string;
  subtitle: string;
  icon: any;
  children: ReactNode;
}) {
  return (
    <section className="card-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-200">
              Live
            </span>
          </div>
          <p className="text-sm text-slate-400">{subtitle}</p>
        </div>
        <div className="rounded-lg border border-cyan-300/25 bg-cyan-400/15 p-2.5 text-cyan-200">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {children}
    </section>
  );
}

function PageHeader({
  title,
  subtitle,
  actions
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <div className="card-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Supply Operations</p>
          <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function VisitsModule() {
  const [leadId, setLeadId] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const { data, isLoading } = useVisits();
  const createVisit = useCreateVisit();
  const updateOutcome = useUpdateVisitOutcome();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Visits"
        subtitle="Schedule, track, and capture site visit outcomes."
        actions={
          <>
            <Link to="/leads" className="btn-secondary">View Leads</Link>
            <Link to="/pipeline" className="btn-secondary">Pipeline</Link>
          </>
        }
      />
      <ModuleCard title="Visits" subtitle="Schedule and monitor site visits." icon={CalendarPlus}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createVisit.mutate({ lead_id: leadId, property_id: propertyId, scheduled_at: scheduledAt });
            setLeadId('');
            setPropertyId('');
            setScheduledAt('');
          }}
          className="mb-4 grid gap-3 sm:grid-cols-4"
        >
          <input className="input-modern" placeholder="Lead ID" value={leadId} onChange={(e) => setLeadId(e.target.value)} required />
          <input className="input-modern" placeholder="Property ID" value={propertyId} onChange={(e) => setPropertyId(e.target.value)} required />
          <input className="input-modern" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} required />
          <button className="btn-primary" type="submit" disabled={createVisit.isPending}>
            {createVisit.isPending ? 'Saving...' : 'Schedule'}
          </button>
        </form>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="pb-2">Lead</th>
                <th className="pb-2">Property</th>
                <th className="pb-2">When</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-slate-200">
              {(data?.data ?? []).slice(0, 12).map((v: any) => (
                <tr key={v.id}>
                  <td className="py-2">{v.leads?.name ?? v.lead_id}</td>
                  <td className="py-2">{v.properties?.name ?? v.property_id}</td>
                  <td className="py-2">{new Date(v.scheduled_at).toLocaleString()}</td>
                  <td className="py-2">
                    <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-medium capitalize">
                      {v.visit_status}
                    </span>
                  </td>
                  <td className="py-2">
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        className="rounded-md border border-emerald-300/30 bg-emerald-400/10 px-2 py-1 text-xs text-emerald-200"
                        onClick={() => updateOutcome.mutate({ id: v.id, payload: { outcome: 'booked' } })}
                        disabled={updateOutcome.isPending}
                      >
                        Booked
                      </button>
                      <button
                        type="button"
                        className="rounded-md border border-amber-300/30 bg-amber-400/10 px-2 py-1 text-xs text-amber-200"
                        onClick={() => updateOutcome.mutate({ id: v.id, payload: { outcome: 'considering' } })}
                        disabled={updateOutcome.isPending}
                      >
                        Considering
                      </button>
                      <button
                        type="button"
                        className="rounded-md border border-rose-300/30 bg-rose-400/10 px-2 py-1 text-xs text-rose-200"
                        onClick={() => updateOutcome.mutate({ id: v.id, payload: { outcome: 'not_interested' } })}
                        disabled={updateOutcome.isPending}
                      >
                        Not Interested
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {isLoading && <p className="mt-3 text-sm text-slate-400">Loading visits...</p>}
        </div>
      </ModuleCard>
    </div>
  );
}

export function BookingsModule() {
  const { data, isLoading } = useBookings();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const bookings = (data?.data ?? []).filter((b: any) => {
    const guest = String(b.leads?.name ?? b.lead_id ?? '').toLowerCase();
    const property = String(b.properties?.name ?? b.property_id ?? '').toLowerCase();
    const matchesQuery = !query || guest.includes(query.toLowerCase()) || property.includes(query.toLowerCase());
    const matchesStatus = !status || b.status === status;
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Bookings"
        subtitle="Manage bookings from pending to check-out."
        actions={<Link to="/inventory" className="btn-secondary">Inventory</Link>}
      />
      <ModuleCard title="Bookings" subtitle="Track pending/active/completed bookings." icon={BarChart3}>
        <div className="mb-3 grid gap-3 sm:grid-cols-3">
          <input
            className="input-modern sm:col-span-2"
            placeholder="Search guest or property"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select className="select-modern" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="checked_in">Checked In</option>
            <option value="checked_out">Checked Out</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-slate-400">
            <tr>
              <th className="pb-2">Guest</th>
              <th className="pb-2">Property</th>
              <th className="pb-2">Move-in</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Payment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 text-slate-200">
            {bookings.slice(0, 30).map((b: any) => (
              <tr key={b.id}>
                <td className="py-2">{b.leads?.name ?? b.lead_id}</td>
                <td className="py-2">{b.properties?.name ?? b.property_id}</td>
                <td className="py-2">{b.move_in_date}</td>
                <td className="py-2">
                  <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-medium capitalize">
                    {b.status}
                  </span>
                </td>
                <td className="py-2">
                  <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-medium capitalize">
                    {b.payment_status ?? 'pending'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {isLoading && <p className="mt-3 text-sm text-slate-400">Loading bookings...</p>}
      </div>
      </ModuleCard>
    </div>
  );
}

export function InventoryModule() {
  const { data: inventory, isLoading } = useInventory();
  const { data: properties } = useProperties();
  const createProperty = useCreateProperty();
  const createRoom = useCreateRoom();
  const addBeds = useAddBedsToRoom();
  const confirmRoomStatus = useConfirmRoomStatus();
  const [form, setForm] = useState({ name: '', owner_id: '', city: '', area: '', address: '', gender_allowed: 'any' });
  const [roomForm, setRoomForm] = useState({ property_id: '', room_type: '', bed_count: '1', status: 'available' });
  const [bedForm, setBedForm] = useState({ room_id: '', count: '1' });
  const [statusForm, setStatusForm] = useState({ room_id: '', owner_id: '', status: 'available' });
  const [uploadPropertyId, setUploadPropertyId] = useState('');
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState('');

  const rooms = useMemo(() => (Array.isArray(inventory) ? inventory : []), [inventory]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Inventory"
        subtitle="Onboard properties, rooms, and beds with real-time availability."
        actions={
          <>
            <Link to="/owners" className="btn-secondary">Owners</Link>
            <Link to="/availability" className="btn-secondary">Availability</Link>
          </>
        }
      />
      <ModuleCard title="Add Property" subtitle="Onboard owner inventory quickly." icon={Building2}>
        <form
          className="grid gap-3 sm:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            createProperty.mutate(form);
            setForm({ name: '', owner_id: '', city: '', area: '', address: '', gender_allowed: 'any' });
          }}
        >
          <input className="input-modern" placeholder="Property Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <input className="input-modern" placeholder="Owner ID" value={form.owner_id} onChange={(e) => setForm((f) => ({ ...f, owner_id: e.target.value }))} required />
          <input className="input-modern" placeholder="City" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} required />
          <input className="input-modern" placeholder="Area" value={form.area} onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))} required />
          <input className="input-modern sm:col-span-2" placeholder="Address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} required />
          <select className="select-modern" value={form.gender_allowed} onChange={(e) => setForm((f) => ({ ...f, gender_allowed: e.target.value }))}>
            <option value="any">Any</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          <button className="btn-primary sm:col-span-3" type="submit" disabled={createProperty.isPending}>
            {createProperty.isPending ? 'Saving...' : 'Create Property'}
          </button>
        </form>
      </ModuleCard>

      <ModuleCard title="Inventory" subtitle="Live room + bed status across properties." icon={BedDouble}>
        <div className="mb-4 grid gap-4 lg:grid-cols-3">
          <form
            className="rounded-xl border border-white/10 bg-white/5 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              createRoom.mutate({
                property_id: roomForm.property_id,
                room_type: roomForm.room_type,
                bed_count: Number(roomForm.bed_count),
                status: roomForm.status
              });
              setRoomForm({ property_id: '', room_type: '', bed_count: '1', status: 'available' });
            }}
          >
            <p className="mb-2 text-sm font-semibold text-white">Add Room</p>
            <div className="space-y-2">
              <select className="select-modern" value={roomForm.property_id} onChange={(e) => setRoomForm((f) => ({ ...f, property_id: e.target.value }))} required>
                <option value="">Property</option>
                {(properties?.data ?? []).map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <input className="input-modern" placeholder="Room Type" value={roomForm.room_type} onChange={(e) => setRoomForm((f) => ({ ...f, room_type: e.target.value }))} required />
              <input className="input-modern" type="number" min={1} max={20} placeholder="Beds" value={roomForm.bed_count} onChange={(e) => setRoomForm((f) => ({ ...f, bed_count: e.target.value }))} required />
              <select className="select-modern" value={roomForm.status} onChange={(e) => setRoomForm((f) => ({ ...f, status: e.target.value }))}>
                {ROOM_STATUSES.map((status) => (
                  <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                ))}
              </select>
              <button className="btn-primary w-full" type="submit" disabled={createRoom.isPending}>
                {createRoom.isPending ? 'Saving...' : 'Create Room'}
              </button>
            </div>
          </form>

          <form
            className="rounded-xl border border-white/10 bg-white/5 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              addBeds.mutate({
                id: bedForm.room_id,
                payload: { count: Number(bedForm.count) }
              });
              setBedForm({ room_id: '', count: '1' });
            }}
          >
            <p className="mb-2 text-sm font-semibold text-white">Add Beds</p>
            <div className="space-y-2">
              <select className="select-modern" value={bedForm.room_id} onChange={(e) => setBedForm((f) => ({ ...f, room_id: e.target.value }))} required>
                <option value="">Room</option>
                {rooms.map((room: any) => (
                  <option key={room.id} value={room.id}>{room.properties?.name ?? room.property_id} - {room.room_type}</option>
                ))}
              </select>
              <input className="input-modern" type="number" min={1} max={20} placeholder="Count" value={bedForm.count} onChange={(e) => setBedForm((f) => ({ ...f, count: e.target.value }))} required />
              <button className="btn-primary w-full" type="submit" disabled={addBeds.isPending}>
                {addBeds.isPending ? 'Saving...' : 'Add Beds'}
              </button>
            </div>
          </form>

          <form
            className="rounded-xl border border-white/10 bg-white/5 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              confirmRoomStatus.mutate(statusForm);
            }}
          >
            <p className="mb-2 text-sm font-semibold text-white">Confirm Room Status</p>
            <div className="space-y-2">
              <select className="select-modern" value={statusForm.room_id} onChange={(e) => setStatusForm((f) => ({ ...f, room_id: e.target.value }))} required>
                <option value="">Room</option>
                {rooms.map((room: any) => (
                  <option key={room.id} value={room.id}>{room.properties?.name ?? room.property_id} - {room.room_type}</option>
                ))}
              </select>
              <input className="input-modern" placeholder="Owner ID" value={statusForm.owner_id} onChange={(e) => setStatusForm((f) => ({ ...f, owner_id: e.target.value }))} required />
              <select className="select-modern" value={statusForm.status} onChange={(e) => setStatusForm((f) => ({ ...f, status: e.target.value }))}>
                {ROOM_STATUSES.map((status) => (
                  <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                ))}
              </select>
              <button className="btn-primary w-full" type="submit" disabled={confirmRoomStatus.isPending}>
                {confirmRoomStatus.isPending ? 'Saving...' : 'Confirm Status'}
              </button>
            </div>
          </form>

          <form
            className="rounded-xl border border-white/10 bg-white/5 p-3 lg:col-span-3"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!uploadPropertyId || uploadFiles.length === 0) {
                setUploadStatus('Select a property and at least one file.');
                return;
              }
              try {
                setUploadStatus('Uploading images...');
                const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '';
                const publicBase = supabaseUrl ? `${supabaseUrl}/storage/v1/object/public` : '';
                const uploadedUrls: string[] = [];

                for (const file of uploadFiles) {
                  const signed = await storageApi.signedUpload({
                    bucket: 'property-images',
                    folder: `properties/${uploadPropertyId}`,
                    filename: file.name,
                    contentType: file.type
                  });
                  await fetch(signed.signedUrl, {
                    method: 'PUT',
                    headers: { 'Content-Type': file.type },
                    body: file
                  });
                  const url = publicBase ? `${publicBase}/${signed.bucket}/${signed.path}` : signed.path;
                  uploadedUrls.push(url);
                }

                await api.operations.properties.updatePhotos(uploadPropertyId, uploadedUrls);
                setUploadStatus('Images uploaded and saved to property.');
                setUploadFiles([]);
              } catch (error) {
                setUploadStatus(error instanceof Error ? error.message : 'Upload failed.');
              }
            }}
          >
            <p className="mb-2 text-sm font-semibold text-white">Upload Property Images</p>
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <select className="select-modern" value={uploadPropertyId} onChange={(e) => setUploadPropertyId(e.target.value)} required>
                <option value="">Select property</option>
                {(properties?.data ?? []).map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <input
                type="file"
                multiple
                className="input-modern"
                onChange={(e) => setUploadFiles(Array.from(e.target.files ?? []))}
              />
              <button className="btn-primary" type="submit">
                Upload
              </button>
            </div>
            {uploadStatus && <p className="mt-2 text-xs text-cyan-300">{uploadStatus}</p>}
          </form>
        </div>
        <p className="mb-3 text-sm text-slate-400">Total properties: {(properties?.data ?? []).length} | Total rooms: {rooms.length}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="pb-2">Property</th>
                <th className="pb-2">Room Type</th>
                <th className="pb-2">Room Status</th>
                <th className="pb-2">Beds</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-slate-200">
              {rooms.slice(0, 20).map((r: any) => (
                <tr key={r.id}>
                  <td className="py-2">{r.properties?.name ?? r.property_id}</td>
                  <td className="py-2">{r.room_type}</td>
                  <td className="py-2">
                    <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-medium capitalize">
                      {r.status}
                    </span>
                  </td>
                  <td className="py-2">{(r.beds ?? []).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {isLoading && <p className="mt-3 text-sm text-slate-400">Loading inventory...</p>}
        </div>
      </ModuleCard>
    </div>
  );
}

export function OwnersModule() {
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const { data, isLoading } = useOwners();
  const createOwner = useCreateOwner();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Owners"
        subtitle="Manage owner accounts, contacts, and supply readiness."
        actions={<Link to="/inventory" className="btn-secondary">Inventory</Link>}
      />
      <ModuleCard title="Owners" subtitle="Manage owner accounts and supply pipeline." icon={Users}>
        <form
          className="mb-4 grid gap-3 sm:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault();
            createOwner.mutate(form);
            setForm({ name: '', email: '', phone: '' });
          }}
        >
          <input className="input-modern" placeholder="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <input className="input-modern" placeholder="Email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
          <input className="input-modern" placeholder="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          <button className="btn-primary" type="submit" disabled={createOwner.isPending}>
            {createOwner.isPending ? 'Saving...' : 'Add Owner'}
          </button>
        </form>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="pb-2">Name</th>
                <th className="pb-2">Email</th>
                <th className="pb-2">Phone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-slate-200">
              {(data?.data ?? []).map((owner: any) => (
                <tr key={owner.id}>
                  <td className="py-2">{owner.name}</td>
                  <td className="py-2">{owner.email}</td>
                  <td className="py-2">{owner.phone ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {isLoading && <p className="mt-3 text-sm text-slate-400">Loading owners...</p>}
        </div>
      </ModuleCard>
    </div>
  );
}

export function EffortModule() {
  const { data: properties } = useProperties();
  const [propertyId, setPropertyId] = useState('');
  const { data, isLoading } = useEffortDashboard(propertyId || undefined);
  return (
    <div className="space-y-5">
      <PageHeader
        title="Effort"
        subtitle="Measure lead, visit, and booking effort by property."
        actions={<Link to="/analytics" className="btn-secondary">Analytics</Link>}
      />
      <ModuleCard title="Effort Dashboard" subtitle="Measure funnel effort per property." icon={BarChart3}>
        <div className="mb-3 grid gap-3 sm:grid-cols-2">
          <select className="select-modern" value={propertyId} onChange={(e) => setPropertyId(e.target.value)}>
            <option value="">All properties</option>
            {(properties?.data ?? []).map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 text-sm text-slate-300">
          {(Array.isArray(data) ? data : []).slice(0, 25).map((row: any) => (
            <div key={row.id ?? row.property_id} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              {row.name ?? row.property_name ?? JSON.stringify(row)}
            </div>
          ))}
        </div>
        {isLoading && <p className="mt-3 text-sm text-slate-400">Loading effort metrics...</p>}
      </ModuleCard>
    </div>
  );
}

export function AvailabilityModule() {
  const { data: inventory, isLoading } = useInventory();
  const rooms = useMemo(() => (Array.isArray(inventory) ? inventory : []), [inventory]);
  const [propertyFilter, setPropertyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const properties = useMemo(() => {
    const map = new Map<string, string>();
    rooms.forEach((room: any) => {
      map.set(room.property_id, room.properties?.name ?? room.property_id);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [rooms]);

  const filtered = rooms.filter((room: any) => {
    const byProperty = !propertyFilter || room.property_id === propertyFilter;
    const byStatus = !statusFilter || room.status === statusFilter;
    return byProperty && byStatus;
  });

  const summary = filtered.reduce(
    (acc: any, room: any) => {
      const beds = room.beds ?? [];
      acc.totalRooms += 1;
      acc.totalBeds += beds.length;
      beds.forEach((bed: any) => {
        if (bed.status === BED_STATUSES[0]) acc.vacant += 1;
        if (bed.status === BED_STATUSES[3]) acc.occupied += 1;
        if (bed.status === BED_STATUSES[1]) acc.reserved += 1;
        if (bed.status === BED_STATUSES[2]) acc.booked += 1;
      });
      return acc;
    },
    { totalRooms: 0, totalBeds: 0, vacant: 0, occupied: 0, reserved: 0, booked: 0 }
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Availability"
        subtitle="Real-time room and bed availability across inventory."
        actions={<Link to="/inventory" className="btn-secondary">Inventory</Link>}
      />
      <ModuleCard title="Availability Board" subtitle="Room and bed availability in real-time." icon={BedDouble}>
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <select className="select-modern" value={propertyFilter} onChange={(e) => setPropertyFilter(e.target.value)}>
            <option value="">All properties</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select className="select-modern" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All room statuses</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="maintenance">Maintenance</option>
          </select>
          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
            Rooms: {summary.totalRooms} | Beds: {summary.totalBeds}
          </div>
        </div>

        <div className="mb-4 grid gap-2 sm:grid-cols-4">
          <div className="rounded-lg border border-emerald-300/25 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200">Available Beds: {summary.vacant}</div>
          <div className="rounded-lg border border-amber-300/25 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">Reserved Beds: {summary.reserved}</div>
          <div className="rounded-lg border border-sky-300/25 bg-sky-400/10 px-3 py-2 text-xs text-sky-200">Booked Beds: {summary.booked}</div>
          <div className="rounded-lg border border-rose-300/25 bg-rose-400/10 px-3 py-2 text-xs text-rose-200">Occupied Beds: {summary.occupied}</div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.slice(0, 60).map((room: any) => (
            <div key={room.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-white">{room.properties?.name ?? room.property_id}</p>
                <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] capitalize text-slate-300">
                  {room.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">Room: {room.room_type}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {(room.beds ?? []).map((bed: any) => (
                  <span
                    key={bed.id}
                    className={`rounded-md px-2 py-1 text-[11px] ${
                      bed.status === BED_STATUSES[0]
                        ? 'bg-emerald-400/15 text-emerald-200'
                        : bed.status === BED_STATUSES[1]
                          ? 'bg-amber-400/15 text-amber-200'
                          : bed.status === BED_STATUSES[2]
                            ? 'bg-sky-400/15 text-sky-200'
                            : bed.status === BED_STATUSES[4]
                              ? 'bg-violet-400/20 text-violet-200'
                              : 'bg-rose-400/15 text-rose-200'
                    }`}
                  >
                    {bed.status}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        {isLoading && <p className="mt-3 text-sm text-slate-400">Loading availability...</p>}
      </ModuleCard>
    </div>
  );
}

export function ComingSoonModule({ title, description }: { title: string; description: string }) {
  return (
    <ModuleCard title={title} subtitle={description} icon={BarChart3}>
      <p className="text-sm text-slate-300">
        Module shell is ready and route-protected. Connect API integration for this screen next.
      </p>
    </ModuleCard>
  );
}
