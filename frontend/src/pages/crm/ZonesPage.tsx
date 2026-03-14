import { useMemo, useState } from 'react';
import { Building2, Map, Pencil, Plus, Users, X } from 'lucide-react';
import { useCreateZone, useUpdateZone, useZones } from '../../hooks/useOperations';
import DataTable from '../../components/crm/DataTable';
import KpiCard from '../../components/crm/KpiCard';

export default function ZonesPage() {
  const { data: zones = [], isLoading } = useZones();
  const createZone = useCreateZone();
  const updateZone = useUpdateZone();

  const [showModal, setShowModal] = useState(false);
  const [editZone, setEditZone] = useState<any | null>(null);
  const [form, setForm] = useState({ name: '', areas: '', agents: '' });

  const stats = useMemo(() => {
    let areas = 0;
    let agents = 0;
    (zones as any[]).forEach((zone) => {
      areas += (zone.areas ?? []).length;
      agents += Number(zone.agent_count ?? 0);
    });
    return { zones: (zones as any[]).length, areas, agents };
  }, [zones]);

  const openEdit = (zone: any) => {
    setEditZone(zone);
    setForm({
      name: zone.name ?? '',
      areas: (zone.areas ?? []).join(', '),
      agents: String(zone.agent_count ?? '')
    });
    setShowModal(true);
  };

  return (
    <div className="page-shell">
      <div className="page-card">
        <div className="page-header">
          <div>
            <p className="page-header__eyebrow">Zones</p>
            <h1 className="page-header__title mt-2">Zone Management</h1>
            <p className="page-header__subtitle">Assign areas and agents to zones for smarter routing.</p>
          </div>
          <div className="page-actions">
            <button
              className="btn-primary"
              onClick={() => {
                setEditZone(null);
                setForm({ name: '', areas: '', agents: '' });
                setShowModal(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add Zone
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <KpiCard title="Zones" value={stats.zones} icon={<Map className="h-5 w-5" />} tone="bg-cyan-400/15 text-cyan-200" hint="Live" />
        <KpiCard title="Areas" value={stats.areas} icon={<Building2 className="h-5 w-5" />} tone="bg-sky-400/15 text-sky-200" hint="Live" />
        <KpiCard title="Agents" value={stats.agents} icon={<Users className="h-5 w-5" />} tone="bg-emerald-400/15 text-emerald-200" hint="Live" />
      </div>

      <DataTable
        columns={[
          { key: 'name', label: 'Zone Name', className: 'font-semibold text-white', render: (zone: any) => zone.name },
          { key: 'areas', label: 'Areas Covered', render: (zone: any) => (zone.areas ?? []).join(', ') || '-' },
          { key: 'agents', label: 'Assigned Agents', render: (zone: any) => zone.agent_count ?? 0 },
          { key: 'queue', label: 'Lead Queue', render: (zone: any) => zone.lead_queue ?? zone.queue_length ?? 0 },
          {
            key: 'actions',
            label: 'Actions',
            render: (zone: any) => (
              <button className="btn-secondary" onClick={() => openEdit(zone)}>
                <Pencil className="h-4 w-4" />
                Edit
              </button>
            )
          }
        ]}
        data={zones as any[]}
        isLoading={isLoading}
        emptyState="No zones configured."
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="modal-surface w-full max-w-lg p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">{editZone ? 'Edit Zone' : 'Add Zone'}</h2>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form
              className="mt-4 space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                const parsedAgents = form.agents
                  .split(',')
                  .map((item) => item.trim())
                  .filter(Boolean);
                const payload = {
                  name: form.name,
                  areas: form.areas.split(',').map((item) => item.trim()).filter(Boolean),
                  agent_count: parsedAgents.length
                };
                if (editZone?.id) {
                  updateZone.mutate({ id: editZone.id, payload });
                } else {
                  createZone.mutate(payload);
                }
                setShowModal(false);
              }}
            >
              <input
                className="input-modern"
                placeholder="Zone name"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
              <input
                className="input-modern"
                placeholder="Areas (comma separated)"
                value={form.areas}
                onChange={(event) => setForm((prev) => ({ ...prev, areas: event.target.value }))}
              />
              <input
                className="input-modern"
                placeholder="Assigned agents (comma separated)"
                value={form.agents}
                onChange={(event) => setForm((prev) => ({ ...prev, agents: event.target.value }))}
              />
              <div className="flex justify-end gap-2">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={createZone.isPending || updateZone.isPending}>
                  {createZone.isPending || updateZone.isPending ? 'Saving...' : 'Save Zone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
