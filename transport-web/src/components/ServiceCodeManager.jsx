import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Code, FileText, X } from 'lucide-react';
import { ServiceCodeMaster } from '../models/dataModels.js';

/**
 * サービスコード・加算コード管理コンポーネント
 * 介護報酬請求に必要なサービスコードを管理
 */
const ServiceCodeManager = ({ onClose }) => {
  const [serviceCodes, setServiceCodes] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'basic',
    description: ''
  });
  const [filterType, setFilterType] = useState('all');

  // デフォルトのサービスコード
  const defaultServiceCodes = [
    {
      code: '321111',
      name: '通常規模型デイサービス（7時間以上8時間未満）',
      type: 'basic',
      description: '基本サービスコード'
    },
    {
      code: '321211',
      name: '通常規模型デイサービス（8時間以上9時間未満）',
      type: 'basic',
      description: '基本サービスコード'
    },
    {
      code: '322101',
      name: '入浴介助加算',
      type: 'additional',
      description: '入浴介助を行った場合の加算'
    },
    {
      code: '322201',
      name: '個別機能訓練加算（Ⅰ）',
      type: 'additional',
      description: '個別機能訓練を実施した場合の加算'
    },
    {
      code: '322301',
      name: '送迎減算',
      type: 'additional',
      description: '送迎を行わなかった場合の減算'
    },
    {
      code: '322401',
      name: '栄養改善加算',
      type: 'additional',
      description: '栄養改善サービスを提供した場合の加算'
    },
    {
      code: '322501',
      name: '口腔機能向上加算',
      type: 'additional',
      description: '口腔機能向上サービスを提供した場合の加算'
    }
  ];

  // ローカルストレージからサービスコードを読み込み
  useEffect(() => {
    const savedCodes = localStorage.getItem('dayservice_service_codes');
    if (savedCodes) {
      setServiceCodes(JSON.parse(savedCodes));
    } else {
      // デフォルトのサービスコードを設定
      const codes = defaultServiceCodes.map(code => new ServiceCodeMaster(code).toJSON());
      setServiceCodes(codes);
      localStorage.setItem('dayservice_service_codes', JSON.stringify(codes));
    }
  }, []);

  // サービスコードをローカルストレージに保存
  const saveCodes = (updatedCodes) => {
    setServiceCodes(updatedCodes);
    localStorage.setItem('dayservice_service_codes', JSON.stringify(updatedCodes));
  };

  // フォームのリセット
  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      type: 'basic',
      description: ''
    });
    setEditingCode(null);
    setIsFormOpen(false);
  };

  // 新規登録
  const handleAdd = () => {
    if (!formData.code || !formData.name) {
      alert('サービスコードと名称は必須です');
      return;
    }

    // 重複チェック
    if (serviceCodes.some(code => code.code === formData.code)) {
      alert('このサービスコードは既に登録されています');
      return;
    }

    const newCode = new ServiceCodeMaster(formData);
    saveCodes([...serviceCodes, newCode.toJSON()]);
    resetForm();
  };

  // 編集
  const handleEdit = (code) => {
    setEditingCode(code);
    setFormData(code);
    setIsFormOpen(true);
  };

  // 更新
  const handleUpdate = () => {
    if (!formData.code || !formData.name) {
      alert('サービスコードと名称は必須です');
      return;
    }

    const updatedCodes = serviceCodes.map(code =>
      code.code === editingCode.code ? { ...formData } : code
    );

    saveCodes(updatedCodes);
    resetForm();
  };

  // 削除
  const handleDelete = (codeValue) => {
    if (window.confirm('このサービスコードを削除してもよろしいですか？')) {
      const updatedCodes = serviceCodes.filter(code => code.code !== codeValue);
      saveCodes(updatedCodes);
    }
  };

  // フィルタリングされたサービスコード
  const filteredCodes = serviceCodes.filter(code => {
    if (filterType === 'all') return true;
    return code.type === filterType;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* ヘッダー */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Code className="w-6 h-6" />
              サービスコード管理
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            介護報酬請求に使用するサービスコードと加算コードを管理します
          </p>
        </div>

        {/* アクションボタン */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  filterType === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                すべて
              </button>
              <button
                onClick={() => setFilterType('basic')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  filterType === 'basic'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                基本サービス
              </button>
              <button
                onClick={() => setFilterType('additional')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  filterType === 'additional'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                加算・減算
              </button>
            </div>
            <button
              onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              新規登録
            </button>
          </div>
        </div>

        {/* サービスコード一覧 */}
        <div className="flex-1 overflow-auto p-6">
          <div className="text-sm text-gray-600 mb-4">
            登録件数: {filteredCodes.length}件
          </div>

          {filteredCodes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>サービスコードがありません</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      コード
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      名称
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      種別
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      説明
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCodes.map((code) => (
                    <tr key={code.code} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {code.code}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {code.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          code.type === 'basic'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {code.type === 'basic' ? '基本サービス' : '加算・減算'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {code.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(code)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(code.code)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 登録・編集フォーム */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  {editingCode ? 'サービスコードの編集' : '新規サービスコード登録'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    サービスコード <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    disabled={!!editingCode}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    placeholder="例: 321111"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例: 通常規模型デイサービス"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    種別
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="basic">基本サービス</option>
                    <option value="additional">加算・減算</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    説明
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="サービスコードの説明を入力してください"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={resetForm}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={editingCode ? handleUpdate : handleAdd}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingCode ? '更新' : '登録'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceCodeManager;

