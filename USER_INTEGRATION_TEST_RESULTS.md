# 利用者管理と送迎計画の連携機能 テスト結果

**テスト日時:** 2025年11月2日 04:35 (JST)  
**環境:** http://localhost:8081  
**機能:** 利用者マスタデータと送迎計画の連携

---

## テスト内容

### 実施した操作

1. **利用者管理画面で新規利用者を登録**
   - 名前: 田中 一郎
   - 住所: 千代田区神田1-1-1
   - 利用曜日: 水曜日
   - 送迎時刻: 08:00

2. **送迎計画画面で水曜日を選択**
   - 未割り当てリストに新規利用者が表示されるか確認

---

## テスト結果

### ❌ 問題点

**新規登録した利用者が送迎計画に表示されない**

- 利用者管理で「田中 一郎」を登録
- 送迎計画の水曜日に切り替え
- 未割り当てリストに「田中 一郎」が表示されない
- 既存のサンプルデータ（30名）のみ表示される

### 確認したデータ

**localStorageの状態:**
- `dayservice_users`: 2件（テスト 花子、田中 一郎）
- `transport_plan_水曜日`: 30名（サンプルデータのみ）

---

## 原因分析

### 1. 保存済みデータの優先

App.jsxの実装では、localStorageに保存された送迎計画データがある場合、それを優先的に読み込みます。

```javascript
if (saved) {
  // 保存されたデータを読み込む
  const savedData = JSON.parse(saved)
  setUnassignedUsers(savedData.unassignedUsers || [])
  setVehicleAssignments(savedData.vehicleAssignments || {})
} else {
  // 保存されたデータがない場合は統合データで初期化
  const users = integratedWeeklyData[selectedWeekday] || []
  setUnassignedUsers(users)
  ...
}
```

**問題:** 水曜日の送迎計画データが既にlocalStorageに保存されているため、統合処理が実行されない。

### 2. 利用者マスタ変更監視の不発

`watchUserMasterChanges`関数は実装されていますが、以下の問題があります:

1. **同一タブ内での変更検知の問題**
   - `storage`イベントは同一タブ内では発火しない
   - カスタムイベント`userMasterUpdated`に依存

2. **useEffectの依存配列の問題**
   - `unassignedUsers`と`vehicleAssignments`が依存配列に含まれている
   - これらが変更されるたびにイベントリスナーが再登録される
   - 無限ループの可能性

---

## 解決策

### 方法1: 全リセットボタンを使用（暫定対応）

**手順:**
1. 送迎計画画面で「全リセット」ボタンをクリック
2. localStorageの保存データをクリア
3. ページをリロード
4. 統合データが読み込まれる

### 方法2: 実装を修正（恒久対応）

**修正内容:**

1. **保存済みデータがある場合も統合処理を実行**
   ```javascript
   // 利用者マスタデータとサンプルデータを統合
   const integratedWeeklyData = integrateUserData(weeklyData)
   const integratedUsers = integratedWeeklyData[selectedWeekday] || []
   
   if (saved) {
     const savedData = JSON.parse(saved)
     
     // 既存の割り当てを保持しつつ、新しいユーザーを追加
     const existingUserIds = new Set()
     savedData.unassignedUsers.forEach(u => existingUserIds.add(u.id))
     Object.values(savedData.vehicleAssignments).forEach(assignment => {
       assignment.trips?.forEach(trip => {
         trip.users?.forEach(u => existingUserIds.add(u.id))
       })
     })
     
     // 新しいユーザーを未割り当てに追加
     const newUsers = integratedUsers.filter(u => !existingUserIds.has(u.id))
     setUnassignedUsers([...savedData.unassignedUsers, ...newUsers])
     setVehicleAssignments(savedData.vehicleAssignments)
   } else {
     setUnassignedUsers(integratedUsers)
     // ...
   }
   ```

2. **利用者マスタ変更監視の修正**
   ```javascript
   useEffect(() => {
     const handleUserMasterUpdate = () => {
       // 統合データを再取得
       const integratedWeeklyData = integrateUserData(weeklyData)
       const users = integratedWeeklyData[selectedWeekday] || []
       
       // 既存ユーザーIDを収集
       const existingUserIds = new Set()
       unassignedUsers.forEach(u => existingUserIds.add(u.id))
       Object.values(vehicleAssignments).forEach(assignment => {
         assignment.trips?.forEach(trip => {
           trip.users?.forEach(u => existingUserIds.add(u.id))
         })
       })
       
       // 新しいユーザーのみを追加
       const newUsers = users.filter(u => !existingUserIds.has(u.id))
       if (newUsers.length > 0) {
         setUnassignedUsers(prev => [...prev, ...newUsers])
       }
     }
     
     watchUserMasterChanges(handleUserMasterUpdate)
   }, [selectedWeekday]) // 依存配列を最小限に
   ```

---

## 次のステップ

1. ✅ 利用者管理と送迎計画の連携機能を実装
2. ❌ 保存済みデータがある場合の統合処理が動作しない
3. 次: 実装を修正して、保存済みデータがある場合も新規ユーザーを追加できるようにする
4. 次: 送迎計画の状態保存機能の改善

---

## 結論

**現状:** 利用者管理と送迎計画の連携機能は部分的に実装されていますが、保存済みデータがある場合に新規ユーザーが反映されない問題があります。

**必要な対応:** 保存済みデータの読み込み処理を修正し、統合データと既存データをマージする必要があります。

