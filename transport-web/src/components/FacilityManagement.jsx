import React, { useState, useEffect } from 'react';
import { geocodeAddress } from '../utils/geocoding';

const FacilityManagement = () => {
  const [facility, setFacility] = useState({
    name: '',
    address: '',
    lat: null,
    lng: null
  });
  const [isGeocoding, setIsGeocoding] = useState(false);

  useEffect(() => {
    // LocalStorageから事業所情報を読み込む
    const savedFacility = localStorage.getItem('facility');
    if (savedFacility) {
      setFacility(JSON.parse(savedFacility));
    }
  }, []);

  const saveFacility = (facilityData) => {
    localStorage.setItem('facility', JSON.stringify(facilityData));
    setFacility(facilityData);
  };

  const handleSave = async () => {
    if (!facility.name || !facility.address) {
      alert('事業所名と住所を入力してください。');
      return;
    }

    // 座標が設定されていない場合はGeocoding実行
    if (!facility.lat || !facility.lng) {
      setIsGeocoding(true);
      const coords = await geocodeAddress(facility.address);
      setIsGeocoding(false);

      if (coords) {
        const updatedFacility = {
          ...facility,
          lat: coords.lat,
          lng: coords.lng
        };
        saveFacility(updatedFacility);
        alert('事業所情報を保存しました。');
      } else {
        alert('住所から座標を取得できませんでした。住所を確認してください。');
      }
    } else {
      saveFacility(facility);
      alert('事業所情報を保存しました。');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>事業所管理</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          事業所名
        </label>
        <input
          type="text"
          value={facility.name}
          onChange={(e) => setFacility({ ...facility, name: e.target.value })}
          style={{
            width: '100%',
            padding: '8px',
            fontSize: '14px',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
          placeholder="例: デイサービスセンター○○"
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          住所
        </label>
        <input
          type="text"
          value={facility.address}
          onChange={(e) => setFacility({ ...facility, address: e.target.value })}
          style={{
            width: '100%',
            padding: '8px',
            fontSize: '14px',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
          placeholder="例: 東京都荒川区西日暮里2-25-1"
        />
      </div>

      {facility.lat && facility.lng && (
        <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
          <p style={{ margin: '0', fontSize: '14px' }}>
            <strong>座標:</strong> 緯度 {facility.lat.toFixed(6)}, 経度 {facility.lng.toFixed(6)}
          </p>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={isGeocoding}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: isGeocoding ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isGeocoding ? 'not-allowed' : 'pointer'
        }}
      >
        {isGeocoding ? '座標取得中...' : '保存'}
      </button>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '4px', border: '1px solid #ffc107' }}>
        <p style={{ margin: '0', fontSize: '14px' }}>
          <strong>注意:</strong> 事業所の住所を入力して保存すると、自動的に座標が取得されます。
          この座標は送迎ルートの起点・終点として使用されます。
        </p>
      </div>
    </div>
  );
};

export default FacilityManagement;

