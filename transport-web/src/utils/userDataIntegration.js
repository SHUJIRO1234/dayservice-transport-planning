/**
 * 利用者データ統合ユーティリティ
 * 
 * 利用者管理で登録したデータとサンプルデータを統合し、
 * 送迎計画で使用できる形式に変換する
 */

/**
 * localStorageから利用者マスタデータを取得
 */
export const getUserMasterData = () => {
  try {
    const data = localStorage.getItem('userMaster');
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('利用者マスタデータの読み込みエラー:', error);
    return [];
  }
};

/**
 * 曜日の日本語表記を英語表記に変換
 */
const dayMapping = {
  '月': '月曜日',
  '火': '火曜日',
  '水': '水曜日',
  '木': '木曜日',
  '金': '金曜日',
  '土': '土曜日',
  '日': '日曜日',
};

/**
 * 利用者マスタデータを送迎計画用のフォーマットに変換
 */
export const convertUserMasterToTransportFormat = (userMasterData) => {
  return userMasterData.map(user => ({
    id: user.id || user.user_id,
    name: user.name,
    address: user.address,
    lat: user.lat || 35.7212, // デフォルト座標（施設付近）
    lng: user.lng || 139.7745,
    wheelchair: user.wheelchair || false,
    note: user.notes || '',
    pickupTime: user.pickupTime || user.pickup_time || '08:00',
    returnTime: '16:00', // デフォルト値
    days_of_week: user.days_of_week || [],
  }));
};

/**
 * 曜日ごとに利用者をフィルタリング
 */
export const filterUsersByWeekday = (users, weekday) => {
  return users.filter(user => {
    if (!user.days_of_week || user.days_of_week.length === 0) {
      return false; // 利用曜日が設定されていない場合は除外
    }
    
    // days_of_weekには「水曜日」のような完全な形式が入っているので直接比較
    return user.days_of_week.includes(weekday);
  });
};

/**
 * サンプルデータと利用者マスタデータを統合
 * 
 * @param {Object} sampleWeeklyData - weeklyData.jsのサンプルデータ
 * @param {Array} userMasterData - 利用者マスタデータ
 * @returns {Object} 統合された曜日ごとのデータ
 */
export const integrateUserData = (sampleWeeklyData, userMasterData = null) => {
  // 利用者マスタデータを取得（引数がない場合はlocalStorageから取得）
  const masterData = userMasterData || getUserMasterData();
  
  // 利用者マスタデータを送迎計画用のフォーマットに変換
  const convertedMasterData = convertUserMasterToTransportFormat(masterData);
  
  // 曜日ごとに統合
  const integratedData = {};
  const weekdays = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日', '日曜日'];
  
  weekdays.forEach(weekday => {
    // サンプルデータ
    const sampleUsers = sampleWeeklyData[weekday] || [];
    
    // 利用者マスタから該当曜日のユーザーを抽出
    const masterUsers = filterUsersByWeekday(convertedMasterData, weekday);
    
    // 重複を避けるため、IDでマージ
    const userMap = new Map();
    
    // サンプルデータを追加
    sampleUsers.forEach(user => {
      userMap.set(user.id, user);
    });
    
    // 利用者マスタデータを追加（上書き）
    masterUsers.forEach(user => {
      userMap.set(user.id, user);
    });
    
    // Mapを配列に変換
    integratedData[weekday] = Array.from(userMap.values());
  });
  
  return integratedData;
};

/**
 * 利用者マスタデータの更新を監視し、送迎計画データを更新
 */
export const watchUserMasterChanges = (callback) => {
  // localStorageの変更を監視
  window.addEventListener('storage', (event) => {
    if (event.key === 'userMaster') {
      callback();
    }
  });
  
  // 同一タブ内での変更を監視（カスタムイベント）
  window.addEventListener('userMasterUpdated', () => {
    callback();
  });
};

/**
 * 利用者マスタ更新イベントを発火
 */
export const triggerUserMasterUpdate = () => {
  window.dispatchEvent(new CustomEvent('userMasterUpdated'));
};

