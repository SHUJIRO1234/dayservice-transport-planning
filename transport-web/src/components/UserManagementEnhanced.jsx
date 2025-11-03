import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Download, Upload, Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import { UserMaster } from '../models/dataModels.js';
import { getCurrentTimestamp } from '../utils/uuid.js';
import { saveSampleUsersToLocalStorage } from '../utils/migrateSampleUsers.js';

const UserManagementEnhanced = ({ onClose }) => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showBillingSection, setShowBillingSection] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    wheelchair: false,
    pickupTime: '08:00',
    notes: '',
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
    sunday: false,
    // 請求連動フィールド
    serviceCode: '321111', // デフォルト: 通常規模型デイサービス（7時間以上8時間未満）
    serviceDuration: {
      monday: '7-8h',
      tuesday: '7-8h',
      wednesday: '7-8h',
      thursday: '7-8h',
      friday: '7-8h',
      saturday: '7-8h',
      sunday: '7-8h'
    },
    additionalServices: {
      bathing: false,        // 入浴介助加算
      training: false,       // 個別機能訓練加算
      nutrition: false,      // 栄養改善加算
      oral: false           // 口腔機能向上加算
    }
  });

  // サービスコードの選択肢
  const serviceCodeOptions = [
    { code: '321111', name: '通常規模型デイサービス（7時間以上8時間未満）' },
    { code: '321211', name: '通常規模型デイサービス（8時間以上9時間未満）' }
  ];

  // 利用時間の選択肢
  const durationOptions = [
    { value: '7-8h', label: '7時間以上8時間未満' },
    { value: '8-9h', label: '8時間以上9時間未満' }
  ];

  // 加算サービスの定義
  const additionalServiceOptions = [
    { key: 'bathing', code: '322101', name: '入浴介助加算' },
    { key: 'training', code: '322201', name: '個別機能訓練加算（Ⅰ）' },
    { key: 'nutrition', code: '322401', name: '栄養改善加算' },
    { key: 'oral', code: '322501', name: '口腔機能向上加算' }
  ];

  // ローカルストレージから利用者データを読み込み
  useEffect(() => {
    const savedUsers = localStorage.getItem('userMaster');
    if (savedUsers) {
      try {
        setUsers(JSON.parse(savedUsers));
      } catch (e) {
        console.error('Failed to load users:', e);
        setUsers([]);
      }
    }
  }, []);

  // 利用者データをローカルストレージに保存
  const saveUsers = (updatedUsers) => {
    setUsers(updatedUsers);
    localStorage.setItem('userMaster', JSON.stringify(updatedUsers));
  };

  // サンプル利用者を移行
  const handleMigrateSampleUsers = async () => {
    if (confirm('80名のサンプル利用者を利用者マスタに移行しますか？\n既存のデータは上書きされます。')) {
      try {
        // 80名のサンプルデータを読み込む
        const response = await fetch('/sample_users_80.json');
        const data = await response.json();
        const sampleUsers = data.userMaster;
        
        // localStorageに保存
        localStorage.setItem('userMaster', JSON.stringify(sampleUsers));
        setUsers(sampleUsers);
        alert(`${sampleUsers.length}名のサンプル利用者を移行しました`);
      } catch (error) {
        console.error('サンプルデータの読み込みに失敗しました:', error);
        alert('サンプルデータの移行に失敗しました');
      }
    }
  };

  // フォームのリセット
  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      wheelchair: false,
      pickupTime: '08:00',
      notes: '',
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false,
      serviceCode: '321111',
      serviceDuration: {
        monday: '7-8h',
        tuesday: '7-8h',
        wednesday: '7-8h',
        thursday: '7-8h',
        friday: '7-8h',
        saturday: '7-8h',
        sunday: '7-8h'
      },
      additionalServices: {
        bathing: false,
        training: false,
        nutrition: false,
        oral: false
      }
    });
    setEditingUser(null);
    setIsFormOpen(false);
    setShowBillingSection(false);
  };

  // 新規登録
  const handleAdd = () => {
    if (!formData.name || !formData.address) {
      alert('利用者名と住所は必須です');
      return;
    }

    const daysOfWeek = [];
    if (formData.monday) daysOfWeek.push('月曜日');
    if (formData.tuesday) daysOfWeek.push('火曜日');
    if (formData.wednesday) daysOfWeek.push('水曜日');
    if (formData.thursday) daysOfWeek.push('木曜日');
    if (formData.friday) daysOfWeek.push('金曜日');
    if (formData.saturday) daysOfWeek.push('土曜日');
    if (formData.sunday) daysOfWeek.push('日曜日');

    // 加算サービスコードの配列を作成
    const additionalCodes = [];
    if (formData.additionalServices.bathing) additionalCodes.push('322101');
    if (formData.additionalServices.training) additionalCodes.push('322201');
    if (formData.additionalServices.nutrition) additionalCodes.push('322401');
    if (formData.additionalServices.oral) additionalCodes.push('322501');

    const newUser = new UserMaster({
      name: formData.name,
      address: formData.address,
      wheelchair: formData.wheelchair,
      pickup_time: formData.pickupTime,
      days_of_week: daysOfWeek,
      notes: formData.notes
    });

    const userWithBilling = {
      ...newUser.toJSON(),
      id: newUser.user_id,
      pickupTime: formData.pickupTime,
      monday: formData.monday,
      tuesday: formData.tuesday,
      wednesday: formData.wednesday,
      thursday: formData.thursday,
      friday: formData.friday,
      saturday: formData.saturday,
      sunday: formData.sunday,
      // 請求連動フィールド
      serviceCode: formData.serviceCode,
      serviceDuration: formData.serviceDuration,
      additionalServices: formData.additionalServices,
      additionalCodes: additionalCodes
    };

    saveUsers([...users, userWithBilling]);
    resetForm();
    alert('利用者を登録しました');
  };

  // 編集
  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      address: user.address,
      wheelchair: user.wheelchair || false,
      pickupTime: user.pickupTime || '08:00',
      notes: user.notes || '',
      monday: user.monday || false,
      tuesday: user.tuesday || false,
      wednesday: user.wednesday || false,
      thursday: user.thursday || false,
      friday: user.friday || false,
      saturday: user.saturday || false,
      sunday: user.sunday || false,
      serviceCode: user.serviceCode || '321111',
      serviceDuration: user.serviceDuration || {
        monday: '7-8h',
        tuesday: '7-8h',
        wednesday: '7-8h',
        thursday: '7-8h',
        friday: '7-8h',
        saturday: '7-8h',
        sunday: '7-8h'
      },
      additionalServices: user.additionalServices || {
        bathing: false,
        training: false,
        nutrition: false,
        oral: false
      }
    });
    setIsFormOpen(true);
  };

  // 更新
  const handleUpdate = () => {
    if (!formData.name || !formData.address) {
      alert('利用者名と住所は必須です');
      return;
    }

    const daysOfWeek = [];
    if (formData.monday) daysOfWeek.push('月曜日');
    if (formData.tuesday) daysOfWeek.push('火曜日');
    if (formData.wednesday) daysOfWeek.push('水曜日');
    if (formData.thursday) daysOfWeek.push('木曜日');
    if (formData.friday) daysOfWeek.push('金曜日');
    if (formData.saturday) daysOfWeek.push('土曜日');
    if (formData.sunday) daysOfWeek.push('日曜日');

    const additionalCodes = [];
    if (formData.additionalServices.bathing) additionalCodes.push('322101');
    if (formData.additionalServices.training) additionalCodes.push('322201');
    if (formData.additionalServices.nutrition) additionalCodes.push('322401');
    if (formData.additionalServices.oral) additionalCodes.push('322501');

    const updatedUsers = users.map(user =>
      user.id === editingUser.id
        ? {
            ...user,
            name: formData.name,
            address: formData.address,
            wheelchair: formData.wheelchair,
            pickupTime: formData.pickupTime,
            notes: formData.notes,
            monday: formData.monday,
            tuesday: formData.tuesday,
            wednesday: formData.wednesday,
            thursday: formData.thursday,
            friday: formData.friday,
            saturday: formData.saturday,
            sunday: formData.sunday,
            serviceCode: formData.serviceCode,
            serviceDuration: formData.serviceDuration,
            additionalServices: formData.additionalServices,
            additionalCodes: additionalCodes,
            days_of_week: daysOfWeek,
            updated_at: getCurrentTimestamp()
          }
        : user
    );

    saveUsers(updatedUsers);
    resetForm();
    alert('利用者情報を更新しました');
  };

  // 削除
  const handleDelete = (userId) => {
    if (confirm('この利用者を削除しますか？')) {
      const updatedUsers = users.filter(user => user.id !== userId);
      saveUsers(updatedUsers);
    }
  };

  // エクスポート
  const handleExport = () => {
    const csv = [
      ['利用者名', '住所', '車椅子', '送迎時刻', '特記事項', '月', '火', '水', '木', '金', '土', '日', 'サービスコード', '加算サービス'].join(','),
      ...users.map(user => [
        user.name,
        user.address,
        user.wheelchair ? 'はい' : 'いいえ',
        user.pickupTime,
        user.notes,
        user.monday ? '○' : '',
        user.tuesday ? '○' : '',
        user.wednesday ? '○' : '',
        user.thursday ? '○' : '',
        user.friday ? '○' : '',
        user.saturday ? '○' : '',
        user.sunday ? '○' : '',
        user.serviceCode || '',
        (user.additionalCodes || []).join(';')
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `利用者データ_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // 検索フィルター
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">利用者管理</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* ツールバー */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setIsFormOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                新規登録
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-5 h-5" />
                エクスポート
              </button>
              <button
                onClick={handleMigrateSampleUsers}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Upload className="w-5 h-5" />
                サンプル移行
              </button>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="利用者名または住所で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="outline-none"
              />
            </div>
          </div>
        </div>

        {/* 利用者一覧 */}
        <div className="flex-1 overflow-auto p-6">
          <div className="text-sm text-gray-600 mb-4">
            登録件数: {filteredUsers.length}件
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-3 text-left">利用者名</th>
                  <th className="border p-3 text-left">住所</th>
                  <th className="border p-3 text-center">車椅子</th>
                  <th className="border p-3 text-center">送迎時刻</th>
                  <th className="border p-3 text-left">利用曜日</th>
                  <th className="border p-3 text-left">サービス</th>
                  <th className="border p-3 text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="border p-8 text-center text-gray-500">
                      {searchTerm ? '検索結果が見つかりません' : '利用者データがありません。新規登録またはサンプル移行から追加してください。'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="border p-3">{user.name}</td>
                      <td className="border p-3 text-sm">{user.address}</td>
                      <td className="border p-3 text-center">
                        {user.wheelchair ? '✓' : ''}
                      </td>
                      <td className="border p-3 text-center">{user.pickupTime}</td>
                      <td className="border p-3">
                        <div className="flex gap-1 flex-wrap">
                          {user.monday && <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">月</span>}
                          {user.tuesday && <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">火</span>}
                          {user.wednesday && <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">水</span>}
                          {user.thursday && <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">木</span>}
                          {user.friday && <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">金</span>}
                          {user.saturday && <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">土</span>}
                          {user.sunday && <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">日</span>}
                        </div>
                      </td>
                      <td className="border p-3 text-xs">
                        <div className="text-gray-600">
                          {user.serviceCode && <div>コード: {user.serviceCode}</div>}
                          {user.additionalCodes && user.additionalCodes.length > 0 && (
                            <div className="text-green-600">加算: {user.additionalCodes.length}件</div>
                          )}
                        </div>
                      </td>
                      <td className="border p-3">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="編集"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="削除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 登録・編集フォーム */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto">
              <div className="p-6 border-b">
                <h3 className="text-xl font-bold">
                  {editingUser ? '利用者情報の編集' : '新規利用者登録'}
                </h3>
              </div>
              <div className="p-6 space-y-6">
                {/* 基本情報 */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg border-b pb-2">基本情報</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        利用者名 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="例: 山田 太郎"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">送迎時刻</label>
                      <input
                        type="time"
                        value={formData.pickupTime}
                        onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      住所 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="例: 東京都千代田区..."
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.wheelchair}
                        onChange={(e) => setFormData({ ...formData, wheelchair: e.target.checked })}
                        className="w-5 h-5"
                      />
                      <span className="text-sm font-medium">車椅子対応</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">利用曜日</label>
                    <div className="flex flex-wrap gap-3">
                      {[
                        { key: 'monday', label: '月' },
                        { key: 'tuesday', label: '火' },
                        { key: 'wednesday', label: '水' },
                        { key: 'thursday', label: '木' },
                        { key: 'friday', label: '金' },
                        { key: 'saturday', label: '土' },
                        { key: 'sunday', label: '日' }
                      ].map(day => (
                        <label key={day.key} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData[day.key]}
                            onChange={(e) => setFormData({ ...formData, [day.key]: e.target.checked })}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">{day.label}曜日</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">特記事項</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      rows="2"
                      placeholder="例: 玄関まで介助必要、認知症あり など"
                    />
                  </div>
                </div>

                {/* 請求連動情報（アコーディオン） */}
                <div className="border rounded-lg">
                  <button
                    onClick={() => setShowBillingSection(!showBillingSection)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <h4 className="font-semibold text-lg">請求連動情報（サービスコード・加算）</h4>
                    {showBillingSection ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                  {showBillingSection && (
                    <div className="p-4 border-t space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">基本サービスコード</label>
                        <select
                          value={formData.serviceCode}
                          onChange={(e) => setFormData({ ...formData, serviceCode: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          {serviceCodeOptions.map(option => (
                            <option key={option.code} value={option.code}>
                              {option.code} - {option.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">曜日ごとの利用時間</label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { key: 'monday', label: '月曜日', enabled: formData.monday },
                            { key: 'tuesday', label: '火曜日', enabled: formData.tuesday },
                            { key: 'wednesday', label: '水曜日', enabled: formData.wednesday },
                            { key: 'thursday', label: '木曜日', enabled: formData.thursday },
                            { key: 'friday', label: '金曜日', enabled: formData.friday },
                            { key: 'saturday', label: '土曜日', enabled: formData.saturday },
                            { key: 'sunday', label: '日曜日', enabled: formData.sunday }
                          ].filter(day => day.enabled).map(day => (
                            <div key={day.key}>
                              <label className="block text-xs text-gray-600 mb-1">{day.label}</label>
                              <select
                                value={formData.serviceDuration[day.key]}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  serviceDuration: {
                                    ...formData.serviceDuration,
                                    [day.key]: e.target.value
                                  }
                                })}
                                className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                              >
                                {durationOptions.map(option => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">加算サービス</label>
                        <div className="space-y-2">
                          {additionalServiceOptions.map(service => (
                            <label key={service.key} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded">
                              <input
                                type="checkbox"
                                checked={formData.additionalServices[service.key]}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  additionalServices: {
                                    ...formData.additionalServices,
                                    [service.key]: e.target.checked
                                  }
                                })}
                                className="w-4 h-4"
                              />
                              <span className="text-sm">
                                <span className="font-medium">{service.name}</span>
                                <span className="text-gray-500 ml-2">({service.code})</span>
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-6 border-t flex gap-3 justify-end bg-gray-50">
                <button
                  onClick={resetForm}
                  className="px-6 py-2 border rounded-lg hover:bg-white transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={editingUser ? handleUpdate : handleAdd}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingUser ? '更新' : '登録'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagementEnhanced;

