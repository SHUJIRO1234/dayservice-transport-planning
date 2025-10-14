import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Calendar, MapPin, Users, Car, Accessibility, Clock, Route, Navigation, RefreshCw, Edit3 } from 'lucide-react'
import TransportMap from './components/TransportMap.jsx'
import SortableRouteList from './components/SortableRouteList.jsx'
import { optimizeRoute, recalculateRoute, assignUsersToVehicles } from './utils/routeOptimization.js'
import { sampleUsers, sampleSchedules, sampleVehicles, sampleFacility } from './sampleData30.js'
import './App.css'

function App() {
  const [users, setUsers] = useState([])
  const [schedules, setSchedules] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [facility, setFacility] = useState(null)
  const [loading, setLoading] = useState(true)
  const [todaySchedules, setTodaySchedules] = useState([])
  const [showMap, setShowMap] = useState(false)
  const [optimizedRoute, setOptimizedRoute] = useState(null)
  const [vehicleAssignments, setVehicleAssignments] = useState([])
  const [isEditingRoute, setIsEditingRoute] = useState(false)
  const [manualRoute, setManualRoute] = useState(null)

  // 30名のサンプルデータを読み込む
  useEffect(() => {
    setUsers(sampleUsers)
    setSchedules(sampleSchedules)
    setVehicles(sampleVehicles)
    setFacility(sampleFacility)

    // 今日の送迎対象者を抽出
    const today = new Date().toISOString().split('T')[0]
    const todayList = sampleSchedules
      .filter(schedule => schedule.date === today && schedule.status === "予定")
      .map(schedule => {
        const user = sampleUsers.find(u => u.user_id === schedule.user_id)
        return { ...schedule, ...user }
      })
    
    setTodaySchedules(todayList)
    setLoading(false)
  }, [])

  // ルートを自動最適化
  const handleOptimizeRoute = () => {
    if (!facility || todaySchedules.length === 0) return

    const result = optimizeRoute(facility, todaySchedules)
    setOptimizedRoute(result)
    setManualRoute(null)
    setIsEditingRoute(false)

    // 車両割り当て
    const assignments = assignUsersToVehicles(result.order, vehicles)
    setVehicleAssignments(assignments)
  }

  // 手動でルートを並び替え
  const handleReorderRoute = (newOrder) => {
    if (!facility) return

    const result = recalculateRoute(facility, newOrder)
    setManualRoute(result)
    setOptimizedRoute(result)

    // 車両割り当てを更新
    const assignments = assignUsersToVehicles(newOrder, vehicles)
    setVehicleAssignments(assignments)
  }

  // 編集モードの切り替え
  const toggleEditMode = () => {
    setIsEditingRoute(!isEditingRoute)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  const wheelchairCount = todaySchedules.filter(s => s.wheelchair).length
  const regularCount = todaySchedules.filter(s => !s.wheelchair).length

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
                <h1 className="text-3xl font-bold text-gray-900">デイサービス送迎計画</h1>
                <p className="text-sm text-gray-500 mt-1">{facility?.facility_name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Calendar className="h-5 w-5" />
              <span className="text-sm font-medium">{new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* サマリーカード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">本日の送迎対象者</CardTitle>
              <Users className="h-5 w-5 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-600">{todaySchedules.length}</div>
              <p className="text-xs text-gray-500 mt-1">名</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">車椅子対応</CardTitle>
              <Accessibility className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{wheelchairCount}</div>
              <p className="text-xs text-gray-500 mt-1">名（一般: {regularCount}名）</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">利用可能車両</CardTitle>
              <Car className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{vehicles.length}</div>
              <p className="text-xs text-gray-500 mt-1">台</p>
            </CardContent>
          </Card>
        </div>

        {/* 本日の送迎対象者一覧 */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6 text-indigo-600" />
              本日の送迎対象者一覧
            </CardTitle>
            <CardDescription>{new Date().toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })} の送迎予定</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {todaySchedules.map((schedule, index) => (
                <div key={schedule.user_id} className="bg-gradient-to-br from-white to-gray-50 rounded-lg p-4 border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm">
                        {index + 1}
                      </div>
                      <h3 className="font-semibold text-gray-900">{schedule.name}</h3>
                    </div>
                    {schedule.wheelchair && (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200">
                        <Accessibility className="h-3 w-3 mr-1" />
                        車椅子
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{schedule.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span>送迎: {schedule.pickup_time} / 帰宅: {schedule.return_time}</span>
                    </div>
                    {schedule.notes && (
                      <p className="text-xs text-gray-500 mt-2 bg-yellow-50 p-2 rounded">{schedule.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 地図表示セクション */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-6 w-6 text-indigo-600" />
                  送迎ルート地図
                </CardTitle>
                <CardDescription>利用者の位置と最適化されたルートを表示</CardDescription>
              </div>
              <Button onClick={() => setShowMap(!showMap)} variant="outline" className="hover:bg-indigo-50">
                <Navigation className="h-4 w-4 mr-2" />
                {showMap ? '地図を閉じる' : '地図で表示'}
              </Button>
            </div>
          </CardHeader>
          
          {showMap && (
            <CardContent className="animate-in fade-in duration-500">
              <TransportMap 
                facility={facility}
                users={todaySchedules}
                route={optimizedRoute ? optimizedRoute.route : null}
              />
            </CardContent>
          )}
        </Card>

        {/* ルート最適化セクション */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Route className="h-6 w-6 text-indigo-600" />
                  送迎ルート最適化
                </CardTitle>
                <CardDescription>最適な巡回ルートを自動計算、または手動で調整</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleOptimizeRoute} className="bg-indigo-600 hover:bg-indigo-700">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  ルートを最適化
                </Button>
                {optimizedRoute && (
                  <Button onClick={toggleEditMode} variant="outline" className="hover:bg-indigo-50">
                    <Edit3 className="h-4 w-4 mr-2" />
                    {isEditingRoute ? '編集完了' : '手動で調整'}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          {optimizedRoute && (
            <CardContent className="animate-in fade-in duration-500">
              {/* ルート統計情報 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                  <div className="text-sm text-blue-700 font-medium mb-1">総移動距離</div>
                  <div className="text-2xl font-bold text-blue-900">{optimizedRoute.totalDistance} km</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                  <div className="text-sm text-green-700 font-medium mb-1">予想所要時間</div>
                  <div className="text-2xl font-bold text-green-900">{optimizedRoute.estimatedTime} 分</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                  <div className="text-sm text-purple-700 font-medium mb-1">訪問件数</div>
                  <div className="text-2xl font-bold text-purple-900">{optimizedRoute.order.length} 件</div>
                </div>
              </div>

              {/* 訪問順序 */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-indigo-600" />
                  訪問順序
                  {isEditingRoute && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      ドラッグして並び替え
                    </Badge>
                  )}
                  {manualRoute && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      手動調整済み
                    </Badge>
                  )}
                </h3>
                
                {isEditingRoute ? (
                  <SortableRouteList 
                    users={optimizedRoute.order} 
                    onReorder={handleReorderRoute}
                  />
                ) : (
                  <div className="space-y-2">
                    {/* 出発地点 */}
                    <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500 text-white font-bold flex items-center justify-center text-sm">
                        0
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{facility.facility_name}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {facility.address}（出発）
                        </div>
                      </div>
                    </div>

                    {/* 訪問先 */}
                    {optimizedRoute.order.map((user, index) => (
                      <div key={user.user_id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{user.name}</span>
                            {user.wheelchair && (
                              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                                <Accessibility className="h-3 w-3 mr-1" />
                                車椅子
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{user.address}</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* 帰着地点 */}
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 text-white font-bold flex items-center justify-center text-sm">
                        {optimizedRoute.order.length + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{facility.facility_name}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {facility.address}（帰着）
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 車両別割り当て */}
              {vehicleAssignments.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Car className="h-5 w-5 text-indigo-600" />
                    車両別割り当て
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {vehicleAssignments.map((assignment) => (
                      <Card key={assignment.vehicle.vehicle_id} className="border-2 border-indigo-100">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Car className="h-5 w-5 text-indigo-600" />
                            {assignment.vehicle.vehicle_name}
                          </CardTitle>
                          <CardDescription>担当: {assignment.vehicle.driver_name}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex gap-4 mb-3 text-sm">
                            <div>
                              <span className="text-gray-600">一般: </span>
                              <span className="font-semibold">{assignment.regularCount}/{assignment.vehicle.capacity}名</span>
                            </div>
                            <div>
                              <span className="text-gray-600">車椅子: </span>
                              <span className="font-semibold">{assignment.wheelchairCount}/{assignment.vehicle.wheelchair_capacity}名</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            {assignment.users.map((user) => (
                              <div key={user.user_id} className="text-sm flex items-center gap-2 text-gray-700">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                                <span>{user.name}</span>
                                {user.wheelchair && (
                                  <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                                    <Accessibility className="h-2.5 w-2.5 mr-0.5" />
                                    車椅子
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* 利用可能車両 */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-6 w-6 text-indigo-600" />
              利用可能車両
            </CardTitle>
            <CardDescription>本日利用可能な送迎車両</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vehicles.map((vehicle) => (
                <div key={vehicle.vehicle_id} className="bg-gradient-to-br from-white to-gray-50 rounded-lg p-4 border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Car className="h-5 w-5 text-indigo-600" />
                    <h3 className="font-semibold text-gray-900">{vehicle.vehicle_name}</h3>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>担当:</span>
                      <span className="font-medium">{vehicle.driver_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>定員:</span>
                      <span className="font-medium">{vehicle.capacity}名</span>
                    </div>
                    <div className="flex justify-between">
                      <span>車椅子:</span>
                      <span className="font-medium">{vehicle.wheelchair_capacity}台</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* フッター */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-gray-500">
          <p>{facility?.facility_name} - 送迎運行管理システム v1.0</p>
          <p className="mt-1">{facility?.address} / TEL: {facility?.phone}</p>
        </div>
      </footer>
    </div>
  )
}

export default App

