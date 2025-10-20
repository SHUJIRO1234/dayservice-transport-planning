import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableUserCard from './SortableUserCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Car, Users, Clock, MapPin, Route, Accessibility } from 'lucide-react';

// 車両パネル用のドロップゾーン
const VehicleTripDropZone = ({ vehicleId, tripIndex, children, isEmpty }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `trip-${vehicleId}-${tripIndex}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        min-h-[120px] rounded-lg p-3 transition-all
        ${isOver ? 'bg-green-100 border-2 border-green-500' : 'bg-gray-50 border border-gray-200'}
        ${isEmpty ? 'border-dashed' : ''}
      `}
    >
      {children}
    </div>
  );
};

// 未割り当てパネル
const UnassignedPanel = ({ users, onToggleAbsent, isDragging }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: 'unassigned',
  });

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="w-5 h-5" />
          未割り当て
          <Badge variant="secondary">{users.length}名</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          ref={setNodeRef}
          className={`
            space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-2 p-3 rounded-lg transition-all
            ${isOver ? 'bg-blue-100 border-2 border-blue-500' : ''}
            ${isDragging && !isOver ? 'bg-green-50 border-2 border-green-400 border-dashed' : ''}
          `}
        >
          {isDragging && (
            <div className="text-center text-green-600 font-semibold py-2 bg-green-100 rounded-lg mb-2 text-sm">
              ここにドロップして未割り当てに戻す
            </div>
          )}
          <SortableContext
            items={users.map(u => u.id)}
            strategy={verticalListSortingStrategy}
          >
            {users.map((user) => (
              <SortableUserCard
                key={user.id}
                user={user}
                showAbsentToggle={true}
                onToggleAbsent={onToggleAbsent}
              />
            ))}
          </SortableContext>
          {users.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              すべて割り当て済み
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// 車両パネル
const VehiclePanel = ({ vehicle, assignment, onOptimize }) => {
  const trips = assignment?.trips || [];
  const totalUsers = trips.reduce((sum, trip) => sum + trip.users.length, 0);
  const wheelchairUsers = trips.reduce((sum, trip) => 
    sum + trip.users.filter(u => u.wheelchair).length, 0
  );

  return (
    <Card className={`h-full ${!vehicle.isActive ? 'opacity-50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Car className="w-5 h-5" />
            {vehicle.name}
            {!vehicle.isActive && (
              <Badge variant="secondary" className="bg-gray-300">無効</Badge>
            )}
          </CardTitle>
          <Button
            onClick={() => onOptimize(vehicle.id)}
            size="sm"
            variant="outline"
            disabled={!vehicle.isActive || totalUsers === 0}
          >
            <Route className="w-4 h-4 mr-1" />
            最適化
          </Button>
        </div>
        <div className="flex gap-2 mt-2 text-xs">
          <Badge variant="outline">
            {totalUsers}/{vehicle.capacity}名
          </Badge>
          <Badge variant="outline">
            <Accessibility className="w-3 h-3 mr-1" />
            {wheelchairUsers}/{vehicle.wheelchairCapacity}台
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
          {trips.map((trip, tripIndex) => (
            <div key={tripIndex} className="bg-white rounded-lg border border-gray-200 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">第{tripIndex + 1}便</span>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {trip.distance?.toFixed(1) || '0.0'}km
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {trip.duration || 0}分
                  </div>
                </div>
              </div>

              <VehicleTripDropZone
                vehicleId={vehicle.id}
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
                      />
                    ))}
                  </div>
                </SortableContext>

                {trip.users.length === 0 && (
                  <div className="text-center py-4 text-gray-400 text-xs">
                    利用者をドラッグ&ドロップ
                  </div>
                )}
              </VehicleTripDropZone>
            </div>
          ))}

          {trips.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              自動割り当てを実行してください
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// メインのダッシュボードビュー
const DashboardView = ({
  vehicles,
  vehicleAssignments,
  unassignedUsers,
  onToggleAbsent,
  onOptimizeVehicle,
  activeId,
}) => {
  const activeVehicles = vehicles.filter(v => v.isActive);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 未割り当てパネル */}
      <div className="lg:col-span-1">
        <UnassignedPanel
          users={unassignedUsers}
          onToggleAbsent={onToggleAbsent}
          isDragging={!!activeId}
        />
      </div>

      {/* 車両パネル */}
      {activeVehicles.map(vehicle => (
        <div key={vehicle.id} className="lg:col-span-1">
          <VehiclePanel
            vehicle={vehicle}
            assignment={vehicleAssignments[vehicle.id]}
            onOptimize={onOptimizeVehicle}
          />
        </div>
      ))}
    </div>
  );
};

export default DashboardView;

