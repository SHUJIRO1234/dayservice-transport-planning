import React from 'react'

/**
 * 送迎計画表（一覧形式）コンポーネント
 * 全体の送迎計画を一覧で確認できる印刷用資料
 */
const TransportPlanPrint = ({ vehicles, selectedDay, users }) => {
  // 現在の日付を取得
  const currentDate = new Date()
  const dateStr = `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月${currentDate.getDate()}日`
  
  return (
    <div className="print-preview">
      {/* ヘッダー */}
      <div className="print-header">
        <h1>デイサービス送迎計画表</h1>
        <div className="date">{dateStr}（{selectedDay}）</div>
      </div>
      
      {/* 車両ごとの送迎計画 */}
      {vehicles.map((vehicle) => {
        if (!vehicle.inUse) return null
        
        // 車両に割り当てられた利用者を取得
        const vehicleUsers = users.filter(user => user.vehicleId === vehicle.id)
        if (vehicleUsers.length === 0) return null
        
        // 便ごとにグループ化
        const tripGroups = {}
        vehicleUsers.forEach(user => {
          const tripIndex = user.tripIndex || 0
          if (!tripGroups[tripIndex]) {
            tripGroups[tripIndex] = []
          }
          tripGroups[tripIndex].push(user)
        })
        
        return (
          <div key={vehicle.id} className="vehicle-section avoid-break">
            {/* 車両ヘッダー */}
            <div className="vehicle-header">
              <div>【{vehicle.name}】</div>
              <div className="vehicle-info">
                <span>担当: {vehicle.driver}</span>
                <span>定員: {vehicleUsers.length}/{vehicle.capacity}名</span>
                <span>車椅子: {vehicleUsers.filter(u => u.wheelchair).length}/{vehicle.wheelchairCapacity}台</span>
              </div>
            </div>
            
            {/* 便ごとの利用者リスト */}
            {Object.keys(tripGroups).sort((a, b) => Number(a) - Number(b)).map((tripIndex) => {
              const tripUsers = tripGroups[tripIndex]
              const tripNum = Number(tripIndex) + 1
              
              // 距離と時間の計算（実際のデータがあれば使用）
              const distance = vehicle.trips?.[tripIndex]?.distance || 0
              const duration = vehicle.trips?.[tripIndex]?.duration || 0
              
              return (
                <div key={tripIndex} className="trip-section">
                  <div className="trip-header">
                    第{tripNum}便（{tripUsers.length}名
                    {distance > 0 && ` / 距離: ${distance.toFixed(2)} km`}
                    {duration > 0 && ` / 時間: ${Math.round(duration)}分`}）
                  </div>
                  
                  {/* 利用者リスト（簡易版） */}
                  <table className="print-table">
                    <thead>
                      <tr>
                        <th style={{width: '40px'}}>順序</th>
                        <th style={{width: '120px'}}>氏名</th>
                        <th>住所</th>
                        <th style={{width: '80px'}}>車椅子</th>
                        <th style={{width: '100px'}}>特記事項</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tripUsers.map((user, index) => (
                        <tr key={user.id}>
                          <td className="text-center">{index + 1}</td>
                          <td className="font-bold">{user.name}</td>
                          <td>{user.address}</td>
                          <td className="text-center">{user.wheelchair ? '○' : ''}</td>
                          <td>{user.dementia ? '認知症あり' : ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            })}
          </div>
        )
      })}
      
      {/* フッター */}
      <div className="print-footer">
        デイサービス送迎計画 - 運行管理システム
      </div>
    </div>
  )
}

export default TransportPlanPrint

