import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, MapPin, Clock, Accessibility } from 'lucide-react';

const SortableUserCard = ({ user, index }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: user.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold">
        {index + 1}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">{user.name}</span>
          {user.wheelchair && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
              <Accessibility className="w-3 h-3" />
              車椅子
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
          <MapPin className="w-3 h-3" />
          {user.address}
        </div>
        {user.note && (
          <div className="text-xs text-amber-600 mt-1 bg-amber-50 px-2 py-1 rounded">
            {user.note}
          </div>
        )}
      </div>

      <div className="flex-shrink-0 text-right text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {user.pickupTime}
        </div>
      </div>
    </div>
  );
};

export default SortableUserCard;

