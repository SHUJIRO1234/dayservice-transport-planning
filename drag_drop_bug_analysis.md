# ドラッグ&ドロップのバグ分析

## 問題点

### 1. 車両間の移動ができない
- 車両A → 車両B への移動ができない
- 車両内の2便への移動は可能

### 2. 利用者が消える問題
- ドラッグ中に緑色の表示が出る
- そこでドロップすると利用者が画面から消える

### 3. 順番変更時の表示問題
- 車両内で利用者の順番を変更する際、緑色の表示になる
- 同時に未割り当てリストも緑色になってしまう

## 原因分析

### DashboardView.jsxのドロップゾーンID
```javascript
<VehicleTripDropZone
  vehicleId={vehicle.id}
  tripIndex={tripIndex}
  isEmpty={trip.users.length === 0}
>
```

ドロップゾーンのIDが `trip-${vehicleId}-${tripIndex}` になっている。

### handleDragEndのターゲット判定
```javascript
} else if (overId.toString().startsWith('trip-')) {
  // 便へ
  targetType = 'trip'
  const parts = overId.split('-')
  targetVehicleId = parseInt(parts[1])
  targetTripIndex = parseInt(parts[2])
}
```

これは正しく動作するはず。

### 問題の可能性
1. **SortableContextの設定**: DashboardView.jsxで、各便の利用者リストが正しくSortableContextに含まれていない可能性
2. **ドロップゾーンの重複**: 緑色の表示は、複数のドロップゾーンが重なっている可能性
3. **未割り当てリストのドロップゾーンID**: 未割り当てリストのIDが正しく設定されていない可能性

## 修正方針

### 1. DashboardView.jsxの修正
- VehicleTripDropZoneのIDを明確にする
- SortableContextを各便ごとに正しく設定する
- 未割り当てリストのドロップゾーンIDを確認

### 2. ドロップゾーンの視覚的フィードバック改善
- 緑色の表示を制御する条件を見直す
- 正しいドロップ先のみハイライトする

### 3. デバッグログの追加
- handleDragEndでoverId、targetTypeをログ出力
- どのドロップゾーンが反応しているか確認

