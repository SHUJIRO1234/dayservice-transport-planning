import React from 'react';
import { Plus, Trash2, Clock, MapPin } from 'lucide-react';
import VehiclePrintView from './VehiclePrintView';
import VehicleQRCode from './VehicleQRCode';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableUserCard from './SortableUserCard';
import { Button } from '@/components/ui/button.jsx';

const TripDropZone = ({ vehicleId, tripIndex, children, isEmpty }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `trip-${vehicleId}-${tripIndex}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        min-h-[150px] rounded-lg p-4 transition-all relative
        ${isOver ? 'bg-green-100 border-2 border-green-500 shadow-lg' : 'bg-gray-50 border-2 border-gray-200'}
        ${isEmpty ? 'border-dashed border-4' : ''}
      `}
    >
      {isOver && (
        <div className="absolute top-0 left-0 right-0 text-center text-green-600 font-semibold py-2 bg-green-50 rounded-t-lg z-10">
          ここにドロップできます
        </div>
      )}
      <div className={isOver ? 'mt-10' : ''}>
        {children}
      </div>
    </div>
  );
};

const TripManager = ({ 
  vehicleId,
  vehicle,
  trips, 
  facility,
  selectedDay,
  selectedTrip,
  onAddTrip, 
  onRemoveTrip, 
  onReorderUsers,
  onToggleOrderFixed,
  onOptimizeTrip
}) => {
  return (
    <div className="space-y-4">
      {/* 車両全体の印刷ボタンとQRコード */}
      {vehicle && trips.length > 0 && trips.some(t => t.users.length > 0) && (
        <div className="flex justify-end gap-2 mb-4">
          <VehicleQRCode
            vehicle={vehicle}
            selectedDay={selectedDay}
            selectedTrip={selectedTrip}
          />
          <VehiclePrintView 
            vehicle={{
              ...vehicle,
              trips: trips.map((trip, idx) => ({
                ...trip,
                totalDistance: trip.distance,
                totalTime: trip.duration
              }))
            }}
            selectedDay={selectedDay}
          />
        </div>
      )}
      {trips.map((trip, tripIndex) => (
        <div key={tripIndex} className="rounded-lg bg-white">
          <div className="flex items-center justify-between mb-3 px-4 pt-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg">第{tripIndex + 1}便</span>
              <span className="text-sm text-gray-600">
                {trip.users.length}名 / 距離: {trip.distance?.toFixed(2) || '0.00'} km / 
                時間: {trip.duration || 0}分
              </span>
            </div>
            <div className="flex items-center gap-2">
              {trip.users.length > 1 && (
                <Button
                  onClick={() => onOptimizeTrip(vehicleId, tripIndex)}
                  size="sm"
                  variant="outline"
                >
                  <MapPin className="w-4 h-4 mr-1" />
                  最適化
                </Button>
              )}
              {trips.length > 1 && (
                <Button
                  onClick={() => onRemoveTrip(vehicleId, tripIndex)}
                  size="sm"
                  variant="destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          <TripDropZone 
            vehicleId={vehicleId} 
            tripIndex={tripIndex}
            isEmpty={trip.users.length === 0}
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
                    showOrderFixedToggle={true}
                    onToggleOrderFixed={onToggleOrderFixed}
                  />
                ))}
              </div>
            </SortableContext>

            {trip.users.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                利用者をここにドラッグ&ドロップしてください
              </div>
            )}
          </TripDropZone>
        </div>
      ))}

      <Button
        onClick={() => onAddTrip(vehicleId)}
        variant="outline"
        className="w-full py-6 border-2 border-dashed"
      >
        <Plus className="w-5 h-5 mr-2" />
        便を追加
      </Button>
    </div>
  );
};

export default TripManager;

