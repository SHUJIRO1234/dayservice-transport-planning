import React from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Printer } from 'lucide-react'

/**
 * 車両ごとの印刷ビューコンポーネント
 */
const VehiclePrintView = ({ vehicle, selectedDay }) => {
  const handlePrint = () => {
    // 印刷用のウィンドウを開く
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    
    // 印刷用HTMLを生成
    const printContent = generatePrintHTML(vehicle, selectedDay)
    
    printWindow.document.write(printContent)
    printWindow.document.close()
    
    // ページ読み込み後に印刷ダイアログを開く
    printWindow.onload = () => {
      printWindow.print()
    }
  }
  
  return (
    <Button
      onClick={handlePrint}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      <Printer className="h-4 w-4" />
      印刷
    </Button>
  )
}

/**
 * 印刷用HTMLを生成
 */
const generatePrintHTML = (vehicle, selectedDay) => {
  const today = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
  
  // 車椅子対応の利用者数を計算
  const wheelchairCount = vehicle.trips.reduce((sum, trip) => {
    return sum + trip.users.filter(u => u.wheelchair).length
  }, 0)
  
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${vehicle.name} - 運行指示書</title>
  <style>
    @page {
      size: A4;
      margin: 15mm 10mm;
    }
    
    body {
      font-family: 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', 'Meiryo', sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #000;
      background: #fff;
      margin: 0;
      padding: 20px;
    }
    
    .header {
      text-align: center;
      border-bottom: 3px double #333;
      padding-bottom: 15px;
      margin-bottom: 25px;
    }
    
    .header h1 {
      font-size: 20pt;
      font-weight: bold;
      margin: 0 0 10px 0;
    }
    
    .header .date {
      font-size: 13pt;
      color: #666;
      margin-bottom: 5px;
    }
    
    .vehicle-info {
      background: #f0f0f0;
      border: 2px solid #333;
      padding: 15px;
      margin-bottom: 25px;
      border-radius: 5px;
    }
    
    .vehicle-info h2 {
      font-size: 16pt;
      margin: 0 0 10px 0;
      color: #333;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 12pt;
    }
    
    .info-label {
      font-weight: bold;
      color: #555;
    }
    
    .trip-section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    
    .trip-header {
      background: #333;
      color: #fff;
      padding: 10px 15px;
      font-size: 14pt;
      font-weight: bold;
      margin-bottom: 15px;
      border-radius: 3px;
    }
    
    .trip-stats {
      background: #e8f4f8;
      border-left: 4px solid #2196F3;
      padding: 10px 15px;
      margin-bottom: 15px;
      font-size: 11pt;
    }
    
    .user-card {
      border: 2px solid #ddd;
      padding: 12px;
      margin-bottom: 12px;
      background: #fff;
      page-break-inside: avoid;
      border-radius: 3px;
    }
    
    .user-header {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid #ddd;
    }
    
    .user-number {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 35px;
      height: 35px;
      background: #333;
      color: #fff;
      border-radius: 50%;
      font-size: 14pt;
      font-weight: bold;
      margin-right: 12px;
      flex-shrink: 0;
    }
    
    .user-name {
      font-size: 13pt;
      font-weight: bold;
      color: #333;
    }
    
    .wheelchair-badge {
      display: inline-block;
      background: #ff6b6b;
      color: #fff;
      padding: 3px 10px;
      border-radius: 3px;
      font-size: 10pt;
      margin-left: 10px;
    }
    
    .user-details {
      margin-left: 47px;
      font-size: 11pt;
    }
    
    .detail-row {
      margin-bottom: 6px;
      display: flex;
    }
    
    .detail-label {
      display: inline-block;
      width: 100px;
      font-weight: bold;
      color: #555;
    }
    
    .detail-value {
      flex: 1;
    }
    
    .special-note {
      background: #fff3cd;
      border: 1px solid #ffc107;
      padding: 8px 12px;
      margin-top: 8px;
      border-radius: 3px;
      font-size: 10pt;
    }
    
    .special-note-label {
      font-weight: bold;
      color: #856404;
      margin-bottom: 3px;
    }
    
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #ccc;
      text-align: center;
      font-size: 10pt;
      color: #999;
    }
    
    @media print {
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>送迎運行指示書</h1>
    <div class="date">${today}</div>
    <div class="date">${selectedDay}</div>
  </div>
  
  <div class="vehicle-info">
    <h2>${vehicle.name}</h2>
    <div class="info-row">
      <span class="info-label">担当者:</span>
      <span>${vehicle.driver}</span>
    </div>
    <div class="info-row">
      <span class="info-label">定員:</span>
      <span>${vehicle.capacity}名</span>
    </div>
    <div class="info-row">
      <span class="info-label">車椅子:</span>
      <span>${wheelchairCount}/${vehicle.wheelchairCapacity}台</span>
    </div>
  </div>
  
  ${vehicle.trips.map((trip, tripIndex) => `
    <div class="trip-section">
      <div class="trip-header">
        第${tripIndex + 1}便
      </div>
      
      <div class="trip-stats">
        <strong>利用者数:</strong> ${trip.users.length}名 | 
        <strong>距離:</strong> ${trip.totalDistance ? trip.totalDistance.toFixed(2) : '0.00'} km | 
        <strong>時間:</strong> ${trip.totalTime || 0}分
      </div>
      
      ${trip.users.map((user, userIndex) => `
        <div class="user-card">
          <div class="user-header">
            <div class="user-number">${userIndex + 1}</div>
            <div>
              <span class="user-name">${user.name}</span>
              ${user.wheelchair ? '<span class="wheelchair-badge">車椅子</span>' : ''}
            </div>
          </div>
          
          <div class="user-details">
            <div class="detail-row">
              <span class="detail-label">住所:</span>
              <span class="detail-value">${user.address}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">送迎時間:</span>
              <span class="detail-value">${user.pickupTime}</span>
            </div>
            ${user.specialNeeds ? `
              <div class="special-note">
                <div class="special-note-label">⚠️ 特記事項</div>
                <div>${user.specialNeeds}</div>
              </div>
            ` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `).join('')}
  
  <div class="footer">
    デイサービス送迎計画 - 運行管理システム
  </div>
</body>
</html>
  `
}

export default VehiclePrintView

