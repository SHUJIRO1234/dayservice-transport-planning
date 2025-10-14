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

export default function TransportMap({ facility, users, route = null }) {
  const [locations, setLocations] = useState([])

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
    <div className="w-full h-[600px] rounded-lg overflow-hidden shadow-lg border border-gray-200">
      <MapContainer
        center={center}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
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

        {/* ルートの表示（将来実装） */}
        {route && route.length > 0 && (
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

