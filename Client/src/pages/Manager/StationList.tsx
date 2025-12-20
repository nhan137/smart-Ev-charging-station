import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, MapPin, Filter, Loader2 } from 'lucide-react';
import { managerService } from '../../services/managerService';
import './StationList.css';

const StationList = () => {
  const navigate = useNavigate();
  const [stations, setStations] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStations();
  }, [filterStatus]);

  const loadStations = async () => {
    try {
      setLoading(true);
      const response = await managerService.getManagerStations({
        status: filterStatus || undefined
      });
      
      if (response.success && response.data) {
        setStations(response.data);
      } else {
        setStations([]);
      }
    } catch (error: any) {
      console.error('Error loading stations:', error);
      setStations([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter is handled by API, so no need to filter again
  const filteredStations = stations;

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      active: { label: 'Hoạt động', class: 'status-active' },
      maintenance: { label: 'Bảo trì', class: 'status-maintenance' },
      inactive: { label: 'Ngừng hoạt động', class: 'status-inactive' }
    };
    const config = statusConfig[status] || { label: status, class: '' };
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  return (
    <div className="station-list-manager">
      <div className="page-header-manager">
        <div>
          <h1>Danh sách trạm phụ trách trạm</h1>
          <p>Quản lý {stations.length} trạm sạc</p>
        </div>
      </div>

      {/* Filter */}
      <div className="filter-section">
        <div className="filter-group">
          <Filter size={20} />
          <span>Lọc theo trạng thái:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="maintenance">Bảo trì</option>
            <option value="inactive">Ngừng hoạt động</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã trạm</th>
              <th>Tên trạm</th>
              <th>Địa chỉ</th>
              <th>Giá sạc</th>
              <th>Số chỗ</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="empty-row">
                  <Loader2 className="spinner" size={32} />
                  <p>Đang tải...</p>
                </td>
              </tr>
            ) : filteredStations.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-row">
                  <Building2 size={48} />
                  <p>Không có trạm nào</p>
                </td>
              </tr>
            ) : (
              filteredStations.map((station) => (
                <tr key={station.station_id}>
                  <td>{station.station_code || `#${station.station_id}`}</td>
                  <td>
                    <Building2 size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                    {station.station_name}
                  </td>
                  <td>
                    <MapPin size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                    {station.address?.substring(0, 40)}...
                  </td>
                  <td>{station.price_display || `${station.price_per_kwh?.toLocaleString()} đ/kWh`}</td>
                  <td>{station.slots_display || `${station.available_slots}/${station.total_slots}`}</td>
                  <td>{getStatusBadge(station.status || 'active')}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="action-btn-text"
                        onClick={() => navigate(`/manager/stations/${station.station_id}/bookings`)}
                      >
                        Xem đặt lịch
                      </button>
                      <button
                        className="action-btn-text"
                        onClick={() => navigate(`/manager/stations/${station.station_id}`)}
                      >
                        Xem chi tiết
                      </button>
                      <button
                        className="action-btn-text"
                        onClick={() => navigate(`/manager/stations/${station.station_id}/status`)}
                      >
                        Cập nhật trạng thái
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
  );
};

export default StationList;
