import { useMemo, useState } from 'react';
import { BedDouble, Building2, Plus, Users, X } from 'lucide-react';
import { useCreateOwner, useOwners } from '../../hooks/useOperations';
import DataTable from '../../components/crm/DataTable';
import KpiCard from '../../components/crm/KpiCard';

export default function OwnersPage() {
  const { data, isLoading } = useOwners();
  const createOwner = useCreateOwner();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });

  const owners = data?.data ?? [];

  const stats = useMemo(() => {
    let properties = 0;
    let beds = 0;
    owners.forEach((owner: any) => {
      properties += owner.properties_owned ?? owner.properties?.length ?? 0;
      beds += owner.total_beds ?? owner.beds?.length ?? 0;
    });
    return { owners: owners.length, properties, beds };
  }, [owners]);

  return (
    <div className="page-shell">
      <div className="page-card">
        <div className="page-header">
          <div>
            <p className="page-header__eyebrow">Owners</p>
            <h1 className="page-header__title mt-2">Property Owners</h1>
            <p className="page-header__subtitle">Manage owner contacts and onboarding status.</p>
          </div>
          <div className="page-actions">
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <Plus className="h-4 w-4" />
              Add Owner
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <KpiCard title="Owners" value={stats.owners} icon={<Users className="h-5 w-5" />} tone="bg-cyan-400/15 text-cyan-200" hint="Live" />
        <KpiCard title="Properties" value={stats.properties} icon={<Building2 className="h-5 w-5" />} tone="bg-sky-400/15 text-sky-200" hint="Live" />
        <KpiCard title="Total Beds" value={stats.beds} icon={<BedDouble className="h-5 w-5" />} tone="bg-emerald-400/15 text-emerald-200" hint="Live" />
      </div>

      <DataTable
        columns={[
          { key: 'name', label: 'Owner Name', className: 'font-semibold text-white', render: (owner: any) => owner.name },
          { key: 'phone', label: 'Phone', render: (owner: any) => owner.phone ?? '-' },
          { key: 'email', label: 'Email', render: (owner: any) => owner.email ?? '-' },
          { key: 'properties', label: 'Properties Owned', render: (owner: any) => owner.properties_owned ?? owner.properties?.length ?? 0 },
          { key: 'beds', label: 'Total Beds', render: (owner: any) => owner.total_beds ?? owner.beds?.length ?? 0 }
        ]}
        data={owners}
        isLoading={isLoading}
        emptyState="No owners added yet."
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="modal-surface w-full max-w-lg p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Add Owner</h2>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form
              className="mt-4 space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                createOwner.mutate(form);
                setShowModal(false);
                setForm({ name: '', phone: '', email: '' });
              }}
            >
              <input
                className="input-modern"
                placeholder="Owner name"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
              <input
                className="input-modern"
                placeholder="Phone"
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              />
              <input
                className="input-modern"
                placeholder="Email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              />
              <div className="flex justify-end gap-2">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={createOwner.isPending}>
                  {createOwner.isPending ? 'Saving...' : 'Save Owner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
