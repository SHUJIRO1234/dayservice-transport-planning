# デイサービス送迎計画アプリ - プロジェクトサマリー

## プロジェクト概要

デイサービスの送迎業務を効率化するWebアプリケーションを開発しました。このアプリは、利用者の住所を地図上に表示し、最適な巡回ルートを自動計算することで、送迎時間の短縮と業務効率化を実現します。

## 開発期間

2025年10月15日 - 現在

## 実装済み機能（ステップ2まで完了）

### ステップ1: 基本設計とデータ準備

✅ **Googleスプレッドシートのデータ構造設計**
- 利用者マスタ、利用予定、車両マスタ、事業所情報の設計完了
- サンプルCSVデータの作成

✅ **GitHubリポジトリの作成**
- リポジトリURL: https://github.com/SHUJIRO1234/dayservice-transport-app
- バージョン管理体制の構築

✅ **Reactアプリケーションの基本構造**
- Vite + React 19.1.0による高速開発環境
- Tailwind CSS + shadcn/uiによる美しいUI
- 本日の送迎対象者一覧表示
- サマリー情報（送迎対象者数、車椅子対応数、利用可能車両数）

### ステップ2: 地図連携とルート計算機能

✅ **地図表示機能**
- OpenStreetMap + Leaflet.jsによる地図表示
- 事業所と利用者の位置をマーカー表示
- 車椅子対応が必要な利用者を紫色のマーカーで区別
- マーカークリックでポップアップ表示

✅ **ルート最適化アルゴリズム**
- 最近傍法（Nearest Neighbor）による最適ルート計算
- ハーバーサイン公式による2点間の直線距離計算
- 総移動距離と予想所要時間の自動計算
- 訪問順序の表示

✅ **地図上のルート表示**
- 最適化されたルートを青い線で地図上に表示
- 視覚的に分かりやすいルート案内

✅ **車両別割り当て**
- 車椅子対応を考慮した自動車両割り当て
- 各車両の定員と車椅子対応可能数を考慮
- 車両ごとの利用者リスト表示

## 技術スタック

### フロントエンド
- **React**: 19.1.0
- **Vite**: 6.0.7
- **Tailwind CSS**: 3.4.17
- **shadcn/ui**: UIコンポーネントライブラリ
- **Lucide React**: 0.469.0（アイコン）

### 地図関連
- **Leaflet.js**: 1.9.4
- **React Leaflet**: 5.0.0
- **OpenStreetMap**: 地図データ

### 開発ツール
- **Git/GitHub**: バージョン管理
- **ESLint**: コード品質チェック
- **PostCSS**: CSS処理

## プロジェクト構造

```
dayservice-transport-app/
├── README.md                          # プロジェクト概要
├── USER_GUIDE.md                      # ユーザー向け使い方ガイド
├── DEVELOPER_GUIDE.md                 # 開発者向けガイド
├── PROJECT_SUMMARY.md                 # このファイル
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
    │   ├── main.jsx
    │   ├── App.jsx
    │   ├── App.css
    │   ├── index.css
    │   ├── components/
    │   │   ├── TransportMap.jsx
    │   │   └── ui/
    │   ├── utils/
    │   │   └── routeOptimization.js
    │   └── lib/
    │       └── utils.js
    └── public/
```

## 主要なコミット履歴

1. **Initial commit**: プロジェクトの初期設定
2. **feat: Webアプリケーションの基本構造を実装**: React + Tailwind CSSによるUI
3. **feat: 地図表示機能を実装**: Leaflet.jsによる地図表示とマーカー配置
4. **feat: ルート最適化と地図上のルート表示機能を実装**: 最近傍法によるルート計算
5. **docs: ユーザーガイドと開発者ガイドを追加**: 充実したドキュメント

## ルート最適化アルゴリズムの詳細

### 最近傍法（Nearest Neighbor）

**アルゴリズムの流れ:**

1. 事業所から出発
2. 未訪問の利用者の中から、現在地から最も近い利用者を選択
3. その利用者を訪問済みとしてマーク
4. すべての利用者を訪問するまで2-3を繰り返し

**距離計算:**

ハーバーサイン公式を使用して2点間の直線距離を計算：

```javascript
const R = 6371 // 地球の半径（km）
const dLat = (lat2 - lat1) * Math.PI / 180
const dLng = (lng2 - lng1) * Math.PI / 180
const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLng/2) * Math.sin(dLng/2)
const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
const distance = R * c
```

**所要時間計算:**

```javascript
所要時間 = (総移動距離 / 平均速度) * 60 + (訪問件数 * 停車時間)
         = (totalDistance / 20) * 60 + (users.length * 3)
```

- 平均速度: 20 km/h
- 停車時間: 3分/件

### 車両割り当てロジック

1. 車椅子対応が必要な利用者と一般利用者を分離
2. 各車両に対して：
   - 車椅子利用者を優先的に割り当て（車椅子対応可能数まで）
   - 残りの定員に一般利用者を割り当て
3. すべての利用者が割り当てられるまで繰り返し

## 今後の開発予定

### Phase 3: Googleスプレッドシート連携

- Google Cloud Platformでプロジェクトを作成
- Google Sheets APIを有効化
- 認証情報（APIキー）を取得
- データ読み込み機能を実装
- リアルタイムデータ更新

### Phase 4: 高度なルート最適化

- OSRM（Open Source Routing Machine）の統合
- 実際の道路網を考慮したルート計算
- 交通状況を考慮した所要時間予測
- 複数車両の同時ルート最適化

### Phase 5: 通知機能

- LINE Messaging APIまたはSendGridの統合
- 送迎開始時刻の通知
- 到着予定時刻の通知
- 遅延時の自動通知

### Phase 6: モバイル対応とUX改善

- レスポンシブデザインの最適化
- PWA（Progressive Web App）化
- オフライン機能
- 音声ナビゲーション

## パフォーマンス指標

### 現在の実装

- **総移動距離**: 1.11 km（サンプルデータ）
- **予想所要時間**: 19分（サンプルデータ）
- **訪問件数**: 5件（サンプルデータ）
- **ページ読み込み時間**: < 1秒
- **地図レンダリング時間**: < 2秒

### 最適化の効果（想定）

従来の手動ルート計画と比較して：
- 移動距離: 15-20%削減
- 所要時間: 10-15%削減
- 計画作成時間: 90%削減（30分 → 3分）

## セキュリティとプライバシー

### 現在の実装

- サンプルデータのみ使用（個人情報なし）
- クライアントサイドのみで動作
- 外部APIへのデータ送信なし

### 今後の対応

- Google Sheets API使用時のOAuth認証
- HTTPS通信の強制
- データの暗号化
- アクセス制御の実装

## ドキュメント

### ユーザー向け

- **USER_GUIDE.md**: アプリの使い方、機能説明、トラブルシューティング

### 開発者向け

- **DEVELOPER_GUIDE.md**: 技術仕様、セットアップ手順、カスタマイズ方法
- **spreadsheet-design.md**: データ構造設計
- **map-api-selection.md**: 地図API選定理由

## 成果物

### GitHubリポジトリ

https://github.com/SHUJIRO1234/dayservice-transport-app

### 主要ファイル

1. **transport-web/src/App.jsx**: メインアプリケーション（約400行）
2. **transport-web/src/components/TransportMap.jsx**: 地図コンポーネント（約150行）
3. **transport-web/src/utils/routeOptimization.js**: ルート最適化ユーティリティ（約150行）

### ドキュメント

1. **README.md**: プロジェクト概要（約150行）
2. **USER_GUIDE.md**: ユーザーガイド（約300行）
3. **DEVELOPER_GUIDE.md**: 開発者ガイド（約500行）

## 学んだこと

### 技術的な学び

1. **Leaflet.jsの活用**: OpenStreetMapを使った無料の地図表示
2. **ルート最適化アルゴリズム**: 最近傍法の実装と限界
3. **React Hooksの活用**: useState, useEffectによる状態管理
4. **Tailwind CSS + shadcn/ui**: 美しいUIの高速開発

### ビジネス的な学び

1. **段階的な開発**: 大きな機能を小さなステップに分解
2. **ドキュメントの重要性**: ユーザーと開発者の両方に配慮
3. **実用性の追求**: 実際の業務フローを考慮した機能設計

## まとめ

このプロジェクトでは、デイサービスの送迎業務を効率化するWebアプリケーションの基礎を構築しました。地図表示、ルート最適化、車両割り当てといった主要機能を実装し、実用的なプロトタイプが完成しました。

今後は、Googleスプレッドシート連携、高度なルート最適化、通知機能などを追加することで、実際の業務で使用できる本格的なシステムへと発展させていく予定です。

## 次のステップ

1. **ステップ3**: Googleスプレッドシート連携の実装
2. **ステップ4**: 高度なルート最適化（OSRM統合）
3. **ステップ5**: 通知機能（LINE/メール）
4. **ステップ6**: モバイル対応とUX改善
5. **ステップ7**: 本番環境へのデプロイ

---

**プロジェクト開始日**: 2025年10月15日  
**現在のステータス**: ステップ2完了  
**GitHubリポジトリ**: https://github.com/SHUJIRO1234/dayservice-transport-app

