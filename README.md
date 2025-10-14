# デイサービス送迎計画アプリ

デイサービスの送迎業務を効率化するためのWebアプリケーションです。利用者の住所を地図上に表示し、最適な巡回ルートを自動計算することで、送迎時間の短縮と業務効率化を実現します。

## スクリーンショット

![App Screenshot](https://via.placeholder.com/800x400?text=Screenshot+Coming+Soon)

## 主要機能

### ✅ 実装済み

- **本日の送迎対象者一覧**: 利用者の氏名、住所、送迎時刻、車椅子対応の有無を表示
- **サマリー情報**: 送迎対象者数、車椅子対応数、利用可能車両数
- **地図表示**: OpenStreetMapを使用した地図上に事業所と利用者の位置をマーカー表示
- **ルート最適化**: 最近傍法による送迎ルートの自動最適化
- **総移動距離・予想所要時間**: ルートの総距離と所要時間を自動計算
- **訪問順序表示**: 最適化された訪問順序をリスト表示
- **地図上のルート表示**: 最適化されたルートを地図上に青い線で表示
- **車両別割り当て**: 車椅子対応を考慮した自動車両割り当て

### 🚧 開発予定

- **Googleスプレッドシート連携**: 外部データソースとの連携
- **高度なルート最適化**: 実際の道路網を考慮したルート計算
- **通知機能**: LINEまたはメールでの送迎通知
- **モバイル対応**: スマートフォン・タブレットでの使いやすさ向上

## 技術スタック

- **フロントエンド**: React 19.1.0
- **ビルドツール**: Vite 6.0.7
- **地図ライブラリ**: Leaflet.js 1.9.4 + React Leaflet 5.0.0
- **地図データ**: OpenStreetMap
- **CSSフレームワーク**: Tailwind CSS 3.4.17
- **UIコンポーネント**: shadcn/ui
- **アイコン**: Lucide React 0.469.0

## クイックスタート

### 前提条件

- Node.js 22.13.0以上
- pnpm

### インストール

```bash
# リポジトリのクローン
git clone https://github.com/SHUJIRO1234/dayservice-transport-app.git
cd dayservice-transport-app

# 依存関係のインストール
cd transport-web
pnpm install

# 開発サーバーの起動
pnpm dev
```

ブラウザで `http://localhost:5173/` にアクセスしてアプリを確認できます。

## ドキュメント

- **[USER_GUIDE.md](USER_GUIDE.md)**: ユーザー向け使い方ガイド
- **[DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)**: 開発者向けガイド
- **[spreadsheet-design.md](spreadsheet-design.md)**: データ構造設計書
- **[map-api-selection.md](map-api-selection.md)**: 地図API選定ドキュメント

## プロジェクト構造

```
dayservice-transport-app/
├── README.md
├── USER_GUIDE.md
├── DEVELOPER_GUIDE.md
├── spreadsheet-design.md
├── map-api-selection.md
├── sample_data/
└── transport-web/          # Reactアプリケーション
    ├── src/
    │   ├── App.jsx
    │   ├── components/
    │   │   └── TransportMap.jsx
    │   └── utils/
    │       └── routeOptimization.js
    └── package.json
```

## 使い方

1. **送迎対象者を確認**: 本日の送迎対象者一覧を確認
2. **地図を表示**: 「地図で表示」ボタンをクリック
3. **ルートを最適化**: 「ルートを最適化」ボタンをクリック
4. **結果を確認**: 総移動距離、予想所要時間、訪問順序を確認
5. **地図上のルートを確認**: 青い線で表示されたルートを視覚的に確認

詳しい使い方は [USER_GUIDE.md](USER_GUIDE.md) を参照してください。

## ルート最適化アルゴリズム

このアプリでは、**最近傍法（Nearest Neighbor）**を使用して送迎ルートを最適化しています。

### アルゴリズムの概要

1. 事業所から出発
2. 未訪問の利用者の中から、現在地から最も近い利用者を選択
3. その利用者を訪問済みとしてマーク
4. すべての利用者を訪問するまで2-3を繰り返し

### 距離計算

ハーバーサイン公式を使用して2点間の直線距離を計算しています。

### 所要時間計算

```
所要時間 = (総移動距離 / 平均速度) * 60 + (訪問件数 * 停車時間)
```

- 平均速度: 20 km/h
- 停車時間: 3分/件

## コントリビューション

プルリクエストは歓迎します！大きな変更を加える場合は、まずIssueを開いて変更内容を議論してください。

## ライセンス

MIT License

## 作者

SHUJIRO1234

## 謝辞

- [OpenStreetMap](https://www.openstreetmap.org/) - 地図データ提供
- [Leaflet.js](https://leafletjs.com/) - 地図ライブラリ
- [shadcn/ui](https://ui.shadcn.com/) - UIコンポーネント

