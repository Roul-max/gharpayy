import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useCreateOwner, useOwners } from '../hooks/useOperations';
import DataTable from '../components/crm/DataTable';

export default function OwnersPage() {
  const { data, isLoading } = useOwners();
  const createOwner = useCreateOwner();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });

  const owners = data?.data ?? [];

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">CRM</p>
          <h1 className="mt-2 text-2xl font-bold text-white">Owners</h1>
          <p className="mt-2 text-sm text-slate-400">Manage property owners.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" />
          Add Owner
        </button>
      </header>

      <DataTable
        columns={[
          { key: 'name', label: 'Owner Name', className: 'font-semibold text-white', render: (owner: any) => owner.name },
          { key: 'phone', label: 'Phone', render: (owner: any) => owner.phone ?? '-' },
          { key: 'email', label: 'Email', render: (owner: any) => owner.email ?? '-' },
          { key: 'properties', label: 'Properties Owned', render: (owner: any) => owner.properties_owned ?? owner.properties?.length ?? 0 }
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
                Close
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
