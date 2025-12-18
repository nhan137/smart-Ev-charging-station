import { X, Building2, MapPin, DollarSign, Zap, Phone, Clock, Users, Activity } from 'lucide-react';
import './StationDetailModal.css';

interface StationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  station: any;
}

const StationDetailModal = ({ isOpen, onClose, station }: StationDetailModalProps) => {
  if (!isOpen || !station) return null;

  const getTypeBadge = (type: string) => {
    const typeConfig: any = {
      'xe_may': { label: 'Xe máy', class: 'type-bike' },
      'oto': { label: 'Ô tô', class: 'type-car' },
      'ca_hai': { label: 'Cả hai', class: 'type-both' }
    };
    const config = typeConfig[type] || { label: type, class: '' };
    return <span className={`type-badge ${config.class}`}>{config.label}</span>;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      'active': { label: 'Hoạt động', class: 'status-active' },
      'maintenance': { label: 'Bảo trì', class: 'status-maintenance' },
      'inactive': { label: 'Ngừng hoạt động', class: 'status-inactive' }
    };
    const config = statusConfig[status] || statusConfig['active'];
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  // Mock statistics
  const stationStats = {
    totalBookings: 250,
    completedBookings: 230,
    totalRevenue: 15000000,
    totalEnergy: 3500
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="station-detail-modal-admin" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="modal-header">
          <div className="station-icon">
            <Building2 size={40} />
          </div>
          <div className="station-header-info">
            <h2>{station.station_name}</h2>
            <div className="station-badges">
              {getTypeBadge(station.station_type)}
              {getStatusBadge(station.status || 'active')}
            </div>
          </div>
        </div>

        <div className="station-detail-content">
          {/* Basic Info */}
          <div className="detail-section">
            <h3>Thông tin cơ bản</h3>
            <div className="info-grid">
              <div className="info-item full-width">
                <MapPin size={20} />
                <div>
                  <span className="info-label">Địa chỉ</span>
                  <span className="info-value">{station.address}</span>
                </div>
              </div>

              <div className="info-item">
                <Phone size={20} />
                <div>
                  <span className="info-label">Số điện thoại</span>
                  <span className="info-value">{station.contact_phone || '0236-3888-999'}</span>
                </div>
              </div>

              <div className="info-item">
                <Clock size={20} />
                <div>
                  <span className="info-label">Giờ mở cửa</span>
                  <span className="info-value">{station.opening_hours || '24/7'}</span>
                </div>
              </div>

              <div className="info-item">
                <DollarSign size={20} />
                <div>
                  <span className="info-label">Giá/kWh</span>
                  <span className="info-value">{station.price_per_kwh?.toLocaleString()}đ</span>
                </div>
              </div>

              <div className="info-item">
                <Zap size={20} />
                <div>
                  <span className="info-label">Công suất</span>
                  <span className="info-value">{station.charging_power || 50} kW</span>
                </div>
              </div>

              <div className="info-item">
                <Users size={20} />
                <div>
                  <span className="info-label">Số chỗ</span>
                  <span className="info-value">
                    {station.available_slots}/{station.total_slots} chỗ trống
                  </span>
                </div>
              </div>

              <div className="info-item full-width">
                <Zap size={20} />
                <div>
                  <span className="info-label">Đầu sạc</span>
                  <span className="info-value">{station.connector_types}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="detail-section">
            <h3>Vị trí</h3>
            <div className="info-grid">
              <div className="info-item">
                <MapPin size={20} />
                <div>
                  <span className="info-label">Vĩ độ</span>
                  <span className="info-value">{station.latitude}</span>
                </div>
              </div>

              <div className="info-item">
                <MapPin size={20} />
                <div>
                  <span className="info-label">Kinh độ</span>
                  <span className="info-value">{station.longitude}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="detail-section">
            <h3>Thống kê hoạt động</h3>
            <div className="stats-grid">
              <div className="stat-box">
                <div className="stat-icon" style={{ background: '#dbeafe', color: '#3b82f6' }}>
                  <Activity size={24} />
                </div>
                <div className="stat-content">
                  <span className="stat-value">{stationStats.totalBookings}</span>
                  <span className="stat-label">Tổng booking</span>
                </div>
              </div>

              <div className="stat-box">
                <div className="stat-icon" style={{ background: '#d1fae5', color: '#10b981' }}>
                  <Activity size={24} />
                </div>
                <div className="stat-content">
                  <span className="stat-value">{stationStats.completedBookings}</span>
                  <span className="stat-label">Hoàn thành</span>
                </div>
              </div>

              <div className="stat-box">
                <div className="stat-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>
                  <span style={{ fontSize: '1.5rem' }}>💰</span>
                </div>
                <div className="stat-content">
                  <span className="stat-value">{(stationStats.totalRevenue / 1000000).toFixed(1)}M</span>
                  <span className="stat-label">Doanh thu</span>
                </div>
              </div>

              <div className="stat-box">
                <div className="stat-icon" style={{ background: '#e9d5ff', color: '#a855f7' }}>
                  <span style={{ fontSize: '1.5rem' }}>⚡</span>
                </div>
                <div className="stat-content">
                  <span className="stat-value">{stationStats.totalEnergy}</span>
                  <span className="stat-label">kWh cung cấp</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-close" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default StationDetailModal;
