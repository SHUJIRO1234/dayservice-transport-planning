import React, { useState, useEffect } from 'react';
import { Calendar, Download, FileJson, Users, CheckCircle, XCircle, Clock } from 'lucide-react';
import { UsageRecord } from '../models/dataModels.js';
import { formatDateISO, getCurrentTimestamp } from '../utils/uuid.js';

/**
 * 利用実績管理コンポーネント
 * 送迎計画を利用実績として記録・管理
 */
const UsageRecordManager = ({ onClose }) => {
  const [usageRecords, setUsageRecords] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    absent: 0,
    scheduled: 0
  });

  // ローカルストレージから利用実績を読み込み
  useEffect(() => {
    const savedRecords = localStorage.getItem('dayservice_usage_records');
    if (savedRecords) {
      const records = JSON.parse(savedRecords);
      setUsageRecords(records);
      setFilteredRecords(records);
      calculateStats(records);
    }
  }, []);

  // 統計情報を計算
  const calculateStats = (records) => {
    const stats = {
      total: records.length,
      completed: records.filter(r => r.status === '利用済').length,
      absent: records.filter(r => r.status === '欠席').length,
      scheduled: records.filter(r => r.status === '利用予定').length
    };
    setStats(stats);
  };

  // 期間でフィルタリング
  const handleFilter = () => {
    if (!startDate || !endDate) {
      alert('開始日と終了日を選択してください');
      return;
    }

    const filtered = usageRecords.filter(record => {
      return record.usage_date >= startDate && record.usage_date <= endDate;
    });

    setFilteredRecords(filtered);
    calculateStats(filtered);
  };

  // フィルタリングをリセット
  const handleResetFilter = () => {
    setStartDate('');
    setEndDate('');
    setFilteredRecords(usageRecords);
    calculateStats(usageRecords);
  };

  // ステータスを更新
  const handleStatusChange = (recordId, newStatus) => {
    const updatedRecords = usageRecords.map(record => {
      if (record.usage_record_id === recordId) {
        return {
          ...record,
          status: newStatus,
          last_updated_at: getCurrentTimestamp()
        };
      }
      return record;
    });

    setUsageRecords(updatedRecords);
    localStorage.setItem('dayservice_usage_records', JSON.stringify(updatedRecords));
    
    // フィルタリングされたレコードも更新
    const filtered = updatedRecords.filter(record => {
      if (!startDate || !endDate) return true;
      return record.usage_date >= startDate && record.usage_date <= endDate;
    });
    setFilteredRecords(filtered);
    calculateStats(filtered);
  };

  // JSON形式でエクスポート（外部システム連携用）
  const handleExportJSON = () => {
    if (filteredRecords.length === 0) {
      alert('エクスポートするデータがありません');
      return;
    }

    // 外部システム連携用の簡易JSON形式
    const exportData = filteredRecords.map(record => ({
      usage_record_id: record.usage_record_id,
      user_id: record.user_id,
      usage_date: record.usage_date,
      service_type: record.service_type,
      service_code: record.service_code,
      additional_codes: record.additional_codes || [],
      status: record.status,
      last_updated_at: record.last_updated_at
    }));

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    
    const filename = startDate && endDate 
      ? `利用実績_${startDate}_${endDate}.json`
      : `利用実績_${formatDateISO(new Date())}.json`;
    
    link.download = filename;
    link.click();
  };

  // CSV形式でエクスポート
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      alert('エクスポートするデータがありません');
      return;
    }

    const headers = [
      '利用実績ID',
      '利用者ID',
      '利用日',
      'サービス種別',
      'サービスコード',
      '加算コード',
      'ステータス',
      '最終更新日時'
    ];

    const csvData = filteredRecords.map(record => [
      record.usage_record_id,
      record.user_id,
      record.usage_date,
      record.service_type,
      record.service_code,
      (record.additional_codes || []).join(';'),
      record.status,
      record.last_updated_at
    ]);

    const csv = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    
    const filename = startDate && endDate 
      ? `利用実績_${startDate}_${endDate}.csv`
      : `利用実績_${formatDateISO(new Date())}.csv`;
    
    link.download = filename;
    link.click();
  };

  // ステータスの色を取得
  const getStatusColor = (status) => {
    switch (status) {
      case '利用済':
        return 'bg-green-100 text-green-800';
      case '欠席':
        return 'bg-red-100 text-red-800';
      case 'キャンセル':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  // ステータスのアイコンを取得
  const getStatusIcon = (status) => {
    switch (status) {
      case '利用済':
        return <CheckCircle className="w-4 h-4" />;
      case '欠席':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* ヘッダー */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              利用実績管理
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 統計情報 */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">総件数</div>
              <div className="text-2xl font-bold text-gray-800">{stats.total}件</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">利用済</div>
              <div className="text-2xl font-bold text-green-600">{stats.completed}件</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">欠席</div>
              <div className="text-2xl font-bold text-red-600">{stats.absent}件</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">利用予定</div>
              <div className="text-2xl font-bold text-blue-600">{stats.scheduled}件</div>
            </div>
          </div>
        </div>

        {/* フィルタリング */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                開始日
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                終了日
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleFilter}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              フィルター
            </button>
            <button
              onClick={handleResetFilter}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              リセット
            </button>
          </div>
        </div>

        {/* エクスポートボタン */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex gap-4">
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <FileJson className="w-4 h-4" />
              JSON出力（外部連携用）
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              CSV出力
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            ※ JSON形式は外部システム（記録・請求システム等）との連携に使用できます
          </p>
        </div>

        {/* 利用実績一覧 */}
        <div className="flex-1 overflow-auto p-6">
          <div className="text-sm text-gray-600 mb-4">
            登録件数: {filteredRecords.length}件
          </div>

          {filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>利用実績がありません</p>
              <p className="text-sm mt-2">送迎計画を実行すると、自動的に利用実績が記録されます</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      利用日
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      利用者ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      サービス種別
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      サービスコード
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      加算コード
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ステータス
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRecords.map((record) => (
                    <tr key={record.usage_record_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.usage_date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {record.user_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.service_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {record.service_code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(record.additional_codes || []).length > 0 
                          ? (record.additional_codes || []).join(', ')
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                          {getStatusIcon(record.status)}
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <select
                          value={record.status}
                          onChange={(e) => handleStatusChange(record.usage_record_id, e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="利用予定">利用予定</option>
                          <option value="利用済">利用済</option>
                          <option value="欠席">欠席</option>
                          <option value="キャンセル">キャンセル</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsageRecordManager;

