# 車両ごとの固定機能の実装計画

## 背景

ユーザーからのご要望:
> 曜日ごとの加えて車両ごとの固定機能も欲しい。全リセットすると車両全てリセットされてしまうので、確定した車両以外を組みなおすために実装してほしい

## 現在の状態

- **全リセット**: すべての車両の割り当てをクリアし、全利用者を未割り当てリストに戻す
- **車両ごとのリセット**: 特定の車両の割り当てをクリアし、その車両の利用者を未割り当てリストに戻す（既に実装済み）

## 要件

1. **車両ごとの固定機能**: 特定の車両を「固定」状態にし、全リセットや自動割り当ての対象外にする
2. **全リセット時の動作**: 固定されていない車両のみをリセットし、固定された車両の割り当ては保持する
3. **自動割り当て時の動作**: 固定されていない車両のみに利用者を割り当てる

## 実装方針

### 1. データモデルの拡張

`vehicles` 配列に `isLocked` プロパティを追加:

```javascript
{
  id: 1,
  name: '送迎車1号',
  driver: '山田太郎',
  capacity: 9,
  wheelchairCapacity: 2,
  isActive: true,
  isLocked: false  // 新規追加
}
```

### 2. UI の追加

- **タブビュー**: 各車両のヘッダーに「固定」チェックボックスを追加
- **全体ビュー**: 各車両パネルのヘッダーに「固定」アイコンを追加

### 3. 機能の実装

#### 3.1 車両の固定/解除

```javascript
const handleToggleVehicleLock = (vehicleId) => {
  setVehicles(vehicles.map(v => 
    v.id === vehicleId ? { ...v, isLocked: !v.isLocked } : v
  ))
}
```

#### 3.2 全リセット時の動作変更

```javascript
const handleResetAll = () => {
  const users = weeklyData[selectedWeekday] || []
  
  // 固定されていない車両の利用者を未割り当てに戻す
  const unlockedUsers = []
  const newAssignments = {}
  
  vehicles.forEach(vehicle => {
    if (vehicle.isLocked) {
      // 固定された車両の割り当てを保持
      newAssignments[vehicle.id] = vehicleAssignments[vehicle.id] || { trips: [{ users: [], distance: 0, duration: 0 }] }
    } else {
      // 固定されていない車両の利用者を未割り当てに戻す
      const assignment = vehicleAssignments[vehicle.id]
      if (assignment) {
        assignment.trips.forEach(trip => {
          unlockedUsers.push(...trip.users)
        })
      }
      newAssignments[vehicle.id] = { trips: [{ users: [], distance: 0, duration: 0 }] }
    }
  })
  
  // 元の未割り当てリストと固定されていない車両の利用者を合わせる
  setUnassignedUsers([...users.filter(u => !unlockedUsers.some(uu => uu.id === u.id) && !Object.values(newAssignments).some(a => a.trips.some(t => t.users.some(tu => tu.id === u.id)))), ...unlockedUsers])
  setVehicleAssignments(newAssignments)
}
```

#### 3.3 自動割り当て時の動作変更

```javascript
const handleAutoAssign = () => {
  if (unassignedUsers.length === 0) return

  const newAssignments = { ...vehicleAssignments }
  
  // 固定されていない有効な車両のみを対象にする
  const activeVehicles = vehicles.filter(v => v.isActive && !v.isLocked)
  
  if (activeVehicles.length === 0) {
    alert('有効で固定されていない車両がありません。')
    return
  }
  
  // 以降は既存の自動割り当てロジックと同じ
  // ...
}
```

## UI デザイン

### タブビュー

```
┌─────────────────────────────────────────────┐
│ 送迎車1号                                    │
│ 担当: 山田太郎                               │
│ [✓] 固定  [ルート最適化] [リセット]         │
└─────────────────────────────────────────────┘
```

### 全体ビュー

```
┌─────────────────────────────────────────────┐
│ 🚗 送迎車1号 (山田太郎) [🔒 固定]           │
│ 定員: 5/9名 | 車椅子: 1/2台                 │
│ [ルート最適化]                               │
└─────────────────────────────────────────────┘
```

## テスト計画

1. **車両の固定/解除**: チェックボックスをクリックして、車両が固定/解除されることを確認
2. **全リセット時の動作**: 一部の車両を固定し、全リセットを実行して、固定された車両の割り当てが保持されることを確認
3. **自動割り当て時の動作**: 一部の車両を固定し、自動割り当てを実行して、固定された車両に利用者が割り当てられないことを確認
4. **曜日ごとの保存**: 車両の固定状態が曜日ごとに保存されることを確認

## 実装順序

1. データモデルの拡張（vehicles に isLocked を追加）
2. handleToggleVehicleLock の実装
3. handleResetAll の修正
4. handleAutoAssign の修正
5. タブビューの UI 追加
6. 全体ビューの UI 追加
7. ローカルストレージへの保存（車両の固定状態も保存）
8. テストと動作確認

