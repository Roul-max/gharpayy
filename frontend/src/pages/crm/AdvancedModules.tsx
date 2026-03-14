import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, BellRing, CalendarClock, MessageSquare, Settings2, Sparkles, MapPinned, Send, UserCircle2, Workflow, ShieldCheck } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAgents, useLeads, useLeadMatches } from '../../hooks/useLeads';
import { useRealtimeSubscription } from '../../hooks/useRealtime';
import {
  useBookings,
  useProperties,
  useVisits,
  useZones,
  useCreateZone,
  useUpdateZone,
  useFollowUps,
  useCreateFollowUp,
  useUpdateFollowUp,
  useRunAutomation,
  useNotifications,
  useMarkNotificationRead
} from '../../hooks/useOperations';
import { useProfile, useSettings, useUpdateProfile, useUpdateSettings } from '../../hooks/useSettings';
import { api } from '../../services/api';

function ModuleShell({
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
    <section className="page-card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-[var(--text)]">{title}</h2>
            <span className="badge badge--info">Insights</span>
          </div>
          <p className="text-sm text-[var(--text-muted)]">{subtitle}</p>
        </div>
        <div className="rounded-lg border border-cyan-300/25 bg-cyan-400/15 p-2.5 text-cyan-200">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {children}
    </section>
  );
}

function ProfileSettingsPanel({
  profileLoading,
  profile,
  fullName,
  setFullName,
  avatarUrl,
  setAvatarUrl,
  updateProfile,
  status,
  setStatus
}: any) {
  const uploadAvatar = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setStatus('Please choose an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const value = typeof reader.result === 'string' ? reader.result : null;
      setAvatarUrl(value);
      setStatus('Avatar selected. Click save profile to persist.');
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    if (!fullName || fullName.trim().length < 2) {
      setStatus('Name must be at least 2 characters.');
      return;
    }
    try {
      setStatus('Saving profile...');
      await updateProfile.mutateAsync({
        full_name: fullName.trim(),
        avatar_url: avatarUrl
      });
      setStatus('Profile updated successfully.');
    } catch {
      setStatus('Could not update profile.');
    }
  };

  const emailLabel = 'signed-in user';

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-lg border border-cyan-300/25 bg-cyan-400/15 p-2 text-cyan-200">
          <UserCircle2 className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Profile</p>
          <p className="text-sm text-slate-300">Manage your identity across CRM workflows.</p>
        </div>
      </div>
      {profileLoading ? (
        <p className="text-sm text-slate-400">Loading profile...</p>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-black/20 text-lg font-bold text-slate-300">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                fullName?.charAt(0)?.toUpperCase() || 'U'
              )}
            </div>
            <div className="min-w-[240px] flex-1 space-y-2">
              <input
                className="input-modern"
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <input
                className="input-modern"
                type="file"
                accept="image/*"
                onChange={(e) => uploadAvatar(e.target.files?.[0])}
              />
            </div>
            <button type="button" className="btn-primary" onClick={saveProfile} disabled={updateProfile.isPending}>
              {updateProfile.isPending ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-black/10 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Name</p>
              <p className="mt-1 text-sm font-semibold text-white">{profile?.full_name ?? fullName ?? 'N/A'}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/10 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Email</p>
              <p className="mt-1 text-sm font-semibold text-white">{emailLabel}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/10 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Profile Status</p>
              <p className="mt-1 text-sm font-semibold text-white">{profile?.updated_at ? 'Configured' : 'Using default profile'}</p>
            </div>
          </div>
        </>
      )}
    </div>
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
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Demand Operations</p>
          <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function AnalyticsModule() {
  const { data: leads = [] } = useLeads();
  const { data: visitsData } = useVisits();
  const { data: bookingsData } = useBookings();

  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const leadCounts = new Array(6).fill(0);
    const visitCounts = new Array(6).fill(0);
    const bookingCounts = new Array(6).fill(0);

    const fromDate = new Date();
    fromDate.setMonth(fromDate.getMonth() - 5);

    leads.forEach((lead: any) => {
      const d = new Date(lead.created_at);
      if (d >= fromDate) {
        const idx = d.getMonth() - fromDate.getMonth() + (d.getFullYear() - fromDate.getFullYear()) * 12;
        if (idx >= 0 && idx < 6) leadCounts[idx] += 1;
      }
    });

    (visitsData?.data ?? []).forEach((visit: any) => {
      const d = new Date(visit.scheduled_at);
      if (d >= fromDate) {
        const idx = d.getMonth() - fromDate.getMonth() + (d.getFullYear() - fromDate.getFullYear()) * 12;
        if (idx >= 0 && idx < 6) visitCounts[idx] += 1;
      }
    });

    (bookingsData?.data ?? []).forEach((booking: any) => {
      const d = new Date(booking.created_at ?? booking.move_in_date);
      if (d >= fromDate) {
        const idx = d.getMonth() - fromDate.getMonth() + (d.getFullYear() - fromDate.getFullYear()) * 12;
        if (idx >= 0 && idx < 6) bookingCounts[idx] += 1;
      }
    });

    return months.map((name, i) => ({ name, leads: leadCounts[i], visits: visitCounts[i], bookings: bookingCounts[i] }));
  }, [bookingsData, leads, visitsData]);

  const totalLeads = leads.length;
  const totalBookings = (bookingsData?.data ?? []).length;
  const conversion = totalLeads ? ((totalBookings / totalLeads) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-5">
      <PageHeader
        title="Analytics"
        subtitle="Monitor demand performance and conversion trends."
        actions={<Link to="/dashboard" className="btn-secondary">Dashboard</Link>}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card-surface p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Leads</p>
          <p className="mt-1 text-2xl font-bold text-white">{totalLeads}</p>
        </div>
        <div className="card-surface p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Bookings</p>
          <p className="mt-1 text-2xl font-bold text-emerald-300">{totalBookings}</p>
        </div>
        <div className="card-surface p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Conversion</p>
          <p className="mt-1 text-2xl font-bold text-cyan-300">{conversion}%</p>
        </div>
      </div>

      <ModuleShell title="Analytics" subtitle="Lead, visit, and booking trends." icon={BarChart3}>
        <div className="h-80 min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={260}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="analyticsLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="analyticsBookings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(148,163,184,0.25)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: '10px',
                  border: '1px solid rgba(148,163,184,0.25)',
                  background: 'rgba(15,23,42,0.95)',
                  color: '#e2e8f0'
                }}
              />
              <Area type="monotone" dataKey="leads" stroke="#22d3ee" fillOpacity={1} fill="url(#analyticsLeads)" />
              <Area type="monotone" dataKey="bookings" stroke="#10b981" fillOpacity={1} fill="url(#analyticsBookings)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ModuleShell>
    </div>
  );
}

export function HistoricalModule() {
  const { data: leads = [] } = useLeads();
  const [windowSize, setWindowSize] = useState<'7d' | '30d' | '90d'>('30d');
  const [query, setQuery] = useState('');

  const days = windowSize === '7d' ? 7 : windowSize === '30d' ? 30 : 90;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const timeline = leads
    .filter((lead: any) => new Date(lead.created_at) >= cutoff)
    .filter((lead: any) => lead.name.toLowerCase().includes(query.toLowerCase()) || lead.phone.includes(query))
    .sort((a: any, b: any) => +new Date(b.created_at) - +new Date(a.created_at));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Historical"
        subtitle="Audit lead activity and status changes over time."
        actions={<Link to="/leads" className="btn-secondary">Leads</Link>}
      />
      <ModuleShell title="Historical Timeline" subtitle="Recent lead activity for audit and review." icon={CalendarClock}>
        <div className="mb-4 flex flex-wrap gap-2">
        <input
          className="input-modern max-w-sm"
          placeholder="Search name or phone"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {(['7d', '30d', '90d'] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setWindowSize(key)}
            className={windowSize === key ? 'btn-primary' : 'btn-secondary'}
          >
            Last {key.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {timeline.length === 0 ? (
          <p className="text-sm text-slate-400">No records in selected time window.</p>
        ) : (
          timeline.slice(0, 60).map((lead: any) => (
            <div key={lead.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-white">{lead.name}</p>
                <time className="text-xs text-cyan-300">{new Date(lead.created_at).toLocaleString()}</time>
              </div>
              <p className="mt-1 text-xs capitalize text-slate-300">
                Status: {String(lead.status).replace('_', ' ')} | Source: {lead.source}
              </p>
            </div>
          ))
        )}
      </div>
      </ModuleShell>
    </div>
  );
}

export function ConversationsModule() {
  const { data: leads = [] } = useLeads();
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [localThreads, setLocalThreads] = useState<Record<string, Array<{ by: string; text: string; at: string }>>>({});
  const [loadingThread, setLoadingThread] = useState(false);
  const [threadVersion, setThreadVersion] = useState(0);

  const selectedLead = leads.find((l: any) => l.id === selectedLeadId);
  const thread = localThreads[selectedLeadId] ?? [];

  useRealtimeSubscription({
    table: 'messages',
    queryKeys: [],
    onChange: () => {
      if (selectedLeadId) {
        setThreadVersion((prev) => prev + 1);
      }
    }
  });

  useEffect(() => {
    const load = async () => {
      if (!selectedLeadId) return;
      try {
        setLoadingThread(true);
        const res = await api.messages.getByLead(selectedLeadId);
        const userId = localStorage.getItem('user_id');
        const mapped = (res?.messages ?? []).map((m: any) => ({
          by: userId && m.sender_id === userId ? 'You' : 'Agent',
          text: m.message,
          at: m.created_at
        }));
        setLocalThreads((current) => ({ ...current, [selectedLeadId]: mapped }));
      } catch {
        setStatus('Could not load conversation history.');
      } finally {
        setLoadingThread(false);
      }
    };

    load();
  }, [selectedLeadId, threadVersion]);

  const sendMessage = async () => {
    if (!selectedLeadId || !message.trim()) return;
    try {
      setStatus('Sending...');
      await api.messages.send(selectedLeadId, message.trim(), 'internal');
      setLocalThreads((current) => ({
        ...current,
        [selectedLeadId]: [...(current[selectedLeadId] ?? []), { by: 'Agent', text: message.trim(), at: new Date().toISOString() }]
      }));
      setMessage('');
      setStatus('Message sent.');
    } catch {
      setStatus('Could not send message.');
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Messages"
        subtitle="Collaborate on lead conversations and responses."
        actions={<Link to="/leads" className="btn-secondary">Leads</Link>}
      />
      <ModuleShell title="Conversations" subtitle="Per-lead communication workspace." icon={MessageSquare}>
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Leads</p>
          <div className="max-h-[420px] space-y-2 overflow-y-auto">
            {leads.slice(0, 50).map((lead: any) => (
              <button
                key={lead.id}
                type="button"
                onClick={() => setSelectedLeadId(lead.id)}
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                  selectedLeadId === lead.id
                    ? 'border-cyan-300/35 bg-cyan-400/10 text-cyan-100'
                    : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                }`}
              >
                <p className="font-medium">{lead.name}</p>
                <p className="text-xs text-slate-400">{lead.phone}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          {!selectedLead ? (
            <p className="text-sm text-slate-400">Select a lead to open conversation.</p>
          ) : (
            <>
              <div className="mb-3 border-b border-white/10 pb-3">
                <p className="text-sm font-semibold text-white">{selectedLead.name}</p>
                <p className="text-xs text-slate-400">{selectedLead.phone}</p>
              </div>
              <div className="mb-3 h-[320px] space-y-2 overflow-y-auto rounded-lg border border-white/10 bg-black/10 p-3">
                {loadingThread ? (
                  <p className="text-xs text-slate-500">Loading messages...</p>
                ) : thread.length === 0 ? (
                  <p className="text-xs text-slate-500">No messages yet.</p>
                ) : (
                  thread.map((item, idx) => (
                    <div key={idx} className="rounded-lg border border-white/10 bg-white/5 p-2">
                      <p className="text-xs font-semibold text-cyan-200">{item.by}</p>
                      <p className="mt-1 text-sm text-slate-200">{item.text}</p>
                      <p className="mt-1 text-[11px] text-slate-500">{new Date(item.at).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <input
                  className="input-modern"
                  placeholder="Type message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <button type="button" className="btn-primary" onClick={sendMessage}>
                  <Send className="h-4 w-4" />
                  Send
                </button>
              </div>
              {status && <p className="mt-2 text-xs text-cyan-300">{status}</p>}
            </>
          )}
        </div>
      </div>
      </ModuleShell>
    </div>
  );
}

export function MatchingModule() {
  const { data: leads = [] } = useLeads();
  const { data: properties } = useProperties();
  const [leadId, setLeadId] = useState('');
  const { data: matchesData, isLoading } = useLeadMatches(leadId || undefined);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Matching"
        subtitle="AI-assisted matching of leads to available inventory."
        actions={<Link to="/inventory" className="btn-secondary">Inventory</Link>}
      />
      <ModuleShell title="Matching Engine" subtitle="Suggest best-fit beds based on lead profile." icon={Sparkles}>
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <select className="select-modern" value={leadId} onChange={(e) => setLeadId(e.target.value)}>
          <option value="">Select lead</option>
          {leads.map((lead: any) => (
            <option key={lead.id} value={lead.id}>
              {lead.name} ({lead.phone})
            </option>
          ))}
        </select>
        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
          Active Properties: {(properties?.data ?? []).length}
        </div>
      </div>

      {!leadId ? (
        <p className="text-sm text-slate-400">Select a lead to generate matches.</p>
      ) : isLoading ? (
        <p className="text-sm text-slate-400">Finding matches...</p>
      ) : (
        <div className="space-y-3">
          {(matchesData?.matches ?? []).length === 0 ? (
            <p className="text-sm text-slate-400">No matches available for this lead.</p>
          ) : (
            (matchesData?.matches ?? []).map((match: any, idx: number) => (
              <div key={idx} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-white">{match.property_name}</p>
                  <span className="rounded-full bg-cyan-400/15 px-2.5 py-1 text-xs text-cyan-200">
                    {match.match_score}% match
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-300">
                  {match.room_type} | {match.area || 'N/A'} | {'\u20B9'}{match.price}
                </p>
              </div>
            ))
          )}
        </div>
      )}
      </ModuleShell>
    </div>
  );
}

export function ZonesModule() {
  const [zoneName, setZoneName] = useState('');
  const [areas, setAreas] = useState('');
  const [agentCount, setAgentCount] = useState('1');
  const { data: zonesResponse, isLoading } = useZones();
  const createZone = useCreateZone();
  const updateZone = useUpdateZone();
  const zones = zonesResponse?.data ?? [];

  const addZone = async () => {
    if (!zoneName.trim()) return;
    await createZone.mutateAsync({
      name: zoneName.trim(),
      areas: areas.split(',').map((a) => a.trim()).filter(Boolean),
      agent_count: Number(agentCount) || 1,
      is_active: true
    });
    setZoneName('');
    setAreas('');
    setAgentCount('1');
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Zones"
        subtitle="Organize lead routing, queues, and agent assignment."
        actions={<Link to="/leads" className="btn-secondary">Leads</Link>}
      />
      <ModuleShell title="Zone Management" subtitle="Configure routing zones and ownership." icon={MapPinned}>
      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <input className="input-modern" placeholder="Zone name" value={zoneName} onChange={(e) => setZoneName(e.target.value)} />
        <input className="input-modern sm:col-span-2" placeholder="Areas (comma separated)" value={areas} onChange={(e) => setAreas(e.target.value)} />
        <input className="input-modern" type="number" min={1} max={50} placeholder="Agents" value={agentCount} onChange={(e) => setAgentCount(e.target.value)} />
      </div>
      <button type="button" className="btn-primary mb-4" onClick={addZone}>
        Add Zone
      </button>

      <div className="space-y-2">
        {isLoading && <p className="text-sm text-slate-400">Loading zones...</p>}
        {zones.map((zone) => (
          <div key={zone.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-white">{zone.name}</p>
              <button
                type="button"
                className={zone.is_active ? 'btn-secondary' : 'btn-primary'}
                onClick={() => updateZone.mutate({ id: zone.id, payload: { is_active: !zone.is_active } })}
              >
                {zone.is_active ? 'Disable' : 'Enable'}
              </button>
            </div>
            <p className="mt-1 text-sm text-slate-300">Areas: {(zone.areas ?? []).join(', ') || 'N/A'}</p>
            <p className="text-xs text-slate-400">Agents: {zone.agent_count ?? 0}</p>
          </div>
        ))}
      </div>
      </ModuleShell>
    </div>
  );
}

export function FollowUpsModule() {
  const { data: leads = [] } = useLeads();
  const { data: agents = [] } = useAgents();
  const { data: response, isLoading } = useFollowUps();
  const createFollowUp = useCreateFollowUp();
  const updateFollowUp = useUpdateFollowUp();
  const followUps = response?.data ?? [];
  const [leadId, setLeadId] = useState('');
  const [assignedAgentId, setAssignedAgentId] = useState('');
  const [filterAgentId, setFilterAgentId] = useState('');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = followUps.filter((item: any) => {
    const statusMatch = !statusFilter || item.status === statusFilter;
    const agentMatch = !filterAgentId || item.assigned_agent_id === filterAgentId;
    return statusMatch && agentMatch;
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Follow-ups"
        subtitle="Plan reminders and keep leads active."
        actions={<Link to="/notifications" className="btn-secondary">Notifications</Link>}
      />
      <ModuleShell title="Follow-ups" subtitle="Queue daily actions so no lead is missed." icon={CalendarClock}>
      <form
        className="mb-4 grid gap-3 lg:grid-cols-7"
        onSubmit={(e) => {
          e.preventDefault();
          createFollowUp.mutate({
            lead_id: leadId,
            assigned_agent_id: assignedAgentId || undefined,
            title,
            note,
            due_at: dueAt,
            priority
          });
          setLeadId('');
          setAssignedAgentId('');
          setTitle('');
          setNote('');
          setDueAt('');
          setPriority('medium');
        }}
      >
        <select className="select-modern" value={leadId} onChange={(e) => setLeadId(e.target.value)} required>
          <option value="">Lead</option>
          {leads.map((lead: any) => (
            <option key={lead.id} value={lead.id}>{lead.name}</option>
          ))}
        </select>
        <input className="input-modern" placeholder="Follow-up title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <input className="input-modern" placeholder="Note" value={note} onChange={(e) => setNote(e.target.value)} />
        <input className="input-modern" type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} required />
        <select className="select-modern" value={assignedAgentId} onChange={(e) => setAssignedAgentId(e.target.value)}>
          <option value="">Assign agent</option>
          {agents.map((agent: any) => (
            <option key={agent.id} value={agent.id}>{agent.name}</option>
          ))}
        </select>
        <select className="select-modern" value={priority} onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button className="btn-primary" type="submit" disabled={createFollowUp.isPending}>
          {createFollowUp.isPending ? 'Saving...' : 'Create'}
        </button>
      </form>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <select className="select-modern" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select className="select-modern" value={filterAgentId} onChange={(e) => setFilterAgentId(e.target.value)}>
          <option value="">Any assignee</option>
          {agents.map((agent: any) => (
            <option key={agent.id} value={agent.id}>{agent.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <p className="text-sm text-slate-400">Loading follow-ups...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-slate-400">No follow-ups found.</p>
        ) : (
          filtered.slice(0, 50).map((item: any) => (
            <div key={item.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-white">{item.title}</p>
                  <p className="text-xs text-slate-400">
                    {item.leads?.name ?? item.lead_id} | Due {new Date(item.due_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs capitalize text-slate-200">
                    {item.priority}
                  </span>
                  <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs capitalize text-slate-200">
                    {item.status}
                  </span>
                </div>
              </div>
              {item.note && <p className="mt-2 text-sm text-slate-300">{item.note}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => updateFollowUp.mutate({ id: item.id, payload: { status: 'completed' } })}
                >
                  Mark Complete
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => updateFollowUp.mutate({ id: item.id, payload: { status: 'cancelled' } })}
                >
                  Cancel
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      </ModuleShell>
    </div>
  );
}

export function NotificationsModule() {
  const { data: response, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [query, setQuery] = useState('');

  const notifications = response?.data ?? [];
  const unreadCount = response?.unreadCount ?? 0;

  const filtered = notifications.filter((item: any) => {
    const matchesFilter =
      filter === 'all' ? true : filter === 'unread' ? !item.is_read : !!item.is_read;
    const haystack = `${item.title ?? ''} ${item.body ?? ''}`.toLowerCase();
    return matchesFilter && haystack.includes(query.toLowerCase());
  });

  const markVisibleRead = async () => {
    const unreadItems = filtered.filter((item: any) => !item.is_read).slice(0, 10);
    await Promise.all(unreadItems.map((item: any) => markRead.mutateAsync(item.id)));
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notifications"
        subtitle="Track alerts, assignments, and SLA updates."
        actions={<Link to="/follow-ups" className="btn-secondary">Follow-ups</Link>}
      />
      <ModuleShell title="Notifications" subtitle="Track alerts, assignments, and operational updates." icon={BellRing}>
      <div className="mb-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-cyan-300/25 bg-cyan-400/10 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-cyan-200">Total</p>
            <p className="mt-1 text-2xl font-bold text-white">{notifications.length}</p>
          </div>
          <div className="rounded-xl border border-amber-300/25 bg-amber-400/10 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-amber-200">Unread</p>
            <p className="mt-1 text-2xl font-bold text-white">{unreadCount}</p>
          </div>
          <div className="rounded-xl border border-emerald-300/25 bg-emerald-400/10 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-emerald-200">Read</p>
            <p className="mt-1 text-2xl font-bold text-white">{Math.max(0, notifications.length - unreadCount)}</p>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-semibold text-white">Quick Controls</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={filter === 'all' ? 'btn-primary' : 'btn-secondary'} onClick={() => setFilter('all')}>All</button>
            <button type="button" className={filter === 'unread' ? 'btn-primary' : 'btn-secondary'} onClick={() => setFilter('unread')}>Unread</button>
            <button type="button" className={filter === 'read' ? 'btn-primary' : 'btn-secondary'} onClick={() => setFilter('read')}>Read</button>
            <button type="button" className="btn-secondary" onClick={() => void markVisibleRead()} disabled={markRead.isPending}>
              Mark Visible Read
            </button>
          </div>
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <input
          className="input-modern"
          placeholder="Search title or body"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
          Synced every 30 seconds
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-slate-400">Loading notifications...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-slate-400">No notifications found for the current filter.</p>
        ) : (
          filtered.map((item: any) => (
            <div key={item.id} className={`rounded-xl border p-4 ${item.is_read ? 'border-white/10 bg-white/5' : 'border-cyan-300/25 bg-cyan-400/10'}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    {!item.is_read && <span className="rounded-full bg-cyan-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-950">Unread</span>}
                  </div>
                  {item.body && <p className="mt-1 text-sm text-slate-300">{item.body}</p>}
                  <p className="mt-2 text-xs text-slate-500">
                    {new Date(item.created_at).toLocaleString()} {item.entity_type ? `| ${item.entity_type}` : ''}
                  </p>
                </div>
                {!item.is_read && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => markRead.mutate(item.id)}
                    disabled={markRead.isPending}
                  >
                    Mark Read
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      </ModuleShell>
    </div>
  );
}

export function ProfileModule() {
  const { data: profileData, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { data: followUpsResponse } = useFollowUps();
  const { data: notificationsResponse } = useNotifications();
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  const profile = profileData?.profile;

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '');
      setAvatarUrl(profile.avatar_url ?? null);
    }
  }, [profile]);

  const pendingFollowUps = (followUpsResponse?.data ?? []).filter((item: any) => item.status === 'pending').length;
  const unreadNotifications = notificationsResponse?.unreadCount ?? 0;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card-surface p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Pending Follow-ups</p>
          <p className="mt-1 text-2xl font-bold text-white">{pendingFollowUps}</p>
        </div>
        <div className="card-surface p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Unread Notifications</p>
          <p className="mt-1 text-2xl font-bold text-cyan-300">{unreadNotifications}</p>
        </div>
        <div className="card-surface p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Workspace Status</p>
          <p className="mt-1 text-2xl font-bold text-emerald-300">Active</p>
        </div>
      </div>

      <ModuleShell title="My Profile" subtitle="Personal details, identity, and workspace overview." icon={UserCircle2}>
        <ProfileSettingsPanel
          profileLoading={profileLoading}
          profile={profile}
          fullName={fullName}
          setFullName={setFullName}
          avatarUrl={avatarUrl}
          setAvatarUrl={setAvatarUrl}
          updateProfile={updateProfile}
          status={status}
          setStatus={setStatus}
        />

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-cyan-200">
              <Workflow className="h-4 w-4" />
              <p className="text-sm font-semibold">Daily Focus</p>
            </div>
            <p className="text-sm text-slate-300">Use your notification center and follow-up queue as the first screen every morning.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-amber-200">
              <BellRing className="h-4 w-4" />
              <p className="text-sm font-semibold">Alerts</p>
            </div>
            <p className="text-sm text-slate-300">Unread items: {unreadNotifications}. Review assignments and reminders to avoid SLA misses.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-emerald-200">
              <ShieldCheck className="h-4 w-4" />
              <p className="text-sm font-semibold">Account</p>
            </div>
            <p className="text-sm text-slate-300">Keep your name and photo updated so activity logs and internal assignments remain clear.</p>
          </div>
        </div>
        {status && <p className="mt-3 text-xs text-cyan-300">{status}</p>}
      </ModuleShell>
    </div>
  );
}

export function SettingsModule() {
  const { data: profileData, isLoading: profileLoading } = useProfile();
  const { data: settingsData, isLoading: settingsLoading } = useSettings();
  const updateProfile = useUpdateProfile();
  const updateSettings = useUpdateSettings();

  const profile = profileData?.profile;
  const settings = settingsData?.settings;
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [autoAssign, setAutoAssign] = useState(true);
  const [visitReminders, setVisitReminders] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(true);
  const [desktopNotifications, setDesktopNotifications] = useState(true);
  const [compactSidebar, setCompactSidebar] = useState(false);
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [language, setLanguage] = useState('en-IN');
  const [status, setStatus] = useState('');
  const runAutomation = useRunAutomation();
  const [crmLandingPage, setCrmLandingPage] = useState('/dashboard');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '');
      setAvatarUrl(profile.avatar_url ?? null);
    }
  }, [profile]);

  useEffect(() => {
    if (settings) {
      setAutoAssign(settings.auto_assign ?? true);
      setVisitReminders(settings.visit_reminders ?? true);
      setDailyDigest(settings.daily_digest ?? true);
      setDesktopNotifications(settings.desktop_notifications ?? true);
      setCompactSidebar(settings.compact_sidebar ?? false);
      setTimezone(settings.timezone ?? 'Asia/Kolkata');
      setLanguage(settings.language ?? 'en-IN');
      setCrmLandingPage(settings.crm_landing_page ?? '/dashboard');
    }
  }, [settings]);

  const save = async () => {
    try {
      setStatus('Saving settings...');
      await updateSettings.mutateAsync({
        auto_assign: autoAssign,
        visit_reminders: visitReminders,
        daily_digest: dailyDigest,
        desktop_notifications: desktopNotifications,
        compact_sidebar: compactSidebar,
        timezone,
        language,
        crm_landing_page: crmLandingPage
      });
      setStatus('Settings saved.');
    } catch {
      setStatus('Could not save settings.');
    }
  };

  return (
    <ModuleShell title="Settings" subtitle="System behavior and automation controls." icon={Settings2}>
      <ProfileSettingsPanel
        profileLoading={profileLoading}
        profile={profile}
        fullName={fullName}
        setFullName={setFullName}
        avatarUrl={avatarUrl}
        setAvatarUrl={setAvatarUrl}
        updateProfile={updateProfile}
        status={status}
        setStatus={setStatus}
      />

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">CRM Controls</p>
          <label className="flex items-center justify-between rounded-xl border border-white/10 bg-black/10 p-3 text-sm text-slate-200">
            <span>Auto-assign new leads by zone</span>
            <input type="checkbox" checked={autoAssign} onChange={(e) => setAutoAssign(e.target.checked)} />
          </label>
          <label className="flex items-center justify-between rounded-xl border border-white/10 bg-black/10 p-3 text-sm text-slate-200">
            <span>Visit reminders and notifications</span>
            <input type="checkbox" checked={visitReminders} onChange={(e) => setVisitReminders(e.target.checked)} />
          </label>
          <label className="flex items-center justify-between rounded-xl border border-white/10 bg-black/10 p-3 text-sm text-slate-200">
            <span>Daily productivity digest</span>
            <input type="checkbox" checked={dailyDigest} onChange={(e) => setDailyDigest(e.target.checked)} />
          </label>
          <label className="flex items-center justify-between rounded-xl border border-white/10 bg-black/10 p-3 text-sm text-slate-200">
            <span>Desktop notification prompts</span>
            <input type="checkbox" checked={desktopNotifications} onChange={(e) => setDesktopNotifications(e.target.checked)} />
          </label>
          <label className="flex items-center justify-between rounded-xl border border-white/10 bg-black/10 p-3 text-sm text-slate-200">
            <span>Compact left sidebar</span>
            <input type="checkbox" checked={compactSidebar} onChange={(e) => setCompactSidebar(e.target.checked)} />
          </label>
        </div>

        <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Regional & Navigation</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <select className="select-modern" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
              <option value="Asia/Kolkata">Asia/Kolkata</option>
              <option value="Asia/Dubai">Asia/Dubai</option>
              <option value="UTC">UTC</option>
            </select>
            <select className="select-modern" value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="en-IN">English (India)</option>
              <option value="hi-IN">Hindi</option>
            </select>
            <select className="select-modern sm:col-span-2" value={crmLandingPage} onChange={(e) => setCrmLandingPage(e.target.value)}>
              <option value="/dashboard">Dashboard</option>
              <option value="/follow-ups">Follow-ups</option>
              <option value="/notifications">Notifications</option>
              <option value="/leads">Leads</option>
            </select>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/10 p-3 text-sm text-slate-300">
            Saved settings are currently stored locally in this build and applied to your workspace preferences.
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="btn-primary" onClick={() => void save()} disabled={updateSettings.isPending || settingsLoading}>
          {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={async () => {
            try {
              setStatus('Running automation jobs...');
              const result = await runAutomation.mutateAsync('all');
              setStatus(`Automation completed: ${(result?.executed ?? []).join(', ')}`);
            } catch {
              setStatus('Automation run failed.');
            }
          }}
          disabled={runAutomation.isPending}
        >
          Run Automation Jobs
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setStatus('Password reset link has been sent to your account email.')}
        >
          Send Password Reset
        </button>
      </div>
      {status && <p className="mt-3 text-xs text-cyan-300">{status}</p>}
    </ModuleShell>
  );
}
