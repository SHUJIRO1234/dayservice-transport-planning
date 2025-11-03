# 80名サンプルデータ実装レポート

## 実装日時
2025年11月3日

## 実装内容

### 1. 80名のサンプルデータを生成

**曜日ごとの利用者数:**
- 月曜日: **33名**（最大定員）
- 火曜日: **30名**
- 水曜日: **28名**
- 木曜日: **32名**
- 金曜日: **31名**
- 土曜日: **25名**
- 日曜日: **0名**

**その他の特徴:**
- 車椅子利用者: 16名（20%）
- 各利用者は1-3曜日に登録
- 住所: 東京23区内の30種類
- ピックアップ時間: 08:00～09:15の6パターン
- メモ: 「玄関まで介助必要」「認知症あり」など

### 2. サンプル移行機能の更新

**変更前:**
- `weeklyData.js`のサンプルデータを移行
- 古いデータ構造

**変更後:**
- `/sample_users_80.json`から80名のデータを読み込み
- 新しいデータ構造に対応
- 既存データを上書き

### 3. 自動データクリア機能の追加

**機能:**
- 初回アクセス時に古いデータを自動的にクリア
- `data_cleared_v1`フラグで1回のみ実行
- 対象: `transport_plan_*`, `userMaster`, `vehicles`

## 使用方法

### ステップ1: 本番環境にアクセス
https://transport-web-ten.vercel.app/

### ステップ2: ブラウザのキャッシュをクリア
- Chrome/Edge: `Ctrl+Shift+R` (Windows) / `Cmd+Shift+R` (Mac)
- Firefox: `Ctrl+F5` (Windows) / `Cmd+Shift+R` (Mac)

### ステップ3: 「利用者管理」ボタンをクリック
トップメニューの「利用者管理」（青色）をクリック

### ステップ4: 「サンプル移行」ボタンをクリック
1. 利用者管理画面の「サンプル移行」（オレンジ色）をクリック
2. 確認ダイアログで「OK」をクリック
3. 「80名のサンプル利用者を移行しました」と表示される

### ステップ5: 送迎計画で確認
1. 利用者管理画面を閉じる
2. 送迎計画画面の「利用者マスタから同期」ボタンをクリック
3. 各曜日タブの人数を確認
   - 月曜日: 33名
   - 火曜日: 30名
   - 水曜日: 28名
   - 木曜日: 32名
   - 金曜日: 31名
   - 土曜日: 25名

## 技術的な詳細

### サンプルデータの生成スクリプト

**ファイル:** `generate_sample_users_v2.py`

**アルゴリズム:**
1. 80名の利用者データを生成
2. 各利用者を1-3曜日にランダムに割り当て
3. 曜日ごとの目標人数に調整
   - 不足: 他の利用者を追加
   - 超過: ランダムに削除
4. JSON形式で出力

**出力ファイル:**
- `/home/ubuntu/dayservice-transport-app/sample_users_80_v2.json`
- `/home/ubuntu/dayservice-transport-app/transport-web/public/sample_users_80.json`

### サンプル移行機能の実装

**ファイル:** `transport-web/src/components/UserManagementEnhanced.jsx`

**変更内容:**
```javascript
const handleMigrateSampleUsers = async () => {
  if (confirm('80名のサンプル利用者を利用者マスタに移行しますか？\n既存のデータは上書きされます。')) {
    try {
      // 80名のサンプルデータを読み込む
      const response = await fetch('/sample_users_80.json');
      const data = await response.json();
      const sampleUsers = data.userMaster;
      
      // localStorageに保存
      localStorage.setItem('userMaster', JSON.stringify(sampleUsers));
      setUsers(sampleUsers);
      alert(`${sampleUsers.length}名のサンプル利用者を移行しました`);
    } catch (error) {
      console.error('サンプルデータの読み込みに失敗しました:', error);
      alert('サンプルデータの移行に失敗しました');
    }
  }
};
```

### 自動データクリア機能の実装

**ファイル:** `transport-web/src/App.jsx`

**変更内容:**
```javascript
// 初回アクセス時に古いデータをクリア（1回のみ実行）
useEffect(() => {
  const clearFlag = localStorage.getItem('data_cleared_v1');
  if (!clearFlag) {
    // 古いデータをクリア
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('transport_plan_') || key === 'userMaster' || key === 'vehicles') {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // クリア済みフラグを設定
    localStorage.setItem('data_cleared_v1', 'true');
    console.log('✅ 古いデータをクリアしました');
  }
}, []);
```

## データ構造

### 利用者データの形式

```json
{
  "id": "user_20251103123456789012_1234",
  "name": "佐藤 太郎",
  "address": "荒川区西日暮里1-10-13",
  "wheelchair": false,
  "pickupTime": "08:00",
  "notes": "玄関まで介助必要",
  "monday": true,
  "tuesday": false,
  "wednesday": true,
  "thursday": false,
  "friday": true,
  "saturday": false,
  "sunday": false,
  "serviceCode": "321111",
  "serviceDuration": {
    "monday": "7-8h",
    "tuesday": "7-8h",
    "wednesday": "7-8h",
    "thursday": "7-8h",
    "friday": "7-8h",
    "saturday": "7-8h",
    "sunday": "7-8h"
  },
  "additionalServices": {
    "bathing": true,
    "training": false,
    "nutrition": true,
    "oral": false
  },
  "createdAt": "2025-11-03T14:28:27.123456",
  "updatedAt": "2025-11-03T14:28:27.123456"
}
```

## トラブルシューティング

### Q1: サンプル移行ボタンをクリックしても何も起こらない

**原因:** ブラウザのキャッシュが古いバージョンを表示している

**解決策:**
1. ブラウザのキャッシュをクリア（Ctrl+Shift+R）
2. ページを再読み込み

### Q2: 「サンプルデータの移行に失敗しました」と表示される

**原因:** `sample_users_80.json`が見つからない

**解決策:**
1. Vercelのデプロイが完了するまで待つ（2-3分）
2. ブラウザのキャッシュをクリア

### Q3: 曜日タブの人数が0名のまま

**原因:** 「利用者マスタから同期」ボタンをクリックしていない

**解決策:**
1. 送迎計画画面の「利用者マスタから同期」ボタンをクリック
2. 各曜日タブの人数が更新される

## まとめ

今回の実装により、以下が実現されました：

1. **80名のサンプルデータを生成**
   - 曜日ごとに人数を制御（最大定員33名）
   - リアルな利用者データ

2. **サンプル移行機能の更新**
   - ボタン1つで80名のデータをインポート
   - 既存データを上書き

3. **自動データクリア機能の追加**
   - 初回アクセス時に古いデータを自動的にクリア
   - 1回のみ実行

これにより、ユーザーは実運用に近い環境でシステムをテストできます。

## 次のステップ

1. ✅ 80名のサンプルデータを生成 - **完了**
2. ✅ サンプル移行機能の更新 - **完了**
3. ✅ 自動データクリア機能の追加 - **完了**
4. ✅ 本番環境へのデプロイ - **完了**
5. ⏳ ユーザーによるサンプル移行実行 - **ユーザー作業待ち**
6. ⏳ 本番環境での動作確認 - **ユーザー作業待ち**

