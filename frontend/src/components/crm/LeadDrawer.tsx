import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { getLeadDisplayName } from '../../utils/leadDisplay';

interface LeadDrawerProps {
  lead: any;
  assignedAgent?: string;
  onClose: () => void;
}

export default function LeadDrawer({ lead, assignedAgent, onClose }: LeadDrawerProps) {
  const navigate = useNavigate();
  const [actionStatus, setActionStatus] = useState('');
  const leadName = getLeadDisplayName(lead);
  const leadId = lead?.id ?? '';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
      <div className="flex h-full w-full max-w-md flex-col border-l border-white/10 bg-slate-950">
        <div className="flex items-center justify-between border-b border-white/10 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Lead Details</p>
            <h3 className="mt-1 text-xl font-bold text-white">{leadName}</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {actionStatus && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
              {actionStatus}
            </div>
          )}
          <div className="space-y-2 text-sm text-slate-300">
            <p><span className="text-slate-400">Phone:</span> {lead.phone}</p>
            <p><span className="text-slate-400">Email:</span> {lead.email ?? '-'}</p>
            <p><span className="text-slate-400">Source:</span> {lead.source ?? '-'}</p>
            <p><span className="text-slate-400">Status:</span> {String(lead.status ?? 'new').replace('_', ' ')}</p>
            <p><span className="text-slate-400">Assigned:</span> {assignedAgent ?? 'Unassigned'}</p>
            <p><span className="text-slate-400">Last activity:</span> {lead.last_activity_at ? new Date(lead.last_activity_at).toLocaleString() : '-'}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Lead Score</p>
            <p className="mt-2 text-2xl font-bold text-cyan-300">{lead.lead_score ?? 0}</p>
            <p className="mt-2 text-sm text-slate-400">Use follow-ups to increase conversion likelihood.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Next Actions</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setActionStatus(`Scheduling a visit for ${leadName}.`);
                  navigate(`/crm/visits?lead=${encodeURIComponent(leadId)}`);
                }}
              >
                Schedule Visit
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setActionStatus(`Opening messages with ${leadName}.`);
                  navigate(`/crm/conversations?lead=${encodeURIComponent(leadId)}`);
                }}
              >
                Send Message
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setActionStatus(`Assigning an agent to ${leadName}.`);
                  navigate(`/crm/leads?lead=${encodeURIComponent(leadId)}`);
                }}
              >
                Assign Agent
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
