import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Car, Plus, Trash2, Edit2, Save, X } from 'lucide-react';

const VehicleManager = ({ onClose, onVehiclesUpdate }) => {
  const [vehicles, setVehicles] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    driver: '',
    capacity: 8,
    wheelchairCapacity: 2,
  });
  const [isAdding, setIsAdding] = useState(false);

  // ローカルストレージから車両データを読み込み
  useEffect(() => {
    const saved = localStorage.getItem('vehicles');
    if (saved) {
      setVehicles(JSON.parse(saved));
    } else {
      // 初期データ
      const initialVehicles = [
        {
          id: 1,
          name: "送迎車1号",
          driver: "佐藤 花子",
          capacity: 8,
          wheelchairCapacity: 2,
          isActive: true,
          isLocked: false,
        },
        {
          id: 2,
          name: "送迎車2号",
          driver: "中村 次郎",
          capacity: 6,
          wheelchairCapacity: 1,
          isActive: true,
          isLocked: false,
        },
        {
          id: 3,
          name: "送迎車3号",
          driver: "田中 三郎",
          capacity: 8,
          wheelchairCapacity: 2,
          isActive: true,
          isLocked: false,
        },
        {
          id: 4,
          name: "送迎車4号",
          driver: "山田 美咲",
          capacity: 7,
          wheelchairCapacity: 1,
          isActive: true,
          isLocked: false,
        },
        {
          id: 5,
          name: "送迎車5号",
          driver: "鈴木 健太",
          capacity: 6,
          wheelchairCapacity: 1,
          isActive: true,
          isLocked: false,
        },
      ];
      setVehicles(initialVehicles);
      localStorage.setItem('vehicles', JSON.stringify(initialVehicles));
    }
  }, []);

  // 車両データを保存
  const saveVehicles = (newVehicles) => {
    setVehicles(newVehicles);
    localStorage.setItem('vehicles', JSON.stringify(newVehicles));
    if (onVehiclesUpdate) {
      onVehiclesUpdate(newVehicles);
    }
  };

  // 新規追加開始
  const handleAddStart = () => {
    setIsAdding(true);
    setEditForm({
      name: `送迎車${vehicles.length + 1}号`,
      driver: '',
      capacity: 8,
      wheelchairCapacity: 2,
    });
  };

  // 新規追加保存
  const handleAddSave = () => {
    if (!editForm.name || !editForm.driver) {
      alert('車両名と運転手名を入力してください。');
      return;
    }

    const newVehicle = {
      id: vehicles.length > 0 ? Math.max(...vehicles.map(v => v.id)) + 1 : 1,
      name: editForm.name,
      driver: editForm.driver,
      capacity: parseInt(editForm.capacity) || 8,
      wheelchairCapacity: parseInt(editForm.wheelchairCapacity) || 2,
      isActive: true,
      isLocked: false,
    };

    saveVehicles([...vehicles, newVehicle]);
    setIsAdding(false);
    setEditForm({ name: '', driver: '', capacity: 8, wheelchairCapacity: 2 });
  };

  // 編集開始
  const handleEditStart = (vehicle) => {
    setEditingId(vehicle.id);
    setEditForm({
      name: vehicle.name,
      driver: vehicle.driver,
      capacity: vehicle.capacity,
      wheelchairCapacity: vehicle.wheelchairCapacity,
    });
  };

  // 編集保存
  const handleEditSave = (id) => {
    if (!editForm.name || !editForm.driver) {
      alert('車両名と運転手名を入力してください。');
      return;
    }

    const updatedVehicles = vehicles.map(v =>
      v.id === id
        ? {
            ...v,
            name: editForm.name,
            driver: editForm.driver,
            capacity: parseInt(editForm.capacity) || 8,
            wheelchairCapacity: parseInt(editForm.wheelchairCapacity) || 2,
          }
        : v
    );

    saveVehicles(updatedVehicles);
    setEditingId(null);
    setEditForm({ name: '', driver: '', capacity: 8, wheelchairCapacity: 2 });
  };

  // 削除
  const handleDelete = (id) => {
    if (!confirm('この車両を削除してもよろしいですか？')) {
      return;
    }

    const updatedVehicles = vehicles.filter(v => v.id !== id);
    saveVehicles(updatedVehicles);
  };

  // キャンセル
  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
    setEditForm({ name: '', driver: '', capacity: 8, wheelchairCapacity: 2 });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Car className="w-6 h-6" />
                車両管理
              </CardTitle>
              <CardDescription>
                送迎車両の情報を管理します
              </CardDescription>
            </div>
            <Button variant="ghost" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 新規追加ボタン */}
            {!isAdding && (
              <Button onClick={handleAddStart} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                新しい車両を追加
              </Button>
            )}

            {/* 新規追加フォーム */}
            {isAdding && (
              <Card className="border-2 border-blue-500">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="new-name">車両名</Label>
                      <Input
                        id="new-name"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        placeholder="送迎車1号"
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-driver">運転手</Label>
                      <Input
                        id="new-driver"
                        value={editForm.driver}
                        onChange={(e) => setEditForm({ ...editForm, driver: e.target.value })}
                        placeholder="佐藤 花子"
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-capacity">定員</Label>
                      <Input
                        id="new-capacity"
                        type="number"
                        min="1"
                        max="20"
                        value={editForm.capacity}
                        onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-wheelchair">車椅子対応数</Label>
                      <Input
                        id="new-wheelchair"
                        type="number"
                        min="0"
                        max="10"
                        value={editForm.wheelchairCapacity}
                        onChange={(e) => setEditForm({ ...editForm, wheelchairCapacity: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={handleAddSave} className="flex-1">
                      <Save className="w-4 h-4 mr-2" />
                      保存
                    </Button>
                    <Button onClick={handleCancel} variant="outline" className="flex-1">
                      <X className="w-4 h-4 mr-2" />
                      キャンセル
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 車両リスト */}
            <div className="space-y-3">
              {vehicles.map((vehicle) => (
                <Card key={vehicle.id} className={editingId === vehicle.id ? 'border-2 border-blue-500' : ''}>
                  <CardContent className="pt-6">
                    {editingId === vehicle.id ? (
                      // 編集モード
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`edit-name-${vehicle.id}`}>車両名</Label>
                            <Input
                              id={`edit-name-${vehicle.id}`}
                              value={editForm.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`edit-driver-${vehicle.id}`}>運転手</Label>
                            <Input
                              id={`edit-driver-${vehicle.id}`}
                              value={editForm.driver}
                              onChange={(e) => setEditForm({ ...editForm, driver: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`edit-capacity-${vehicle.id}`}>定員</Label>
                            <Input
                              id={`edit-capacity-${vehicle.id}`}
                              type="number"
                              min="1"
                              max="20"
                              value={editForm.capacity}
                              onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`edit-wheelchair-${vehicle.id}`}>車椅子対応数</Label>
                            <Input
                              id={`edit-wheelchair-${vehicle.id}`}
                              type="number"
                              min="0"
                              max="10"
                              value={editForm.wheelchairCapacity}
                              onChange={(e) => setEditForm({ ...editForm, wheelchairCapacity: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button onClick={() => handleEditSave(vehicle.id)} className="flex-1">
                            <Save className="w-4 h-4 mr-2" />
                            保存
                          </Button>
                          <Button onClick={handleCancel} variant="outline" className="flex-1">
                            <X className="w-4 h-4 mr-2" />
                            キャンセル
                          </Button>
                        </div>
                      </>
                    ) : (
                      // 表示モード
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Car className="w-5 h-5 text-blue-600" />
                              <h3 className="text-lg font-semibold">{vehicle.name}</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                              <div>運転手: {vehicle.driver}</div>
                              <div>定員: {vehicle.capacity}名</div>
                              <div>車椅子対応: {vehicle.wheelchairCapacity}台</div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleEditStart(vehicle)}
                              variant="outline"
                              size="sm"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => handleDelete(vehicle.id)}
                              variant="destructive"
                              size="sm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {vehicles.length === 0 && !isAdding && (
              <div className="text-center py-8 text-gray-500">
                車両が登録されていません。新しい車両を追加してください。
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VehicleManager;

