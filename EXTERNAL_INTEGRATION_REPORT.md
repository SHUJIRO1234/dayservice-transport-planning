# 外部システム連携機能 実装完了レポート

## 📋 プロジェクト概要

デイサービス送迎計画アプリケーションに、将来の外部システム（記録・請求システム等）との連携を見据えた機能を実装しました。

**実装日**: 2025年11月1日  
**バージョン**: 2.0.0

---

## ✨ 実装完了機能

### 1. ユニークID（UUID）管理システム

すべてのデータに、システム全体で絶対に重複しない「ユニークID」を自動付与します。

#### 対応データ
- **利用者マスタ**: `user_id` (UUID v4形式)
- **車両マスタ**: `vehicle_id` (UUID v4形式)
- **ドライバーマスタ**: `driver_id` (UUID v4形式)
- **利用実績**: `usage_record_id` (UUID v4形式)
- **送迎ルート**: `route_id` (UUID v4形式)

#### 技術仕様
```javascript
// UUID生成関数
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
```

---

### 2. 利用実績管理機能

送迎計画を「利用実績」として記録し、外部システムとの連携に必要なデータを管理します。

#### 管理項目
- **usage_record_id**: 利用実績ID（UUID）
- **user_id**: 利用者ID（UUID）
- **usage_date**: 利用日（ISO 8601形式: 2025-10-01）
- **service_type**: サービス種別（例: '通常規模型デイサービス'）
- **service_code**: 基本サービスコード（例: 321111）
- **additional_codes**: 加算サービスコードの配列
- **status**: ステータス（'利用予定', '利用済', '欠席'）
- **vehicle_id**: 車両ID
- **route_id**: ルートID
- **pickup_time**: 送迎時刻
- **notes**: 備考
- **created_at**: 作成日時（ISO 8601形式）
- **last_updated_at**: 最終更新日時（ISO 8601形式）

#### 画面機能
- 期間フィルタリング（開始日〜終了日）
- 統計情報表示（総件数、利用済、欠席、利用予定）
- JSON出力（外部連携用）
- CSV出力（Excel対応）

---

### 3. サービスコード管理機能

介護報酬請求に必要なサービスコードを管理します。

#### デフォルト登録済みサービスコード

| コード | 名称 | 種別 | 説明 |
|--------|------|------|------|
| 321111 | 通常規模型デイサービス（7時間以上8時間未満） | 基本サービス | 基本サービスコード |
| 321211 | 通常規模型デイサービス（8時間以上9時間未満） | 基本サービス | 基本サービスコード |
| 322101 | 入浴介助加算 | 加算・減算 | 入浴介助を行った場合の加算 |
| 322201 | 個別機能訓練加算（Ⅰ） | 加算・減算 | 個別機能訓練を実施した場合の加算 |
| 322301 | 送迎減算 | 加算・減算 | 送迎を行わなかった場合の減算 |
| 322401 | 栄養改善加算 | 加算・減算 | 栄養改善サービスを提供した場合の加算 |
| 322501 | 口腔機能向上加算 | 加算・減算 | 口腔機能向上サービスを提供した場合の加算 |

#### 画面機能
- サービスコード一覧表示
- フィルタリング（すべて、基本サービス、加算・減算）
- 新規登録・編集・削除
- 検索機能

---

### 4. JSON出力機能（外部連携用）

利用実績を、外部システムが読み取り可能なJSON形式で出力します。

#### 出力形式（例）
```json
[
  {
    "usage_record_id": "a1b2c3d4-e5f6-4g7h-8i9j-0k1l2m3n4o5p",
    "user_id": "b2c3d4e5-f6g7-4h8i-9j0k-1l2m3n4o5p6q",
    "usage_date": "2025-11-04",
    "service_type": "通常規模型デイサービス",
    "service_code": "321111",
    "additional_codes": ["322101", "322201"],
    "status": "利用済",
    "vehicle_id": "c3d4e5f6-g7h8-4i9j-0k1l-2m3n4o5p6q7r",
    "route_id": "route_vehicle1_Trip 1",
    "pickup_time": "08:00",
    "notes": "",
    "created_at": "2025-11-01T22:00:00+09:00",
    "last_updated_at": "2025-11-01T22:00:00+09:00"
  }
]
```

#### 用途
- 記録システムへのデータ連携
- 請求システムへのデータ連携
- 分析システムへのデータ連携
- バックアップ・データ移行

---

## 🗂️ データモデル設計

### User（利用者マスタ）
```javascript
{
  user_id: String (UUID),
  name: String,
  address: String,
  wheelchair: Boolean,
  pickup_time: String,
  days: Array<String>,
  notes: String,
  created_at: String (ISO 8601),
  updated_at: String (ISO 8601)
}
```

### Vehicle（車両マスタ）
```javascript
{
  vehicle_id: String (UUID),
  id: Number,
  name: String,
  capacity: Number,
  wheelchairCapacity: Number,
  driver: String,
  created_at: String (ISO 8601)
}
```

### ServiceCode（サービスコード）
```javascript
{
  service_code_id: String (UUID),
  code: String,
  name: String,
  type: String ('basic' | 'additional'),
  description: String,
  created_at: String (ISO 8601)
}
```

### UsageRecord（利用実績）
```javascript
{
  usage_record_id: String (UUID),
  user_id: String (UUID),
  usage_date: String (ISO 8601),
  service_type: String,
  service_code: String,
  additional_codes: Array<String>,
  status: String ('利用予定' | '利用済' | '欠席'),
  vehicle_id: String (UUID),
  route_id: String,
  pickup_time: String,
  notes: String,
  created_at: String (ISO 8601),
  last_updated_at: String (ISO 8601)
}
```

---

## 🔧 技術スタック

- **フロントエンド**: React 18, Vite 6
- **UI**: Tailwind CSS, shadcn/ui
- **データ保存**: LocalStorage（将来的にバックエンドAPI対応可能）
- **UUID生成**: カスタムUUID v4実装
- **日付管理**: ISO 8601形式

---

## 📁 プロジェクト構成

```
transport-web/
├── src/
│   ├── components/
│   │   ├── UserManagement.jsx          # 利用者管理（UUID対応）
│   │   ├── UsageRecordManager.jsx      # 利用実績管理
│   │   └── ServiceCodeManager.jsx      # サービスコード管理
│   ├── models/
│   │   └── dataModels.js               # データモデル定義
│   ├── utils/
│   │   ├── uuid.js                     # UUID生成ユーティリティ
│   │   └── usageRecordUtils.js         # 利用実績自動記録
│   └── App.jsx                         # メインアプリケーション
└── ...
```

---

## 🚀 使い方

### 管理者

#### 1. 利用者登録（UUID自動付与）
1. 「利用者管理」ボタンをクリック
2. 「新規登録」をクリック
3. 利用者情報を入力（user_idは自動生成）
4. 「登録」をクリック

#### 2. サービスコード管理
1. 「サービスコード」ボタンをクリック
2. デフォルトの7件が登録済み
3. 必要に応じて追加・編集・削除

#### 3. 送迎計画の実行
1. 曜日を選択
2. 「自動割り当て」をクリック
3. 「全ルート最適化」をクリック
4. 利用実績が自動的に記録される

#### 4. 利用実績の確認・出力
1. 「利用実績」ボタンをクリック
2. 期間を指定してフィルター
3. 「JSON出力（外部連携用）」をクリック
4. JSONファイルがダウンロードされる

### 外部システム開発者

#### JSON形式での利用実績取得
```javascript
// ローカルストレージから取得
const usageRecords = JSON.parse(
  localStorage.getItem('dayservice_usage_records') || '[]'
);

// 期間フィルタリング
const filtered = usageRecords.filter(record => {
  const date = new Date(record.usage_date);
  return date >= startDate && date <= endDate;
});

// JSON出力
const json = JSON.stringify(filtered, null, 2);
```

---

## 🎯 外部システム連携シナリオ

### シナリオ1: 記録システムとの連携

**目的**: 送迎実績を記録システムに自動転送

**手順**:
1. 送迎計画アプリで送迎計画を作成
2. 送迎実施後、ステータスを「利用済」に更新
3. JSON出力機能で利用実績を取得
4. 記録システムのAPIにPOST

**JSON例**:
```json
{
  "usage_record_id": "...",
  "user_id": "...",
  "usage_date": "2025-11-04",
  "status": "利用済",
  ...
}
```

### シナリオ2: 請求システムとの連携

**目的**: 月次の利用実績を請求システムに一括転送

**手順**:
1. 月末に「利用実績」画面を開く
2. 期間を「2025-11-01」〜「2025-11-30」に設定
3. JSON出力機能で全実績を取得
4. 請求システムのインポート機能で読み込み

**JSON例**:
```json
[
  {
    "user_id": "...",
    "usage_date": "2025-11-01",
    "service_code": "321111",
    "additional_codes": ["322101"],
    ...
  },
  ...
]
```

### シナリオ3: 分析システムとの連携

**目的**: 送迎実績データを分析システムで可視化

**手順**:
1. 定期的にJSON出力機能で実績を取得
2. 分析システムのデータベースに保存
3. ダッシュボードで可視化（利用率、車両稼働率等）

---

## 📊 今後の拡張提案

### 1. バックエンドAPI実装
- RESTful APIの構築
- データベース（PostgreSQL等）への移行
- 認証・認可機能の追加

### 2. リアルタイム連携
- WebSocket/Server-Sent Eventsによるリアルタイム更新
- 外部システムからの双方向データ連携

### 3. 標準規格対応
- HL7 FHIR形式への対応
- 介護保険システム標準仕様への準拠

### 4. セキュリティ強化
- データ暗号化
- アクセスログ記録
- GDPR/個人情報保護法対応

---

## 🔒 データ保護とプライバシー

### 現在の実装
- ローカルストレージにデータを保存
- ブラウザ内でのみデータが保持される
- 外部への自動送信なし

### 将来の実装（推奨）
- サーバーサイドでのデータ暗号化
- アクセス制御（ロールベース）
- 監査ログの記録
- バックアップ・リカバリー機能

---

## 📝 まとめ

デイサービス送迎計画アプリケーションに、外部システム連携を見据えた以下の機能を実装しました：

✅ **UUID管理システム** - すべてのデータに一意のIDを付与  
✅ **利用実績管理** - 送迎計画を実績として記録  
✅ **サービスコード管理** - 介護報酬請求コードの管理  
✅ **JSON出力機能** - 外部システムとの連携に対応

これにより、将来的に記録システム、請求システム、分析システム等との連携が容易になり、介護DXの推進に貢献します。

---

**作成日**: 2025年11月1日  
**バージョン**: 2.0.0  
**作成者**: Manus AI Agent

