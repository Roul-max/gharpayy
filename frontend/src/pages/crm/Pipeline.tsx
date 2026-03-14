import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
  closestCorners,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BedDouble, CalendarCheck, GripVertical, Mail, Phone, Users, XCircle } from 'lucide-react';
import clsx from 'clsx';
import { useLeads, useUpdateLead } from '../../hooks/useLeads';
import KpiCard from '../../components/crm/KpiCard';
import { getLeadDisplayName } from '../../utils/leadDisplay';

const STAGES = [
  { id: 'new', label: 'New Lead' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'requirement_collected', label: 'Requirement Collected' },
  { id: 'property_suggested', label: 'Property Suggested' },
  { id: 'visit_scheduled', label: 'Visit Scheduled' },
  { id: 'visit_completed', label: 'Visit Completed' },
  { id: 'booked', label: 'Booked' },
  { id: 'lost', label: 'Lost' }
] as const;

type StageId = (typeof STAGES)[number]['id'];

type PipelineLead = {
  id: string;
  name: string;
  displayName: string;
  phone: string;
  email?: string | null;
  status: StageId;
  lead_score?: number | null;
};

const scoreTone = (score?: number | null) => {
  const value = score ?? 0;
  if (value >= 80) return 'pipeline-score-high';
  if (value >= 50) return 'pipeline-score-mid';
  return 'pipeline-score-low';
};

function SortableLead({ lead }: { lead: PipelineLead }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={clsx('pipeline-card rounded-xl border p-3 shadow-sm transition', isDragging && 'is-dragging')}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">{lead.displayName}</p>
        <GripVertical className="h-4 w-4 text-slate-500" />
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
        <Phone className="h-3.5 w-3.5" />
        {lead.phone}
      </div>
      {lead.email && (
        <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
          <Mail className="h-3.5 w-3.5" />
          {lead.email}
        </div>
      )}
      <div className="mt-3">
        <span className={clsx('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', scoreTone(lead.lead_score))}>
          Score {lead.lead_score ?? 0}
        </span>
      </div>
    </div>
  );
}

function PipelineLane({
  id,
  title,
  count,
  children
}: {
  id: string;
  title: string;
  count: number;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="pipeline-lane min-w-[240px] rounded-2xl border border-white/10 bg-slate-950/60 p-3">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-white">{title}</p>
        <span className="pipeline-lane-count rounded-full px-2 py-0.5 text-xs">{count}</span>
      </div>
      <div
        ref={setNodeRef}
        className={clsx('pipeline-dropzone space-y-3 rounded-xl border border-dashed border-white/10 p-2', isOver && 'is-over')}
      >
        {children}
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const { data: leads = [], isLoading } = useLeads();
  const updateLead = useUpdateLead();
  const [items, setItems] = useState<PipelineLead[]>([]);
  const [status, setStatus] = useState('');
  const lastSignature = useRef<string>('');

  const leadsSignature = useMemo(() => {
    return (leads as any[])
      .map((lead) => `${lead.id}:${lead.status ?? 'new'}:${lead.lead_score ?? 0}`)
      .sort()
      .join('|');
  }, [leads]);

  useEffect(() => {
    if (leadsSignature === lastSignature.current) return;
    lastSignature.current = leadsSignature;
    const mapped = (leads as any[]).map((lead) => ({
      id: lead.id,
      name: lead.name,
      displayName: getLeadDisplayName(lead),
      phone: lead.phone,
      email: lead.email,
      status: (STAGES.find((stage) => stage.id === lead.status)?.id ?? 'new') as StageId,
      lead_score: lead.lead_score
    }));
    setItems(mapped);
  }, [leadsSignature, leads]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    setItems((current) => {
      const activeIndex = current.findIndex((lead) => lead.id === activeId);
      if (activeIndex === -1) return current;

      const overLead = current.find((lead) => lead.id === overId);
      const destinationStage = overLead?.status ?? (overId.startsWith('stage-') ? overId.replace('stage-', '') : overId);

      const next = [...current];
      const [moved] = next.splice(activeIndex, 1);
      const updated = { ...moved, status: destinationStage as StageId };

      const insertIndex = overLead ? next.findIndex((lead) => lead.id === overLead.id) : next.length;
      next.splice(insertIndex < 0 ? next.length : insertIndex, 0, updated);

      const stageLabel = STAGES.find((stage) => stage.id === destinationStage)?.label ?? 'Updated';
      if (moved.status !== destinationStage) {
        setStatus(`${moved.displayName} moved to ${stageLabel}.`);
        updateLead.mutate(
          { id: moved.id, status: destinationStage },
          {
            onSuccess: () => setStatus(`${moved.displayName} moved to ${stageLabel}.`),
            onError: () => setStatus('Unable to update stage.')
          }
        );
      } else {
        setStatus(`${moved.displayName} reordered in ${stageLabel}.`);
      }

      return next;
    });
  };

  const stageMap = useMemo(() => {
    const map = new Map<StageId, PipelineLead[]>();
    STAGES.forEach((stage) => map.set(stage.id, []));
    items.forEach((lead) => {
      const bucket = map.get(lead.status) ?? map.get('new');
      if (bucket) bucket.push(lead);
    });
    return map;
  }, [items]);

  const totals = useMemo(() => {
    const total = items.length;
    const booked = items.filter((lead) => lead.status === 'booked').length;
    const lost = items.filter((lead) => lead.status === 'lost').length;
    const visitScheduled = items.filter((lead) => lead.status === 'visit_scheduled').length;
    const active = total - booked - lost;
    return { total, active, visitScheduled, booked, lost };
  }, [items]);

  return (
    <div className="pipeline-page page-shell">
      <div className="page-card">
        <div className="page-header">
          <div>
            <p className="page-header__eyebrow">Pipeline</p>
            <h1 className="page-header__title mt-2">Sales Pipeline</h1>
            <p className="page-header__subtitle">Drag leads across stages to update status in real time.</p>
          </div>
        </div>
        {status && <p className="mt-4 text-xs text-cyan-300">{status}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Total Leads" value={totals.total} icon={<Users className="h-5 w-5" />} tone="bg-cyan-400/15 text-cyan-200" hint="Live" />
        <KpiCard title="Active" value={totals.active} icon={<CalendarCheck className="h-5 w-5" />} tone="bg-sky-400/15 text-sky-200" hint="Live" />
        <KpiCard title="Visits Scheduled" value={totals.visitScheduled} icon={<BedDouble className="h-5 w-5" />} tone="bg-amber-400/15 text-amber-200" hint="Live" />
        <KpiCard title="Lost" value={totals.lost} icon={<XCircle className="h-5 w-5" />} tone="bg-rose-400/15 text-rose-200" hint="Live" />
      </div>

      {isLoading ? (
        <div className="card-surface p-6 text-sm text-slate-400">Loading pipeline...</div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="grid gap-4 pb-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {STAGES.map((stage) => {
              const stageItems = stageMap.get(stage.id) ?? [];
              return (
                <PipelineLane key={stage.id} id={`stage-${stage.id}`} title={stage.label} count={stageItems.length}>
                  <SortableContext items={stageItems.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                    {stageItems.map((lead) => (
                      <SortableLead key={lead.id} lead={lead} />
                    ))}
                  </SortableContext>
                  {stageItems.length === 0 && (
                    <div className="pipeline-empty rounded-xl border border-white/10 p-4 text-center text-xs">Drop lead here</div>
                  )}
                </PipelineLane>
              );
            })}
          </div>
        </DndContext>
      )}
    </div>
  );
}
