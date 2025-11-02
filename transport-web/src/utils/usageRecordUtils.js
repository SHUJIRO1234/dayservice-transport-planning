/**
 * 利用実績自動記録ユーティリティ
 * 送迎計画から利用実績を自動生成
 */

import { UsageRecord } from '../models/dataModels.js';
import { formatDateISO } from './uuid.js';

/**
 * 送迎計画から利用実績を生成
 * @param {Object} params - パラメータ
 * @param {string} params.weekday - 曜日（例: '月曜日'）
 * @param {Array} params.users - 利用者リスト
 * @param {string} params.vehicleId - 車両ID
 * @param {string} params.routeId - ルートID
 * @returns {Array} 生成された利用実績の配列
 */
export function generateUsageRecordsFromPlan({ weekday, users, vehicleId, routeId }) {
  // 今週の該当曜日の日付を取得
  const usageDate = getNextWeekdayDate(weekday);
  
  // デフォルトのサービスコード（ローカルストレージから取得）
  const serviceCodes = JSON.parse(localStorage.getItem('dayservice_service_codes') || '[]');
  const defaultServiceCode = serviceCodes.find(code => code.type === 'basic');
  
  const records = users.map(user => {
    const record = new UsageRecord({
      user_id: user.user_id || user.id,
      usage_date: usageDate,
      service_type: '通常規模型デイサービス',
      service_code: defaultServiceCode?.code || '321111',
      additional_codes: [],
      status: '利用予定',
      vehicle_id: vehicleId,
      route_id: routeId,
      pickup_time: user.pickupTime || user.pickup_time || '08:00',
      notes: user.notes || ''
    });
    
    return record.toJSON();
  });
  
  return records;
}

/**
 * 次の指定曜日の日付を取得（ISO 8601形式）
 * @param {string} weekday - 曜日（例: '月曜日'）
 * @returns {string} ISO 8601形式の日付（例: '2025-10-06'）
 */
function getNextWeekdayDate(weekday) {
  const weekdayMap = {
    '月曜日': 1,
    '火曜日': 2,
    '水曜日': 3,
    '木曜日': 4,
    '金曜日': 5,
    '土曜日': 6,
    '日曜日': 0
  };
  
  const targetDay = weekdayMap[weekday];
  const today = new Date();
  const currentDay = today.getDay();
  
  // 次の該当曜日までの日数を計算
  let daysUntilTarget = targetDay - currentDay;
  if (daysUntilTarget <= 0) {
    daysUntilTarget += 7;
  }
  
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + daysUntilTarget);
  
  return formatDateISO(targetDate);
}

/**
 * 利用実績をローカルストレージに保存
 * @param {Array} newRecords - 新しい利用実績の配列
 */
export function saveUsageRecords(newRecords) {
  const existingRecords = JSON.parse(localStorage.getItem('dayservice_usage_records') || '[]');
  
  // 重複チェック（同じuser_idと同じusage_dateの実績は上書き）
  const updatedRecords = [...existingRecords];
  
  newRecords.forEach(newRecord => {
    const existingIndex = updatedRecords.findIndex(
      record => record.user_id === newRecord.user_id && record.usage_date === newRecord.usage_date
    );
    
    if (existingIndex >= 0) {
      // 既存の実績を更新
      updatedRecords[existingIndex] = newRecord;
    } else {
      // 新しい実績を追加
      updatedRecords.push(newRecord);
    }
  });
  
  localStorage.setItem('dayservice_usage_records', JSON.stringify(updatedRecords));
  
  return updatedRecords;
}

/**
 * 送迎計画全体から利用実績を一括生成・保存
 * @param {Object} params - パラメータ
 * @param {string} params.weekday - 曜日
 * @param {Object} params.vehicleAssignments - 車両割り当て情報
 * @param {Array} params.vehicles - 車両リスト
 * @returns {number} 生成された利用実績の件数
 */
export function generateAndSaveAllUsageRecords({ weekday, vehicleAssignments, vehicles }) {
  const allRecords = [];
  
  // 各車両の各便から利用実績を生成
  Object.entries(vehicleAssignments).forEach(([vehicleKey, trips]) => {
    const vehicleId = vehicles.find(v => v.id.toString() === vehicleKey.replace('vehicle', ''))?.vehicle_id || vehicleKey;
    
    Object.entries(trips).forEach(([tripKey, users]) => {
      if (users && users.length > 0) {
        const records = generateUsageRecordsFromPlan({
          weekday,
          users,
          vehicleId,
          routeId: `route_${vehicleKey}_${tripKey}`
        });
        
        allRecords.push(...records);
      }
    });
  });
  
  // 一括保存
  saveUsageRecords(allRecords);
  
  return allRecords.length;
}

