# 地図API選定ドキュメント

## 選定方針

デイサービス送迎計画アプリでは、以下の要件を満たす地図APIを選定します：

1. **無料または低コストで利用可能**
2. **日本の住所に対応**
3. **ルート検索機能**
4. **JavaScriptで簡単に統合可能**

## 候補となる地図API

### 1. Leaflet.js + OpenStreetMap（採用）

**メリット:**
- 完全無料でオープンソース
- 軽量（42KB）で高速
- 日本の地図データも充実
- 商用利用可能
- APIキー不要

**デメリット:**
- ルート検索機能は別途実装が必要
- Google Mapsほど詳細な情報はない

**採用理由:**
- 無料で制限なく利用可能
- 日本の住所データに対応
- React統合が容易
- ジオコーディング（住所→座標変換）はNominatim APIで対応可能

### 2. Google Maps Platform

**メリット:**
- 最も詳細で正確な地図データ
- 強力なルート検索機能
- 日本語完全対応

**デメリット:**
- 月額200ドルの無料枠あるが、APIキーの設定が必要
- クレジットカード登録必須
- 商用利用には課金の可能性

### 3. Mapbox

**メリット:**
- 美しいデザイン
- 高いカスタマイズ性
- 無料枠あり

**デメリット:**
- APIキー必要
- 日本の詳細データはGoogle Mapsに劣る

## 実装方針

### Phase 1: 地図表示とマーカー配置
- Leaflet.jsを使用して地図を表示
- 利用者の住所をマーカーで表示
- 事業所を中心マーカーで表示

### Phase 2: ジオコーディング
- Nominatim API（OpenStreetMapのジオコーディングサービス）を使用
- 住所文字列から緯度経度を取得

### Phase 3: ルート計算
- 簡易版：直線距離ベースの巡回セールスマン問題（TSP）アルゴリズム
- 将来的には、OSRM（Open Source Routing Machine）などのルーティングエンジンを統合

## 必要なライブラリ

```bash
npm install leaflet react-leaflet
```

## 参考リンク

- Leaflet公式: https://leafletjs.com/
- React Leaflet: https://react-leaflet.js.org/
- Nominatim API: https://nominatim.org/
- OpenStreetMap: https://www.openstreetmap.org/

