import { useState, useEffect } from 'react';
import { Filter, Search, Plus, MapPin, Zap, DollarSign } from 'lucide-react';
import { mockStations, mockUsers } from '../../services/mockData';
import ConfirmModal from '../../components/shared/ConfirmModal';
import AlertModal from '../../components/shared/AlertModal';
import StationFormModal from './components/StationFormModal';
import StationDetailModal from '../User/components/StationDetailModal';
import './StationManagement.css';

interface Station {
  station_id: number;
  station_name: string;
  address: string;
  latitude: number;
  longitude: number;
  station_type: string;
  price_per_kwh: number;
  charging_power: number;
  connector_types: string;
  opening_hours?: string;
  contact_phone?: string;
  available_slots: number;
  total_slots: number;
  status?: string;
  avatar_url?: string;
}

const StationManagement = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    message: '',
    type: 'warning' as 'warning' | 'danger' | 'info',
    onConfirm: () => {}
  });
  const [alertModal, setAlertModal] = useState({
    show: false,
    title: '',
    message: '',
    type: 'success' as 'success' | 'error' | 'info'
  });
  const [formModal, setFormModal] = useState({
    show: false,
    station: null as Station | null
  });
  const [detailModal, setDetailModal] = useState({
    show: false,
    station: null as Station | null
  });

  // Get managers from mockUsers
  const managers = mockUsers.filter(u => u.role === 'manager').map(u => ({
    user_id: u.user_id,
    full_name: u.full_name
  }));

  useEffect(() => {
    loadStations();
  }, []);

  const loadStations = () => {
    // Add status to mock stations
    const stationsWithStatus = mockStations.map(s => ({
      ...s,
      status: s.status || 'active',
      opening_hours: s.opening_hours || '24/7',
      contact_phone: s.contact_phone || '0236-3888-999'
    }));
    setStations(stationsWithStatus);
  };

  const filteredStations = stations.filter(station => {
    if (filterType && station.station_type !== filterType) return false;
    if (filterStatus && station.status !== filterStatus) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        station.station_name.toLowerCase().includes(query) ||
        station.address.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const handleDeleteStation = (station: Station) => {
    setConfirmModal({
      show: true,
      title: 'Xóa trạm sạc?',
      message: `Bạn có chắc chắn muốn xóa trạm "${station.station_name}"? Hành động này không thể hoàn tác.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          // TODO: Call API
          // await stationService.deleteStation(station.station_id);
          
          setAlertModal({
            show: true,
            title: 'Thành công!',
            message: `Đã xóa trạm sạc ${station.station_name}`,
            type: 'success'
          });
          loadStations();
        } catch (error: any) {
          setAlertModal({
            show: true,
            title: 'Lỗi',
            message: error.message || 'Có lỗi xảy ra',
            type: 'error'
          });
        }
      }
    });
  };

  const handleSubmitStation = async (data: any) => {
    try {
      // TODO: Call API
      if (formModal.station) {
        // Update existing station
        // await stationService.updateStation(formModal.station.station_id, data);
        setAlertModal({
          show: true,
          title: 'Thành công!',
          message: `Đã cập nhật trạm sạc ${data.station_name}`,
          type: 'success'
        });
      } else {
        // Create new station
        // await stationService.createStation(data);
        setAlertModal({
          show: true,
          title: 'Thành công!',
          message: `Đã thêm trạm sạc ${data.station_name}`,
          type: 'success'
        });
      }
      loadStations();
    } catch (error: any) {
      setAlertModal({
        show: true,
        title: 'Lỗi',
        message: error.message || 'Có lỗi xảy ra',
        type: 'error'
      });
    }
  };

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

  return (
    <div className="station-management">
      <div className="page-header-admin">
        <div>
          <h1>Quản lý Trạm sạc</h1>
          <p>Quản lý tất cả trạm sạc trong hệ thống</p>
        </div>
        <button
          className="btn-add-station"
          onClick={() => setFormModal({ show: true, station: null })}
        >
          <Plus size={20} />
          <span>Thêm trạm mới</span>
        </button>
      </div>

      {/* Filters */}
      <div className="filter-section">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, địa chỉ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <Filter size={20} />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">Tất cả loại trạm</option>
            <option value="xe_may">Xe máy</option>
            <option value="oto">Ô tô</option>
            <option value="ca_hai">Cả hai</option>
          </select>
        </div>

        <div className="filter-group">
          <Filter size={20} />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="maintenance">Bảo trì</option>
            <option value="inactive">Ngừng hoạt động</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stations.length}</div>
          <div className="stat-label">Tổng trạm sạc</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stations.filter(s => s.status === 'active').length}</div>
          <div className="stat-label">Đang hoạt động</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stations.reduce((sum, s) => sum + s.total_slots, 0)}</div>
          <div className="stat-label">Tổng số chỗ</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stations.reduce((sum, s) => sum + s.available_slots, 0)}</div>
          <div className="stat-label">Chỗ trống</div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên trạm</th>
              <th>Địa chỉ</th>
              <th>Loại trạm</th>
              <th>Giá/kWh</th>
              <th>Công suất</th>
              <th>Số chỗ</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredStations.map((station) => (
              <tr key={station.station_id}>
                <td className="id-cell">#{station.station_id}</td>
                <td className="name-cell">
                  <div className="station-name-cell">
                    <MapPin size={16} />
                    <span>{station.station_name}</span>
                  </div>
                </td>
                <td className="address-cell">{station.address}</td>
                <td>{getTypeBadge(station.station_type)}</td>
                <td>
                  <div className="price-cell">
                    <DollarSign size={14} />
                    <span>{station.price_per_kwh.toLocaleString()}đ</span>
                  </div>
                </td>
                <td>
                  <div className="power-cell">
                    <Zap size={14} />
                    <span>{station.charging_power}kW</span>
                  </div>
                </td>
                <td>
                  <div className="slots-cell">
                    <span className="available">{station.available_slots}</span>
                    <span className="separator">/</span>
                    <span className="total">{station.total_slots}</span>
                  </div>
                </td>
                <td>{getStatusBadge(station.status || 'active')}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="action-btn-text"
                      onClick={() => setFormModal({ show: true, station })}
                    >
                      Chỉnh sửa
                    </button>
                    <button
                      className="action-btn-text"
                      onClick={() => setDetailModal({ show: true, station })}
                    >
                      Xem chi tiết
                    </button>
                    <button
                      className="action-btn-text"
                      onClick={() => handleDeleteStation(station)}
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.show}
        onClose={() => setConfirmModal({ ...confirmModal, show: false })}
        onConfirm={() => {
          confirmModal.onConfirm();
          setConfirmModal({ ...confirmModal, show: false });
        }}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.show}
        onClose={() => setAlertModal({ ...alertModal, show: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />

      {/* Station Form Modal */}
      <StationFormModal
        isOpen={formModal.show}
        onClose={() => setFormModal({ show: false, station: null })}
        onSubmit={handleSubmitStation}
        station={formModal.station}
        managers={managers}
      />

      {/* Station Detail Modal */}
      <StationDetailModal
        isOpen={detailModal.show}
        onClose={() => setDetailModal({ show: false, station: null })}
        station={detailModal.station}
      />
    </div>
  );
};

export default StationManagement;
