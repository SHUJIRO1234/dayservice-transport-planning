import React from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Accessibility, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge.jsx'

// ドラッグ可能な個別アイテム
function SortableItem({ user, index }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: user.user_id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-3 p-3 bg-white rounded-lg border
        ${isDragging ? 'border-indigo-400 shadow-lg' : 'border-gray-200 hover:border-indigo-300'}
        transition-all duration-200
      `}
    >
      {/* ドラッグハンドル */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-indigo-600 transition-colors"
      >
        <GripVertical className="h-5 w-5" />
      </div>

      {/* 訪問順序番号 */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm">
        {index + 1}
      </div>

      {/* 利用者情報 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{user.name}</span>
          {user.wheelchair && (
            <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200">
              <Accessibility className="h-3 w-3 mr-1" />
              車椅子
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
          <MapPin className="h-3 w-3" />
          <span className="truncate">{user.address}</span>
        </div>
      </div>
    </div>
  )
}

// ドラッグ&ドロップ可能なリスト
export default function SortableRouteList({ users, onReorder }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event) => {
    const { active, over } = event

    if (active.id !== over.id) {
      const oldIndex = users.findIndex((user) => user.user_id === active.id)
      const newIndex = users.findIndex((user) => user.user_id === over.id)
      const newOrder = arrayMove(users, oldIndex, newIndex)
      onReorder(newOrder)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={users.map(u => u.user_id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {users.map((user, index) => (
            <SortableItem key={user.user_id} user={user} index={index} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

