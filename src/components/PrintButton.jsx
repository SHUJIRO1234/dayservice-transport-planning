import React from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Printer } from 'lucide-react'

/**
 * 印刷ボタンコンポーネント
 * ブラウザの標準印刷機能を使用
 */
const PrintButton = () => {
  const handlePrint = () => {
    window.print()
  }
  
  return (
    <Button
      onClick={handlePrint}
      variant="outline"
      className="flex items-center gap-2"
    >
      <Printer className="h-4 w-4" />
      印刷
    </Button>
  )
}

export default PrintButton

