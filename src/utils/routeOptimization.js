/**
 * 送迎ルート最適化ユーティリティ
 * 
 * 巡回セールスマン問題（TSP）の簡易版を実装
 * 最近傍法（Nearest Neighbor）を使用して、効率的な巡回ルートを計算
 */

/**
 * 2点間の直線距離を計算（ハーバーサイン公式）
 * @param {Object} point1 - {lat, lng}
 * @param {Object} point2 - {lat, lng}
 * @returns {number} - 距離（km）
 */
export function calculateDistance(point1, point2) {
  const R = 6371 // 地球の半径（km）
  const dLat = toRad(point2.lat - point1.lat)
  const dLng = toRad(point2.lng - point1.lng)
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.lat)) * Math.cos(toRad(point2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  
  return distance
}

function toRad(degrees) {
  return degrees * (Math.PI / 180)
}

/**
 * 最近傍法を使用して送迎ルートを最適化
 * デイサービスから出発 → 利用者を順次ピックアップ → デイサービスに戻る
 * 順番固定の利用者は現在の位置を維持
 * @param {Object} facility - 事業所の座標 {lat, lng, name}
 * @param {Array} users - 利用者の配列 [{lat, lng, name, isOrderFixed, ...}, ...]
 * @returns {Object} - {route: 座標の配列, totalDistance: 総距離, order: 訪問順序}
 */
export function optimizeRoute(facility, users) {
  if (!users || users.length === 0) {
    return {
      route: [],
      totalDistance: 0,
      order: [],
      estimatedTime: 0
    }
  }

  // 順番固定の利用者と柔軟な利用者を分離
  const fixedUsers = users.map((user, index) => ({ user, originalIndex: index })).filter(item => item.user.isOrderFixed)
  const flexibleUsers = users.filter(user => !user.isOrderFixed)

  // 柔軟な利用者のみを最適化
  const unvisited = [...flexibleUsers]
  const visited = []
  const routeCoordinates = []
  let totalDistance = 0
  let currentPoint = facility

  // 事業所から開始
  routeCoordinates.push([facility.lat, facility.lng])

  // 最近傍法：柔軟な利用者のみを最適化
  while (unvisited.length > 0) {
    let nearestIndex = 0
    let nearestDistance = Infinity

    // 最も近い利用者を探す
    for (let i = 0; i < unvisited.length; i++) {
      const distance = calculateDistance(currentPoint, unvisited[i])
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestIndex = i
      }
    }

    // 最も近い利用者を訪問
    const nextUser = unvisited[nearestIndex]
    visited.push(nextUser)
    currentPoint = nextUser
    unvisited.splice(nearestIndex, 1)
  }

  // 固定された利用者を元の位置に挿入
  const finalOrder = []
  let flexibleIndex = 0
  for (let i = 0; i < users.length; i++) {
    const fixedItem = fixedUsers.find(item => item.originalIndex === i)
    if (fixedItem) {
      finalOrder.push(fixedItem.user)
    } else if (flexibleIndex < visited.length) {
      finalOrder.push(visited[flexibleIndex])
      flexibleIndex++
    }
  }

  // 距離とルートを再計算
  currentPoint = facility
  totalDistance = 0
  for (const user of finalOrder) {
    const distance = calculateDistance(currentPoint, user)
    totalDistance += distance
    routeCoordinates.push([user.lat, user.lng])
    currentPoint = user
  }

  // 最後に事業所に戻る
  const returnDistance = calculateDistance(currentPoint, facility)
  totalDistance += returnDistance
  routeCoordinates.push([facility.lat, facility.lng])

  // 推定所要時間を計算（平均速度20km/h + 各停車地で3分）
  const averageSpeed = 20 // km/h
  const stopTime = 3 // 分
  const drivingTime = (totalDistance / averageSpeed) * 60 // 分
  const totalStopTime = finalOrder.length * stopTime
  const estimatedTime = Math.ceil(drivingTime + totalStopTime)

  return {
    route: routeCoordinates,
    totalDistance: Math.round(totalDistance * 100) / 100, // 小数点2桁
    order: finalOrder,
    estimatedTime
  }
}

/**
 * 車両の定員を考慮して利用者をグループ分け
 * @param {Array} users - 利用者の配列
 * @param {Array} vehicles - 車両の配列
 * @returns {Array} - 車両ごとの利用者グループ
 */
export function assignUsersToVehicles(users, vehicles) {
  if (!users || users.length === 0 || !vehicles || vehicles.length === 0) {
    return []
  }

  const assignments = []
  const remainingUsers = [...users]

  // 車椅子対応が必要な利用者を優先的に割り当て
  const wheelchairUsers = remainingUsers.filter(u => u.wheelchair)
  const regularUsers = remainingUsers.filter(u => !u.wheelchair)

  for (const vehicle of vehicles) {
    const vehicleUsers = []
    let regularCount = 0
    let wheelchairCount = 0

    // 車椅子利用者を割り当て
    while (
      wheelchairUsers.length > 0 &&
      wheelchairCount < vehicle.wheelchair_capacity &&
      regularCount + wheelchairCount < vehicle.capacity
    ) {
      vehicleUsers.push(wheelchairUsers.shift())
      wheelchairCount++
    }

    // 一般利用者を割り当て
    while (
      regularUsers.length > 0 &&
      regularCount + wheelchairCount < vehicle.capacity
    ) {
      vehicleUsers.push(regularUsers.shift())
      regularCount++
    }

    if (vehicleUsers.length > 0) {
      assignments.push({
        vehicle,
        users: vehicleUsers,
        regularCount,
        wheelchairCount
      })
    }

    // すべての利用者を割り当てたら終了
    if (wheelchairUsers.length === 0 && regularUsers.length === 0) {
      break
    }
  }

  return assignments
}



/**
 * 手動で並び替えられたルートの距離と時間を再計算
 * @param {Object} facility - 事業所の座標 {lat, lng, name}
 * @param {Array} orderedUsers - 並び替えられた利用者の配列
 * @returns {Object} - {route: 座標の配列, totalDistance: 総距離, order: 訪問順序}
 */
export function recalculateRoute(facility, orderedUsers) {
  if (!orderedUsers || orderedUsers.length === 0) {
    return {
      route: [],
      totalDistance: 0,
      order: [],
      estimatedTime: 0
    }
  }

  const routeCoordinates = []
  let totalDistance = 0
  let currentPoint = facility

  // 事業所から開始
  routeCoordinates.push([facility.lat, facility.lng])

  // 指定された順序で訪問
  for (const user of orderedUsers) {
    const distance = calculateDistance(currentPoint, user)
    totalDistance += distance
    routeCoordinates.push([user.lat, user.lng])
    currentPoint = user
  }

  // 最後に事業所に戻る
  const returnDistance = calculateDistance(currentPoint, facility)
  totalDistance += returnDistance
  routeCoordinates.push([facility.lat, facility.lng])

  // 推定所要時間を計算（平均速度20km/h + 各停車地で3分）
  const averageSpeed = 20 // km/h
  const stopTime = 3 // 分
  const drivingTime = (totalDistance / averageSpeed) * 60 // 分
  const totalStopTime = orderedUsers.length * stopTime
  const estimatedTime = Math.ceil(drivingTime + totalStopTime)

  return {
    route: routeCoordinates,
    totalDistance: Math.round(totalDistance * 100) / 100, // 小数点2桁
    order: orderedUsers,
    estimatedTime
  }
}

