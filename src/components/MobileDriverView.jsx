import React, { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { MapPin, Navigation, Phone, Copy, Check } from 'lucide-react'

/**
 * モバイル最適化ビュー - ドライバー用運行画面
 * スマホ・タブレットで見やすい大きめのフォントとボタン
 */
const MobileDriverView = ({ vehicle, selectedDay, facility }) => {
  const [copiedIndex, setCopiedIndex] = useState(null)
  
  // 車椅子対応の利用者数を計算
  const wheelchairCount = vehicle.trips.reduce((sum, trip) => {
    return sum + trip.users.filter(u => u.wheelchair).length
  }, 0)
  
  // 住所をクリップボードにコピー
  const copyAddress = (address, index) => {
    navigator.clipboard.writeText(address)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }
  
  // Google Mapsで開く
  const openInGoogleMaps = (address) => {
    const encodedAddress = encodeURIComponent(address)
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank')
  }
  
  // 全住所をカーナビ用にコピー
  const copyAllAddresses = () => {
    const allAddresses = vehicle.trips.flatMap(trip => 
      trip.users.map((user, idx) => `${idx + 1}. ${user.name} - ${user.address}`)
    ).join('\n')
    
    navigator.clipboard.writeText(`${facility.name}\n↓\n${allAddresses}\n↓\n${facility.name}`)
    alert('全ての住所をコピーしました')
  }
  
  return (
    <div className="mobile-driver-view bg-gray-50 min-h-screen">
      {/* ヘッダー */}
      <div className="bg-blue-600 text-white p-6 sticky top-0 z-10 shadow-lg">
        <h1 className="text-2xl font-bold mb-2">{vehicle.name}</h1>
        <div className="text-sm opacity-90">
          <div>担当: {vehicle.driver}</div>
          <div>{selectedDay}</div>
        </div>
      </div>
      
      {/* 車両情報サマリー */}
      <div className="bg-white p-4 m-4 rounded-lg shadow">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {vehicle.trips.reduce((sum, t) => sum + t.users.length, 0)}
            </div>
            <div className="text-xs text-gray-600">利用者数</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">
              {wheelchairCount}/{vehicle.wheelchairCapacity}
            </div>
            <div className="text-xs text-gray-600">車椅子</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {vehicle.trips.length}
            </div>
            <div className="text-xs text-gray-600">便数</div>
          </div>
        </div>
        
        {/* 全住所コピーボタン */}
        <Button 
          onClick={copyAllAddresses}
          className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-6 text-lg"
        >
          <Copy className="w-5 h-5 mr-2" />
          全住所をコピー（カーナビ用）
        </Button>
      </div>
      
      {/* 便ごとの利用者リスト */}
      {vehicle.trips.map((trip, tripIndex) => (
        <div key={tripIndex} className="m-4">
          <div className="bg-gray-800 text-white p-4 rounded-t-lg">
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold">第{tripIndex + 1}便</span>
              <div className="text-sm">
                {trip.users.length}名 | {trip.distance?.toFixed(1) || '0.0'} km | {trip.duration || 0}分
              </div>
            </div>
          </div>
          
          <div className="space-y-3 bg-white p-4 rounded-b-lg shadow">
            {trip.users.map((user, userIndex) => (
              <div 
                key={user.id}
                className="border-2 border-gray-200 rounded-lg p-4 bg-white"
              >
                {/* 利用者ヘッダー */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                      {userIndex + 1}
                    </div>
                    <div>
                      <div className="text-xl font-bold">{user.name}</div>
                      {user.wheelchair && (
                        <span className="inline-block bg-red-500 text-white text-xs px-2 py-1 rounded mt-1">
                          車椅子
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {user.pickupTime}
                  </div>
                </div>
                
                {/* 住所 */}
                <div className="bg-gray-50 p-3 rounded mb-3">
                  <div className="text-sm text-gray-600 mb-1">住所</div>
                  <div className="text-lg font-medium">{user.address}</div>
                </div>
                
                {/* 特記事項 */}
                {user.specialNeeds && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-3">
                    <div className="text-sm font-bold text-yellow-800 mb-1">⚠️ 特記事項</div>
                    <div className="text-sm text-yellow-900">{user.specialNeeds}</div>
                  </div>
                )}
                
                {/* アクションボタン */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => openInGoogleMaps(user.address)}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-6 text-base"
                  >
                    <Navigation className="w-5 h-5 mr-2" />
                    ナビで開く
                  </Button>
                  <Button
                    onClick={() => copyAddress(user.address, `${tripIndex}-${userIndex}`)}
                    variant="outline"
                    className="py-6 text-base"
                  >
                    {copiedIndex === `${tripIndex}-${userIndex}` ? (
                      <>
                        <Check className="w-5 h-5 mr-2 text-green-600" />
                        コピー済み
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5 mr-2" />
                        住所コピー
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {/* フッター */}
      <div className="bg-white p-6 m-4 rounded-lg shadow text-center">
        <div className="text-lg font-bold mb-2">施設に戻る</div>
        <div className="text-gray-600 mb-3">{facility.name}</div>
        <div className="text-sm text-gray-500">{facility.address}</div>
        <Button
          onClick={() => openInGoogleMaps(facility.address)}
          className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-6 text-lg"
        >
          <Navigation className="w-5 h-5 mr-2" />
          施設へのルートを開く
        </Button>
      </div>
    </div>
  )
}

export default MobileDriverView

