import { useState, useEffect } from 'react'
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Calendar, MapPin, Users, Car, Accessibility, Clock, Route, Navigation } from 'lucide-react'
import TransportMap from './components/TransportMap.jsx'
import VehicleTabs from './components/VehicleTabs.jsx'
import TripManager from './components/TripManager.jsx'
import SortableUserCard from './components/SortableUserCard.jsx'
import { optimizeRoute, recalculateRoute } from './utils/routeOptimization.js'
import { weeklyData, vehicles as vehiclesData, facility as facilityData } from './weeklyData.js'
import './App.css'

function App() {
  const [selectedWeekday, setSelectedWeekday] = useState('月曜日')
  const [selectedVehicle, setSelectedVehicle] = useState(1)
  const [vehicles, setVehicles] = useState(vehiclesData)
  const [facility, setFacility] = useState(facilityData)
  const [showMap, setShowMap] = useState(false)
  const [activeId, setActiveId] = useState(null)
  
  // 車両ごとの割り当て（複数便対応）
  const [vehicleAssignments, setVehicleAssignments] = useState({})
  
  // 未割り当ての利用者リスト
  const [unassignedUsers, setUnassignedUsers] = useState([])

  const weekdays = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日', '日曜日']

  // ドラッグ&ドロップセンサー設定
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // 曜日が変わったら利用者をリセット
  useEffect(() => {
    const users = weeklyData[selectedWeekday] || []
    setUnassignedUsers(users)
    
    // 車両割り当てをリセット
    const initialAssignments = {}
    vehicles.forEach(vehicle => {
      initialAssignments[vehicle.id] = {
        trips: [{ users: [], distance: 0, duration: 0 }]
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

      const tripUsers = newAssignments[vehicle.id].trips[0].users

      // 車椅子ユーザーを割り当て
      let wheelchairAssigned = 0
      while (wheelchairUsers.length > 0 && wheelchairAssigned < vehicle.wheelchairCapacity) {
        const user = wheelchairUsers.shift()
        tripUsers.push(user)
        wheelchairAssigned++
      }

      // 一般ユーザーを割り当て
      while (regularUsers.length > 0 && tripUsers.length < vehicle.capacity) {
        const user = regularUsers.shift()
        tripUsers.push(user)
      }
    })

    const remainingUsers = [...wheelchairUsers, ...regularUsers]
    setVehicleAssignments(newAssignments)
    setUnassignedUsers(remainingUsers)
  }

  // ルートを最適化
  const handleOptimizeVehicleRoute = (vehicleId) => {
    const assignment = vehicleAssignments[vehicleId]
    if (!assignment || !facility) return

    const newAssignments = { ...vehicleAssignments }

    newAssignments[vehicleId].trips = assignment.trips.map(trip => {
      const users = trip.users || []
      
      if (users.length === 0) return { users: [], distance: 0, duration: 0 }

      const result = optimizeRoute(users, facility)
      return {
        users: result.route,
        distance: result.distance,
        duration: result.duration
      }
    })

    setVehicleAssignments(newAssignments)
  }

  // 全車両のルートを最適化
  const handleOptimizeAllRoutes = () => {
    const newAssignments = { ...vehicleAssignments }

    vehicles.forEach(vehicle => {
      const assignment = newAssignments[vehicle.id]
      if (!assignment) return

      assignment.trips = assignment.trips.map(trip => {
        const users = trip.users || []
        
        if (users.length === 0) return { users: [], distance: 0, duration: 0 }

        const result = optimizeRoute(users, facility)
        return {
          users: result.route,
          distance: result.distance,
          duration: result.duration
        }
      })
    })

    setVehicleAssignments(newAssignments)
  }

  // ドラッグ開始
  const handleDragStart = (event) => {
    setActiveId(event.active.id)
  }

  // ドラッグ終了
  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeId = active.id
    const overId = over.id

    // 未割り当てから送迎車へ
    if (overId.toString().startsWith('vehicle-')) {
      const vehicleId = parseInt(overId.replace('vehicle-', ''))
      const user = unassignedUsers.find(u => u.id === activeId)
      
      if (user) {
        // 未割り当てから削除
        setUnassignedUsers(prev => prev.filter(u => u.id !== activeId))
        
        // 送迎車の第1便に追加
        setVehicleAssignments(prev => {
          const newAssignments = { ...prev }
          if (!newAssignments[vehicleId]) {
            newAssignments[vehicleId] = { trips: [{ users: [], distance: 0, duration: 0 }] }
          }
          newAssignments[vehicleId].trips[0].users.push(user)
          return newAssignments
        })
      }
    }
  }

  // 便を追加
  const handleAddTrip = (vehicleId) => {
    setVehicleAssignments(prev => {
      const newAssignments = { ...prev }
      if (!newAssignments[vehicleId]) {
        newAssignments[vehicleId] = { trips: [] }
      }
      newAssignments[vehicleId].trips.push({ users: [], distance: 0, duration: 0 })
      return newAssignments
    })
  }

  // 便を削除
  const handleDeleteTrip = (vehicleId, tripIndex) => {
    setVehicleAssignments(prev => {
      const newAssignments = { ...prev }
      if (newAssignments[vehicleId] && newAssignments[vehicleId].trips.length > 1) {
        // 削除される便の利用者を未割り当てに戻す
        const deletedUsers = newAssignments[vehicleId].trips[tripIndex].users
        setUnassignedUsers(prevUsers => [...prevUsers, ...deletedUsers])
        
        newAssignments[vehicleId].trips.splice(tripIndex, 1)
      }
      return newAssignments
    })
  }

  // 便内でユーザーを並び替え
  const handleReorderUsers = (vehicleId, tripIndex, newOrder) => {
    setVehicleAssignments(prev => {
      const newAssignments = { ...prev }
      if (newAssignments[vehicleId] && newAssignments[vehicleId].trips[tripIndex]) {
        newAssignments[vehicleId].trips[tripIndex].users = newOrder
        
        // 距離と時間を再計算
        if (newOrder.length > 0 && facility) {
          const result = recalculateRoute(newOrder, facility)
          newAssignments[vehicleId].trips[tripIndex].distance = result.distance
          newAssignments[vehicleId].trips[tripIndex].duration = result.duration
        }
      }
      return newAssignments
    })
  }

  // 選択中の曜日のデータ
  const currentUsers = weeklyData[selectedWeekday] || []
  const wheelchairCount = currentUsers.filter(u => u.wheelchair).length

  // 選択中の車両の統計
  const selectedVehicleData = vehicles.find(v => v.id === selectedVehicle)
  const selectedAssignment = vehicleAssignments[selectedVehicle] || { trips: [] }
  
  let totalUsers = 0
  let totalWheelchair = 0
  selectedAssignment.trips.forEach(trip => {
    const users = trip.users || []
    totalUsers += users.length
    totalWheelchair += users.filter(u => u.wheelchair).length
  })

  // ドラッグ中のユーザー
  const activeUser = activeId ? unassignedUsers.find(u => u.id === activeId) : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* ヘッダー */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg">
                  <Car className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">デイサービス送迎計画</h1>
                  <p className="text-sm text-gray-500">デイサービスさくら</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>{new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* 曜日選択 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                曜日選択
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {weekdays.map((day, index) => {
                  const dayUsers = weeklyData[day] || []
                  return (
                    <Button
                      key={day}
                      variant={selectedWeekday === day ? 'default' : 'outline'}
                      onClick={() => setSelectedWeekday(day)}
                      className="relative"
                    >
                      {day}
                      <Badge variant="secondary" className="ml-2">{dayUsers.length}名</Badge>
                    </Button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* サマリーカード */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Users className="h-5 w-5" />
                  {selectedWeekday}の送迎対象者
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{currentUsers.length}</div>
                <p className="text-blue-100">名</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Accessibility className="h-5 w-5" />
                  車椅子対応
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{wheelchairCount}</div>
                <p className="text-purple-100">名（一般: {currentUsers.length - wheelchairCount}名）</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Car className="h-5 w-5" />
                  利用可能車両
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{vehicles.length}</div>
                <p className="text-green-100">台</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Users className="h-5 w-5" />
                  未割り当て
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{unassignedUsers.length}</div>
                <p className="text-orange-100">名</p>
              </CardContent>
            </Card>
          </div>

          {/* アクションボタン */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleAutoAssign} className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600">
              <Users className="mr-2 h-4 w-4" />
              自動割り当て
            </Button>
            <Button onClick={handleOptimizeAllRoutes} className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
              <Route className="mr-2 h-4 w-4" />
              全ルート最適化
            </Button>
            <Button onClick={() => setShowMap(!showMap)} variant="outline">
              <MapPin className="mr-2 h-4 w-4" />
              地図で表示
            </Button>
          </div>

          {/* 地図表示 */}
          {showMap && (
            <Card>
              <CardContent className="p-0">
                <TransportMap 
                  users={currentUsers} 
                  facility={facility}
                  optimizedRoute={null}
                />
              </CardContent>
            </Card>
          )}

          {/* 2カラムレイアウト */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左側: 未割り当て利用者リスト */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    未割り当ての利用者（{unassignedUsers.length}名）
                  </CardTitle>
                  <CardDescription>
                    車両タブにドラッグ&ドロップで割り当ててください
                  </CardDescription>
                </CardHeader>
                <CardContent className="max-h-[600px] overflow-y-auto space-y-2">
                  <SortableContext items={unassignedUsers.map(u => u.id)} strategy={verticalListSortingStrategy}>
                    {unassignedUsers.map(user => (
                      <SortableUserCard key={user.id} user={user} />
                    ))}
                  </SortableContext>
                  {unassignedUsers.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      すべての利用者が割り当てられました
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 右側: 送迎車別管理 */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
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

                  {/* 選択中の送迎車の詳細 */}
                  {selectedVehicleData && (
                    <div className="mt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold">送迎車{selectedVehicle}号</h3>
                          <p className="text-sm text-gray-600">
                            担当: {selectedVehicleData.driver} / 定員: {totalUsers}/{selectedVehicleData.capacity}名 / 車椅子: {totalWheelchair}/{selectedVehicleData.wheelchairCapacity}台
                          </p>
                        </div>
                        <Button 
                          onClick={() => handleOptimizeVehicleRoute(selectedVehicle)}
                          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                        >
                          <Route className="mr-2 h-4 w-4" />
                          ルート最適化
                        </Button>
                      </div>

                      <TripManager
                        vehicleId={selectedVehicle}
                        trips={selectedAssignment.trips}
                        onAddTrip={handleAddTrip}
                        onDeleteTrip={handleDeleteTrip}
                        onReorderUsers={handleReorderUsers}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* ドラッグオーバーレイ */}
      <DragOverlay>
        {activeUser ? (
          <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-blue-500">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{activeUser.name}</span>
              {activeUser.wheelchair && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  <Accessibility className="h-3 w-3 mr-1" />
                  車椅子
                </Badge>
              )}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

export default App

