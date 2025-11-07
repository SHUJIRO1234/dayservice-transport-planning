import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Download, Upload, Search, X } from 'lucide-react';
import { UserMaster } from '../models/dataModels.js';
import { getCurrentTimestamp } from '../utils/uuid.js';
import { normalizeName, normalizeAddress, normalizeTime } from '../utils/inputNormalizer.js';
import { triggerUserMasterUpdate } from '../utils/userDataIntegration.js';
import { geocodeAddress } from '../utils/geocoding.js';

const UserManagement = ({ onClose }) => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
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
    sunday: false
  });

  // ローカルストレージから利用者データを読み込み
  useEffect(() => {
    const savedUsers = localStorage.getItem('dayservice_users');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    }
  }, []);

  // 利用者データをローカルストレージに保存
  const saveUsers = (updatedUsers) => {
    setUsers(updatedUsers);
    localStorage.setItem('dayservice_users', JSON.stringify(updatedUsers));
    // 利用者マスタ更新イベントを発火
    triggerUserMasterUpdate();
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
      sunday: false
    });
    setEditingUser(null);
    setIsFormOpen(false);
  };

  // 新規登録
  const handleAdd = () => {
    if (!formData.name || !formData.address) {
      alert('利用者名と住所は必須です');
      return;
    }

    // 入力値を正規化
    const normalizedName = normalizeName(formData.name);
    const normalizedAddress = normalizeAddress(formData.address);
    const normalizedPickupTime = normalizeTime(formData.pickupTime);

    // UserMasterモデルを使用してユニークIDを付与
    const daysOfWeek = [];
    if (formData.monday) daysOfWeek.push('月曜日');
    if (formData.tuesday) daysOfWeek.push('火曜日');
    if (formData.wednesday) daysOfWeek.push('水曜日');
    if (formData.thursday) daysOfWeek.push('木曜日');
    if (formData.friday) daysOfWeek.push('金曜日');
    if (formData.saturday) daysOfWeek.push('土曜日');
    if (formData.sunday) daysOfWeek.push('日曜日');

    const newUser = new UserMaster({
      name: normalizedName,
      address: normalizedAddress,
      wheelchair: formData.wheelchair,
      pickup_time: normalizedPickupTime,
      days_of_week: daysOfWeek,
      notes: formData.notes
    });

    // 既存のフォーマットとの互換性のため、idフィールドも保持
    const userWithId = {
      ...newUser.toJSON(),
      id: newUser.user_id,
      pickupTime: normalizedPickupTime,
      monday: formData.monday,
      tuesday: formData.tuesday,
      wednesday: formData.wednesday,
      thursday: formData.thursday,
      friday: formData.friday,
      saturday: formData.saturday,
      sunday: formData.sunday
    };

    saveUsers([...users, userWithId]);
    resetForm();
  };

  // 編集
  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData(user);
    setIsFormOpen(true);
  };

  // 更新
  const handleUpdate = () => {
    if (!formData.name || !formData.address) {
      alert('利用者名と住所は必須です');
      return;
    }

    // 入力値を正規化
    const normalizedName = normalizeName(formData.name);
    const normalizedAddress = normalizeAddress(formData.address);
    const normalizedPickupTime = normalizeTime(formData.pickupTime);

    const daysOfWeek = [];
    if (formData.monday) daysOfWeek.push('月曜日');
    if (formData.tuesday) daysOfWeek.push('火曜日');
    if (formData.wednesday) daysOfWeek.push('水曜日');
    if (formData.thursday) daysOfWeek.push('木曜日');
    if (formData.friday) daysOfWeek.push('金曜日');
    if (formData.saturday) daysOfWeek.push('土曜日');
    if (formData.sunday) daysOfWeek.push('日曜日');

    const updatedUsers = users.map(user => {
      if (user.id === editingUser.id) {
        return {
          ...user,
          ...formData,
          name: normalizedName,
          address: normalizedAddress,
          pickupTime: normalizedPickupTime,
          user_id: user.user_id || user.id, // user_idがない場合はidを使用
          days_of_week: daysOfWeek,
          pickup_time: normalizedPickupTime,
          updated_at: getCurrentTimestamp()
        };
      }
      return user;
    });

    saveUsers(updatedUsers);
    resetForm();
  };

  // 削除
  const handleDelete = (userId) => {
    if (window.confirm('この利用者を削除してもよろしいですか？')) {
      const updatedUsers = users.filter(user => user.id !== userId);
      saveUsers(updatedUsers);
    }
  };

  // CSVエクスポート
  const handleExport = () => {
    const headers = ['利用者名', '住所', '車椅子', '送迎時刻', '特記事項', '月', '火', '水', '木', '金', '土', '日'];
    const csvData = users.map(user => [
      user.name,
      user.address,
      user.wheelchair ? 'はい' : 'いいえ',
      user.pickupTime,
      user.notes || '',
      user.monday ? '○' : '',
      user.tuesday ? '○' : '',
      user.wednesday ? '○' : '',
      user.thursday ? '○' : '',
      user.friday ? '○' : '',
      user.saturday ? '○' : '',
      user.sunday ? '○' : ''
    ]);

    const csv = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `利用者データ_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // CSVインポート（住所から座標を自動取得）
  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

        const importedUsers = lines.slice(1).map((line, index) => {
          const values = line.split(',').map(v => v.replace(/"/g, '').trim());
          
          return {
            id: `import_${Date.now()}_${index}`,
            user_id: `user_import_${Date.now()}_${index}`,
            name: values[0] || '',
            address: values[1] || '',
            wheelchair: values[2] === 'はい' || values[2] === '○',
            pickupTime: values[3] || '08:00',
            notes: values[4] || '',
            monday: values[5] === '○',
            tuesday: values[6] === '○',
            wednesday: values[7] === '○',
            thursday: values[8] === '○',
            friday: values[9] === '○',
            saturday: values[10] === '○',
            sunday: values[11] === '○'
          };
        }).filter(user => user.name && user.address);

        if (importedUsers.length === 0) {
          alert('有効なデータが見つかりませんでした');
          return;
        }

        // 住所から座標を取得
        alert(`${importedUsers.length}件の住所から座標を取得しています...。\nこれには数分かかる場合があります。`);
        const usersWithCoords = [];
        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < importedUsers.length; i++) {
          const user = importedUsers[i];
          console.log(`Geocoding ${i + 1}/${importedUsers.length}: ${user.address}`);
          
          const coords = await geocodeAddress(user.address);
          
          if (coords) {
            usersWithCoords.push({
              ...user,
              lat: coords.lat,
              lng: coords.lng
            });
            successCount++;
          } else {
            // 座標取得失敗でもユーザーを追加（lat/lngなし）
            usersWithCoords.push(user);
            failCount++;
            console.warn(`Failed to geocode: ${user.name} - ${user.address}`);
          }
        }

        saveUsers([...users, ...usersWithCoords]);
        
        let message = `${usersWithCoords.length}件の利用者データをインポートしました。\n`;
        message += `座標取得成功: ${successCount}件\n`;
        if (failCount > 0) {
          message += `座標取得失敗: ${failCount}件（地図に表示されません）`;
        }
        alert(message);
      } catch (error) {
        console.error('Import error:', error);
        alert('インポートに失敗しました。CSVファイルの形式を確認してください。');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
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
            <div className="flex gap-2">
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
              <label className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors cursor-pointer">
                <Upload className="w-5 h-5" />
                インポート
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
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
                  <th className="border p-3 text-left">特記事項</th>
                  <th className="border p-3 text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="border p-8 text-center text-gray-500">
                      {searchTerm ? '検索結果が見つかりません' : '利用者データがありません。新規登録から追加してください。'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="border p-3">{user.name}</td>
                      <td className="border p-3">{user.address}</td>
                      <td className="border p-3 text-center">
                        {user.wheelchair ? '✓' : ''}
                      </td>
                      <td className="border p-3 text-center">{user.pickupTime}</td>
                      <td className="border p-3">
                        <div className="flex gap-1">
                          {user.monday && <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">月</span>}
                          {user.tuesday && <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">火</span>}
                          {user.wednesday && <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">水</span>}
                          {user.thursday && <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">木</span>}
                          {user.friday && <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">金</span>}
                          {user.saturday && <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">土</span>}
                          {user.sunday && <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">日</span>}
                        </div>
                      </td>
                      <td className="border p-3 text-sm text-gray-600">{user.notes}</td>
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
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
              <div className="p-6 border-b">
                <h3 className="text-xl font-bold">
                  {editingUser ? '利用者情報の編集' : '新規利用者登録'}
                </h3>
              </div>
              <div className="p-6 space-y-4">
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
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">送迎時刻</label>
                    <input
                      type="time"
                      value={formData.pickupTime}
                      onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="flex items-center">
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
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">利用曜日</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'monday', label: '月曜日' },
                      { key: 'tuesday', label: '火曜日' },
                      { key: 'wednesday', label: '水曜日' },
                      { key: 'thursday', label: '木曜日' },
                      { key: 'friday', label: '金曜日' },
                      { key: 'saturday', label: '土曜日' },
                      { key: 'sunday', label: '日曜日' }
                    ].map(day => (
                      <label key={day.key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData[day.key]}
                          onChange={(e) => setFormData({ ...formData, [day.key]: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">{day.label}</span>
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
                    rows="3"
                    placeholder="例: 玄関まで介助必要、認知症あり など"
                  />
                </div>
              </div>
              <div className="p-6 border-t flex gap-3 justify-end">
                <button
                  onClick={resetForm}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={editingUser ? handleUpdate : handleAdd}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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

export default UserManagement;

