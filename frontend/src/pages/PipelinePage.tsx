import { useEffect, useMemo, useState } from 'react';
import { DndContext, DragEndEvent, PointerSensor, KeyboardSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Mail, Phone } from 'lucide-react';
import { useLeads, useUpdateLead } from '../hooks/useLeads';
import KanbanColumn from '../components/crm/KanbanColumn';

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
  phone: string;
  email?: string | null;
  status: StageId;
  lead_score?: number | null;
};

function SortableLead({ lead }: { lead: PipelineLead }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-xl border border-white/10 bg-white/5 p-3 shadow-sm transition ${
        isDragging ? 'scale-[1.02] bg-white/10' : 'hover:bg-white/10'
      }`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">{lead.name}</p>
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
        <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-semibold text-cyan-200">
          Score {lead.lead_score ?? 0}
        </span>
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const { data: leads = [], isLoading } = useLeads();
  const updateLead = useUpdateLead();
  const [items, setItems] = useState<PipelineLead[]>([]);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const mapped = (leads as any[]).map((lead) => ({
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      status: (STAGES.find((stage) => stage.id === lead.status)?.id ?? 'new') as StageId,
      lead_score: lead.lead_score
    }));
    setItems(mapped);
  }, [leads]);

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

      if (moved.status !== destinationStage) {
        updateLead.mutate(
          { id: moved.id, status: destinationStage },
          {
            onSuccess: () => setStatus('Stage updated.'),
            onError: () => setStatus('Unable to update stage.')
          }
        );
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

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">CRM</p>
          <h1 className="mt-2 text-2xl font-bold text-white">Pipeline</h1>
          <p className="mt-2 text-sm text-slate-400">Manage lead stages and conversions.</p>
        </div>
      </header>
      {status && <p className="text-xs text-cyan-300">{status}</p>}

      {isLoading ? (
        <div className="card-surface p-6 text-sm text-slate-400">Loading pipeline...</div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="flex min-w-max gap-4 overflow-x-auto pb-4">
            {STAGES.map((stage) => {
              const stageItems = stageMap.get(stage.id) ?? [];
              return (
                <KanbanColumn key={stage.id} id={`stage-${stage.id}`} title={stage.label} count={stageItems.length}>
                  <SortableContext items={stageItems.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                    {stageItems.map((lead) => (
                      <SortableLead key={lead.id} lead={lead} />
                    ))}
                  </SortableContext>
                  {stageItems.length === 0 && (
                    <div className="rounded-xl border border-white/10 p-4 text-center text-xs text-slate-500">Drop lead here</div>
                  )}
                </KanbanColumn>
              );
            })}
          </div>
        </DndContext>
      )}
    </div>
  );
}
