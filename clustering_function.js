  // 地理的クラスタリングを使用した自動割り当て
  const handleAutoAssignWithClustering = () => {
    if (unassignedUsers.length === 0) return

    // 欠席者を除外
    const availableUsers = unassignedUsers.filter(u => !u.isAbsent)
    
    if (availableUsers.length === 0) {
      alert('割り当て可能な利用者がいません。')
      return
    }

    // 有効で固定されていない車両のみを対象にする
    const activeVehicles = vehicles.filter(v => v.isActive && !v.isLocked)
    
    if (activeVehicles.length === 0) {
      alert('有効で固定されていない車両がありません。')
      return
    }

    // 固定された利用者と柔軟な利用者を分離
    const fixedUsers = availableUsers.filter(u => u.isOrderFixed)
    const flexibleUsers = availableUsers.filter(u => !u.isOrderFixed)

    // 地理的クラスタリングを使用して柔軟な利用者を割り当て
    const clusteringAssignments = assignUsersToVehiclesWithClustering(flexibleUsers, activeVehicles)

    // 既存の割り当てを保持
    const newAssignments = { ...vehicleAssignments }

    // 固定されていない車両の割り当てをクラスタリング結果で更新
    activeVehicles.forEach(vehicle => {
      const vehicleId = vehicle.id
      
      if (clusteringAssignments[vehicleId]) {
        // クラスタリング結果がある場合
        newAssignments[vehicleId] = clusteringAssignments[vehicleId]
      } else {
        // クラスタリング結果がない場合は空の便を作成
        newAssignments[vehicleId] = { trips: [{ users: [], distance: 0, duration: 0 }] }
      }
    })

    // 固定された利用者を手動で追加（最初の利用可能な便に追加）
    if (fixedUsers.length > 0) {
      let vehicleIndex = 0
      fixedUsers.forEach(user => {
        if (vehicleIndex < activeVehicles.length) {
          const vehicleId = activeVehicles[vehicleIndex].id
          const vehicle = activeVehicles[vehicleIndex]
          
          // 最後の便に追加を試みる
          const trips = newAssignments[vehicleId].trips
          const lastTrip = trips[trips.length - 1]
          
          const currentUsers = lastTrip.users.length
          const wheelchairCount = lastTrip.users.filter(u => u.wheelchair).length
          
          const canAdd = 
            currentUsers < vehicle.capacity &&
            (!user.wheelchair || wheelchairCount < vehicle.wheelchairCapacity)
          
          if (canAdd) {
            lastTrip.users.push(user)
          } else {
            // 新しい便を作成
            trips.push({ users: [user], distance: 0, duration: 0 })
          }
          
          vehicleIndex = (vehicleIndex + 1) % activeVehicles.length
        }
      })
    }

    // 欠席者を含めた未割り当てリストを作成
    const absentUsers = unassignedUsers.filter(u => u.isAbsent)
    
    setVehicleAssignments(newAssignments)
    setUnassignedUsers(absentUsers)
  }

