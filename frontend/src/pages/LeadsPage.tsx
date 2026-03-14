import { useMemo, useState } from 'react';
import { ArrowUpDown, Plus, Search } from 'lucide-react';
import { useAgents, useCreateLead, useLeads } from '../hooks/useLeads';
import { LEAD_STATUSES } from '../constants/enums';
import DataTable from '../components/crm/DataTable';
import LeadDrawer from '../components/crm/LeadDrawer';

const SOURCES = ['website', 'referral', 'walk_in', 'partner', 'other'];

type SortKey = 'name' | 'status' | 'last_activity';

type LeadRecord = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  source?: string | null;
  status?: string | null;
  assigned_agent_id?: string | null;
  last_activity_at?: string | null;
  created_at?: string | null;
  lead_score?: number | null;
};

function formatDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

export default function LeadsPage() {
  const { data: leads = [], isLoading, error } = useLeads();
  const { data: agents = [] } = useAgents();
  const createLead = useCreateLead();

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('last_activity');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [drawerLead, setDrawerLead] = useState<LeadRecord | null>(null);
  const [showModal, setShowModal] = useState(false);

  const agentMap = useMemo(() => {
    const map = new Map<string, string>();
    agents.forEach((agent: any) => map.set(agent.id, agent.name));
    return map;
  }, [agents]);

  const filtered = useMemo(() => {
    return (leads as LeadRecord[]).filter((lead) => {
      const haystack = `${lead.name} ${lead.phone} ${lead.source ?? ''}`.toLowerCase();
      const matchesQuery = !query || haystack.includes(query.toLowerCase());
      const matchesStatus = !statusFilter || lead.status === statusFilter;
      const matchesSource = !sourceFilter || lead.source === sourceFilter;
      return matchesQuery && matchesStatus && matchesSource;
    });
  }, [leads, query, statusFilter, sourceFilter]);

  const sorted = useMemo(() => {
    const next = [...filtered];
    next.sort((a, b) => {
      const getValue = (item: LeadRecord) => {
        if (sortKey === 'name') return item.name ?? '';
        if (sortKey === 'status') return item.status ?? '';
        const last = item.last_activity_at ?? item.created_at ?? '';
        return new Date(last).getTime();
      };
      const aVal = getValue(a);
      const bVal = getValue(b);

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return sortDir === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
    return next;
  }, [filtered, sortDir, sortKey]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">CRM</p>
          <h1 className="mt-2 text-2xl font-bold text-white">Leads</h1>
          <p className="mt-2 text-sm text-slate-400">Track and prioritize inbound leads.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" />
          Add Lead
        </button>
      </header>

      <section className="card-surface p-5">
        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.6fr_0.6fr]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              className="input-modern pl-10"
              placeholder="Search name, phone, source"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <select className="select-modern" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
            <option value="">All sources</option>
            {SOURCES.map((source) => (
              <option key={source} value={source}>
                {source.replace('_', ' ')}
              </option>
            ))}
          </select>
          <select className="select-modern" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All statuses</option>
            {LEAD_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
      </section>

      <DataTable
        columns={[
          {
            key: 'name',
            label: 'Name',
            className: 'font-semibold text-white',
            render: (lead: LeadRecord) => (
              <div className="flex items-center gap-2">
                <span>{lead.name}</span>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleSort('name');
                  }}
                >
                  <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
                </button>
              </div>
            )
          },
          { key: 'phone', label: 'Phone', className: 'text-slate-200' },
          { key: 'source', label: 'Source', render: (lead: LeadRecord) => lead.source ?? '-' },
          {
            key: 'status',
            label: 'Status',
            render: (lead: LeadRecord) => (
              <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-medium capitalize text-slate-200">
                {String(lead.status ?? 'new').replace('_', ' ')}
              </span>
            )
          },
          {
            key: 'assigned',
            label: 'Assigned Agent',
            render: (lead: LeadRecord) =>
              lead.assigned_agent_id ? agentMap.get(lead.assigned_agent_id) ?? 'Unassigned' : 'Unassigned'
          },
          {
            key: 'last_activity_at',
            label: 'Last Activity',
            render: (lead: LeadRecord) => (
              <div className="flex items-center gap-2">
                <span>{formatDate(lead.last_activity_at ?? lead.created_at)}</span>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleSort('last_activity');
                  }}
                >
                  <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
                </button>
              </div>
            )
          }
        ]}
        data={sorted}
        isLoading={isLoading}
        emptyState={error ? 'Unable to load leads.' : 'No leads match your filters.'}
        onRowClick={(lead) => setDrawerLead(lead)}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="modal-surface w-full max-w-lg p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Add Lead</h2>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200">
                Close
              </button>
            </div>
            <form
              className="mt-4 space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                createLead.mutate({
                  name: String(form.get('name') ?? ''),
                  phone: String(form.get('phone') ?? ''),
                  email: String(form.get('email') ?? ''),
                  source: String(form.get('source') ?? 'other'),
                  status: 'new'
                });
                setShowModal(false);
              }}
            >
              <input className="input-modern" name="name" placeholder="Lead name" required />
              <input className="input-modern" name="phone" placeholder="Phone number" required />
              <input className="input-modern" name="email" placeholder="Email (optional)" />
              <select className="select-modern" name="source" defaultValue="website">
                {SOURCES.map((source) => (
                  <option key={source} value={source}>
                    {source.replace('_', ' ')}
                  </option>
                ))}
              </select>
              <div className="flex justify-end gap-2">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={createLead.isPending}>
                  {createLead.isPending ? 'Saving...' : 'Save Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {drawerLead && (
        <LeadDrawer
          lead={drawerLead}
          assignedAgent={drawerLead.assigned_agent_id ? agentMap.get(drawerLead.assigned_agent_id) ?? 'Unassigned' : 'Unassigned'}
          onClose={() => setDrawerLead(null)}
        />
      )}
    </div>
  );
}
