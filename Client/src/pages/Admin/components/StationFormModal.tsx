import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import './StationFormModal.css';

interface StationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  station?: any;
  onSubmit: (stationData: any) => void;
}

const StationFormModal = ({ isOpen, onClose, station, onSubmit }: StationFormModalProps) => {
  const [formData, setFormData] = useState({
    station_name: '',
    address: '',
    latitude: '',
    longitude: '',
    total_slots: '',
    price_per_kwh: '',
    station_type: 'ca_hai',
    connector_types: '',
    status: 'active'
  });

  useEffect(() => {
    if (station) {
      setFormData({
        station_name: station.station_name || '',
        address: station.address || '',
        latitude: station.latitude?.toString() || '',
        longitude: station.longitude?.toString() || '',
        total_slots: station.total_slots?.toString() || '',
        price_per_kwh: station.price_per_kwh?.toString() || '',
        station_type: station.station_type || 'ca_hai',
        connector_types: station.connector_types || '',
        status: station.status || 'active'
      });
    }
  }, [station]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      total_slots: parseInt(formData.total_slots),
      price_per_kwh: parseFloat(formData.price_per_kwh)
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        <h2>{station ? 'Chỉnh sửa trạm sạc' : 'Thêm trạm sạc mới'}</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Tên trạm *</label>
              <input
                type="text"
                value={formData.station_name}
                onChange={(e) => setFormData({ ...formData, station_name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Loại trạm *</label>
              <select
                value={formData.station_type}
                onChange={(e) => setFormData({ ...formData, station_type: e.target.value })}
              >
                <option value="xe_may">Xe máy</option>
                <option value="oto">Ô tô</option>
                <option value="ca_hai">Cả hai</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Địa chỉ *</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={2}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Vĩ độ *</label>
              <input
                type="number"
                step="0.000001"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Kinh độ *</label>
              <input
                type="number"
                step="0.000001"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Số chỗ *</label>
              <input
                type="number"
                value={formData.total_slots}
                onChange={(e) => setFormData({ ...formData, total_slots: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Giá (đ/kWh) *</label>
              <input
                type="number"
                value={formData.price_per_kwh}
                onChange={(e) => setFormData({ ...formData, price_per_kwh: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Loại đầu sạc *</label>
            <input
              type="text"
              value={formData.connector_types}
              onChange={(e) => setFormData({ ...formData, connector_types: e.target.value })}
              placeholder="VD: Type 2, CCS2, CHAdeMO"
              required
            />
          </div>

          <div className="form-group">
            <label>Trạng thái</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="active">Hoạt động</option>
              <option value="maintenance">Bảo trì</option>
              <option value="inactive">Ngừng hoạt động</option>
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Hủy
            </button>
            <button type="submit" className="btn-submit">
              {station ? 'Cập nhật' : 'Thêm trạm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StationFormModal;
