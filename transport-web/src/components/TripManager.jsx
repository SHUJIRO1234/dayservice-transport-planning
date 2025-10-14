import React from 'react';
import { Plus, Trash2, Clock, MapPin } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableUserCard from './SortableUserCard';

const TripManager = ({ 
  vehicle, 
  trips, 
  onAddTrip, 
  onRemoveTrip, 
  onReorderUsers,
  onMoveUserBetweenTrips 
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (tripIndex) => (event) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    onReorderUsers(tripIndex, active.id, over.id);
  };

  return (
    <div className="space-y-4">
      {trips.map((trip, tripIndex) => (
        <div key={tripIndex} className="border-2 border-gray-200 rounded-lg p-4 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg">第{tripIndex + 1}便</span>
              <span className="text-sm text-gray-600">
                {trip.users.length}名 / 距離: {trip.distance?.toFixed(2) || '0.00'} km / 
                時間: {trip.duration || 0}分
              </span>
            </div>
            {trips.length > 1 && (
              <button
                onClick={() => onRemoveTrip(tripIndex)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd(tripIndex)}
          >
            <SortableContext
              items={trip.users.map(u => u.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {trip.users.map((user, userIndex) => (
                  <SortableUserCard
                    key={user.id}
                    user={user}
                    index={userIndex}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {trip.users.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              利用者をドラッグ&ドロップで追加してください
            </div>
          )}
        </div>
      ))}

      <button
        onClick={onAddTrip}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        便を追加
      </button>
    </div>
  );
};

export default TripManager;

