import { ReactNode } from 'react';
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';

export type KanbanColumn<T> = {
  id: string;
  title: string;
  items: T[];
};

interface KanbanBoardProps<T> {
  columns: Array<KanbanColumn<T>>;
  getItemId: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  onDragEnd: (event: DragEndEvent) => void;
}

function ColumnDrop({ id, children }: { id: string; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`space-y-3 rounded-xl border border-dashed border-white/10 p-2 ${isOver ? 'bg-white/10' : 'bg-transparent'}`}>
      {children}
    </div>
  );
}

export default function KanbanBoard<T>({ columns, getItemId, renderItem, onDragEnd }: KanbanBoardProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
      <div className="flex min-w-max gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <div key={column.id} className="w-[280px] shrink-0 rounded-2xl border border-white/10 bg-slate-950/60 p-3">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">{column.title}</p>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-300">{column.items.length}</span>
            </div>
            <ColumnDrop id={`stage-${column.id}`}>
              <SortableContext items={column.items.map(getItemId)} strategy={verticalListSortingStrategy}>
                {column.items.map((item) => (
                  <div key={getItemId(item)}>{renderItem(item)}</div>
                ))}
              </SortableContext>
              {column.items.length === 0 && (
                <div className="rounded-xl border border-white/10 p-4 text-center text-xs text-slate-500">Drop lead here</div>
              )}
            </ColumnDrop>
          </div>
        ))}
      </div>
    </DndContext>
  );
}
