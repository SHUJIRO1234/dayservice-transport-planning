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
        min-h-[60px] rounded-lg p-2 transition-all
        ${isOver ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-50 border border-gray-200'}
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
    <Card className="h-[calc(100vh-120px)]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4" />
          未割り当て
          <Badge variant="secondary" className="text-xs">{users.length}名</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-60px)]">
        <div
          ref={setNodeRef}
          className={`
            space-y-1 h-full overflow-y-auto pr-2 p-2 rounded-lg transition-all
            ${isOver ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-50 border border-gray-200'}
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
                compact={true}
                showCheckbox={true}
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
  // 便がない場合は空の第1便を作成
  const trips = assignment?.trips || [{ users: [], distance: 0, duration: 0 }];
  const totalUsers = trips.reduce((sum, trip) => sum + trip.users.length, 0);
  const wheelchairUsers = trips.reduce((sum, trip) => 
    sum + trip.users.filter(u => u.wheelchair).length, 0
  );

  return (
    <Card className={`h-[calc(100vh-120px)] ${!vehicle.isActive ? 'opacity-50' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Car className="w-4 h-4" />
            {vehicle.name}
            {!vehicle.isActive && (
              <Badge variant="secondary" className="bg-gray-300 text-xs">無効</Badge>
            )}
          </CardTitle>
          <Button
            onClick={() => onOptimize(vehicle.id)}
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            disabled={!vehicle.isActive || totalUsers === 0}
          >
            <Route className="w-3 h-3 mr-1" />
            最適化
          </Button>
        </div>
        <div className="flex gap-2 mt-1 text-xs">
          <Badge variant="outline" className="text-xs">
            {totalUsers}/{vehicle.capacity}名
          </Badge>
          <Badge variant="outline" className="text-xs">
            <Accessibility className="w-3 h-3 mr-1" />
            {wheelchairUsers}/{vehicle.wheelchairCapacity}台
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="h-[calc(100%-100px)]">
        <div className="space-y-2 h-full overflow-y-auto pr-2">
          {trips.map((trip, tripIndex) => (
            <div key={tripIndex} className="bg-white rounded-lg border border-gray-200 p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-xs">第{tripIndex + 1}便</span>
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <MapPin className="w-3 h-3" />
                  {trip.distance?.toFixed(1) || '0.0'}km
                  <Clock className="w-3 h-3 ml-1" />
                  {trip.duration || 0}分
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
                  <div className="space-y-1">
                    {trip.users.map((user, userIndex) => (
                      <SortableUserCard
                        key={user.id}
                        user={user}
                        index={userIndex}
                        compact={true}
                      />
                    ))}
                  </div>
                </SortableContext>

                {trip.users.length === 0 && (
                  <div className="text-center py-2 text-gray-400 text-xs">
                    ドラッグ&ドロップ
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
    <div className="flex gap-4 overflow-x-auto pb-4">
      {/* 未割り当てパネル */}
      <div className="flex-shrink-0 w-64">
        <UnassignedPanel
          users={unassignedUsers}
          onToggleAbsent={onToggleAbsent}
          isDragging={!!activeId}
        />
      </div>

      {/* 車両パネル */}
      {activeVehicles.map(vehicle => (
        <div key={vehicle.id} className="flex-shrink-0 w-64">
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

