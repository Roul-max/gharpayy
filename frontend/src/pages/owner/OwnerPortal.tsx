import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BarChart3, BedDouble, Building2, CalendarCheck } from 'lucide-react';
import { useBookings, useConfirmRoomStatus, useEffortDashboard, useInventory, useOwnerAlerts, useProperties } from '../../hooks/useOperations';
import { api } from '../../services/api';
import { ROOM_STATUSES } from '../../constants/enums';

export default function OwnerPortal() {
  const { data: propertiesData } = useProperties();
  const { data: bookingsData } = useBookings();
  const { data: effortData, isLoading } = useEffortDashboard();
  const { data: inventoryData } = useInventory();
  const { data: ownerAlertsData } = useOwnerAlerts();
  const confirmRoomStatus = useConfirmRoomStatus();
  const [roomId, setRoomId] = useState('');
  const [roomStatus, setRoomStatus] = useState('available');
  const [ownerName, setOwnerName] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    let active = true;

    api.auth.me()
      .then((payload: any) => {
        if (!active) return;
        const email = payload?.user?.email ?? '';
        setOwnerName(email || 'Owner');
      })
      .catch(() => {
        if (!active) return;
        setOwnerName('Owner');
      });

    return () => {
      active = false;
    };
  }, []);

  const properties = propertiesData?.data ?? [];
  const bookings = bookingsData?.data ?? [];
  const effort = Array.isArray(effortData) ? effortData : [];
  const inventory = useMemo(() => (Array.isArray(inventoryData) ? inventoryData : []), [inventoryData]);

  return (
    <div className="owner-page app-shell px-4 py-16 sm:px-6">
      <div className="mx-auto w-full max-w-6xl page-shell">
        <div className="glass-surface rounded-2xl p-6">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400/20 text-cyan-200">
            <Building2 className="h-6 w-6" />
          </div>
          <p className="page-header__eyebrow">Owner Workspace</p>
          <h1 className="page-header__title mt-2">Owner Portal</h1>
          <p className="page-header__subtitle">Track occupancy, bookings, and property effort performance for {ownerName}.</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
            <span className="badge">Inventory synced</span>
            <span className="badge badge--info">Alerts enabled</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/" className="btn-secondary">
              <ArrowLeft className="h-4 w-4" />
              Back to Marketplace
            </Link>
            <Link to="/inventory" className="btn-secondary">
              <BedDouble className="h-4 w-4" />
              Open Inventory
            </Link>
            <Link to="/bookings" className="btn-secondary">
              <CalendarCheck className="h-4 w-4" />
              Open Bookings
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <div className="card-surface p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Properties</p>
            <p className="mt-1 text-2xl font-bold text-white">{properties.length}</p>
          </div>
          <div className="card-surface p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Bookings</p>
            <p className="mt-1 text-2xl font-bold text-emerald-300">{bookings.length}</p>
          </div>
          <div className="card-surface p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Effort Rows</p>
            <p className="mt-1 text-2xl font-bold text-cyan-300">{effort.length}</p>
          </div>
          <div className="card-surface p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">New Bookings (24h)</p>
            <p className="mt-1 text-2xl font-bold text-amber-300">{ownerAlertsData?.summary?.newBookings ?? 0}</p>
          </div>
          <div className="card-surface p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Unread Messages</p>
            <p className="mt-1 text-2xl font-bold text-fuchsia-300">{ownerAlertsData?.summary?.unreadMessages ?? 0}</p>
          </div>
        </div>

        <div className="card-surface p-5">
          <h2 className="text-lg font-bold text-white">Owner Playbook</h2>
          <p className="mt-1 text-sm text-slate-400">Daily actions to keep your listings high performing.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">Confirm availability</p>
              <p className="mt-1 text-xs text-slate-400">Update room status every day to avoid missed bookings.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">Review new bookings</p>
              <p className="mt-1 text-xs text-slate-400">Acknowledge upcoming move-ins and onboarding needs.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">Respond to alerts</p>
              <p className="mt-1 text-xs text-slate-400">Clear notifications to keep your SLA green.</p>
            </div>
          </div>
        </div>

        <div className="card-surface p-5">
          <div className="mb-5 rounded-xl border border-white/10 bg-white/5 p-4">
            <h2 className="text-lg font-bold text-white">Owner Alerts</h2>
            {(ownerAlertsData?.alerts ?? []).length === 0 ? (
              <p className="mt-2 text-sm text-slate-400">No active alerts.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {(ownerAlertsData?.alerts ?? []).slice(0, 8).map((alert: any, index: number) => (
                  <div key={`${alert.type}-${index}`} className="rounded-lg border border-amber-300/20 bg-amber-400/10 px-3 py-2 text-sm text-amber-200">
                    {alert.title}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-5 rounded-xl border border-white/10 bg-white/5 p-4">
            <h2 className="text-lg font-bold text-white">Confirm Room Availability</h2>
            <p className="mt-1 text-sm text-slate-400">Owners should update room status daily so CRM and marketplace stay accurate.</p>
            <form
              className="mt-4 grid gap-3 md:grid-cols-4"
              onSubmit={(e) => {
                e.preventDefault();
                setStatusMessage('');
                confirmRoomStatus.mutate(
                  { room_id: roomId, status: roomStatus },
                  {
                    onSuccess: () => setStatusMessage('Room status confirmed successfully.'),
                    onError: (error: any) => setStatusMessage(error?.message || 'Could not confirm room status.')
                  }
                );
              }}
            >
              <select className="select-modern" value={roomId} onChange={(e) => setRoomId(e.target.value)} required>
                <option value="">Room</option>
                {inventory.map((room: any) => (
                  <option key={room.id} value={room.id}>{room.properties?.name ?? room.property_id} - {room.room_type}</option>
                ))}
              </select>
              <select className="select-modern" value={roomStatus} onChange={(e) => setRoomStatus(e.target.value)}>
                {ROOM_STATUSES.map((status) => (
                  <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                ))}
              </select>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                Signed in owner
                <div className="mt-1 font-medium text-white">{ownerName}</div>
              </div>
              <button className="btn-primary" type="submit" disabled={confirmRoomStatus.isPending}>
                {confirmRoomStatus.isPending ? 'Saving...' : 'Confirm'}
              </button>
            </form>
            {statusMessage && <p className="mt-3 text-sm text-cyan-300">{statusMessage}</p>}
          </div>

          <div className="mb-3 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-cyan-300" />
            <h2 className="text-lg font-bold text-white">Effort by Property</h2>
          </div>
          {isLoading ? (
            <p className="text-sm text-slate-400">Loading effort metrics...</p>
          ) : effort.length === 0 ? (
            <p className="text-sm text-slate-400">No effort data available.</p>
          ) : (
            <div className="space-y-2">
              {effort.slice(0, 20).map((row: any) => (
                <div key={row.id ?? row.property_id} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
                  {row.name ?? row.property_name ?? JSON.stringify(row)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
