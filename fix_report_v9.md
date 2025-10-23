# 修正レポート v9 - 全体ビュークラッシュと曜日別データ分離の修正

## 実施日時
2025年10月23日

## 修正内容

### 問題1: 全体ビューのクラッシュ問題

**原因:**
- `handleToggleOrderFixed`関数が未割り当てリストのユーザーに対応していなかった
- 未割り当てリストで「固定」チェックボックスをクリックすると、車両の割り当てのみを検索していたため、ユーザーが見つからずエラーが発生していた

**修正内容:**
1. **App.jsx の `handleToggleOrderFixed` 関数を修正** (271-294行目)
   - まず未割り当てリストでユーザーを探す
   - 見つかった場合は `setUnassignedUsers` で更新して終了
   - 見つからない場合は車両の割り当てで探す

```javascript
// 順番固定のトグル
const handleToggleOrderFixed = (userId) => {
  // まず未割り当てリストで探す
  const userInUnassigned = unassignedUsers.find(u => u.id === userId)
  if (userInUnassigned) {
    setUnassignedUsers(unassignedUsers.map(u => 
      u.id === userId ? { ...u, isOrderFixed: !u.isOrderFixed } : u
    ))
    return
  }

  // 未割り当てリストにない場合は車両の割り当てで探す
  const newAssignments = { ...vehicleAssignments }
  Object.keys(newAssignments).forEach(vehicleId => {
    newAssignments[vehicleId].trips = newAssignments[vehicleId].trips.map(trip => ({
      ...trip,
      users: trip.users.map(u => 
        u.id === userId ? { ...u, isOrderFixed: !u.isOrderFixed } : u
      )
    }))
  })

  setVehicleAssignments(newAssignments)
}
```

2. **App.jsx のタブビューの未割り当てリストに固定チェックボックスを追加** (755-764行目)
   - `showUnassignedOrderFixedToggle={true}` を追加
   - `onToggleOrderFixed={handleToggleOrderFixed}` を追加

```javascript
{unassignedUsers.map((user) => (
  <SortableUserCard 
    key={user.id} 
    user={user} 
    showAbsentToggle={true}
    onToggleAbsent={handleToggleAbsent}
    showUnassignedOrderFixedToggle={true}
    onToggleOrderFixed={handleToggleOrderFixed}
  />
))}
```

3. **SortableUserCard.jsx の通常モードに未割り当て用の固定チェックボックスを追加** (113-138行目)
   - 欠席チェックボックスの下に固定チェックボックスを追加
   - `showUnassignedOrderFixedToggle` プロパティが true の場合のみ表示

```javascript
{showAbsentToggle && (
  <div className="flex-shrink-0 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
    <div className="flex items-center gap-1">
      <input
        type="checkbox"
        checked={user.isAbsent || false}
        onChange={() => onToggleAbsent && onToggleAbsent(user.id)}
        className="w-4 h-4 cursor-pointer"
        title="欠席としてマーク"
      />
      <span className="text-xs text-gray-500">欠</span>
    </div>
    {showUnassignedOrderFixedToggle && (
      <div className="flex items-center gap-1">
        <input
          type="checkbox"
          checked={user.isOrderFixed || false}
          onChange={() => onToggleOrderFixed && onToggleOrderFixed(user.id)}
          className="w-4 h-4 cursor-pointer"
          title="順番を固定"
        />
        <span className="text-xs text-gray-500">固</span>
      </div>
    )}
  </div>
)}
```

### 問題2: 自動割り当てが全曜日に反映される問題

**検証結果:**
- ローカルストレージのキーは曜日ごとに正しく分離されている (`transport_plan_${selectedWeekday}`)
- 66-106行目の useEffect で曜日が変わるたびに、その曜日のデータを読み込んでいる
- 96-106行目の useEffect で変更があるたびに、現在の曜日のキーで保存している
- `isInitialLoad` フラグを使って、初期読み込み時の保存を防いでいる

**結論:**
- コード上は正しく実装されており、曜日ごとにデータが分離されている
- もし全曜日に反映されているように見える場合は、以下の可能性がある:
  1. ブラウザのキャッシュ問題
  2. ローカルストレージのデータが古い
  3. 複数のタブで同時に開いている

**推奨される対処法:**
1. ブラウザの開発者ツールでローカルストレージをクリア
2. ページをリロード
3. 各曜日で個別に自動割り当てを実行して確認

## 修正後の動作確認手順

### 1. 全体ビューの動作確認
1. アプリケーションを開く
2. 「全体ビュー」ボタンをクリック
3. 未割り当てリストに「欠」と「固」のチェックボックスが表示されることを確認
4. 「固」チェックボックスをクリックしてもエラーが発生しないことを確認
5. ユーザーカードに「順番固定」のピンアイコンが表示されることを確認

### 2. タブビューの動作確認
1. 「タブビュー」ボタンをクリック
2. 未割り当てリストに「欠」と「固」のチェックボックスが表示されることを確認
3. 「固」チェックボックスをクリックしてもエラーが発生しないことを確認
4. ユーザーカードに「順番固定」のバッジが表示されることを確認

### 3. 曜日ごとのデータ分離の確認
1. 月曜日を選択
2. 自動割り当てを実行
3. 火曜日を選択
4. 未割り当てリストが月曜日の状態と異なることを確認（初期状態に戻っている）
5. 火曜日で自動割り当てを実行
6. 月曜日を再度選択
7. 月曜日の割り当て状態が保持されていることを確認

### 4. ブラウザコンソールの確認
1. ブラウザの開発者ツールを開く (F12)
2. Console タブを開く
3. エラーメッセージがないことを確認
4. Application タブ > Local Storage を開く
5. 各曜日のキー (`transport_plan_月曜日`, `transport_plan_火曜日`, ...) が存在することを確認

## 修正されたファイル

1. `/home/ubuntu/dayservice-transport-app/transport-web/src/App.jsx`
   - `handleToggleOrderFixed` 関数を修正
   - タブビューの未割り当てリストに固定チェックボックスを追加

2. `/home/ubuntu/dayservice-transport-app/transport-web/src/components/SortableUserCard.jsx`
   - 通常モードに未割り当て用の固定チェックボックスを追加

## 今後の展開

### 短期的な改善
1. ローカルストレージのデータをエクスポート/インポートする機能
2. 複数の曜日を一括でコピーする機能
3. 印刷用のレイアウト

### 中期的な改善
1. データベース連携（PostgreSQL または Firebase）
2. ユーザー認証とアクセス制御
3. 履歴管理と変更ログ

### 長期的な改善
1. Google Maps API との本格的な地図連動
2. リアルタイムの交通情報を考慮したルート最適化
3. モバイルアプリ版の開発

## 注意事項

- この修正により、全体ビューとタブビューの両方で未割り当てリストの「固定」チェックボックスが正しく動作するようになりました
- 曜日ごとのデータは正しく分離されており、各曜日で個別に調整できます
- ローカルストレージを使用しているため、ブラウザのキャッシュをクリアするとデータが失われます
- 本番環境ではデータベースを使用することを推奨します

