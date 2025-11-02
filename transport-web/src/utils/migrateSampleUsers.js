import { weeklyData } from '../weeklyData.js';
import { generateUUID } from './uuid.js';

/**
 * weeklyData.jsのサンプル利用者を利用者マスタ形式に変換
 */
export function migrateSampleUsersToMaster() {
  const users = [];
  const processedIds = new Set();

  // 全曜日のデータを走査
  Object.keys(weeklyData).forEach(day => {
    weeklyData[day].forEach(user => {
      // 既に処理済みのIDはスキップ
      if (processedIds.has(user.id)) {
        return;
      }
      
      processedIds.add(user.id);

      // 利用曜日を収集
      const days = [];
      Object.keys(weeklyData).forEach(d => {
        if (weeklyData[d].some(u => u.id === user.id)) {
          days.push(d);
        }
      });

      // 利用者マスタ形式に変換
      const masterUser = {
        user_id: generateUUID(),
        original_id: user.id, // 元のIDを保持（連携用）
        name: user.name,
        address: user.address,
        wheelchair: user.wheelchair || false,
        pickup_time: user.pickupTime || '08:00',
        days: days,
        notes: user.note || '',
        // 請求連動フィールド（デフォルト値）
        service_code: '321111', // 通常規模型デイサービス（7時間以上8時間未満）
        service_duration: {}, // 曜日ごとの利用時間
        additional_services: [], // 加算サービス
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // 曜日ごとの利用時間を設定（デフォルト: 7時間以上8時間未満）
      days.forEach(day => {
        masterUser.service_duration[day] = '7-8h'; // 7時間以上8時間未満
      });

      users.push(masterUser);
    });
  });

  return users;
}

/**
 * サンプル利用者をローカルストレージに保存
 */
export function saveSampleUsersToLocalStorage() {
  const users = migrateSampleUsersToMaster();
  localStorage.setItem('dayservice_users', JSON.stringify(users));
  console.log(`${users.length}名のサンプル利用者を利用者マスタに移行しました`);
  return users;
}

