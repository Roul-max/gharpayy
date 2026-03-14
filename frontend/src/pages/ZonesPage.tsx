import { useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { useCreateZone, useUpdateZone, useZones } from '../hooks/useOperations';
import DataTable from '../components/crm/DataTable';

export default function ZonesPage() {
  const { data: zones = [], isLoading } = useZones();
  const createZone = useCreateZone();
  const updateZone = useUpdateZone();

  const [showModal, setShowModal] = useState(false);
  const [editZone, setEditZone] = useState<any | null>(null);
  const [form, setForm] = useState({ name: '', areas: '', agents: '' });

  const openEdit = (zone: any) => {
    setEditZone(zone);
    setForm({
      name: zone.name ?? '',
      areas: (zone.areas ?? []).join(', '),
      agents: (zone.assigned_agents ?? zone.agents ?? []).join(', ')
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">CRM</p>
          <h1 className="mt-2 text-2xl font-bold text-white">Zones</h1>
          <p className="mt-2 text-sm text-slate-400">Zone routing and team queues.</p>
        </div>
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
      </header>

      <DataTable
        columns={[
          { key: 'name', label: 'Zone Name', className: 'font-semibold text-white', render: (zone: any) => zone.name },
          { key: 'areas', label: 'Areas', render: (zone: any) => (zone.areas ?? []).join(', ') || '-' },
          { key: 'agents', label: 'Assigned Agents', render: (zone: any) => (zone.assigned_agents ?? zone.agents ?? []).join(', ') || '-' },
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
                Close
              </button>
            </div>
            <form
              className="mt-4 space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                const payload = {
                  name: form.name,
                  areas: form.areas.split(',').map((item) => item.trim()).filter(Boolean),
                  assigned_agents: form.agents.split(',').map((item) => item.trim()).filter(Boolean)
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
