import { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { useLeads } from '../hooks/useLeads';
import { useRealtimeSubscription } from '../hooks/useRealtime';
import { api } from '../services/api';

export default function ConversationsPage() {
  const { data: leads = [] } = useLeads();
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [threads, setThreads] = useState<Record<string, Array<{ by: string; text: string; at: string }>>>({});
  const [loadingThread, setLoadingThread] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const selectedLead = (leads as any[]).find((lead) => lead.id === selectedLeadId);

  useRealtimeSubscription({
    table: 'messages',
    queryKeys: [['messages', selectedLeadId]],
    onChange: () => setRefreshKey((prev) => prev + 1)
  });

  useEffect(() => {
    if (!selectedLeadId) return;
    let active = true;
    const load = async () => {
      try {
        setLoadingThread(true);
        const response = await api.messages.getByLead(selectedLeadId);
        if (!active) return;
        const userId = localStorage.getItem('user_id');
        const mapped = (response?.messages ?? []).map((item: any) => ({
          by: userId && item.sender_id === userId ? 'You' : 'Agent',
          text: item.message,
          at: item.created_at
        }));
        setThreads((current) => ({ ...current, [selectedLeadId]: mapped }));
      } catch {
        if (active) setStatus('Unable to load messages.');
      } finally {
        if (active) setLoadingThread(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [selectedLeadId, refreshKey]);

  const thread = threads[selectedLeadId] ?? [];

  const threadPreview = useMemo(() => {
    const previews: Record<string, string> = {};
    Object.keys(threads).forEach((leadId) => {
      const items = threads[leadId];
      previews[leadId] = items?.[items.length - 1]?.text ?? '';
    });
    return previews;
  }, [threads]);

  const sendMessage = async () => {
    if (!selectedLeadId || !message.trim()) return;
    try {
      setStatus('Sending...');
      await api.messages.send(selectedLeadId, message.trim(), 'internal');
      setThreads((current) => ({
        ...current,
        [selectedLeadId]: [
          ...(current[selectedLeadId] ?? []),
          { by: 'Agent', text: message.trim(), at: new Date().toISOString() }
        ]
      }));
      setMessage('');
      setStatus('Message sent.');
    } catch {
      setStatus('Unable to send message.');
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">CRM</p>
          <h1 className="mt-2 text-2xl font-bold text-white">Conversations</h1>
          <p className="mt-2 text-sm text-slate-400">Communicate with leads and owners.</p>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="card-surface p-4">
          <p className="mb-3 text-xs uppercase tracking-[0.14em] text-slate-400">Threads</p>
          <div className="max-h-[520px] space-y-2 overflow-y-auto">
            {(leads as any[]).length === 0 ? (
              <p className="text-sm text-slate-400">No leads available.</p>
            ) : (
              (leads as any[]).map((lead) => (
                <button
                  key={lead.id}
                  type="button"
                  onClick={() => setSelectedLeadId(lead.id)}
                  className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                    selectedLeadId === lead.id
                      ? 'border-cyan-300/40 bg-cyan-400/10 text-cyan-100'
                      : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                  }`}
                >
                  <p className="font-semibold">{lead.name}</p>
                  <p className="text-xs text-slate-400">{threadPreview[lead.id] ?? lead.phone}</p>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="card-surface flex min-h-[520px] flex-col p-4">
          {!selectedLead ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center text-slate-400">
              <MessageSquare className="mb-3 h-8 w-8 text-slate-500" />
              Select a lead to open the conversation.
            </div>
          ) : (
            <>
              <div className="mb-3 border-b border-white/10 pb-3">
                <p className="text-sm font-semibold text-white">{selectedLead.name}</p>
                <p className="text-xs text-slate-400">{selectedLead.phone}</p>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto rounded-xl border border-white/10 bg-black/10 p-3">
                {loadingThread ? (
                  <p className="text-xs text-slate-500">Loading messages...</p>
                ) : thread.length === 0 ? (
                  <p className="text-xs text-slate-500">No messages yet.</p>
                ) : (
                  thread.map((item, index) => (
                    <div key={index} className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-cyan-200">{item.by}</p>
                        <span className="text-[11px] text-slate-500">{new Date(item.at).toLocaleString()}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-100">{item.text}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  className="input-modern"
                  placeholder="Type your message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                />
                <button className="btn-primary" type="button" onClick={sendMessage}>
                  <Send className="h-4 w-4" />
                  Send
                </button>
              </div>
              {status && <p className="mt-2 text-xs text-cyan-300">{status}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
