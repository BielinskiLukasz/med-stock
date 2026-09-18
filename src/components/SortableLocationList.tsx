import type { ReactNode } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { useLang } from '@/i18n'
import type { Location } from '@/lib/db'

interface SortableLocationListProps {
  locations: Location[]
  renderRow: (loc: Location) => ReactNode
  onDragEnd: (oldIndex: number, newIndex: number) => void
}

// D-14: drag handle + up/down buttons operate on the same list simultaneously.
// This component owns only the drag mechanics — the caller (LocationsScreen) owns
// what a row looks like via `renderRow`. D-16: "Other" is filtered out by the
// caller before this component ever sees the array — it is not a Location record.
export function SortableLocationList({ locations, renderRow, onDragEnd }: SortableLocationListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = locations.findIndex((l) => l.id === active.id)
    const newIndex = locations.findIndex((l) => l.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    onDragEnd(oldIndex, newIndex)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={locations.map((l) => l.id)} strategy={verticalListSortingStrategy}>
        {locations.map((loc) => (
          <SortableLocationRow key={loc.id} location={loc}>
            {renderRow(loc)}
          </SortableLocationRow>
        ))}
      </SortableContext>
    </DndContext>
  )
}

function SortableLocationRow({ location, children }: { location: Location; children: ReactNode }) {
  const { t } = useLang()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: location.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className={`flex items-center py-2 border-b last:border-0 ${location.hidden ? 'opacity-60' : ''}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={t('aria.dragHandle')}
        className="flex items-center justify-center min-h-11 min-w-11 shrink-0 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex items-center justify-between flex-1 min-w-0">{children}</div>
    </div>
  )
}
