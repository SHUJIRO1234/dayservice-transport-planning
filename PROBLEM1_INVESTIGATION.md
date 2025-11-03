# 問題1: 新規登録後の未割り当て反映 - 調査結果

## 調査日時
2025-11-02

## ローカル環境での調査結果

### ✅ 確認できたこと

1. **days_of_week形式は正しい**
   - 利用者マスタ: `["月曜日", "水曜日"]` という完全な形式で保存されている
   - 修正が正しく適用されている

2. **統合処理は動作している**
   - localStorageの送迎計画データをクリア後、ページをリロード
   - 未割り当てが30名 → 31名に増加
   - 「ﾃｽﾄ　ﾀﾛｳ」が月曜日の未割り当てリストに表示された

3. **問題の原因を特定**
   - 送迎計画データがlocalStorageに保存されている場合、統合処理がスキップされる
   - App.jsxの実装で、保存済みデータがある場合は統合処理を実行しない仕様になっている

### ❌ 問題点

**症状:**
- 新規登録した利用者が未割り当てリストに表示されない
- 送迎計画データをクリアすると表示される

**根本原因:**
App.jsxの統合処理ロジックに問題がある。

```javascript
// 現在の実装（推測）
useEffect(() => {
  const savedData = localStorage.getItem('dayservice_transport_plan');
  if (savedData) {
    // 保存済みデータがある場合、統合処理をスキップ
    setWeeklyData(JSON.parse(savedData));
  } else {
    // 保存済みデータがない場合のみ統合処理を実行
    const integrated = integrateUserMasterData(weeklyData, userMaster);
    setWeeklyData(integrated);
  }
}, []);
```

**問題:**
- 保存済みデータがある場合、利用者マスタの新規ユーザーが反映されない
- カスタムイベント`userMasterUpdated`が発火しても、統合処理が実行されない

## 解決策

### 🎯 推奨案: 保存済みデータと利用者マスタを常に統合

**実装方針:**
1. 保存済みデータを読み込む
2. 利用者マスタから新規ユーザーを抽出
3. 保存済みデータに新規ユーザーを追加（未割り当てリストに）
4. 統合後のデータを表示

**メリット:**
- ✅ 新規登録した利用者が自動的に未割り当てリストに追加される
- ✅ 既存の送迎計画データは保持される
- ✅ カスタムイベントも正常に動作する

**実装箇所:**
- `App.jsx`の初期化処理
- `userMasterUpdated`イベントハンドラ

### 実装の詳細

#### 1. 初期化処理の修正

```javascript
useEffect(() => {
  const savedData = localStorage.getItem('dayservice_transport_plan');
  const userMaster = JSON.parse(localStorage.getItem('dayservice_users') || '[]');
  
  if (savedData) {
    const parsed = JSON.parse(savedData);
    // 保存済みデータと利用者マスタを統合
    const integrated = mergeUserMasterWithSavedData(parsed, userMaster);
    setWeeklyData(integrated);
  } else {
    // 保存済みデータがない場合は通常の統合処理
    const integrated = integrateUserMasterData(weeklyData, userMaster);
    setWeeklyData(integrated);
  }
}, []);
```

#### 2. 統合関数の実装

```javascript
function mergeUserMasterWithSavedData(savedData, userMaster) {
  const result = { ...savedData };
  
  // 各曜日について処理
  Object.keys(result).forEach(weekday => {
    const dayData = result[weekday];
    
    // 利用者マスタから該当曜日の利用者を抽出
    const masterUsers = userMaster.filter(user => 
      user.days_of_week.includes(weekday)
    );
    
    // 保存済みデータに存在しないユーザーを抽出
    const existingUserIds = new Set(dayData.users.map(u => u.user_id || u.id));
    const newUsers = masterUsers.filter(u => !existingUserIds.has(u.user_id));
    
    // 新規ユーザーを未割り当てリストに追加
    dayData.users = [...dayData.users, ...newUsers.map(convertUserMasterToUser)];
  });
  
  return result;
}
```

#### 3. カスタムイベントハンドラの修正

```javascript
useEffect(() => {
  const handleUserMasterUpdate = () => {
    const userMaster = JSON.parse(localStorage.getItem('dayservice_users') || '[]');
    const currentData = weeklyData;
    
    // 現在のデータと利用者マスタを統合
    const integrated = mergeUserMasterWithSavedData(currentData, userMaster);
    setWeeklyData(integrated);
  };
  
  window.addEventListener('userMasterUpdated', handleUserMasterUpdate);
  return () => window.removeEventListener('userMasterUpdated', handleUserMasterUpdate);
}, [weeklyData]);
```

### 補助機能: 手動同期ボタン

**実装内容:**
- 送迎計画画面に「利用者マスタから同期」ボタンを追加
- クリックすると、利用者マスタの全データを再読み込み
- トースト通知で「○件の新規利用者を追加しました」と表示

**メリット:**
- ✅ 自動反映が失敗しても手動で同期できる
- ✅ ユーザーが明示的に同期できる安心感

## 次のアクション

1. App.jsxの統合処理ロジックを修正
2. 手動同期ボタンを実装
3. ローカル環境でテスト
4. 本番環境にデプロイ

