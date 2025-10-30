import React, { useEffect } from 'react'
import TransportPlanPrint from './TransportPlanPrint'
import DriverInstructionPrint from './DriverInstructionPrint'

/**
 * 印刷プレビューページ
 * 新しいウィンドウで開いて印刷プレビューを表示
 */
const PrintPreviewPage = ({ printType, vehicles, selectedDay, users }) => {
  useEffect(() => {
    // ページが読み込まれたら自動的に印刷ダイアログを表示
    const timer = setTimeout(() => {
      window.print()
    }, 500)
    
    return () => clearTimeout(timer)
  }, [])
  
  return (
    <div>
      {printType === 'plan' && (
        <TransportPlanPrint 
          vehicles={vehicles}
          selectedDay={selectedDay}
          users={users}
        />
      )}
      
      {printType === 'instruction' && (
        <DriverInstructionPrint 
          vehicles={vehicles}
          selectedDay={selectedDay}
          users={users}
        />
      )}
      
      {/* 印刷用の閉じるボタン */}
      <div className="no-print" style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000
      }}>
        <button
          onClick={() => window.close()}
          style={{
            padding: '10px 20px',
            background: '#333',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          閉じる
        </button>
      </div>
    </div>
  )
}

export default PrintPreviewPage

