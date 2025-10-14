import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Calendar, MapPin, Users, Car, Accessibility, Clock } from 'lucide-react'
import './App.css'

function App() {
  const [users, setUsers] = useState([])
  const [schedules, setSchedules] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [facility, setFacility] = useState(null)
  const [loading, setLoading] = useState(true)
  const [todaySchedules, setTodaySchedules] = useState([])

  // CSVデータを読み込む（現時点では静的データ）
  useEffect(() => {
    // サンプルデータ（後でGoogleスプレッドシートから取得）
    const sampleUsers = [
      { user_id: "U001", name: "山田 太郎", address: "東京都世田谷区桜新町1-2-3", phone: "03-1234-5678", wheelchair: false, notes: "" },
      { user_id: "U002", name: "鈴木 花子", address: "東京都世田谷区桜新町1-5-8", phone: "03-1234-5679", wheelchair: true, notes: "車椅子対応必要" },
      { user_id: "U003", name: "田中 一郎", address: "東京都世田谷区桜新町2-3-12", phone: "03-1234-5680", wheelchair: false, notes: "" },
      { user_id: "U004", name: "高橋 美咲", address: "東京都世田谷区桜新町2-8-5", phone: "03-1234-5681", wheelchair: false, notes: "玄関まで介助必要" },
      { user_id: "U005", name: "伊藤 健太", address: "東京都世田谷区桜新町3-1-9", phone: "03-1234-5682", wheelchair: true, notes: "車椅子対応必要" },
    ]

    const today = new Date().toISOString().split('T')[0]
    const sampleSchedules = [
      { user_id: "U001", date: today, pickup_time: "08:30", return_time: "16:00", status: "予定" },
      { user_id: "U002", date: today, pickup_time: "08:45", return_time: "16:00", status: "予定" },
      { user_id: "U003", date: today, pickup_time: "08:30", return_time: "16:00", status: "予定" },
      { user_id: "U004", date: today, pickup_time: "09:00", return_time: "16:00", status: "予定" },
      { user_id: "U005", date: today, pickup_time: "08:45", return_time: "16:00", status: "予定" },
    ]

    const sampleVehicles = [
      { vehicle_id: "V001", vehicle_name: "送迎車1号", capacity: 8, wheelchair_capacity: 2, driver_name: "佐藤 花子" },
      { vehicle_id: "V002", vehicle_name: "送迎車2号", capacity: 6, wheelchair_capacity: 1, driver_name: "中村 次郎" },
    ]

    const sampleFacility = {
      facility_name: "デイサービスさくら",
      address: "東京都世田谷区桜新町2-10-5",
      phone: "03-9876-5432"
    }

    setUsers(sampleUsers)
    setSchedules(sampleSchedules)
    setVehicles(sampleVehicles)
    setFacility(sampleFacility)

    // 今日の送迎対象者を抽出
    const todayList = sampleSchedules
      .filter(schedule => schedule.date === today && schedule.status === "予定")
      .map(schedule => {
        const user = sampleUsers.find(u => u.user_id === schedule.user_id)
        return { ...schedule, ...user }
      })
    
    setTodaySchedules(todayList)
    setLoading(false)
  }, [])

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
              <span className="font-medium">{new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</span>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* サマリーカード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Users className="h-5 w-5 mr-2 text-indigo-600" />
                本日の送迎対象者
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-indigo-600">{todaySchedules.length}</div>
              <p className="text-sm text-gray-500 mt-1">名</p>
            </CardContent>
          </Card>

          <Card className="bg-white hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Accessibility className="h-5 w-5 mr-2 text-purple-600" />
                車椅子対応
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-purple-600">{wheelchairCount}</div>
              <p className="text-sm text-gray-500 mt-1">名（一般: {regularCount}名）</p>
            </CardContent>
          </Card>

          <Card className="bg-white hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Car className="h-5 w-5 mr-2 text-green-600" />
                利用可能車両
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600">{vehicles.length}</div>
              <p className="text-sm text-gray-500 mt-1">台</p>
            </CardContent>
          </Card>
        </div>

        {/* 送迎対象者リスト */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">本日の送迎対象者一覧</CardTitle>
            <CardDescription>
              {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })} の送迎予定
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todaySchedules.map((schedule, index) => (
                <div
                  key={schedule.user_id}
                  className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-all duration-300 hover:border-indigo-300 bg-gradient-to-r from-white to-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className="bg-indigo-600 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center text-sm">
                          {index + 1}
                        </span>
                        <h3 className="text-xl font-semibold text-gray-900">{schedule.name}</h3>
                        {schedule.wheelchair && (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                            <Accessibility className="h-3 w-3 mr-1" />
                            車椅子
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-11">
                        <div className="flex items-start space-x-2 text-gray-600">
                          <MapPin className="h-4 w-4 mt-1 flex-shrink-0 text-indigo-500" />
                          <span className="text-sm">{schedule.address}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Clock className="h-4 w-4 flex-shrink-0 text-green-500" />
                          <span className="text-sm">
                            送迎: {schedule.pickup_time} / 帰宅: {schedule.return_time}
                          </span>
                        </div>
                      </div>

                      {schedule.notes && (
                        <div className="ml-11 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {schedule.notes}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {todaySchedules.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Users className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">本日の送迎予定はありません</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 車両情報 */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">利用可能車両</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {vehicles.map((vehicle) => (
              <Card key={vehicle.vehicle_id} className="bg-white hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Car className="h-5 w-5 mr-2 text-indigo-600" />
                    {vehicle.vehicle_name}
                  </CardTitle>
                  <CardDescription>担当: {vehicle.driver_name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-sm">
                    <div>
                      <span className="text-gray-600">定員:</span>
                      <span className="font-semibold ml-2">{vehicle.capacity}名</span>
                    </div>
                    <div>
                      <span className="text-gray-600">車椅子:</span>
                      <span className="font-semibold ml-2">{vehicle.wheelchair_capacity}台</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* アクションボタン（将来の機能用） */}
        <div className="mt-8 flex justify-center space-x-4">
          <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8" disabled>
            <MapPin className="h-5 w-5 mr-2" />
            地図で表示（開発中）
          </Button>
          <Button size="lg" variant="outline" className="px-8" disabled>
            ルート計算（開発中）
          </Button>
        </div>
      </main>

      {/* フッター */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>{facility?.facility_name} - 送迎運行管理システム v1.0</p>
            <p className="mt-1">〒{facility?.address} / TEL: {facility?.phone}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App

