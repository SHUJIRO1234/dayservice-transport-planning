import React, { useEffect, useState } from 'react'
import MobileDriverView from './components/MobileDriverView.jsx'
import { weeklyData, vehicles as vehiclesData, facility as facilityData } from './weeklyData.js'

/**
 * モバイルビュー専用ページ
 * /mobile.html?vehicle=1&day=月曜日&trip=1 のようなURLでアクセス
 * 
 * このコンポーネントは、以下の優先順位でデータを読み込みます：
 * 1. ローカルストレージから保存された割り当てデータ（メインアプリで自動割り当てを実行した場合）
 * 2. weeklyData.jsから基本データを読み込み、指定された車両に仮割り当て
 */
const MobilePage = () => {
  const [vehicleId, setVehicleId] = useState(null)
  const [selectedDay, setSelectedDay] = useState('月曜日')
  const [selectedTrip, setSelectedTrip] = useState('Trip 1')
  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dataSource, setDataSource] = useState('') // 'localStorage' or 'weeklyData'
  
  useEffect(() => {
    try {
      // URLパラメータから車両ID、曜日、便を取得
      const params = new URLSearchParams(window.location.search)
      const vid = params.get('vehicle')
      const day = params.get('day') || '月曜日'
      const trip = params.get('trip') || '1'
      const tripName = `Trip ${trip}`
      
      if (!vid) {
        setError('車両IDが指定されていません')
        setLoading(false)
        return
      }
      
      setVehicleId(parseInt(vid))
      setSelectedDay(day)
      setSelectedTrip(tripName)
      
      // まずローカルストレージから保存された割り当てデータを取得を試みる
      const storageKey = `transport-${day}-${tripName}`
      const savedData = localStorage.getItem(storageKey)
      
      if (savedData) {
        // ローカルストレージにデータがある場合
        try {
          const parsedData = JSON.parse(savedData)
          const vehicleData = parsedData.vehicles?.find(v => v.id === parseInt(vid))
          
          if (vehicleData && vehicleData.trips && vehicleData.trips.length > 0) {
            setVehicle(vehicleData)
            setDataSource('localStorage')
            setLoading(false)
            return
          }
        } catch (e) {
          console.warn('ローカルストレージのデータ解析に失敗:', e)
        }
      }
      
      // ローカルストレージにデータがない場合、weeklyDataから基本データを構築
      const dayUsers = weeklyData[day] || []
      
      if (dayUsers.length === 0) {
        setError(`${day}には利用者データがありません`)
        setLoading(false)
        return
      }
      
      // 指定された車両の基本情報を取得
      const vehicleInfo = vehiclesData.find(v => v.id === parseInt(vid))
      
      if (!vehicleInfo) {
        setError(`車両ID ${vid} が見つかりません`)
        setLoading(false)
        return
      }
      
      // 基本データから車両情報を構築（全利用者を1つの便に割り当て）
      const vehicleWithData = {
        ...vehicleInfo,
        trips: [
          {
            users: dayUsers.map((user, index) => ({
              ...user,
              // 特記事項を統合
              specialNeeds: user.note || (user.wheelchair ? '車椅子対応が必要です' : '')
            })),
            distance: 0,
            duration: 0
          }
        ]
      }
      
      setVehicle(vehicleWithData)
      setDataSource('weeklyData')
      setLoading(false)
      
    } catch (err) {
      console.error('データ読み込みエラー:', err)
      setError('データの読み込みに失敗しました')
      setLoading(false)
    }
  }, [])
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-xl font-semibold mb-2">読み込み中...</div>
          <div className="text-sm text-gray-500">運行データを取得しています</div>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50">
        <div className="text-center max-w-md bg-white p-8 rounded-lg shadow-lg">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-4 text-red-600">エラー</h1>
          <p className="text-gray-700 mb-4">{error}</p>
          <p className="text-sm text-gray-500 mb-6">
            URLパラメータを確認してください。<br/>
            例: ?vehicle=1&day=月曜日&trip=1
          </p>
          <a 
            href="/" 
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            メインアプリへ戻る
          </a>
        </div>
      </div>
    )
  }
  
  if (!vehicle) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <div className="text-6xl mb-4">🚗</div>
          <h1 className="text-2xl font-bold mb-4">車両が見つかりません</h1>
          <p className="text-gray-600 mb-6">URLを確認してください</p>
          <a 
            href="/" 
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            メインアプリへ戻る
          </a>
        </div>
      </div>
    )
  }
  
  return (
    <div>
      {/* データソース表示（開発用） */}
      {dataSource === 'weeklyData' && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-2 text-center text-xs text-yellow-800">
          ℹ️ 基本データを表示中（メインアプリで自動割り当てを実行すると、最適化されたルートが表示されます）
        </div>
      )}
      
      <MobileDriverView 
        vehicle={vehicle}
        selectedDay={selectedDay}
        selectedTrip={selectedTrip}
        facility={facilityData}
      />
    </div>
  )
}

export default MobilePage

