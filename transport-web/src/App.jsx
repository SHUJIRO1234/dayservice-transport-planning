import { useState, useEffect } from 'react'
import { DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Calendar, MapPin, Users, Car, Accessibility, Clock, Route, Navigation, RotateCcw, Trash2 } from 'lucide-react'
import TransportMap from './components/TransportMap.jsx'
import VehicleTabs from './components/VehicleTabs.jsx'
import TripManager from './components/TripManager.jsx'
import SortableUserCard from './components/SortableUserCard.jsx'
import DashboardView from './components/DashboardView.jsx'
import { optimizeRoute, recalculateRoute } from './utils/routeOptimization.js'
import { weeklyData, vehicles as vehiclesData, facility as facilityData } from './weeklyData.js'
import './App.css'

// 未割り当てリスト用のドロップゾーンコンポーネント
const UnassignedDropZone = ({ children, isDragging }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: 'unassigned',
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        space-y-2 max-h-[600px] overflow-y-auto pr-2 p-4 rounded-lg transition-all
        ${isOver ? 'bg-blue-100 border-2 border-blue-500 shadow-lg' : ''}
        ${isDragging && !isOver ? 'bg-green-50 border-2 border-green-400 border-dashed' : ''}
        ${!isDragging ? 'bg-gray-50 border-2 border-transparent' : ''}
      `}
    >
      {isDragging && (
        <div className="text-center text-green-600 font-semibold py-2 bg-green-100 rounded-lg mb-2">
          ここにドロップして未割り当てに戻す
        </div>
      )}
      {children}
    </div>
  );
};

function App() {
  const [selectedWeekday, setSelectedWeekday] = useState('月曜日')
  const [selectedVehicle, setSelectedVehicle] = useState(1)
  const [vehicles, setVehicles] = useState(vehiclesData)
  const [facility, setFacility] = useState(facilityData)
  const [showMap, setShowMap] = useState(false)
  const [viewMode, setViewMode] = useState('tab') // 'tab' or 'dashboard'
  const [activeId, setActiveId] = useState(null)
  const [vehicleAssignments, setVehicleAssignments] = useState({})
  const [unassignedUsers, setUnassignedUsers] = useState([])
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  const weekdays = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日', '日曜日']

  // ドラッグ&ドロップセンサー設定
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // 曜日が変わったらローカルストレージから読み込む
  useEffect(() => {
    setIsInitialLoad(true) // 読み込み中フラグを立てる
    const storageKey = `transport_plan_${selectedWeekday}`
    const saved = localStorage.getItem(storageKey)
    
    if (saved) {
      // 保存されたデータを読み込む
      const savedData = JSON.parse(saved)
      setUnassignedUsers(savedData.unassignedUsers || [])
      setVehicleAssignments(savedData.vehicleAssignments || {})
    } else {
      // 保存されたデータがない場合は初期化
      const users = weeklyData[selectedWeekday] || []
      setUnassignedUsers(users)
      
      const initialAssignments = {}
      vehicles.forEach(vehicle => {
        initialAssignments[vehicle.id] = {
          trips: [{ users: [], distance: 0, duration: 0 }]
        }
      })
      setVehicleAssignments(initialAssignments)
    }
    
    // 次のレンダリングでフラグを下ろす
    setTimeout(() => setIsInitialLoad(false), 0)
  }, [selectedWeekday])
  
  // 変更をローカルストレージに自動保存（初期読み込み時はスキップ）
  useEffect(() => {
    if (isInitialLoad) return // 初期読み込み中は保存しない
    
    const storageKey = `transport_plan_${selectedWeekday}`
    const dataToSave = {
      unassignedUsers,
      vehicleAssignments,
      savedAt: new Date().toISOString()
    }
    localStorage.setItem(storageKey, JSON.stringify(dataToSave))
  }, [vehicleAssignments, unassignedUsers, selectedWeekday, isInitialLoad])

  // 自動割り当て
  const handleAutoAssign = () => {
    if (unassignedUsers.length === 0) return

    const newAssignments = { ...vehicleAssignments }
    // 欠席者を除外して割り当て
    let wheelchairUsers = [...unassignedUsers.filter(u => u.wheelchair && !u.isAbsent)]
    let regularUsers = [...unassignedUsers.filter(u => !u.wheelchair && !u.isAbsent)]

    // 有効な車両のみを対象にする
    const activeVehicles = vehicles.filter(v => v.isActive)
    
    if (activeVehicles.length === 0) {
      alert('有効な車両がありません。車両を有効にしてください。')
      return
    }

    // 各車両の便をリセット
    activeVehicles.forEach(vehicle => {
      newAssignments[vehicle.id] = { trips: [] }
    })

    // 必要な便数を計算（車椅子と一般を別々に計算）
    const totalCapacity = activeVehicles.reduce((sum, v) => sum + v.capacity, 0)
    const totalWheelchairCapacity = activeVehicles.reduce((sum, v) => sum + v.wheelchairCapacity, 0)
    const totalUsers = wheelchairUsers.length + regularUsers.length
    
    // 車椅子利用者と一般利用者の必要便数を計算
    const wheelchairTripsNeeded = Math.ceil(wheelchairUsers.length / totalWheelchairCapacity)
    const regularTripsNeeded = Math.ceil(totalUsers / totalCapacity)
    const tripsNeeded = Math.max(wheelchairTripsNeeded, regularTripsNeeded)

    // 各車両に必要な便数分の便を作成
    for (let tripIndex = 0; tripIndex < tripsNeeded; tripIndex++) {
      activeVehicles.forEach(vehicle => {
        if (!newAssignments[vehicle.id].trips[tripIndex]) {
          newAssignments[vehicle.id].trips.push({ users: [], distance: 0, duration: 0 })
        }

        const tripUsers = newAssignments[vehicle.id].trips[tripIndex].users

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

      // すべての利用者が割り当てられたら終了
      if (wheelchairUsers.length === 0 && regularUsers.length === 0) {
        break
      }
    }

    // 欠席者を含めた未割り当てリストを作成
    const absentUsers = unassignedUsers.filter(u => u.isAbsent)
    const remainingUsers = [...wheelchairUsers, ...regularUsers, ...absentUsers]
    setVehicleAssignments(newAssignments)
    setUnassignedUsers(remainingUsers)
  }

  // 全リセット
  const handleResetAll = () => {
    const users = weeklyData[selectedWeekday] || []
    setUnassignedUsers(users)
    
    const initialAssignments = {}
    vehicles.forEach(vehicle => {
      initialAssignments[vehicle.id] = {
        trips: [{ users: [], distance: 0, duration: 0 }]
      }
    })
    setVehicleAssignments(initialAssignments)
  }

  // 車両ごとのリセット
  const handleResetVehicle = (vehicleId) => {
    const assignment = vehicleAssignments[vehicleId]
    if (!assignment) return

    // 車両の全利用者を未割り当てに戻す
    const allUsers = assignment.trips.flatMap(trip => trip.users)
    setUnassignedUsers([...unassignedUsers, ...allUsers])

    // 車両をリセット
    setVehicleAssignments({
      ...vehicleAssignments,
      [vehicleId]: {
        trips: [{ users: [], distance: 0, duration: 0 }]
      }
    })
  }

  // ルートを最適化（車両ごと）
  const handleOptimizeVehicleRoute = (vehicleId) => {
    const assignment = vehicleAssignments[vehicleId]
    if (!assignment || !facility) return

    const newAssignments = { ...vehicleAssignments }

    newAssignments[vehicleId].trips = assignment.trips.map(trip => {
      const users = trip.users || []
      if (users.length === 0) {
        return { users: [], distance: 0, duration: 0 }
      }

      const result = optimizeRoute(facility, users)
      return {
        users: result.order,
        distance: result.totalDistance,
        duration: result.estimatedTime
      }
    })

    setVehicleAssignments(newAssignments)
  }

  // 車両の有効/無効切り替え
  const handleToggleVehicle = (vehicleId) => {
    setVehicles(vehicles.map(v => 
      v.id === vehicleId ? { ...v, isActive: !v.isActive } : v
    ))
  }

  // 欠席者のトグル
  const handleToggleAbsent = (userId) => {
    setUnassignedUsers(unassignedUsers.map(u => 
      u.id === userId ? { ...u, isAbsent: !u.isAbsent } : u
    ))
  }

  // 全ルート最適化
  const handleOptimizeAllRoutes = () => {
    if (!facility) return

    const newAssignments = { ...vehicleAssignments }

    Object.keys(newAssignments).forEach(vehicleId => {
      const assignment = newAssignments[vehicleId]
      if (!assignment) return

      newAssignments[vehicleId].trips = assignment.trips.map(trip => {
        const users = trip.users || []
        if (users.length === 0) {
          return { users: [], distance: 0, duration: 0 }
        }

        const result = optimizeRoute(facility, users)
        return {
          users: result.order,
          distance: result.totalDistance,
          duration: result.estimatedTime
        }
      })
    })

    setVehicleAssignments(newAssignments)
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
    const trip = newAssignments[vehicleId].trips[tripIndex]
    
    // 便の利用者を未割り当てに戻す
    if (trip && trip.users.length > 0) {
      setUnassignedUsers([...unassignedUsers, ...trip.users])
    }
    
    newAssignments[vehicleId].trips.splice(tripIndex, 1)
    setVehicleAssignments(newAssignments)
  }

  // 便内でユーザーを並び替え
  const handleReorderUsers = (vehicleId, tripIndex, oldIndex, newIndex) => {
    const newAssignments = { ...vehicleAssignments }
    const trip = newAssignments[vehicleId].trips[tripIndex]
    
    trip.users = arrayMove(trip.users, oldIndex, newIndex)
    
    // 距離と時間を再計算
    if (trip.users.length > 0 && facility) {
      const result = recalculateRoute(facility, trip.users)
      trip.distance = result.totalDistance
      trip.duration = result.estimatedTime
    }
    
    setVehicleAssignments(newAssignments)
  }

  // ドラッグ開始
  const handleDragStart = (event) => {
    setActiveId(event.active.id)
  }

  // ドラッグキャンセル
  const handleDragCancel = () => {
    console.log('ドラッグがキャンセルされました')
    setActiveId(null)
  }

  // ドラッグ終了
  const handleDragEnd = (event) => {
    const { active, over } = event

    // overがない場合は何もしない（先にチェック）
    if (!over) {
      console.log('ドロップ失敗: ドロップゾーンが見つかりませんでした。元の位置に残ります。', { activeId: active.id })
      setActiveId(null)
      return
    }
    
    setActiveId(null)

    const activeId = active.id
    const overId = over.id
    
    console.log('Drag End:', { activeId, overId })

    // ドラッグ元を特定
    let sourceType = null
    let sourceVehicleId = null
    let sourceTripIndex = null
    let sourceUserIndex = null
    let draggedUser = null

    // 未割り当てから
    if (unassignedUsers.find(u => u.id === activeId)) {
      sourceType = 'unassigned'
      draggedUser = unassignedUsers.find(u => u.id === activeId)
    } else {
      // 車両から
      for (const [vehicleId, assignment] of Object.entries(vehicleAssignments)) {
        for (let tripIndex = 0; tripIndex < assignment.trips.length; tripIndex++) {
          const userIndex = assignment.trips[tripIndex].users.findIndex(u => u.id === activeId)
          if (userIndex !== -1) {
            sourceType = 'vehicle'
            sourceVehicleId = parseInt(vehicleId)
            sourceTripIndex = tripIndex
            sourceUserIndex = userIndex
            draggedUser = assignment.trips[tripIndex].users[userIndex]
            break
          }
        }
        if (draggedUser) break
      }
    }

    if (!draggedUser) return

    // ドロップ先を特定
    let targetType = null
    let targetVehicleId = null
    let targetTripIndex = null

    // 未割り当てへ
    if (overId === 'unassigned') {
      targetType = 'unassigned'
    } else if (unassignedUsers.some(u => u.id === overId)) {
      // 未割り当てリスト内のユーザーにドロップした場合も未割り当てとして扱う
      targetType = 'unassigned'
    } else if (overId.toString().startsWith('vehicle-')) {
      // 車両へ
      targetType = 'vehicle'
      targetVehicleId = parseInt(overId.replace('vehicle-', ''))
      targetTripIndex = 0 // デフォルトで第1便
    } else if (overId.toString().startsWith('trip-')) {
      // 便へ
      targetType = 'trip'
      const parts = overId.split('-')
      targetVehicleId = parseInt(parts[1])
      targetTripIndex = parseInt(parts[2])
    } else {
      // 便内の利用者へ（順序入れ替え）
      for (const [vehicleId, assignment] of Object.entries(vehicleAssignments)) {
        for (let tripIndex = 0; tripIndex < assignment.trips.length; tripIndex++) {
          const userIndex = assignment.trips[tripIndex].users.findIndex(u => u.id === overId)
          if (userIndex !== -1) {
            targetType = 'reorder'
            targetVehicleId = parseInt(vehicleId)
            targetTripIndex = tripIndex
            break
          }
        }
        if (targetType === 'reorder') break
      }
    }
    
    console.log('Target:', { targetType, targetVehicleId, targetTripIndex })
    console.log('Source:', { sourceType, sourceVehicleId, sourceTripIndex })
    
    // ターゲットが特定できない場合は何もしない
    if (!targetType) {
      console.warn('ターゲットが特定できませんでした')
      return
    }

    // 移動処理
    const newAssignments = { ...vehicleAssignments }

    // 同じ便内での順序入れ替えの場合は特別処理
    if (targetType === 'reorder' && sourceVehicleId === targetVehicleId && sourceTripIndex === targetTripIndex) {
      const trip = newAssignments[targetVehicleId].trips[targetTripIndex]
      const overIndex = trip.users.findIndex(u => u.id === overId)
      trip.users = arrayMove(trip.users, sourceUserIndex, overIndex)
      
      // 距離と時間を再計算
      if (trip.users.length > 0 && facility) {
        const result = recalculateRoute(facility, trip.users)
        trip.distance = result.totalDistance
        trip.duration = result.estimatedTime
      }
      
      setVehicleAssignments(newAssignments)
      return
    }

    // 移動先のバリデーション（元の場所から削除する前にチェック）
    if (targetType === 'vehicle' || targetType === 'trip') {
      if (!newAssignments[targetVehicleId]) {
        newAssignments[targetVehicleId] = { trips: [{ users: [], distance: 0, duration: 0 }] }
      }
      
      // 定員チェック
      const targetVehicle = vehicles.find(v => v.id === targetVehicleId)
      const targetTrip = newAssignments[targetVehicleId].trips[targetTripIndex]
      const currentUsers = targetTrip.users.length
      const currentWheelchairUsers = targetTrip.users.filter(u => u.wheelchair).length
      
      // 車椅子定員チェック
      if (draggedUser.wheelchair && currentWheelchairUsers >= targetVehicle.wheelchairCapacity) {
        alert(`車椅子定員オーバーです。${targetVehicle.name}の車椅子定員は${targetVehicle.wheelchairCapacity}台です。`)
        return // 元の場所に残る
      }
      
      // 総定員チェック
      if (currentUsers >= targetVehicle.capacity) {
        alert(`定員オーバーです。${targetVehicle.name}の定員は${targetVehicle.capacity}名です。`)
        return // 元の場所に残る
      }
    }

    // 元の場所から削除
    if (sourceType === 'unassigned') {
      setUnassignedUsers(prev => prev.filter(u => u.id !== activeId))
    } else if (sourceType === 'vehicle') {
      newAssignments[sourceVehicleId].trips[sourceTripIndex].users.splice(sourceUserIndex, 1)
      
      // 距離と時間を再計算
      const trip = newAssignments[sourceVehicleId].trips[sourceTripIndex]
      if (trip.users.length > 0 && facility) {
        const result = recalculateRoute(facility, trip.users)
        trip.distance = result.totalDistance
        trip.duration = result.estimatedTime
      } else {
        trip.distance = 0
        trip.duration = 0
      }
    }

    // 新しい場所に追加
    if (targetType === 'unassigned') {
      setUnassignedUsers(prev => [...prev, draggedUser])
    } else if (targetType === 'vehicle' || targetType === 'trip') {
      newAssignments[targetVehicleId].trips[targetTripIndex].users.push(draggedUser)
      
      // 距離と時間を再計算
      const trip = newAssignments[targetVehicleId].trips[targetTripIndex]
      if (trip.users.length > 0 && facility) {
        const result = recalculateRoute(facility, trip.users)
        trip.distance = result.totalDistance
        trip.duration = result.estimatedTime
      }
    }

    setVehicleAssignments(newAssignments)
  }

  // 統計情報を計算
  const totalUsers = weeklyData[selectedWeekday]?.length || 0
  const wheelchairUsers = weeklyData[selectedWeekday]?.filter(u => u.wheelchair).length || 0
  const regularUsers = totalUsers - wheelchairUsers

  // 選択中の車両の統計
  const selectedVehicleAssignment = vehicleAssignments[selectedVehicle] || { trips: [] }
  const selectedVehicleUsers = selectedVehicleAssignment.trips.flatMap(trip => trip.users)
  const selectedVehicleWheelchair = selectedVehicleUsers.filter(u => u.wheelchair).length
  const selectedVehicleRegular = selectedVehicleUsers.length - selectedVehicleWheelchair

  // 地図用のデータ
  const allAssignedUsers = Object.values(vehicleAssignments).flatMap(assignment =>
    assignment.trips.flatMap(trip => trip.users)
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto p-4 md:p-6">
          {/* ヘッダー */}
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              デイサービス送迎計画 - 運行管理システム
            </h1>
            <p className="text-gray-600">効率的な送迎ルートの計画と管理</p>
          </div>

          {/* 曜日選択タブ */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                曜日選択
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {weekdays.map(day => (
                  <Button
                    key={day}
                    onClick={() => setSelectedWeekday(day)}
                    variant={selectedWeekday === day ? 'default' : 'outline'}
                    className="flex-1 min-w-[100px]"
                  >
                    {day}
                    <Badge variant="secondary" className="ml-2">
                      {weeklyData[day]?.length || 0}名
                    </Badge>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* サマリー情報 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {selectedWeekday}の送迎対象者
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{totalUsers}名</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Accessibility className="w-4 h-4" />
                  車椅子対応
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {wheelchairUsers}名
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    (一般: {regularUsers}名)
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Car className="w-4 h-4" />
                  利用可能車両
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{vehicles.length}台</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  未割り当て
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">{unassignedUsers.length}名</div>
              </CardContent>
            </Card>
          </div>

          {/* アクションボタン */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="flex gap-2 mr-4">
              <Button 
                onClick={() => setViewMode('tab')} 
                variant={viewMode === 'tab' ? 'default' : 'outline'}
                size="sm"
              >
                タブビュー
              </Button>
              <Button 
                onClick={() => setViewMode('dashboard')} 
                variant={viewMode === 'dashboard' ? 'default' : 'outline'}
                size="sm"
              >
                全体ビュー
              </Button>
            </div>
            <Button onClick={handleAutoAssign} className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              自動割り当て
            </Button>
            <Button onClick={handleOptimizeAllRoutes} variant="secondary" className="flex items-center gap-2">
              <Route className="w-4 h-4" />
              全ルート最適化
            </Button>
            <Button onClick={() => setShowMap(!showMap)} variant="outline" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {showMap ? '地図を隠す' : '地図で表示'}
            </Button>
            <Button onClick={handleResetAll} variant="destructive" className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              全リセット
            </Button>
          </div>

          {/* 地図表示 */}
          {showMap && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="w-5 h-5" />
                  送迎ルート地図
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TransportMap
                  users={allAssignedUsers}
                  facility={facility}
                  optimizedRoute={[]}
                />
              </CardContent>
            </Card>
          )}

          {/* ビューモードに応じて表示切り替え */}
          {viewMode === 'dashboard' ? (
            <DashboardView
              vehicles={vehicles}
              vehicleAssignments={vehicleAssignments}
              unassignedUsers={unassignedUsers}
              onToggleAbsent={handleToggleAbsent}
              onOptimizeVehicle={handleOptimizeVehicleRoute}
              activeId={activeId}
            />
          ) : (
          <div className="grid grid-cols-3 gap-6">
            {/* 左側: 未割り当て利用者リスト */}
            <div className="col-span-1">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    未割り当ての利用者
                    <Badge variant="secondary">{unassignedUsers.length}名</Badge>
                  </CardTitle>
                  <CardDescription>
                    利用者を送迎車にドラッグ&ドロップして割り当てます
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UnassignedDropZone isDragging={!!activeId}>
                    <SortableContext
                      items={unassignedUsers.map(u => u.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {unassignedUsers.map((user) => (
                        <SortableUserCard 
                          key={user.id} 
                          user={user} 
                          showAbsentToggle={true}
                          onToggleAbsent={handleToggleAbsent}
                        />
                      ))}
                    </SortableContext>
                    {unassignedUsers.length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        すべての利用者が割り当てられました
                      </div>
                    )}
                  </UnassignedDropZone>
                </CardContent>
              </Card>
            </div>

            {/* 右側: 送迎車別管理 */}
            <div className="col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="w-5 h-5" />
                    送迎車別管理
                  </CardTitle>
                  <CardDescription>
                    送迎車を選択して利用者を管理します
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* 送迎車タブ */}
                  <VehicleTabs
                    vehicles={vehicles}
                    selectedVehicle={selectedVehicle}
                    setSelectedVehicle={setSelectedVehicle}
                    vehicleAssignments={vehicleAssignments}
                    onToggleVehicle={handleToggleVehicle}
                  />

                  {/* 選択中の送迎車の詳細 */}
                  <div className="mt-6">
                    {vehicles.find(v => v.id === selectedVehicle) && (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold">
                              送迎車{selectedVehicle}号
                            </h3>
                            <p className="text-sm text-gray-600">
                              担当: {vehicles.find(v => v.id === selectedVehicle).driver}
                            </p>
                            <div className="flex gap-4 mt-2">
                              <Badge variant="outline">
                                定員: {selectedVehicleRegular}/{vehicles.find(v => v.id === selectedVehicle).capacity}名
                              </Badge>
                              <Badge variant="outline">
                                車椅子: {selectedVehicleWheelchair}/{vehicles.find(v => v.id === selectedVehicle).wheelchairCapacity}台
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleOptimizeVehicleRoute(selectedVehicle)}
                              size="sm"
                              variant="secondary"
                            >
                              <Route className="w-4 h-4 mr-2" />
                              ルート最適化
                            </Button>
                            <Button
                              onClick={() => handleResetVehicle(selectedVehicle)}
                              size="sm"
                              variant="destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              リセット
                            </Button>
                          </div>
                        </div>

                        {/* 便管理 */}
                        <TripManager
                          vehicleId={selectedVehicle}
                          trips={selectedVehicleAssignment.trips}
                          facility={facility}
                          onAddTrip={handleAddTrip}
                          onRemoveTrip={handleRemoveTrip}
                          onReorderUsers={handleReorderUsers}
                        />
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          )}
        </div>
      </div>

      <DragOverlay>
        {activeId ? (
          <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-blue-500">
            ドラッグ中...
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

export default App

