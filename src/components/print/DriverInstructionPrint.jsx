import React from 'react'

/**
 * 運行指示書（詳細形式）コンポーネント
 * ドライバーが実際の運行で使用する詳細な指示書
 */
const DriverInstructionPrint = ({ vehicles, selectedDay, users }) => {
  // 現在の日付を取得
  const currentDate = new Date()
  const dateStr = `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月${currentDate.getDate()}日`
  
  return (
    <div className="print-preview">
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
          <div key={vehicle.id} className="page-break">
            {/* ヘッダー */}
            <div className="print-header">
              <h1>運行指示書 - {vehicle.name}</h1>
              <div className="date">
                担当: {vehicle.driver}<br />
                {dateStr}（{selectedDay}）
              </div>
            </div>
            
            {/* 便ごとの詳細指示 */}
            {Object.keys(tripGroups).sort((a, b) => Number(a) - Number(b)).map((tripIndex) => {
              const tripUsers = tripGroups[tripIndex]
              const tripNum = Number(tripIndex) + 1
              
              // 距離と時間の計算
              const distance = vehicle.trips?.[tripIndex]?.distance || 0
              const duration = vehicle.trips?.[tripIndex]?.duration || 0
              
              // 出発時刻（最初の利用者の時刻）
              const departureTime = tripUsers[0]?.pickupTime || '08:00'
              
              // 到着予定時刻（出発時刻 + 所要時間）
              const arrivalTime = duration > 0 
                ? calculateArrivalTime(departureTime, duration)
                : '未設定'
              
              return (
                <div key={tripIndex} className="mb-20">
                  {/* 便のヘッダー */}
                  <div className="instruction-header">
                    【第{tripNum}便】
                  </div>
                  
                  <div className="instruction-body mb-20">
                    <div className="instruction-row">
                      <span className="instruction-label">出発時刻:</span>
                      <span className="instruction-value">{departureTime}</span>
                    </div>
                    <div className="instruction-row">
                      <span className="instruction-label">総距離:</span>
                      <span className="instruction-value">{distance.toFixed(2)} km</span>
                    </div>
                    <div className="instruction-row">
                      <span className="instruction-label">所要時間:</span>
                      <span className="instruction-value">約{Math.round(duration)}分</span>
                    </div>
                    <div className="instruction-row">
                      <span className="instruction-label">施設到着予定:</span>
                      <span className="instruction-value">{arrivalTime}</span>
                    </div>
                  </div>
                  
                  {/* 利用者ごとの詳細カード */}
                  {tripUsers.map((user, index) => (
                    <div key={user.id} className="instruction-card avoid-break">
                      <div className="user-card-header">
                        <span className="user-number">{index + 1}</span>
                        <span>{user.name} 様</span>
                        {user.wheelchair && (
                          <span className="wheelchair-badge">車椅子対応</span>
                        )}
                      </div>
                      
                      <div className="user-card-body">
                        <div className="instruction-row">
                          <span className="instruction-label">住所:</span>
                          <span className="instruction-value">{user.address}</span>
                        </div>
                        <div className="instruction-row">
                          <span className="instruction-label">送迎時間:</span>
                          <span className="instruction-value">{user.pickupTime || '08:00'}</span>
                        </div>
                        
                        {/* 特記事項 */}
                        {(user.dementia || user.notes) && (
                          <div className="special-note">
                            <div className="special-note-label">⚠ 特記事項</div>
                            <div>
                              {user.dementia && <div>• 認知症の方です。丁寧な対応をお願いします。</div>}
                              {user.notes && <div>• {user.notes}</div>}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}
            
            {/* フッター */}
            <div className="print-footer">
              デイサービス送迎計画 - 運行管理システム
            </div>
          </div>
        )
      })}
    </div>
  )
}

// 到着時刻を計算する補助関数
function calculateArrivalTime(departureTime, durationMinutes) {
  const [hours, minutes] = departureTime.split(':').map(Number)
  const totalMinutes = hours * 60 + minutes + durationMinutes
  const arrivalHours = Math.floor(totalMinutes / 60)
  const arrivalMinutes = totalMinutes % 60
  return `${String(arrivalHours).padStart(2, '0')}:${String(arrivalMinutes).padStart(2, '0')}`
}

export default DriverInstructionPrint

