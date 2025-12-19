import { useState, useEffect } from 'react';
import { Filter, Search, Plus, MapPin, Zap, DollarSign, Loader2 } from 'lucide-react';
import ConfirmModal from '../../components/shared/ConfirmModal';
import AlertModal from '../../components/shared/AlertModal';
import StationFormModal from './components/StationFormModal';
import StationDetailModal from '../User/components/StationDetailModal';
import { adminService } from '../../services/adminService';
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

interface Manager {
  user_id: number;
  full_name: string;
  email: string;
}

const StationManagement = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [stationStats, setStationStats] = useState({ total: 0, active: 0, totalSlots: 0, availableSlots: 0 });
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    loadStations();
    loadStationStats();
    loadManagers();
  }, [filterType, filterStatus, searchQuery]);

  const loadManagers = async () => {
    try {
      // Load users with role 'manager' from admin service
      const response = await adminService.getUsers({ role_id: '2', limit: 100 }); // role_id 2 = manager
      if (response.success && response.data) {
        const usersData = Array.isArray(response.data) ? response.data : (response.data.users || []);
        const managersList = usersData
          .filter((user: any) => user.role === 'manager' || user.role_id === 2)
          .map((user: any) => ({
            user_id: user.user_id,
            full_name: user.full_name,
            email: user.email
          }));
        setManagers(managersList);
        console.log('[StationManagement] Loaded managers:', managersList.length);
      }
    } catch (error: any) {
      console.error('Error loading managers:', error);
      setManagers([]);
    }
  };

  const loadStationStats = async () => {
    try {
      const response = await adminService.getStationStats();
      if (response.success && response.data) {
        setStationStats({
          total: response.data.total || 0,
          active: response.data.active || 0,
          totalSlots: response.data.total_slots || 0,
          availableSlots: response.data.available_slots || 0
        });
      }
    } catch (error: any) {
      console.error('Error loading station stats:', error);
    }
  };

  const loadStations = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: 1,
        limit: 100
      };
      
      if (filterType) params.type = filterType;
      if (filterStatus) params.status = filterStatus;
      if (searchQuery) params.search = searchQuery;

      const response = await adminService.getStations(params);
      console.log('[StationManagement] API Response:', response);
      
      if (response.success && response.data) {
        // Backend trả về { stations: [...], pagination: {...} }
        let stationsData: any[] = [];
        if (Array.isArray(response.data)) {
          stationsData = response.data;
        } else if (response.data.stations && Array.isArray(response.data.stations)) {
          stationsData = response.data.stations;
        } else if (response.data.rows && Array.isArray(response.data.rows)) {
          stationsData = response.data.rows;
        }
        
        console.log('[StationManagement] Loaded stations:', stationsData.length, stationsData);
        
        if (stationsData.length > 0) {
          const formattedStations = stationsData.map((station: any) => ({
            station_id: station.station_id,
            station_name: station.station_name,
            address: station.address,
            latitude: station.latitude,
            longitude: station.longitude,
            station_type: station.station_type,
            price_per_kwh: station.price_per_kwh,
            charging_power: station.charging_power,
            connector_types: station.connector_types,
            opening_hours: station.opening_hours || '24/7',
            contact_phone: station.contact_phone || '',
            available_slots: station.available_slots || 0,
            total_slots: station.total_slots || 0,
            status: station.status || 'active',
            avatar_url: station.avatar_url
          }));
          setStations(formattedStations);
        } else {
          console.warn('[StationManagement] No stations found in response');
          setStations([]);
        }
      } else {
        console.error('[StationManagement] API response not successful:', response);
        setStations([]);
      }
    } catch (error: any) {
      console.error('Error loading stations:', error);
      setAlertModal({
        show: true,
        title: 'Lỗi',
        message: error.message || 'Không thể tải danh sách trạm sạc',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredStations = stations; // Backend already filters

  const handleDeleteStation = (station: Station) => {
    setConfirmModal({
      show: true,
      title: 'Xóa trạm sạc?',
      message: `Bạn có chắc chắn muốn xóa trạm "${station.station_name}"? Hành động này không thể hoàn tác.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await adminService.deleteStation(station.station_id);
          setAlertModal({
            show: true,
            title: 'Thành công!',
            message: `Đã xóa trạm sạc ${station.station_name}`,
            type: 'success'
          });
          loadStations();
          loadStationStats();
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
      if (formModal.station) {
        // Update existing station
        await adminService.updateStation(formModal.station.station_id, data);
        setAlertModal({
          show: true,
          title: 'Thành công!',
          message: `Đã cập nhật trạm sạc ${data.station_name}`,
          type: 'success'
        });
        setFormModal({ show: false, station: null });
      } else {
        // Create new station
        await adminService.createStation(data);
        setAlertModal({
          show: true,
          title: 'Thành công!',
          message: `Đã thêm trạm sạc ${data.station_name}`,
          type: 'success'
        });
        setFormModal({ show: false, station: null });
      }
      loadStations();
      loadStationStats();
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

  // Debug: Log current state
  console.log('[StationManagement] Render - stations:', stations.length, 'loading:', loading, 'filteredStations:', filteredStations.length);

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
          <div className="stat-value">{stationStats.total}</div>
          <div className="stat-label">Tổng trạm sạc</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stationStats.active}</div>
          <div className="stat-label">Đang hoạt động</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stationStats.totalSlots}</div>
          <div className="stat-label">Tổng số chỗ</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stationStats.availableSlots}</div>
          <div className="stat-label">Chỗ trống</div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem', flexDirection: 'column', gap: '1rem' }}>
            <Loader2 size={48} className="animate-spin" style={{ color: '#3b82f6' }} />
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Đang tải dữ liệu...</p>
          </div>
        ) : filteredStations.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem', flexDirection: 'column', gap: '1rem' }}>
            <MapPin size={64} style={{ color: '#cbd5e1' }} />
            <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: 500 }}>Không có trạm sạc nào</p>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Hãy thêm trạm sạc mới để bắt đầu</p>
          </div>
        ) : (
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
        )}
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
