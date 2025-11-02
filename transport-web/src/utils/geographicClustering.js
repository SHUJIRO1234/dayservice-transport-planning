/**
 * 地理的クラスタリングユーティリティ
 * K-meansアルゴリズムを使用して、利用者を地理的に近いグループに分類
 */

/**
 * ハバーサイン公式を使用して2点間の距離を計算（キロメートル）
 * @param {number} lat1 - 地点1の緯度
 * @param {number} lng1 - 地点1の経度
 * @param {number} lat2 - 地点2の緯度
 * @param {number} lng2 - 地点2の経度
 * @returns {number} 2点間の距離（km）
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // 地球の半径（km）
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

/**
 * 度をラジアンに変換
 * @param {number} degrees - 度
 * @returns {number} ラジアン
 */
function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * K-meansクラスタリングを実行
 * @param {Array} users - 利用者の配列（lat, lngプロパティを持つ）
 * @param {number} k - クラスタ数（車両数）
 * @param {number} maxIterations - 最大反復回数
 * @returns {Array} クラスタの配列（各クラスタは利用者の配列）
 */
export function kMeansClustering(users, k, maxIterations = 100) {
  if (!users || users.length === 0) {
    return [];
  }
  
  if (k <= 0) {
    return [];
  }
  
  // クラスタ数が利用者数より多い場合は、利用者数に調整
  const actualK = Math.min(k, users.length);
  
  // 初期クラスタ中心をランダムに選択（K-means++法を使用）
  let centroids = initializeCentroidsKMeansPlusPlus(users, actualK);
  
  let clusters = [];
  let previousClusters = [];
  let iterations = 0;
  
  // 収束するまで繰り返し
  while (iterations < maxIterations) {
    // 各利用者を最も近いクラスタ中心に割り当て
    clusters = assignUsersToClusters(users, centroids);
    
    // 収束判定: クラスタの割り当てが変わらなくなったら終了
    if (iterations > 0 && areClustersEqual(clusters, previousClusters)) {
      break;
    }
    
    // 各クラスタの中心を再計算
    centroids = updateCentroids(clusters);
    
    previousClusters = clusters.map(cluster => [...cluster]);
    iterations++;
  }
  
  return clusters;
}

/**
 * K-means++法を使用して初期クラスタ中心を選択
 * @param {Array} users - 利用者の配列
 * @param {number} k - クラスタ数
 * @returns {Array} 初期クラスタ中心の配列
 */
function initializeCentroidsKMeansPlusPlus(users, k) {
  const centroids = [];
  
  // 最初の中心をランダムに選択
  const firstIndex = Math.floor(Math.random() * users.length);
  centroids.push({
    lat: users[firstIndex].lat,
    lng: users[firstIndex].lng
  });
  
  // 残りの中心を選択
  for (let i = 1; i < k; i++) {
    const distances = users.map(user => {
      // 各利用者から最も近い既存の中心までの距離を計算
      const minDistance = Math.min(...centroids.map(centroid =>
        calculateDistance(user.lat, user.lng, centroid.lat, centroid.lng)
      ));
      return minDistance;
    });
    
    // 距離の二乗に比例した確率で次の中心を選択
    const squaredDistances = distances.map(d => d * d);
    const totalSquaredDistance = squaredDistances.reduce((sum, d) => sum + d, 0);
    const probabilities = squaredDistances.map(d => d / totalSquaredDistance);
    
    // 確率に基づいて次の中心を選択
    const rand = Math.random();
    let cumulativeProbability = 0;
    let selectedIndex = 0;
    
    for (let j = 0; j < probabilities.length; j++) {
      cumulativeProbability += probabilities[j];
      if (rand <= cumulativeProbability) {
        selectedIndex = j;
        break;
      }
    }
    
    centroids.push({
      lat: users[selectedIndex].lat,
      lng: users[selectedIndex].lng
    });
  }
  
  return centroids;
}

/**
 * 各利用者を最も近いクラスタ中心に割り当て
 * @param {Array} users - 利用者の配列
 * @param {Array} centroids - クラスタ中心の配列
 * @returns {Array} クラスタの配列（各クラスタは利用者の配列）
 */
function assignUsersToClusters(users, centroids) {
  const clusters = centroids.map(() => []);
  
  users.forEach(user => {
    // 最も近いクラスタ中心を見つける
    let minDistance = Infinity;
    let closestClusterIndex = 0;
    
    centroids.forEach((centroid, index) => {
      const distance = calculateDistance(
        user.lat,
        user.lng,
        centroid.lat,
        centroid.lng
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestClusterIndex = index;
      }
    });
    
    clusters[closestClusterIndex].push(user);
  });
  
  return clusters;
}

/**
 * 各クラスタの新しい中心座標を計算
 * @param {Array} clusters - クラスタの配列
 * @returns {Array} 新しいクラスタ中心の配列
 */
function updateCentroids(clusters) {
  return clusters.map(cluster => {
    if (cluster.length === 0) {
      // 空のクラスタの場合は、ランダムな座標を返す
      return {
        lat: 35.6284 + (Math.random() - 0.5) * 0.1,
        lng: 139.6489 + (Math.random() - 0.5) * 0.1
      };
    }
    
    const sumLat = cluster.reduce((sum, user) => sum + user.lat, 0);
    const sumLng = cluster.reduce((sum, user) => sum + user.lng, 0);
    
    return {
      lat: sumLat / cluster.length,
      lng: sumLng / cluster.length
    };
  });
}

/**
 * 2つのクラスタ配列が等しいかどうかを判定
 * @param {Array} clusters1 - クラスタ配列1
 * @param {Array} clusters2 - クラスタ配列2
 * @returns {boolean} 等しい場合はtrue
 */
function areClustersEqual(clusters1, clusters2) {
  if (clusters1.length !== clusters2.length) {
    return false;
  }
  
  for (let i = 0; i < clusters1.length; i++) {
    if (clusters1[i].length !== clusters2[i].length) {
      return false;
    }
    
    // 各クラスタ内の利用者IDをソートして比較
    const ids1 = clusters1[i].map(u => u.id).sort();
    const ids2 = clusters2[i].map(u => u.id).sort();
    
    for (let j = 0; j < ids1.length; j++) {
      if (ids1[j] !== ids2[j]) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * 地理的クラスタリングを使用して利用者を車両に自動割り当て
 * @param {Array} users - 利用者の配列
 * @param {Array} vehicles - 車両の配列
 * @returns {Object} 車両割り当て結果
 */
export function assignUsersToVehiclesWithClustering(users, vehicles) {
  if (!users || users.length === 0) {
    return {};
  }
  
  const activeVehicles = vehicles.filter(v => v.isActive);
  if (activeVehicles.length === 0) {
    return {};
  }
  
  // 利用者を車椅子対応が必要なグループと一般グループに分類
  const wheelchairUsers = users.filter(u => u.wheelchair);
  const regularUsers = users.filter(u => !u.wheelchair);
  
  // 車両を車椅子対応可能と一般のみに分類
  const wheelchairVehicles = activeVehicles.filter(v => v.wheelchairCapacity > 0);
  const regularVehicles = activeVehicles;
  
  const assignments = {};
  
  // 車椅子利用者を車椅子対応車両にクラスタリング
  if (wheelchairUsers.length > 0 && wheelchairVehicles.length > 0) {
    const wheelchairClusters = kMeansClustering(wheelchairUsers, wheelchairVehicles.length);
    
    wheelchairClusters.forEach((cluster, index) => {
      if (cluster.length > 0 && index < wheelchairVehicles.length) {
        const vehicle = wheelchairVehicles[index];
        const vehicleId = vehicle.id;
        
        if (!assignments[vehicleId]) {
          assignments[vehicleId] = { trips: [] };
        }
        
        // 車椅子定員を考慮して便を分割
        const trips = splitIntoTrips(cluster, vehicle.capacity, vehicle.wheelchairCapacity);
        assignments[vehicleId].trips = trips;
      }
    });
  }
  
  // 一般利用者を全車両にクラスタリング
  if (regularUsers.length > 0 && regularVehicles.length > 0) {
    const regularClusters = kMeansClustering(regularUsers, regularVehicles.length);
    
    regularClusters.forEach((cluster, index) => {
      if (cluster.length > 0 && index < regularVehicles.length) {
        const vehicle = regularVehicles[index];
        const vehicleId = vehicle.id;
        
        if (!assignments[vehicleId]) {
          assignments[vehicleId] = { trips: [] };
        }
        
        // 既存の便に追加するか、新しい便を作成
        const existingTrips = assignments[vehicleId].trips;
        const remainingUsers = [...cluster];
        
        // 既存の便に空きがあれば追加
        existingTrips.forEach(trip => {
          const currentWheelchairCount = trip.users.filter(u => u.wheelchair).length;
          const currentRegularCount = trip.users.filter(u => !u.wheelchair).length;
          const availableCapacity = vehicle.capacity - trip.users.length;
          
          if (availableCapacity > 0 && remainingUsers.length > 0) {
            const usersToAdd = remainingUsers.splice(0, availableCapacity);
            trip.users.push(...usersToAdd);
          }
        });
        
        // 残りの利用者を新しい便に追加
        if (remainingUsers.length > 0) {
          const newTrips = splitIntoTrips(remainingUsers, vehicle.capacity, 0);
          assignments[vehicleId].trips.push(...newTrips);
        }
      }
    });
  }
  
  return assignments;
}

/**
 * 利用者を車両の定員に応じて複数の便に分割
 * @param {Array} users - 利用者の配列
 * @param {number} capacity - 車両の定員
 * @param {number} wheelchairCapacity - 車椅子定員
 * @returns {Array} 便の配列
 */
function splitIntoTrips(users, capacity, wheelchairCapacity) {
  const trips = [];
  let currentTrip = { users: [] };
  let currentWheelchairCount = 0;
  
  users.forEach(user => {
    const canAdd = 
      currentTrip.users.length < capacity &&
      (!user.wheelchair || currentWheelchairCount < wheelchairCapacity);
    
    if (canAdd) {
      currentTrip.users.push(user);
      if (user.wheelchair) {
        currentWheelchairCount++;
      }
    } else {
      // 現在の便を保存して新しい便を開始
      if (currentTrip.users.length > 0) {
        trips.push(currentTrip);
      }
      currentTrip = { users: [user] };
      currentWheelchairCount = user.wheelchair ? 1 : 0;
    }
  });
  
  // 最後の便を追加
  if (currentTrip.users.length > 0) {
    trips.push(currentTrip);
  }
  
  return trips;
}

