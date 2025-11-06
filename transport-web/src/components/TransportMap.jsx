import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Leafletのデフォルトアイコンの問題を修正
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// 事業所用のカスタムアイコン
const facilityIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

// 利用者用のカスタムアイコン（青）
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

// 車椅子利用者用のカスタムアイコン（紫）
const wheelchairIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

// 番号付きマーカーを作成する関数
const createNumberedIcon = (number, color = 'blue') => {
  return L.divIcon({
    className: 'custom-numbered-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: white;
        font-size: 14px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      ">${number}</div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  })
}

// 車両ごとの色
const vehicleColors = [
  '#3B82F6', // 青
  '#EF4444', // 赤
  '#10B981', // 緑
  '#F59E0B', // オレンジ
  '#8B5CF6', // 紫
  '#EC4899', // ピンク
]

// 地図の中心を調整するコンポーネント
function MapBoundsUpdater({ locations }) {
  const map = useMap()

  useEffect(() => {
    if (locations && locations.length > 0) {
      const bounds = L.latLngBounds(locations.map(loc => [loc.lat, loc.lng]))
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [locations, map])

  return null
}

export default function TransportMap({ facility, users, route = null, vehicleAssignments = null, vehicles = null, enableVehicleSelection = false, selectedVehicle = null }) {
  const [locations, setLocations] = useState([])
  const [activeVehicle, setActiveVehicle] = useState(null) // 選択された車両

  // デバッグ用
  useEffect(() => {
    console.log('TransportMap - activeVehicle:', activeVehicle)
    console.log('TransportMap - vehicleAssignments:', vehicleAssignments)
    console.log('TransportMap - vehicles:', vehicles)
  }, [activeVehicle, vehicleAssignments, vehicles])

  useEffect(() => {
    // 座標データを直接使用
    const allLocations = []

    // 事業所の座標を追加
    if (facility && facility.lat && facility.lng) {
      allLocations.push({
        lat: facility.lat,
        lng: facility.lng,
        name: facility.facility_name,
        type: 'facility',
        address: facility.address
      })
    }

    // 利用者の座標を追加
    if (users && users.length > 0) {
      users.forEach(user => {
        if (user.lat && user.lng) {
          allLocations.push({
            lat: user.lat,
            lng: user.lng,
            name: user.name,
            type: 'user',
            address: user.address,
            wheelchair: user.wheelchair,
            pickup_time: user.pickup_time
          })
        }
      })
    }

    setLocations(allLocations)
  }, [facility, users])

  // デフォルトの中心座標（東京都世田谷区桜新町）
  const defaultCenter = [35.6284, 139.6489]

  const facilityLocation = locations.find(loc => loc.type === 'facility')
  const userLocations = locations.filter(loc => loc.type === 'user')
  const center = facilityLocation ? [facilityLocation.lat, facilityLocation.lng] : defaultCenter

  return (
    <div className="w-full h-[600px] rounded-lg overflow-hidden shadow-lg border border-gray-200 relative">
      {/* 車両選択UI */}
      {enableVehicleSelection && vehicles && vehicles.length > 0 && (
        <div className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-lg p-2 space-y-1">
          <button
            onClick={() => setActiveVehicle(null)}
            className={`w-full px-3 py-1.5 text-sm rounded ${
              activeVehicle === null
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            全車両表示
          </button>
          {vehicles.filter(v => v.isActive).map((vehicle, index) => {
            const color = vehicleColors[index % vehicleColors.length]
            return (
              <button
                key={vehicle.id}
                onClick={() => setActiveVehicle(vehicle.id)}
                className={`w-full px-3 py-1.5 text-sm rounded flex items-center gap-2 ${
                  activeVehicle === vehicle.id
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={{
                  backgroundColor: activeVehicle === vehicle.id ? color : undefined
                }}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {vehicle.name}
              </button>
            )
          })}
        </div>
      )}
      
      <MapContainer
        center={center}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
        doubleClickZoom={true}
        dragging={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {locations.length > 0 && (
          <MapBoundsUpdater locations={locations.map(loc => ({ lat: loc.lat, lng: loc.lng }))} />
        )}

        {/* 事業所のマーカー */}
        {facilityLocation && (
          <Marker 
            position={[facilityLocation.lat, facilityLocation.lng]} 
            icon={facilityIcon}
          >
            <Popup>
              <div className="font-semibold text-red-600">{facilityLocation.name}</div>
              <div className="text-sm text-gray-600">{facilityLocation.address}</div>
            </Popup>
          </Marker>
        )}

        {/* 利用者のマーカー */}
        {userLocations.map((location, index) => (
          <Marker
            key={index}
            position={[location.lat, location.lng]}
            icon={location.wheelchair ? wheelchairIcon : userIcon}
          >
            <Popup>
              <div className="font-semibold">{location.name}</div>
              <div className="text-sm text-gray-600">{location.address}</div>
              {location.pickup_time && (
                <div className="text-sm text-indigo-600 mt-1">送迎: {location.pickup_time}</div>
              )}
              {location.wheelchair && (
                <div className="text-xs text-purple-600 mt-1">🦽 車椅子対応</div>
              )}
            </Popup>
          </Marker>
        ))}

        {/* 送迎ルートの表示 */}
        {vehicleAssignments && vehicles && facilityLocation && (
          <>
            {vehicles.filter(v => v.isActive)
              .filter(v => activeVehicle === null || v.id === activeVehicle)
              .map((vehicle) => {
              const assignment = vehicleAssignments[vehicle.id]
              if (!assignment || !assignment.trips) return null

              // 元の車両リストでのインデックスを取得（色の一貫性のため）
              const originalVehicleIndex = vehicles.findIndex(v => v.id === vehicle.id)
              const color = vehicleColors[originalVehicleIndex % vehicleColors.length]

              return assignment.trips.map((trip, tripIndex) => {
                if (!trip.users || trip.users.length === 0) return null

                // ルートの座標配列を作成：施設 → 利用者たち → 施設
                const routePositions = [
                  [facilityLocation.lat, facilityLocation.lng],
                  ...trip.users.map(user => [user.lat, user.lng]),
                  [facilityLocation.lat, facilityLocation.lng]
                ]

                return (
                  <div key={`${vehicle.id}-${tripIndex}`}>
                    {/* ルートライン */}
                    <Polyline
                      positions={routePositions}
                      color={color}
                      weight={4}
                      opacity={0.6}
                      dashArray={tripIndex > 0 ? '10, 10' : undefined}
                    />

                    {/* 番号付きマーカー */}
                    {trip.users.map((user, userIndex) => (
                      <Marker
                        key={`${vehicle.id}-${tripIndex}-${user.id}`}
                        position={[user.lat, user.lng]}
                        icon={createNumberedIcon(userIndex + 1, color)}
                      >
                        <Popup>
                          <div className="font-semibold">{user.name}</div>
                          <div className="text-sm text-gray-600">{user.address}</div>
                          <div className="text-sm font-semibold mt-1" style={{ color }}>
                            {vehicle.name} - 第{tripIndex + 1}便 - {userIndex + 1}番目
                          </div>
                          {user.wheelchair && (
                            <div className="text-xs text-purple-600 mt-1">🦽 車椅子対応</div>
                          )}
                        </Popup>
                      </Marker>
                    ))}
                  </div>
                )
              })
            })}
          </>
        )}

        {/* ルートが指定されている場合（互換性のため） */}
        {route && route.length > 0 && !vehicleAssignments && (
          <Polyline
            positions={route}
            color="blue"
            weight={3}
            opacity={0.7}
          />
        )}
      </MapContainer>
    </div>
  )
}

