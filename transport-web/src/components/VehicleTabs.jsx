import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Truck, Users, Accessibility } from 'lucide-react';

const VehicleTabs = ({ vehicles, selectedVehicle, onSelectVehicle, vehicleAssignments }) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {vehicles.map((vehicle) => {
        const assignment = vehicleAssignments[vehicle.id] || { trips: [] };
        
        // 全便の利用者数を合計
        let totalUsers = 0;
        let wheelchairUsers = 0;
        assignment.trips.forEach(trip => {
          const users = trip.users || [];
          totalUsers += users.length;
          wheelchairUsers += users.filter(u => u.wheelchair).length;
        });
        
        return (
          <VehicleTab
            key={vehicle.id}
            vehicle={vehicle}
            isSelected={selectedVehicle === vehicle.id}
            onSelect={() => onSelectVehicle(vehicle.id)}
            totalUsers={totalUsers}
            wheelchairUsers={wheelchairUsers}
          />
        );
      })}
    </div>
  );
};

const VehicleTab = ({ vehicle, isSelected, onSelect, totalUsers, wheelchairUsers }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `vehicle-${vehicle.id}`,
  });

  return (
    <button
      ref={setNodeRef}
      onClick={onSelect}
      className={`flex-shrink-0 px-4 py-3 rounded-lg border-2 transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : isOver
          ? 'border-green-500 bg-green-50'
          : 'border-gray-200 bg-white hover:border-blue-300'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <Truck className={`w-5 h-5 ${isSelected ? 'text-blue-600' : isOver ? 'text-green-600' : 'text-gray-600'}`} />
        <span className={`font-semibold ${isSelected ? 'text-blue-900' : isOver ? 'text-green-900' : 'text-gray-900'}`}>
          {vehicle.name}
        </span>
      </div>
      <div className="text-xs text-gray-600">
        <div>担当: {vehicle.driver}</div>
        <div className="flex items-center gap-2 mt-1">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {totalUsers}/{vehicle.capacity}
          </span>
          <span className="flex items-center gap-1">
            <Accessibility className="w-3 h-3" />
            {wheelchairUsers}/{vehicle.wheelchairCapacity}
          </span>
        </div>
      </div>
    </button>
  );
};

export default VehicleTabs;

