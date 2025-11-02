/**
 * データモデル定義
 * 外部システム連携を想定したデータ構造
 */

import { 
  generateUserId, 
  generateVehicleId, 
  generateDriverId, 
  generateUsageRecordId,
  generateRouteId,
  getCurrentTimestamp 
} from '../utils/uuid.js';

/**
 * 利用者マスタのデータモデル
 */
export class UserMaster {
  constructor(data = {}) {
    this.user_id = data.user_id || generateUserId();
    this.name = data.name || '';
    this.address = data.address || '';
    this.wheelchair = data.wheelchair || false;
    this.pickup_time = data.pickup_time || '08:00';
    this.days_of_week = data.days_of_week || []; // ['月', '火', '水', '木', '金', '土', '日']
    this.notes = data.notes || '';
    this.created_at = data.created_at || getCurrentTimestamp();
    this.updated_at = data.updated_at || getCurrentTimestamp();
  }

  toJSON() {
    return {
      user_id: this.user_id,
      name: this.name,
      address: this.address,
      wheelchair: this.wheelchair,
      pickup_time: this.pickup_time,
      days_of_week: this.days_of_week,
      notes: this.notes,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

/**
 * 車両マスタのデータモデル
 */
export class VehicleMaster {
  constructor(data = {}) {
    this.vehicle_id = data.vehicle_id || generateVehicleId();
    this.vehicle_name = data.vehicle_name || '';
    this.capacity = data.capacity || 8;
    this.wheelchair_capacity = data.wheelchair_capacity || 2;
    this.driver_id = data.driver_id || null;
    this.created_at = data.created_at || getCurrentTimestamp();
    this.updated_at = data.updated_at || getCurrentTimestamp();
  }

  toJSON() {
    return {
      vehicle_id: this.vehicle_id,
      vehicle_name: this.vehicle_name,
      capacity: this.capacity,
      wheelchair_capacity: this.wheelchair_capacity,
      driver_id: this.driver_id,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

/**
 * ドライバーマスタのデータモデル
 */
export class DriverMaster {
  constructor(data = {}) {
    this.driver_id = data.driver_id || generateDriverId();
    this.name = data.name || '';
    this.created_at = data.created_at || getCurrentTimestamp();
    this.updated_at = data.updated_at || getCurrentTimestamp();
  }

  toJSON() {
    return {
      driver_id: this.driver_id,
      name: this.name,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

/**
 * 利用実績のデータモデル
 * 外部システム連携用のJSON出力形式に対応
 */
export class UsageRecord {
  constructor(data = {}) {
    this.usage_record_id = data.usage_record_id || generateUsageRecordId();
    this.user_id = data.user_id || '';
    this.usage_date = data.usage_date || ''; // ISO 8601形式: 2025-10-01
    this.service_type = data.service_type || '通常規模型デイサービス';
    this.service_code = data.service_code || '321111'; // 基本サービスコード
    this.additional_codes = data.additional_codes || []; // 加算サービスコード配列
    this.status = data.status || '利用予定'; // '利用予定', '利用済', '欠席', 'キャンセル'
    this.vehicle_id = data.vehicle_id || null;
    this.route_id = data.route_id || null;
    this.pickup_time = data.pickup_time || '';
    this.actual_pickup_time = data.actual_pickup_time || null;
    this.dropoff_time = data.dropoff_time || null;
    this.notes = data.notes || '';
    this.created_at = data.created_at || getCurrentTimestamp();
    this.last_updated_at = data.last_updated_at || getCurrentTimestamp();
  }

  toJSON() {
    return {
      usage_record_id: this.usage_record_id,
      user_id: this.user_id,
      usage_date: this.usage_date,
      service_type: this.service_type,
      service_code: this.service_code,
      additional_codes: this.additional_codes,
      status: this.status,
      vehicle_id: this.vehicle_id,
      route_id: this.route_id,
      pickup_time: this.pickup_time,
      actual_pickup_time: this.actual_pickup_time,
      dropoff_time: this.dropoff_time,
      notes: this.notes,
      created_at: this.created_at,
      last_updated_at: this.last_updated_at
    };
  }

  /**
   * 外部システム連携用の簡易JSON形式
   */
  toExternalJSON() {
    return {
      usage_record_id: this.usage_record_id,
      user_id: this.user_id,
      usage_date: this.usage_date,
      service_type: this.service_type,
      service_code: this.service_code,
      additional_codes: this.additional_codes,
      status: this.status,
      last_updated_at: this.last_updated_at
    };
  }
}

/**
 * 送迎ルートのデータモデル
 */
export class RouteRecord {
  constructor(data = {}) {
    this.route_id = data.route_id || generateRouteId();
    this.vehicle_id = data.vehicle_id || '';
    this.route_date = data.route_date || ''; // ISO 8601形式: 2025-10-01
    this.trip_number = data.trip_number || 1; // 第何便
    this.user_ids = data.user_ids || []; // 利用者IDの配列（順番通り）
    this.total_distance = data.total_distance || 0; // km
    this.total_duration = data.total_duration || 0; // 分
    this.optimized = data.optimized || false; // ルート最適化済みかどうか
    this.created_at = data.created_at || getCurrentTimestamp();
    this.updated_at = data.updated_at || getCurrentTimestamp();
  }

  toJSON() {
    return {
      route_id: this.route_id,
      vehicle_id: this.vehicle_id,
      route_date: this.route_date,
      trip_number: this.trip_number,
      user_ids: this.user_ids,
      total_distance: this.total_distance,
      total_duration: this.total_duration,
      optimized: this.optimized,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

/**
 * サービスコードマスタのデータモデル
 */
export class ServiceCodeMaster {
  constructor(data = {}) {
    this.code = data.code || '';
    this.name = data.name || '';
    this.type = data.type || 'basic'; // 'basic' or 'additional'
    this.description = data.description || '';
    this.created_at = data.created_at || getCurrentTimestamp();
    this.updated_at = data.updated_at || getCurrentTimestamp();
  }

  toJSON() {
    return {
      code: this.code,
      name: this.name,
      type: this.type,
      description: this.description,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

