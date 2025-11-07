/**
 * 住所から座標（緯度・経度）を取得するユーティリティ
 * Nominatim (OpenStreetMap) APIを使用
 */

// リクエスト間隔を管理するためのキュー
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 1000 // 1秒

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
    // レート制限対策：前回のリクエストから1秒以上待機
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTime
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest))
    }
    lastRequestTime = Date.now()

    // Nominatim APIにリクエスト
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
      `format=json&` +
      `q=${encodeURIComponent(address + ', 日本')}&` +
      `limit=1&` +
      `addressdetails=1`,
      {
        headers: {
          'User-Agent': 'DayServiceTransportApp/1.0'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`)
    }

    const data = await response.json()

    if (data && data.length > 0) {
      const result = data[0]
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon)
      }
    } else {
      console.warn(`Geocoding: No results found for address: ${address}`)
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

