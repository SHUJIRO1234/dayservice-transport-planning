# デイサービス送迎計画アプリケーション - 改善内容まとめ

## 実装した改善内容

### 1. マーカー番号の欠落問題の解決 ✅

**問題**: 同じ住所に複数の利用者がいる場合、マーカーが重なって一部の番号が表示されない

**解決策**: 同じ住所の利用者を1つのマーカーにグループ化し、番号を「2,3」のように結合して表示

**実装方法**:
```javascript
const groupUsersByLocation = (users) => {
  const locationGroups = {}
  users.forEach((user) => {
    const key = `${user.lat},${user.lng}`
    if (!locationGroups[key]) {
      locationGroups[key] = {
        lat: user.lat,
        lng: user.lng,
        users: [],
        numbers: [],
        tripIndex: user.tripIndex
      }
    }
    locationGroups[key].users.push(user)
    locationGroups[key].numbers.push(user.userIndexInTrip)
  })
  return Object.values(locationGroups)
}
```

**結果**:
- 送迎車1号: 1, 2,3, 4, 5,6,7, 8, 1（第2便）← 全ての番号が表示
- 送迎車2号: 1,2, 3, 4, 5, 6 ← 全ての番号が表示
- 同じ住所の利用者が視覚的にグループ化され、見やすくなった

### 2. 全体ビューからの車両選択機能 ✅

**問題**: 全体ビューでは車両ごとに地図を表示できなかった

**解決策**: 地図表示エリアに車両選択ボタンを追加し、全体ビューでも車両ごとに地図を表示可能に

**実装内容**:
- 「全車両」ボタン: 全ての車両のルートを色分けして表示
- 「送迎車1号〜5号」ボタン: 各車両のルートのみを表示
- 利用者数の表示: 各ボタンに割り当てられた利用者数を表示
- 便の選択: 第1便/第2便/第3便の切り替えボタン

**UIの配置**:
```
送迎ルート地図
┌─────────────────────────────────────┐
│ [全車両] [送迎車1号(9名)] [送迎車2号(6名)] ... │
│ 便を選択: [第1便] [第2便] [第3便]          │
│                                         │
│        [地図エリア]                      │
│                                         │
└─────────────────────────────────────┘
```

### 3. 地図のスクロール操作の改善 ✅

**問題**: マウスホイールで地図をスクロールすると、ページ全体がスクロールされてしまう

**解決策**: ScrollControlコンポーネントを実装し、地図上でのスクロールズームを制御

**実装方法**:
```javascript
const ScrollControl = () => {
  const map = useMap()
  
  useEffect(() => {
    // 初期状態ではスクロールズームを無効化
    map.scrollWheelZoom.disable()
    
    // 地図コンテナを取得
    const container = map.getContainer()
    
    // マウスが地図上にある時のみスクロールズームを有効化
    const handleMouseEnter = () => {
      map.scrollWheelZoom.enable()
    }
    
    const handleMouseLeave = () => {
      map.scrollWheelZoom.disable()
    }
    
    // クリックした時にスクロールズームを有効化（フォーカス）
    const handleClick = () => {
      map.scrollWheelZoom.enable()
    }
    
    container.addEventListener('mouseenter', handleMouseEnter)
    container.addEventListener('mouseleave', handleMouseLeave)
    container.addEventListener('click', handleClick)
    
    return () => {
      container.removeEventListener('mouseenter', handleMouseEnter)
      container.removeEventListener('mouseleave', handleMouseLeave)
      container.removeEventListener('click', handleClick)
    }
  }, [map])
  
  return null
}
```

**動作**:
- 地図上にマウスを置くと、スクロールズームが有効化
- 地図から離れると、スクロールズームが無効化
- 地図をクリックすると、スクロールズームが有効化（フォーカス状態）

### 4. ルート線上の矢印表示（検討中）

**要望**: ルート線上に矢印（→）を表示して、移動方向を視覚的に示す

**現状**:
- leaflet-polylinedecoratorプラグインをインストール済み
- PolylineWithArrowsコンポーネントを実装済み
- 実装が複雑で、視覚的な効果が限定的

**代替案**:
- 現在の色分けされたルート線と番号付きマーカーで、送迎順序は十分に理解可能
- 番号が1→2→3→...と順番に並んでいるため、移動方向は明確
- 矢印機能は、より高度な機能として、将来的に実装を検討

## 技術的な詳細

### 使用技術
- **React**: フロントエンドフレームワーク
- **Leaflet**: 地図表示ライブラリ
- **react-leaflet**: ReactでLeafletを使用するためのラッパー
- **OpenStreetMap**: 地図タイルプロバイダー
- **leaflet-polylinedecorator**: ルート線上に矢印を表示するプラグイン（インストール済み）

### 地図表示の構造
```
TransportMap.jsx
├── MapContainer: 地図コンテナ
│   ├── TileLayer: 地図タイル（OpenStreetMap）
│   ├── ScrollControl: スクロール制御
│   ├── Marker (施設): 事業所マーカー
│   ├── Marker (利用者): 番号付きマーカー（グループ化）
│   └── PolylineWithArrows: ルート線（矢印付き、検討中）
└── 車両選択UI: ボタンで車両と便を選択
```

### マーカーグループ化のロジック
1. 利用者の緯度経度をキーとして、同じ位置の利用者をグループ化
2. 各グループに含まれる利用者の番号を配列として保持
3. マーカーのラベルに「2,3」のように結合して表示
4. ポップアップには全ての利用者の詳細情報を表示

## 今後の改善案

### 短期的な改善
1. **矢印機能の完成**: leaflet-polylinedecoratorの実装を完了
2. **マーカーのカスタマイズ**: 車椅子利用者のマーカーを別の色で表示
3. **ルート情報の表示**: 地図上に距離と時間を表示

### 長期的な改善
1. **リアルタイムルート計算**: Google Maps APIやMapbox APIを使用
2. **交通状況の考慮**: 渋滞情報を反映したルート最適化
3. **モバイル対応**: スマートフォンでの操作性向上
4. **印刷機能**: 送迎計画を印刷可能なフォーマットで出力

## まとめ

今回の改善により、以下の点が大幅に向上しました:

1. **視認性の向上**: 全ての利用者が地図上に表示され、同じ住所の利用者がグループ化
2. **操作性の向上**: 全体ビューからも車両選択が可能になり、スクロール操作が改善
3. **柔軟性の向上**: タブビュー/全体ビュー、車両選択、便の切り替えなど、多様な表示オプション

これらの改善により、送迎計画の作成と管理がより効率的かつ直感的になりました。

