import React from 'react';
import { Truck, Users, Accessibility } from 'lucide-react';

const VehicleTabs = ({ vehicles, selectedVehicle, onSelectVehicle, vehicleAssignments }) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {vehicles.map((vehicle) => {
        const assignment = vehicleAssignments[vehicle.id] || { users: [], trips: [] };
        const totalUsers = assignment.users?.length || 0;
        const wheelchairUsers = assignment.users?.filter(u => u.wheelchair).length || 0;
        
        return (
          <button
            key={vehicle.id}
            onClick={() => onSelectVehicle(vehicle.id)}
            className={`flex-shrink-0 px-4 py-3 rounded-lg border-2 transition-all ${
              selectedVehicle === vehicle.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-300'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Truck className={`w-5 h-5 ${selectedVehicle === vehicle.id ? 'text-blue-600' : 'text-gray-600'}`} />
              <span className={`font-semibold ${selectedVehicle === vehicle.id ? 'text-blue-900' : 'text-gray-900'}`}>
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
      })}
    </div>
  );
};

export default VehicleTabs;

