import React, { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { QrCode, X, Download, Copy, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

/**
 * 車両のモバイルビューへのQRコードを表示するコンポーネント
 */
const VehicleQRCode = ({ vehicle, selectedDay, selectedTrip }) => {
  const [copied, setCopied] = useState(false)
  
  // モバイルビューのURLを生成
  const baseUrl = window.location.origin
  const tripNumber = selectedTrip.replace('Trip ', '')
  const mobileUrl = `${baseUrl}/mobile.html?vehicle=${vehicle.id}&day=${encodeURIComponent(selectedDay)}&trip=${tripNumber}`
  
  // URLをクリップボードにコピー
  const copyUrl = () => {
    navigator.clipboard.writeText(mobileUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  // QRコードをPNG画像としてダウンロード
  const downloadQRCode = () => {
    const svg = document.getElementById(`qr-code-${vehicle.id}`)
    if (!svg) return
    
    // SVGをCanvasに変換
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const svgData = new XMLSerializer().serializeToString(svg)
    const img = new Image()
    
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      
      // Canvasをダウンロード
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${vehicle.name}_${selectedDay}_${selectedTrip}_QR.png`
        a.click()
        URL.revokeObjectURL(url)
      })
    }
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <QrCode className="w-4 h-4" />
          QRコード
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{vehicle.name} - モバイルビュー</DialogTitle>
          <DialogDescription>
            スマートフォンやタブレットでQRコードをスキャンして、運行指示にアクセスできます
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-4 py-4">
          {/* QRコード */}
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
            <QRCodeSVG
              id={`qr-code-${vehicle.id}`}
              value={mobileUrl}
              size={256}
              level="H"
              includeMargin={true}
            />
          </div>
          
          {/* 車両情報 */}
          <div className="text-center">
            <div className="font-bold text-lg">{vehicle.name}</div>
            <div className="text-sm text-gray-600">担当: {vehicle.driver}</div>
            <div className="text-sm text-gray-600">{selectedDay} - {selectedTrip}</div>
          </div>
          
          {/* URL表示 */}
          <div className="w-full bg-gray-50 p-3 rounded border text-xs break-all">
            {mobileUrl}
          </div>
          
          {/* アクションボタン */}
          <div className="flex gap-2 w-full">
            <Button
              onClick={copyUrl}
              variant="outline"
              className="flex-1"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-green-600" />
                  コピー済み
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  URLをコピー
                </>
              )}
            </Button>
            <Button
              onClick={downloadQRCode}
              variant="outline"
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              QR保存
            </Button>
          </div>
          
          {/* 使い方の説明 */}
          <div className="w-full bg-blue-50 p-3 rounded text-sm">
            <div className="font-bold mb-1">💡 使い方</div>
            <ol className="list-decimal list-inside space-y-1 text-gray-700">
              <li>QRコードをスキャンしてアクセス</li>
              <li>各利用者の住所をタップしてナビアプリで開く</li>
              <li>「全住所をコピー」でカーナビに一括入力</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default VehicleQRCode

