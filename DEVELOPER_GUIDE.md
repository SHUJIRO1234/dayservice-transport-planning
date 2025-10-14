# デイサービス送迎計画アプリ - 開発者ガイド

## プロジェクト構成

```
dayservice-transport-app/
├── README.md                          # プロジェクト概要
├── USER_GUIDE.md                      # ユーザー向け使い方ガイド
├── DEVELOPER_GUIDE.md                 # 開発者向けガイド（このファイル）
├── map-api-selection.md               # 地図API選定ドキュメント
├── spreadsheet-design.md              # スプレッドシート設計書
├── create_spreadsheet.py              # スプレッドシート作成スクリプト
├── sample_data/                       # サンプルCSVデータ
│   ├── users.csv
│   ├── schedules.csv
│   ├── vehicles.csv
│   └── facility.csv
└── transport-web/                     # Reactアプリケーション
    ├── package.json
    ├── vite.config.js
    ├── index.html
    ├── src/
    │   ├── main.jsx                   # エントリーポイント
    │   ├── App.jsx                    # メインアプリケーション
    │   ├── App.css
    │   ├── index.css
    │   ├── components/
    │   │   ├── TransportMap.jsx      # 地図コンポーネント
    │   │   └── ui/                    # shadcn/uiコンポーネント
    │   ├── utils/
    │   │   └── routeOptimization.js  # ルート最適化ユーティリティ
    │   └── lib/
    │       └── utils.js               # 汎用ユーティリティ
    └── public/
```

## セットアップ

### 前提条件

- Node.js 22.13.0以上
- pnpm（パッケージマネージャー）
- Git

### インストール手順

1. **リポジトリのクローン**

```bash
git clone https://github.com/SHUJIRO1234/dayservice-transport-app.git
cd dayservice-transport-app
```

2. **依存関係のインストール**

```bash
cd transport-web
pnpm install
```

3. **開発サーバーの起動**

```bash
pnpm dev
```

ブラウザで `http://localhost:5173/` にアクセスしてアプリを確認できます。

## 主要コンポーネント

### App.jsx

メインアプリケーションコンポーネント。以下の機能を提供します：

- サンプルデータの読み込みと状態管理
- 送迎対象者一覧の表示
- サマリー情報の計算と表示
- 地図表示の制御
- ルート最適化の実行
- 車両割り当ての表示

**主要なState:**

```javascript
const [users, setUsers] = useState([])              // 利用者マスタ
const [schedules, setSchedules] = useState([])      // 利用予定
const [vehicles, setVehicles] = useState([])        // 車両マスタ
const [facility, setFacility] = useState(null)      // 事業所情報
const [todaySchedules, setTodaySchedules] = useState([])  // 本日の送迎対象者
const [showMap, setShowMap] = useState(false)       // 地図表示フラグ
const [optimizedRoute, setOptimizedRoute] = useState(null)  // 最適化ルート
const [vehicleAssignments, setVehicleAssignments] = useState([])  // 車両割り当て
```

### TransportMap.jsx

地図表示コンポーネント。Leaflet.jsとReact Leafletを使用して地図を表示します。

**Props:**

- `facility`: 事業所の情報（座標、名称、住所）
- `users`: 利用者の配列（座標、名称、住所、車椅子対応など）
- `route`: 最適化されたルートの座標配列（オプション）

**機能:**

- OpenStreetMapタイルの表示
- 事業所マーカーの表示（赤）
- 利用者マーカーの表示（青・紫）
- ルートの線表示（青）
- マーカークリックでポップアップ表示
- 地図の自動ズーム調整

### routeOptimization.js

ルート最適化のユーティリティ関数を提供します。

**主要な関数:**

#### `calculateDistance(point1, point2)`

2点間の直線距離を計算します（ハーバーサイン公式）。

**パラメータ:**
- `point1`: `{lat, lng}` 形式の座標
- `point2`: `{lat, lng}` 形式の座標

**戻り値:**
- 距離（km）

#### `optimizeRoute(facility, users, direction)`

最近傍法を使用して送迎ルートを最適化します。

**パラメータ:**
- `facility`: 事業所の座標と情報
- `users`: 利用者の配列
- `direction`: `'pickup'`（送迎）または `'return'`（帰宅）

**戻り値:**
```javascript
{
  route: [[lat1, lng1], [lat2, lng2], ...],  // 座標の配列
  totalDistance: 1.11,                        // 総距離（km）
  order: [user1, user2, ...],                // 訪問順序
  estimatedTime: 19                           // 予想所要時間（分）
}
```

**アルゴリズム:**

1. 事業所（送迎時）または最初の利用者（帰宅時）から開始
2. 未訪問の利用者の中から、現在地から最も近い利用者を選択
3. その利用者を訪問済みとしてマーク
4. すべての利用者を訪問するまで2-3を繰り返し
5. 帰宅時は最後に事業所に戻る

**所要時間の計算:**

```javascript
所要時間 = (総移動距離 / 平均速度) * 60 + (訪問件数 * 停車時間)
         = (totalDistance / 20) * 60 + (users.length * 3)
```

- 平均速度: 20 km/h
- 停車時間: 3分/件

#### `assignUsersToVehicles(users, vehicles)`

車両の定員を考慮して利用者をグループ分けします。

**パラメータ:**
- `users`: 利用者の配列
- `vehicles`: 車両の配列

**戻り値:**
```javascript
[
  {
    vehicle: {...},           // 車両情報
    users: [...],            // 割り当てられた利用者
    regularCount: 3,         // 一般利用者数
    wheelchairCount: 2       // 車椅子利用者数
  },
  ...
]
```

**割り当てロジック:**

1. 車椅子対応が必要な利用者と一般利用者を分離
2. 各車両に対して：
   - 車椅子利用者を優先的に割り当て（車椅子対応可能数まで）
   - 残りの定員に一般利用者を割り当て
3. すべての利用者が割り当てられるまで繰り返し

## データ構造

### 利用者データ（User）

```javascript
{
  user_id: "U001",
  name: "山田 太郎",
  address: "東京都世田谷区桜新町1-2-3",
  phone: "03-1234-5678",
  wheelchair: false,
  notes: "",
  lat: 35.6295,
  lng: 139.6470
}
```

### 利用予定データ（Schedule）

```javascript
{
  user_id: "U001",
  date: "2025-10-14",
  pickup_time: "08:30",
  return_time: "16:00",
  status: "予定"
}
```

### 車両データ（Vehicle）

```javascript
{
  vehicle_id: "V001",
  vehicle_name: "送迎車1号",
  capacity: 8,
  wheelchair_capacity: 2,
  driver_name: "佐藤 花子"
}
```

### 事業所データ（Facility）

```javascript
{
  facility_name: "デイサービスさくら",
  address: "東京都世田谷区桜新町2-10-5",
  phone: "03-9876-5432",
  lat: 35.6284,
  lng: 139.6489
}
```

## 使用ライブラリ

### 主要ライブラリ

- **React**: 19.1.0 - UIフレームワーク
- **Vite**: 6.0.7 - ビルドツール
- **Leaflet**: 1.9.4 - 地図ライブラリ
- **React Leaflet**: 5.0.0 - LeafletのReactラッパー
- **Tailwind CSS**: 3.4.17 - CSSフレームワーク
- **shadcn/ui**: UIコンポーネントライブラリ
- **Lucide React**: 0.469.0 - アイコンライブラリ

### 開発ツール

- **ESLint**: コード品質チェック
- **PostCSS**: CSS処理
- **Autoprefixer**: ベンダープレフィックス自動付与

## カスタマイズ

### 平均速度の変更

`src/utils/routeOptimization.js` の `optimizeRoute` 関数内：

```javascript
const averageSpeed = 20 // km/h ← この値を変更
```

### 停車時間の変更

`src/utils/routeOptimization.js` の `optimizeRoute` 関数内：

```javascript
const stopTime = 3 // 分 ← この値を変更
```

### 地図のデフォルト中心座標

`src/components/TransportMap.jsx` の `defaultCenter`：

```javascript
const defaultCenter = [35.6284, 139.6489] // [緯度, 経度]
```

### マーカーアイコンの変更

`src/components/TransportMap.jsx` で定義されているアイコン：

```javascript
const facilityIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  // ...
})
```

利用可能な色：
- red（赤）
- blue（青）
- green（緑）
- orange（オレンジ）
- yellow（黄）
- violet（紫）
- grey（灰）
- black（黒）

## ビルドとデプロイ

### 本番ビルド

```bash
cd transport-web
pnpm build
```

ビルドされたファイルは `transport-web/dist/` ディレクトリに出力されます。

### プレビュー

```bash
pnpm preview
```

### デプロイ

Manusのデプロイ機能を使用する場合：

```bash
# transport-webディレクトリで実行
manus deploy
```

または、Vercel、Netlify、GitHub Pagesなどの静的ホスティングサービスにデプロイできます。

## テスト

現在、自動テストは実装されていません。将来的には以下のテストを追加予定：

- ユニットテスト（Jest + React Testing Library）
- ルート最適化アルゴリズムのテスト
- コンポーネントのスナップショットテスト

## 今後の開発予定

### Phase 3: Googleスプレッドシート連携

1. Google Cloud Platformでプロジェクトを作成
2. Google Sheets APIを有効化
3. 認証情報（APIキー）を取得
4. データ読み込み機能を実装

### Phase 4: 高度なルート最適化

1. OSRM（Open Source Routing Machine）の統合
2. 実際の道路網を考慮したルート計算
3. 交通状況を考慮した所要時間予測

### Phase 5: 通知機能

1. LINE Messaging APIまたはSendGridの統合
2. 送迎開始時刻の通知
3. 到着予定時刻の通知

## コントリビューション

プルリクエストは歓迎します！大きな変更を加える場合は、まずIssueを開いて変更内容を議論してください。

## ライセンス

MIT License

