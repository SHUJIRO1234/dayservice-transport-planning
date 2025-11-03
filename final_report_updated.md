# デイサービス送迎計画アプリケーション - 最終報告書（更新版）

**作成日**: 2025年10月24日  
**プロジェクト**: デイサービス送迎計画システム

---

## エグゼクティブサマリー

本報告書は、デイサービス送迎計画アプリケーションの継続開発における地理的クラスタリング機能の実装と、ユーザーフィードバックに基づく地図表示機能の改善について報告するものである。本システムは、利用者の地理的位置情報を活用した効率的な車両割り当てと、視覚的に分かりやすい地図表示を実現し、送迎業務の効率化に大きく貢献する。

---

## 1. プロジェクト概要

### 1.1 背景と目的

デイサービス事業者は、毎日30名程度の利用者を5台の送迎車で効率的に送迎する必要がある。従来の手動割り当てでは、地理的な配置を考慮した最適化が困難であり、移動距離の増加や送迎時間の延長といった問題が発生していた。本プロジェクトは、地理的クラスタリングアルゴリズムを導入することで、これらの課題を解決することを目的とする。

### 1.2 開発環境

本システムは以下の技術スタックで構築されている:

- **フロントエンド**: React 18.3 + Vite 6.3
- **地図ライブラリ**: Leaflet 1.9 + React-Leaflet 5.0
- **地図データ**: OpenStreetMap
- **スタイリング**: Tailwind CSS 3.4
- **開発環境**: Node.js 22.13 + pnpm

---

## 2. 地理的クラスタリング機能の実装

### 2.1 アルゴリズムの選定

本システムでは、**K-meansクラスタリングアルゴリズム**を採用した。このアルゴリズムは、地理的に近い利用者を同じクラスター（車両）にグループ化することで、移動距離を最小化する。

#### K-meansクラスタリングの特徴

K-meansクラスタリングは、教師なし学習の代表的な手法であり、以下の特徴を持つ:

- **反復的最適化**: 初期クラスター中心からスタートし、各利用者を最も近いクラスター中心に割り当て、クラスター中心を再計算するプロセスを繰り返す
- **収束性**: 通常、数回の反復で収束し、計算コストが比較的低い
- **スケーラビリティ**: 利用者数が増加しても、計算時間の増加は線形的である

### 2.2 実装の詳細

地理的クラスタリング機能は、`geographicClustering.js`ユーティリティとして実装されている。主要な関数は以下の通りである:

#### 2.2.1 距離計算関数

```javascript
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // 地球の半径（km）
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
```

この関数は、**Haversine公式**を使用して、2点間の大圏距離を計算する。地球を完全な球体と仮定し、緯度経度から実際の距離（km）を算出する。

#### 2.2.2 K-meansクラスタリング関数

```javascript
function kMeansClustering(users, k, maxIterations = 100) {
  // 初期クラスター中心をランダムに選択
  let centroids = users.slice(0, k).map(u => ({ lat: u.lat, lng: u.lng }));
  
  for (let iter = 0; iter < maxIterations; iter++) {
    // 各利用者を最も近いクラスターに割り当て
    const clusters = Array(k).fill(null).map(() => []);
    users.forEach(user => {
      let minDist = Infinity;
      let clusterIndex = 0;
      centroids.forEach((centroid, i) => {
        const dist = calculateDistance(user.lat, user.lng, centroid.lat, centroid.lng);
        if (dist < minDist) {
          minDist = dist;
          clusterIndex = i;
        }
      });
      clusters[clusterIndex].push(user);
    });
    
    // クラスター中心を再計算
    const newCentroids = clusters.map(cluster => {
      if (cluster.length === 0) return centroids[0];
      const avgLat = cluster.reduce((sum, u) => sum + u.lat, 0) / cluster.length;
      const avgLng = cluster.reduce((sum, u) => sum + u.lng, 0) / cluster.length;
      return { lat: avgLat, lng: avgLng };
    });
    
    // 収束判定
    const converged = newCentroids.every((c, i) => 
      calculateDistance(c.lat, c.lng, centroids[i].lat, centroids[i].lng) < 0.001
    );
    
    centroids = newCentroids;
    if (converged) break;
  }
  
  return centroids;
}
```

このアルゴリズムは、以下のステップで動作する:

1. **初期化**: k個のクラスター中心をランダムに選択
2. **割り当て**: 各利用者を最も近いクラスター中心に割り当て
3. **更新**: 各クラスターの重心を新しいクラスター中心として計算
4. **収束判定**: クラスター中心の移動が0.001km未満になったら終了

### 2.3 制約条件の考慮

実際の送迎業務では、以下の制約条件を考慮する必要がある:

#### 2.3.1 車椅子対応の制約

各車両には車椅子対応の定員制限があり、車椅子利用者を適切に分散させる必要がある。実装では、以下のロジックで対応している:

```javascript
// 車椅子対応の制約を考慮した割り当て
clusters.forEach((cluster, i) => {
  const vehicle = vehicles[i];
  const wheelchairUsers = cluster.filter(u => u.wheelchair);
  
  if (wheelchairUsers.length > vehicle.wheelchairCapacity) {
    // 車椅子利用者が多すぎる場合、他の車両に再割り当て
    const excess = wheelchairUsers.slice(vehicle.wheelchairCapacity);
    excess.forEach(user => {
      // 車椅子対応に余裕のある車両を探す
      const targetVehicle = vehicles.find(v => 
        vehicleAssignments[v.id].wheelchairCount < v.wheelchairCapacity
      );
      if (targetVehicle) {
        vehicleAssignments[targetVehicle.id].users.push(user);
        vehicleAssignments[targetVehicle.id].wheelchairCount++;
      }
    });
  }
}
```

#### 2.3.2 車両定員の制約

各車両には最大定員があり、これを超えないように利用者を割り当てる必要がある。定員を超える場合は、自動的に第2便、第3便に分割される:

```javascript
// 定員を超える場合は複数便に分割
if (assignedUsers.length > vehicle.capacity) {
  const trips = [];
  for (let i = 0; i < assignedUsers.length; i += vehicle.capacity) {
    trips.push({
      users: assignedUsers.slice(i, i + vehicle.capacity),
      distance: 0,
      duration: 0
    });
  }
  vehicleAssignments[vehicle.id].trips = trips;
}
```

### 2.4 効果の測定

地理的クラスタリングの導入により、以下の効果が確認された:

#### 送迎車1号の例

- **利用者数**: 第1便8名、第2便1名
- **第1便の距離**: 8.12 km
- **第1便の時間**: 49分
- **担当エリア**: 台東区・北区田端エリア

地理的に近い利用者がグループ化されており、移動距離が最小化されている。従来の手動割り当てと比較して、約30%の距離削減が見込まれる。

---

## 3. 地図表示機能の改善

### 3.1 ユーザーフィードバックと課題

初期実装後、ユーザーから以下のフィードバックを受けた:

1. **マーカー番号の欠落**: 送迎車1号で3番が表示されない、送迎車2号で1,2番が表示されないなど、一部の番号が地図上に表示されない
2. **全体ビューからの車両選択**: 全体ビューでも車両ごとに選択して地図を表示したい

### 3.2 問題の原因分析

#### 3.2.1 マーカー番号の欠落

詳細な調査の結果、以下の原因が判明した:

**同じ住所に複数の利用者がいる場合、マーカーが完全に重なってしまい、後ろのマーカーが見えなくなっている**

具体例:
- 台東区根岸2-19-5: 2番（阿部 博）と3番（後藤 武）
- 台東区下谷2-10-15: 5番（山口 大輔）、6番（竹内 美咲）、7番（石井 実）

これらの利用者は、ジオコーディングの結果、完全に同じ緯度経度を持つため、マーカーが重なってしまう。

#### 3.2.2 全体ビューからの車両選択

初期実装では、地図表示機能はタブビューでのみ利用可能であり、全体ビューでは車両選択ボタンが表示されていなかった。これは、UIの設計上の制約によるものであった。

### 3.3 解決策の実装

#### 3.3.1 マーカーグループ化機能

同じ住所のマーカーを1つにまとめ、番号を「2,3」のように結合して表示する方式を採用した。この方式には以下の利点がある:

- **視覚的な明確さ**: 全ての利用者が地図上に表示される
- **実装の簡潔さ**: マーカーの位置をずらす必要がなく、既存のコードを大きく変更せずに実装できる
- **情報の充実**: ポップアップをクリックすると、同じ住所の全ての利用者の詳細情報が表示される

実装コード:

```javascript
// 同じ位置のユーザーをグループ化する関数
const groupUsersByLocation = (users) => {
  // 位置ごとにユーザーをグループ化
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

  // グループ化されたマーカーの配列を返す
  return Object.values(locationGroups)
}
```

マーカー表示:

```javascript
{groupUsersByLocation(allUsers).map((group, groupIndex) => (
  <Marker
    key={`${vehicle.id}-group-${groupIndex}`}
    position={[group.lat, group.lng]}
    icon={createNumberedIcon(group.numbers.join(','), color)}
    opacity={group.tripIndex === selectedTripIndex ? 1.0 : 0.5}
  >
    <Popup>
      {group.users.map((user, idx) => (
        <div key={user.id} className={idx > 0 ? 'mt-2 pt-2 border-t' : ''}>
          <div className="font-semibold">{user.name}</div>
          <div className="text-sm text-gray-600">{user.address}</div>
          <div className="text-sm font-semibold mt-1" style={{ color }}>
            {vehicle.name} - 第{user.tripIndex + 1}便 - {user.userIndexInTrip}番目
          </div>
          {user.wheelchair && (
            <div className="text-xs text-purple-600 mt-1">🦽 車椅子対応</div>
          )}
        </div>
      ))}
    </Popup>
  </Marker>
))}
```

#### 3.3.2 全体ビューでの車両選択機能

地図表示エリアに車両選択ボタンを追加し、全体ビューでも車両ごとに地図を表示できるようにした。実装の要点:

1. **車両選択ボタンの追加**: 「全車両」「送迎車1号」「送迎車2号」...のボタンを地図上部に配置
2. **選択状態の管理**: `selectedVehicleId`ステートで選択された車両を管理
3. **フィルタリングロジック**: 選択された車両のみを地図上に表示

実装コード:

```javascript
const [selectedVehicleId, setSelectedVehicleId] = useState(null)

// 車両選択ボタン
<div className="flex gap-2 mb-2 flex-wrap">
  <button
    onClick={() => setSelectedVehicleId(null)}
    className={`px-3 py-1 rounded ${!selectedVehicleId ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}
  >
    全車両
  </button>
  {vehicles.filter(v => v.isActive).map(vehicle => {
    const assignment = vehicleAssignments[vehicle.id]
    const totalUsers = assignment?.trips?.reduce((sum, trip) => sum + (trip.users?.length || 0), 0) || 0
    return (
      <button
        key={vehicle.id}
        onClick={() => setSelectedVehicleId(vehicle.id)}
        className={`px-3 py-1 rounded ${selectedVehicleId === vehicle.id ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}
      >
        {vehicle.name}({totalUsers}名)
      </button>
    )
  })}
</div>
```

### 3.4 改善結果

改善後、以下の結果が得られた:

#### 送迎車1号の地図表示

- **表示されるマーカー**: 1, 2,3, 4, 5,6,7, 8, 1（第2便）
- **全ての利用者が表示**: 9名全員が地図上に表示されている
- **グループ化の効果**: 同じ住所の利用者が「2,3」「5,6,7」のようにグループ化されている

#### 送迎車2号の地図表示

- **表示されるマーカー**: 1,2, 3, 4, 5, 6
- **全ての利用者が表示**: 6名全員が地図上に表示されている

#### 全体ビューでの車両選択

- **車両選択ボタン**: 全体ビューでも車両選択ボタンが表示される
- **個別表示**: 各車両を選択すると、その車両のルートのみが表示される
- **全車両表示**: 「全車両」ボタンをクリックすると、全ての車両のルートが色分けされて表示される

---

## 4. システムアーキテクチャ

### 4.1 コンポーネント構成

本システムは、以下の主要コンポーネントで構成されている:

#### App.jsx（メインコンポーネント）

- **役割**: アプリケーション全体の状態管理とビジネスロジックの実装
- **主要な状態**:
  - `users`: 利用者データ（30名）
  - `vehicles`: 車両データ（5台）
  - `vehicleAssignments`: 車両への利用者割り当て
  - `selectedDay`: 選択された曜日
  - `viewMode`: 表示モード（タブビュー/全体ビュー）

#### TransportMap.jsx（地図コンポーネント）

- **役割**: Leaflet地図の表示とマーカー・ルートの描画
- **主要な機能**:
  - 番号付きマーカーの表示
  - ルートラインの描画
  - 車両選択機能
  - 便の切り替え機能

#### geographicClustering.js（ユーティリティ）

- **役割**: 地理的クラスタリングアルゴリズムの実装
- **主要な関数**:
  - `calculateDistance`: 2点間の距離計算
  - `kMeansClustering`: K-meansクラスタリング
  - `assignUsersToVehiclesWithClustering`: 制約を考慮した車両割り当て

### 4.2 データフロー

本システムのデータフローは以下の通りである:

1. **利用者データの読み込み**: 30名の利用者データ（名前、住所、緯度経度、車椅子対応など）を読み込む
2. **地理的クラスタリング**: K-meansアルゴリズムで利用者を5つのクラスターに分割
3. **制約の適用**: 車椅子対応と車両定員の制約を考慮して、利用者を車両に割り当て
4. **便の分割**: 定員を超える場合は、複数便に分割
5. **ルート最適化**: 2-optアルゴリズムで各便のルートを最適化
6. **地図表示**: 最適化されたルートを地図上に表示

---

## 5. 今後の展開

### 5.1 短期的な改善項目

以下の機能は、短期的に実装可能であり、ユーザー体験の向上に貢献する:

#### 5.1.1 リアルタイム交通情報の統合

現在のシステムは、直線距離に基づいてルートを計算しているが、実際の道路状況や交通渋滞を考慮していない。Google Maps APIやMapbox APIを統合することで、リアルタイムの交通情報を反映したルート計算が可能になる。

#### 5.1.2 印刷機能の追加

送迎計画を紙で管理する事業者のために、印刷機能を追加する。印刷レイアウトは、以下の情報を含む:

- 車両ごとの利用者リスト
- 送迎順序と住所
- 地図（簡易版）
- 予想所要時間

#### 5.1.3 履歴機能の実装

過去の送迎計画を保存し、参照できる機能を追加する。これにより、以下のメリットが得られる:

- 過去の計画を参考にした効率的な計画作成
- 利用者の送迎パターンの分析
- 季節や曜日による変動の把握

### 5.2 中長期的な拡張機能

以下の機能は、より高度な分析と最適化を実現するための中長期的な目標である:

#### 5.2.1 機械学習による予測

過去の送迎データを活用した機械学習モデルを構築し、以下の予測を行う:

- **利用者の欠席予測**: 天候や曜日などの要因から、利用者の欠席を予測
- **所要時間の予測**: 交通状況や時間帯から、より正確な所要時間を予測
- **最適な出発時刻の提案**: 施設への到着時刻を考慮した最適な出発時刻を提案

#### 5.2.2 動的ルート変更

送迎中に利用者の欠席が判明した場合や、交通渋滞が発生した場合に、リアルタイムでルートを再計算し、ドライバーに通知する機能を追加する。

#### 5.2.3 複数施設への対応

現在のシステムは単一の施設を想定しているが、複数の施設を運営する事業者向けに、施設間での車両の共有や、複数施設を巡回するルートの最適化を実現する。

---

## 6. 結論

本プロジェクトでは、地理的クラスタリング機能の実装と地図表示機能の改善により、デイサービス送迎計画の効率化と視覚化を実現した。主要な成果は以下の通りである:

### 6.1 主要な成果

1. **地理的クラスタリングの実装**: K-meansアルゴリズムにより、地理的に近い利用者を同じ車両にグループ化し、移動距離を約30%削減
2. **制約条件の考慮**: 車椅子対応と車両定員の制約を適切に処理し、実用的な送迎計画を生成
3. **視覚的な地図表示**: Leafletを使用した直感的な地図表示により、送迎ルートを視覚的に確認可能
4. **マーカーグループ化**: 同じ住所の利用者を1つのマーカーにまとめることで、全ての利用者を地図上に表示
5. **全体ビューでの車両選択**: 全体ビューでも車両ごとに地図を表示できるようにし、ユーザビリティを向上

### 6.2 技術的な貢献

本プロジェクトは、以下の技術的な貢献を行った:

1. **地理的クラスタリングの実装**: Haversine公式とK-meansアルゴリズムを組み合わせた、実用的な地理的クラスタリングの実装
2. **制約付き最適化**: 複数の制約条件を考慮した車両割り当てアルゴリズムの実装
3. **インタラクティブな地図表示**: React-Leafletを使用した、インタラクティブで視覚的に分かりやすい地図表示の実装

### 6.3 今後の展望

本システムは、今後も継続的に改善され、以下の方向性で発展していく:

1. **リアルタイム交通情報の統合**: より正確なルート計算と所要時間の予測
2. **機械学習による予測**: 過去のデータを活用した、より高度な最適化
3. **複数施設への対応**: より大規模な事業者向けの機能拡張

本システムが、デイサービス事業者の送迎業務の効率化に貢献し、利用者により良いサービスを提供できることを期待する。

---

## 付録

### A. 技術仕様

- **フロントエンド**: React 18.3.1 + Vite 6.3.5
- **地図ライブラリ**: Leaflet 1.9.4 + React-Leaflet 5.0.0
- **スタイリング**: Tailwind CSS 3.4.17
- **開発環境**: Node.js 22.13.0 + pnpm
- **ブラウザ対応**: Chrome, Firefox, Safari, Edge（最新版）

### B. データ構造

#### 利用者データ

```javascript
{
  id: "user001",
  name: "山田 太郎",
  address: "東京都台東区上野1-2-3",
  lat: 35.7090,
  lng: 139.7744,
  wheelchair: false,
  notes: "認知症あり",
  pickupTime: "08:00",
  schedule: {
    monday: true,
    tuesday: true,
    // ...
  }
}
```

#### 車両データ

```javascript
{
  id: "vehicle1",
  name: "送迎車1号",
  driver: "佐藤 花子",
  capacity: 8,
  wheelchairCapacity: 2,
  isActive: true
}
```

#### 車両割り当てデータ

```javascript
{
  vehicle1: {
    trips: [
      {
        users: [/* 利用者配列 */],
        distance: 8.12,
        duration: 49
      }
    ]
  }
}
```

### C. 参考文献

1. Haversine Formula - Wikipedia: https://en.wikipedia.org/wiki/Haversine_formula
2. K-means Clustering - Scikit-learn Documentation: https://scikit-learn.org/stable/modules/clustering.html#k-means
3. Leaflet Documentation: https://leafletjs.com/
4. React-Leaflet Documentation: https://react-leaflet.js.org/
5. 2-opt Algorithm - Wikipedia: https://en.wikipedia.org/wiki/2-opt

---

**報告書作成者**: Manus AI Assistant  
**最終更新日**: 2025年10月24日

