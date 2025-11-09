/**
 * 住所から座標（緯度・経度）を取得するユーティリティ
 * Google Maps Geocoding APIを使用
 */

// Google Maps APIキー
const GOOGLE_MAPS_API_KEY = 'AIzaSyBLKgpIgXMzQNQk46nxFUH0VzGQfLLjFxo'

// リクエスト間隔を管理するためのキュー
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 100 // 0.1秒（Google Mapsは高速）

/**
 * 住所から座標を取得
 * @param {string} address - 住所
 * @returns {Promise<{lat: number, lng: number} | null>} 座標オブジェクトまたはnull
 */
export async function geocodeAddress(address) {
  if (!address || address.trim() === '') {
    console.warn('Geocoding: Empty address provided')
    return null
  }

  try {
    // レート制限対策：前回のリクエストから0.1秒以上待機
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTime
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest))
    }
    lastRequestTime = Date.now()

    // Google Maps Geocoding APIにリクエスト
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?` +
      `address=${encodeURIComponent(address)}&` +
      `key=${GOOGLE_MAPS_API_KEY}&` +
      `language=ja&` +
      `region=jp`
    )

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const result = data.results[0]
      const location = result.geometry.location
      console.log(`Geocoding success: ${address} -> ${location.lat}, ${location.lng}`)
      return {
        lat: location.lat,
        lng: location.lng
      }
    } else {
      console.warn(`Geocoding: No results found for address: ${address}`, data)
      return null
    }
  } catch (error) {
    console.error(`Geocoding error for address "${address}":`, error)
    return null
  }
}

/**
 * 複数の住所を一括でジオコーディング
 * @param {Array<{id: string, address: string}>} addresses - 住所の配列
 * @param {Function} onProgress - 進捗コールバック (current, total) => void
 * @returns {Promise<Array<{id: string, lat: number, lng: number} | null>>}
 */
export async function geocodeAddresses(addresses, onProgress = null) {
  const results = []
  
  for (let i = 0; i < addresses.length; i++) {
    const { id, address } = addresses[i]
    
    if (onProgress) {
      onProgress(i + 1, addresses.length)
    }
    
    const coords = await geocodeAddress(address)
    
    if (coords) {
      results.push({
        id,
        ...coords
      })
    } else {
      results.push(null)
    }
  }
  
  return results
}

