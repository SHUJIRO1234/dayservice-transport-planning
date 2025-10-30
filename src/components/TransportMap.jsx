import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet-polylinedecorator'
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

// 同じ位置のユーザーをグループ化する関数
const groupUsersByLocation = (users) => {
  // 位置ごとにユーザーをグループ化
  const locationGroups = {}
  users.forEach((user) => {
    const key = `${user.lat},${user.lng}`
    if (!locationGroups[key]) {
      locationGroups[key] = {
        lat: user.lat,
        lng: user.lng,
        users: [],
        numbers: [],
        tripIndex: user.tripIndex
      }
    }
    locationGroups[key].users.push(user)
    locationGroups[key].numbers.push(user.userIndexInTrip)
  })

  // グループ化されたマーカーの配列を返す
  return Object.values(locationGroups)
}



// 矢印付きPolylineコンポーネント
const PolylineWithArrows = ({ positions, color, weight, opacity }) => {
  const map = useMap()
  
  useEffect(() => {
    if (!positions || positions.length < 2) return
    
    // Polylineを作成
    const polyline = L.polyline(positions, {
      color: color,
      weight: weight,
      opacity: opacity
    }).addTo(map)
    
    // 矢印デコレーターを追加
    const decorator = L.polylineDecorator(polyline, {
      patterns: [
        {
          offset: '10%',
          repeat: '20%',
          symbol: L.Symbol.arrowHead({
            pixelSize: 10,
            polygon: false,
            pathOptions: {
              stroke: true,
              color: color,
              weight: 2,
              opacity: opacity
            }
          })
        }
      ]
    }).addTo(map)
    
    // クリーンアップ
    return () => {
      map.removeLayer(polyline)
      map.removeLayer(decorator)
    }
  }, [positions, color, weight, opacity, map])
  
  return null
}

// 地図のスクロール制御コンポーネント
const ScrollControl = () => {
  const map = useMap()
  
  useEffect(() => {
    // 初期状態ではスクロールズームを無効化
    map.scrollWheelZoom.disable()
    
    // 地図コンテナを取得
    const container = map.getContainer()
    let isZoomEnabled = false
    
    // クリックした時にスクロールズームを有効化/無効化をトグル
    const handleClick = () => {
      if (isZoomEnabled) {
        map.scrollWheelZoom.disable()
        isZoomEnabled = false
        container.style.cursor = 'grab'
      } else {
        map.scrollWheelZoom.enable()
        isZoomEnabled = true
        container.style.cursor = 'zoom-in'
      }
    }
    
    // マウスが地図から離れたらズームを無効化
    const handleMouseLeave = () => {
      if (isZoomEnabled) {
        map.scrollWheelZoom.disable()
        isZoomEnabled = false
        container.style.cursor = 'grab'
      }
    }
    
    container.addEventListener('click', handleClick)
    container.addEventListener('mouseleave', handleMouseLeave)
    
    // 初期カーソルスタイル
    container.style.cursor = 'grab'
    
    // クリーンアップ
    return () => {
      container.removeEventListener('click', handleClick)
      container.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [map])
  
  return null
}

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

export default function TransportMap({ facility, users, route = null, vehicleAssignments = null, vehicles = null, selectedVehicleId = null, enableVehicleSelection = false }) {
  const [locations, setLocations] = useState([])
  const [selectedTripIndex, setSelectedTripIndex] = useState(0) // 選択された便のインデックス
  const [internalSelectedVehicleId, setInternalSelectedVehicleId] = useState(null) // 内部で管理する車両選択

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

  // 実際に使用する車両ID（外部から渡されたものか、内部で選択されたもの）
  const effectiveVehicleId = selectedVehicleId || internalSelectedVehicleId

  // 最大便数を計算
  const maxTrips = vehicleAssignments && vehicles
    ? Math.max(...vehicles.filter(v => v.isActive && (!effectiveVehicleId || v.id === effectiveVehicleId)).map(v => {
        const assignment = vehicleAssignments[v.id]
        return assignment && assignment.trips ? assignment.trips.length : 0
      }))
    : 0

  return (
    <div className="w-full rounded-lg overflow-hidden shadow-lg border border-gray-200">
      {/* 車両選択ボタン（enableVehicleSelectionがtrueの場合のみ表示） */}
      {enableVehicleSelection && vehicles && vehicles.filter(v => v.isActive).length > 0 && (
        <div className="bg-gray-50 border-b border-gray-200 p-3">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setInternalSelectedVehicleId(null)}
              className={`px-3 py-1.5 text-sm font-medium rounded ${
                !internalSelectedVehicleId
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              全車両
            </button>
            {vehicles.filter(v => v.isActive).map((vehicle) => {
              const assignment = vehicleAssignments[vehicle.id]
              const userCount = assignment && assignment.trips
                ? assignment.trips.reduce((sum, trip) => sum + (trip.users ? trip.users.length : 0), 0)
                : 0
              
              return (
                <button
                  key={vehicle.id}
                  onClick={() => setInternalSelectedVehicleId(vehicle.id)}
                  className={`px-3 py-1.5 text-sm font-medium rounded ${
                    internalSelectedVehicleId === vehicle.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  {vehicle.name}
                  <span className="ml-1 text-xs">({userCount}名)</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
      
      {/* 便の切り替えボタン */}
      {maxTrips > 1 && (
        <div className="bg-white border-b border-gray-200 p-2 flex gap-2">
          <span className="text-sm font-semibold text-gray-700 flex items-center">便を選択:</span>
          {Array.from({ length: maxTrips }, (_, i) => (
            <button
              key={i}
              onClick={() => setSelectedTripIndex(i)}
              className={`px-3 py-1 text-sm font-medium rounded ${
                selectedTripIndex === i
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              第{i + 1}便
            </button>
          ))}
        </div>
      )}
      
      <div className="h-[600px]">
        <MapContainer
          center={center}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ScrollControl />
        
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

        {/* 利用者マーカー: 選択された車両と便のみ表示 */}
        {!vehicleAssignments && userLocations.map((loc, index) => (
          <Marker
            key={index}
            position={[loc.lat, loc.lng]}
            icon={loc.wheelchair ? wheelchairIcon : userIcon}
          >
            <Popup>
              <div className="font-semibold">{loc.name}</div>
              <div className="text-sm text-gray-600">{loc.address}</div>
              {loc.wheelchair && (
                <div className="text-xs text-purple-600 mt-1">🦽 車椅子対応</div>
              )}
              {loc.pickup_time && (
                <div className="text-xs text-blue-600 mt-1">
                  🕒 {loc.pickup_time}
                </div>
              )}
            </Popup>
          </Marker>
        ))}

        {/* 送迎ルートの表示: 選択された車両と便のみ */}
        {vehicleAssignments && vehicles && facilityLocation && (
          <>
            {vehicles.filter(v => v.isActive && (!effectiveVehicleId || v.id === effectiveVehicleId)).map((vehicle, vehicleIndex) => {
              const assignment = vehicleAssignments[vehicle.id]
              if (!assignment || !assignment.trips) return null

              // 全車両の中でのインデックスを取得（色を一貫させるため）
              const allVehicles = vehicles.filter(v => v.isActive)
              const globalVehicleIndex = allVehicles.findIndex(v => v.id === vehicle.id)
              const color = vehicleColors[globalVehicleIndex % vehicleColors.length]

              // 選択された便を取得
              const selectedTrip = assignment.trips[selectedTripIndex]
              
              // 全ての便の利用者を取得（番号付けのため）
              const allUsers = []
              let userNumberOffset = 0
              assignment.trips.forEach((trip, tripIndex) => {
                if (trip && trip.users) {
                  trip.users.forEach((user, userIndex) => {
                    allUsers.push({
                      ...user,
                      tripIndex,
                      userNumber: userNumberOffset + userIndex + 1,
                      userIndexInTrip: userIndex + 1
                    })
                  })
                  userNumberOffset += trip.users.length
                }
              })

              return (
                <React.Fragment key={`${vehicle.id}-all-trips`}>
                  {/* 選択された便のルートライン（矢印付き） */}
                  {selectedTrip && selectedTrip.users && selectedTrip.users.length > 0 && (
                    <PolylineWithArrows
                      positions={[
                        [facilityLocation.lat, facilityLocation.lng],
                        ...selectedTrip.users.map(user => [user.lat, user.lng]),
                        [facilityLocation.lat, facilityLocation.lng]
                      ]}
                      color={color}
                      weight={4}
                      opacity={0.7}
                    />
                  )}

                  {/* 全ての便の番号付きマーカー（同じ位置はグループ化） */}
                  {groupUsersByLocation(allUsers).map((group, groupIndex) => (
                    <Marker
                      key={`${vehicle.id}-group-${groupIndex}`}
                      position={[group.lat, group.lng]}
                      icon={createNumberedIcon(group.numbers.join(','), color)}
                      opacity={group.tripIndex === selectedTripIndex ? 1.0 : 0.5}
                    >
                      <Popup>
                        {group.users.map((user, idx) => (
                          <div key={user.id} className={idx > 0 ? 'mt-2 pt-2 border-t' : ''}>
                            <div className="font-semibold">{user.name}</div>
                            <div className="text-sm text-gray-600">{user.address}</div>
                            <div className="text-sm font-semibold mt-1" style={{ color }}>
                              {vehicle.name} - 第{user.tripIndex + 1}便 - {user.userIndexInTrip}番目
                            </div>
                            {user.wheelchair && (
                              <div className="text-xs text-purple-600 mt-1">🦽 車椅子対応</div>
                            )}
                          </div>
                        ))}
                      </Popup>
                    </Marker>
                  ))}
                </React.Fragment>
              )
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
    </div>
  )
}

