import React, { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { QrCode, Share2, X, Copy, Check, Smartphone } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

/**
 * モバイルビュー共有ボタン
 * QRコードとURLを表示して、ドライバーがスマホでアクセスできるようにする
 */
const MobileShareButton = ({ vehicleId, vehicleName }) => {
  const [showModal, setShowModal] = useState(false)
  const [copied, setCopied] = useState(false)
  
  // モバイルビューのURL
  const mobileUrl = `${window.location.origin}/mobile/${vehicleId}`
  
  // URLをクリップボードにコピー
  const copyUrl = () => {
    navigator.clipboard.writeText(mobileUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  // Web Share API を使用して共有
  const shareUrl = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${vehicleName} - 運行指示`,
          text: `${vehicleName}の運行指示をご確認ください`,
          url: mobileUrl
        })
      } catch (err) {
        console.log('共有がキャンセルされました')
      }
    } else {
      // Web Share API が使えない場合はURLをコピー
      copyUrl()
    }
  }
  
  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <Smartphone className="h-4 w-4" />
        スマホで表示
      </Button>
      
      {/* モーダル */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
            {/* 閉じるボタン */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
            
            {/* タイトル */}
            <h2 className="text-2xl font-bold mb-2">{vehicleName}</h2>
            <p className="text-gray-600 mb-6">スマホ・タブレット用の運行画面</p>
            
            {/* QRコード */}
            <div className="bg-white p-6 rounded-lg border-2 border-gray-200 mb-6 flex justify-center">
              <QRCodeSVG 
                value={mobileUrl} 
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>
            
            <p className="text-sm text-center text-gray-600 mb-6">
              スマホでQRコードを読み取ってアクセス
            </p>
            
            {/* URL表示 */}
            <div className="bg-gray-50 p-3 rounded mb-4 break-all text-sm text-gray-700">
              {mobileUrl}
            </div>
            
            {/* アクションボタン */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={copyUrl}
                variant="outline"
                className="w-full"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2 text-green-600" />
                    コピー済み
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    URLコピー
                  </>
                )}
              </Button>
              <Button
                onClick={shareUrl}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Share2 className="w-4 h-4 mr-2" />
                共有
              </Button>
            </div>
            
            {/* 使い方の説明 */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-bold text-sm mb-2">📱 使い方</h3>
              <ul className="text-xs text-gray-700 space-y-1">
                <li>• QRコードをスマホで読み取る</li>
                <li>• URLをコピーしてLINE等で送信</li>
                <li>• ホーム画面に追加すればアプリのように使える</li>
                <li>• 最新の送迎計画が自動的に反映される</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default MobileShareButton

