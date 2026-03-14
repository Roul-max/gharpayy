import { ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';

interface KanbanColumnProps {
  id: string;
  title: string;
  count: number;
  children: ReactNode;
}

export default function KanbanColumn({ id, title, count, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="w-[280px] shrink-0 rounded-2xl border border-white/10 bg-slate-950/60 p-3">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-white">{title}</p>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-300">{count}</span>
      </div>
      <div ref={setNodeRef} className={`space-y-3 rounded-xl border border-dashed border-white/10 p-2 ${isOver ? 'bg-white/10' : 'bg-transparent'}`}>
        {children}
      </div>
    </div>
  );
}
