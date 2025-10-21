import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, MapPin, Clock, Accessibility, UserX } from 'lucide-react';

const SortableUserCard = ({ user, index, onToggleAbsent, showAbsentToggle = false, compact = false }) => {
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

  const handleAbsentToggle = (e) => {
    e.stopPropagation();
    if (onToggleAbsent) {
      onToggleAbsent(user.id);
    }
  };

  // コンパクトモード（全体ビュー用）
  if (compact) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`flex items-center gap-1 p-1.5 rounded border text-xs transition-colors ${
          user.isAbsent
            ? 'bg-gray-100 border-gray-300 opacity-60'
            : 'bg-white border-gray-200 hover:border-blue-300 cursor-grab active:cursor-grabbing'
        }`}
      >
        {index !== undefined && (
          <div className="flex-shrink-0 w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold text-xs">
            {index + 1}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="truncate">
            <span className={`font-semibold ${user.isAbsent ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
              {user.name}
            </span>
            {user.wheelchair && (
              <Accessibility className="w-3 h-3 inline-block ml-1 text-purple-600" />
            )}
            {user.isAbsent && (
              <UserX className="w-3 h-3 inline-block ml-1 text-red-600" />
            )}
          </div>
          <div className="text-gray-500 truncate text-xs">
            {user.address}
          </div>
        </div>
      </div>
    );
  }

  // 通常モード（タブビュー用）
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
        user.isAbsent
          ? 'bg-gray-100 border-gray-300 opacity-60'
          : 'bg-gray-50 border-gray-200 hover:border-blue-300 cursor-grab active:cursor-grabbing'
      }`}
    >
      {showAbsentToggle && (
        <div className="flex-shrink-0" onClick={handleAbsentToggle}>
          <input
            type="checkbox"
            checked={user.isAbsent || false}
            onChange={handleAbsentToggle}
            className="w-4 h-4 cursor-pointer"
            title="欠席としてマーク"
          />
        </div>
      )}

      <div className="text-gray-400">
        <GripVertical className="w-5 h-5" />
      </div>

      {index !== undefined && (
        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold">
          {index + 1}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-semibold ${user.isAbsent ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
            {user.name}
          </span>
          {user.isAbsent && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">
              <UserX className="w-3 h-3" />
              欠席
            </span>
          )}
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

