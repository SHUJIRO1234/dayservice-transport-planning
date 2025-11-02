/**
 * UUID生成ユーティリティ
 * 外部システム連携のため、すべてのデータにユニークIDを付与
 */

/**
 * UUID v4を生成
 * @returns {string} UUID v4形式の文字列
 */
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 利用者IDを生成
 * @returns {string} user_で始まるUUID
 */
export function generateUserId() {
  return `user_${generateUUID()}`;
}

/**
 * 車両IDを生成
 * @returns {string} vehicle_で始まるUUID
 */
export function generateVehicleId() {
  return `vehicle_${generateUUID()}`;
}

/**
 * ドライバーIDを生成
 * @returns {string} driver_で始まるUUID
 */
export function generateDriverId() {
  return `driver_${generateUUID()}`;
}

/**
 * 利用実績IDを生成
 * @returns {string} usage_で始まるUUID
 */
export function generateUsageRecordId() {
  return `usage_${generateUUID()}`;
}

/**
 * ルートIDを生成
 * @returns {string} route_で始まるUUID
 */
export function generateRouteId() {
  return `route_${generateUUID()}`;
}

/**
 * 現在の日時をISO 8601形式で取得
 * @returns {string} ISO 8601形式の日時文字列
 */
export function getCurrentTimestamp() {
  return new Date().toISOString();
}

/**
 * 日付をISO 8601形式（日付のみ）で取得
 * @param {Date} date - 日付オブジェクト
 * @returns {string} ISO 8601形式の日付文字列（例: 2025-10-01）
 */
export function formatDateISO(date) {
  return date.toISOString().split('T')[0];
}

