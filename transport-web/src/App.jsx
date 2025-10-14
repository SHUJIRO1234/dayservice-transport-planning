import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Calendar, MapPin, Users, Car, Accessibility, Clock, Route, Navigation, Plus } from 'lucide-react'
import TransportMap from './components/TransportMap.jsx'
import VehicleTabs from './components/VehicleTabs.jsx'
import TripManager from './components/TripManager.jsx'
import { optimizeRoute, recalculateRoute } from './utils/routeOptimization.js'
import { weeklyData, vehicles as vehiclesData, facility as facilityData } from './weeklyData.js'
import './App.css'

function App() {
  const [selectedWeekday, setSelectedWeekday] = useState('月曜日')
  const [selectedVehicle, setSelectedVehicle] = useState(1)
  const [vehicles, setVehicles] = useState(vehiclesData)
  const [facility, setFacility] = useState(facilityData)
  const [showMap, setShowMap] = useState(false)
  
  // 車両ごとの割り当て（複数便対応）
  // vehicleAssignments[vehicleId] = { trips: [[user1, user2, ...], [user3, user4, ...]] }
  const [vehicleAssignments, setVehicleAssignments] = useState({})
  
  // 未割り当ての利用者リスト
  const [unassignedUsers, setUnassignedUsers] = useState([])

  const weekdays = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日', '日曜日']

  // 曜日が変わったら利用者をリセット
  useEffect(() => {
    const users = weeklyData[selectedWeekday] || []
    setUnassignedUsers(users)
    
    // 車両割り当てをリセット
    const initialAssignments = {}
    vehicles.forEach(vehicle => {
      initialAssignments[vehicle.id] = {
        trips: [{ users: [], distance: 0, duration: 0 }] // 最初は1便のみ
      }
    })
    setVehicleAssignments(initialAssignments)
  }, [selectedWeekday])

  // 自動割り当て
  const handleAutoAssign = () => {
    if (unassignedUsers.length === 0) return

    const newAssignments = { ...vehicleAssignments }
    let wheelchairUsers = unassignedUsers.filter(u => u.wheelchair)
    let regularUsers = unassignedUsers.filter(u => !u.wheelchair)

    vehicles.forEach(vehicle => {
      if (!newAssignments[vehicle.id]) {
        newAssignments[vehicle.id] = { trips: [{ users: [], distance: 0, duration: 0 }] }
      }

      const currentTrip = newAssignments[vehicle.id].trips[0]
      const users = Array.isArray(currentTrip) ? currentTrip : (currentTrip.users || [])
      
      // 配列形式の場合はオブジェクト形式に変換
      if (Array.isArray(currentTrip)) {
        newAssignments[vehicle.id].trips[0] = { users: currentTrip, distance: 0, duration: 0 }
      }
      
      const tripUsers = newAssignments[vehicle.id].trips[0].users

      // 車椅子ユーザーを割り当て（車椅子定員まで）
      let wheelchairAssigned = 0
      while (wheelchairUsers.length > 0 && wheelchairAssigned < vehicle.wheelchairCapacity) {
        const user = wheelchairUsers.shift()
        tripUsers.push(user)
        wheelchairAssigned++
      }

      // 一般ユーザーを割り当て（総定員まで）
      while (regularUsers.length > 0 && tripUsers.length < vehicle.capacity) {
        const user = regularUsers.shift()
        tripUsers.push(user)
      }
    })

    // 残った利用者を未割り当てに設定
    const remainingUsers = [...wheelchairUsers, ...regularUsers]
    setVehicleAssignments(newAssignments)
    setUnassignedUsers(remainingUsers)
  }

  // ルートを最適化
  const handleOptimizeVehicleRoute = (vehicleId) => {
    const assignment = vehicleAssignments[vehicleId]
    if (!assignment || !facility) return

    const newAssignments = { ...vehicleAssignments }

    // 各便ごとにルートを最適化
    newAssignments[vehicleId].trips = assignment.trips.map(trip => {
      // tripが配列かオブジェクトかを判定
      const users = Array.isArray(trip) ? trip : (trip.users || [])
      
      if (users.length === 0) return { users: [], distance: 0, duration: 0 }

      const result = optimizeRoute(facility, users)
      return {
        users: result.order,
        distance: result.totalDistance,
        duration: result.estimatedTime
      }
    })

    setVehicleAssignments(newAssignments)
  }

  // すべての車両のルートを最適化
  const handleOptimizeAllRoutes = () => {
    vehicles.forEach(vehicle => {
      handleOptimizeVehicleRoute(vehicle.id)
    })
  }

  // 便を追加
  const handleAddTrip = (vehicleId) => {
    const newAssignments = { ...vehicleAssignments }
    if (!newAssignments[vehicleId]) {
      newAssignments[vehicleId] = { trips: [] }
    }
    newAssignments[vehicleId].trips.push({ users: [], distance: 0, duration: 0 })
    setVehicleAssignments(newAssignments)
  }

  // 便を削除
  const handleRemoveTrip = (vehicleId, tripIndex) => {
    const newAssignments = { ...vehicleAssignments }
    const removedTrip = newAssignments[vehicleId].trips[tripIndex]
    const removedUsers = Array.isArray(removedTrip) ? removedTrip : (removedTrip.users || [])
    newAssignments[vehicleId].trips.splice(tripIndex, 1)
    
    // 削除された利用者を未割り当てリストに戻す
    setUnassignedUsers([...unassignedUsers, ...removedUsers])
    setVehicleAssignments(newAssignments)
  }

  // 便内でユーザーを並び替え
  const handleReorderUsers = (vehicleId, tripIndex, activeId, overId) => {
    const newAssignments = { ...vehicleAssignments }
    const trip = newAssignments[vehicleId].trips[tripIndex]
    const users = Array.isArray(trip) ? trip : (trip.users || [])
    
    const oldIndex = users.findIndex(u => u.id === activeId)
    const newIndex = users.findIndex(u => u.id === overId)
    
    if (oldIndex === -1 || newIndex === -1) return

    const [movedUser] = users.splice(oldIndex, 1)
    users.splice(newIndex, 0, movedUser)

    // オブジェクト形式の場合は更新し、距離・時間を再計算
    if (!Array.isArray(trip)) {
      trip.users = users
      // 距離と時間を再計算
      if (users.length > 0 && facility) {
        const result = recalculateRoute(facility, users)
        trip.distance = result.totalDistance
        trip.duration = result.estimatedTime
      }
    }

    setVehicleAssignments(newAssignments)
  }

  // 統計情報を計算
  const currentUsers = weeklyData[selectedWeekday] || []
  const wheelchairCount = currentUsers.filter(u => u.wheelchair).length
  const regularCount = currentUsers.length - wheelchairCount

  // 選択中の車両の情報
  const selectedVehicleData = vehicles.find(v => v.id === selectedVehicle)
  const selectedAssignment = vehicleAssignments[selectedVehicle] || { trips: [{ users: [], distance: 0, duration: 0 }] }

  // 選択中の車両の統計
  const selectedVehicleUsers = selectedAssignment.trips.flatMap(trip => 
    Array.isArray(trip) ? trip : (trip.users || [])
  )
  const selectedVehicleWheelchair = selectedVehicleUsers.filter(u => u.wheelchair).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-600 p-3 rounded-lg">
                <Car className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">デイサービス送迎計画</h1>
                <p className="text-sm text-gray-600">デイサービスさくら</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Calendar className="h-5 w-5" />
              <span className="text-sm">{new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 曜日切り替えタブ */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              曜日選択
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {weekdays.map(weekday => {
                const dayUsers = weeklyData[weekday] || []
                return (
                  <button
                    key={weekday}
                    onClick={() => setSelectedWeekday(weekday)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      selectedWeekday === weekday
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    {weekday}
                    <span className="ml-2 text-xs">({dayUsers.length}名)</span>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* サマリー情報 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                {selectedWeekday}の送迎対象者
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{currentUsers.length}</div>
              <p className="text-sm text-blue-100 mt-1">名</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Accessibility className="h-4 w-4" />
                車椅子対応
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{wheelchairCount}</div>
              <p className="text-sm text-purple-100 mt-1">名（一般: {regularCount}名）</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Car className="h-4 w-4" />
                利用可能車両
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{vehicles.length}</div>
              <p className="text-sm text-green-100 mt-1">台</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                未割り当て
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{unassignedUsers.length}</div>
              <p className="text-sm text-amber-100 mt-1">名</p>
            </CardContent>
          </Card>
        </div>

        {/* アクションボタン */}
        <div className="flex gap-4 mb-6">
          <Button onClick={handleAutoAssign} className="bg-indigo-600 hover:bg-indigo-700">
            <Users className="w-4 h-4 mr-2" />
            自動割り当て
          </Button>
          <Button onClick={handleOptimizeAllRoutes} className="bg-green-600 hover:bg-green-700">
            <Route className="w-4 h-4 mr-2" />
            全ルート最適化
          </Button>
          <Button onClick={() => setShowMap(!showMap)} variant="outline">
            <MapPin className="w-4 h-4 mr-2" />
            {showMap ? '地図を閉じる' : '地図で表示'}
          </Button>
        </div>

        {/* 地図表示 */}
        {showMap && (
          <Card className="mb-6">
            <CardContent className="p-0">
              <TransportMap
                facility={facility}
                users={currentUsers}
                route={null}
              />
            </CardContent>
          </Card>
        )}

        {/* 未割り当て利用者リスト */}
        {unassignedUsers.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                未割り当ての利用者（{unassignedUsers.length}名）
              </CardTitle>
              <CardDescription>
                車両タブにドラッグ&ドロップで割り当ててください
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {unassignedUsers.map(user => (
                  <div
                    key={user.id}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{user.name}</span>
                      {user.wheelchair && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                          <Accessibility className="w-3 h-3 mr-1" />
                          車椅子
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {user.address}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {user.pickupTime}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 送迎車別タブ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="w-5 h-5" />
              送迎車別管理
            </CardTitle>
            <CardDescription>
              各送迎車に利用者を割り当て、ルートを最適化します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VehicleTabs
              vehicles={vehicles}
              selectedVehicle={selectedVehicle}
              onSelectVehicle={setSelectedVehicle}
              vehicleAssignments={vehicleAssignments}
            />

            {/* 選択中の車両の詳細 */}
            {selectedVehicleData && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{selectedVehicleData.name}</h3>
                    <p className="text-sm text-gray-600">
                      担当: {selectedVehicleData.driver} / 
                      定員: {selectedVehicleUsers.length}/{selectedVehicleData.capacity}名 / 
                      車椅子: {selectedVehicleWheelchair}/{selectedVehicleData.wheelchairCapacity}台
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleOptimizeVehicleRoute(selectedVehicle)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Route className="w-4 h-4 mr-2" />
                      ルート最適化
                    </Button>
                  </div>
                </div>

                <TripManager
                  vehicle={selectedVehicleData}
                  trips={selectedAssignment.trips.map((trip, index) => {
                    if (Array.isArray(trip)) {
                      return { users: trip, distance: 0, duration: 0 }
                    }
                    return {
                      users: trip.users || [],
                      distance: trip.distance || 0,
                      duration: trip.duration || 0
                    }
                  })}
                  onAddTrip={() => handleAddTrip(selectedVehicle)}
                  onRemoveTrip={(tripIndex) => handleRemoveTrip(selectedVehicle, tripIndex)}
                  onReorderUsers={(tripIndex, activeId, overId) => 
                    handleReorderUsers(selectedVehicle, tripIndex, activeId, overId)
                  }
                />
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default App

