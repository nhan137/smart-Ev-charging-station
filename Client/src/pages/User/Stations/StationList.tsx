import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { stationService } from '../../../services/stationService';
import { mockFeedbacks } from '../../../services/mockData';
import { MapPin, Zap, DollarSign, Heart, Search, Filter } from 'lucide-react';
import { StationType } from '../../../types';
import StationDetailModal from './StationDetailModal';
import './StationList.css';

const StationList = () => {
  const navigate = useNavigate();
  const [stations, setStations] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadStations();
  }, []);

  const loadStations = async () => {
    try {
      setLoading(true);
      const response = await stationService.getAllStations();
      setStations(response.data || []);
    } catch (error) {
      console.error('Error loading stations:', error);
      setStations([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredStations = stations.filter(station => {
    const matchSearch = station.station_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       station.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = !filterType || station.station_type === filterType;
    return matchSearch && matchType;
  });

  const getStationTypeLabel = (type: string) => {
    const typeMap: any = {
      'xe_may': 'Xe máy',
      'oto': 'Ô tô',
      'ca_hai': 'Cả hai'
    };
    return typeMap[type] || type;
  };

  const handleAddFavorite = async (stationId: number) => {
    try {
      await stationService.addFavorite(stationId);
      alert('Đã lưu trạm yêu thích');
    } catch (error: any) {
      alert(error.message || 'Có lỗi xảy ra');
    }
  };

  return (
    <div className="station-list-page">
      <div className="list-page-container">
        {/* Header */}
        <div className="list-page-header">
          <h1>Tất cả trạm sạc</h1>
          <p>Tìm thấy {filteredStations.length} trạm sạc</p>
        </div>

        {/* Search & Filter */}
        <div className="search-filter-bar">
          <div className="search-box-list">
            <Search size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm trạm sạc..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-box-list">
            <Filter size={20} />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">Tất cả loại trạm</option>
              <option value={StationType.XE_MAY}>Xe máy</option>
              <option value={StationType.OTO}>Ô tô</option>
              <option value={StationType.CA_HAI}>Cả hai</option>
            </select>
          </div>
        </div>

        {/* Stations Grid */}
        {loading ? (
          <div className="loading-state-list">Đang tải danh sách trạm...</div>
        ) : filteredStations.length === 0 ? (
          <div className="empty-state-list">
            <MapPin size={64} />
            <h3>Không tìm thấy trạm sạc</h3>
            <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        ) : (
          <div className="stations-grid">
            {filteredStations.map((station) => {
              const stationFeedbacks = mockFeedbacks.filter(f => f.station_id === station.station_id);
              const avgRating = stationFeedbacks.length > 0
                ? (stationFeedbacks.reduce((sum, f) => sum + f.rating, 0) / stationFeedbacks.length).toFixed(1)
                : '0.0';

              return (
                <div key={station.station_id} className="station-grid-card">
                  <div className="station-card-image">
                    <img
                      src={station.avatar_url || 'https://via.placeholder.com/400x200/3b82f6/ffffff?text=EV+Station'}
                      alt={station.station_name}
                    />
                    <button
                      className="favorite-btn-card"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddFavorite(station.station_id);
                      }}
                    >
                      <Heart size={20} />
                    </button>
                  </div>

                  <div className="station-card-content">
                    <h3>{station.station_name}</h3>
                    
                    <div className="station-card-address">
                      <MapPin size={16} />
                      <span>{station.address.substring(0, 60)}...</span>
                    </div>

                    <div className="station-card-meta">
                      <div className="meta-badge">
                        <span className="meta-label">Loại:</span>
                        <span className="meta-value">{getStationTypeLabel(station.station_type)}</span>
                      </div>
                      <div className="meta-badge rating">
                        <span>⭐ {avgRating}</span>
                      </div>
                    </div>

                    <div className="station-card-info">
                      <div className="info-badge">
                        <DollarSign size={16} />
                        <span>{station.price_per_kwh?.toLocaleString()} đ/kWh</span>
                      </div>
                      <div className="info-badge">
                        <Zap size={16} />
                        <span>{station.available_slots}/{station.total_slots} chỗ</span>
                      </div>
                    </div>

                    <div className="connector-info">
                      <span className="connector-label">Đầu sạc:</span>
                      <span className="connector-value">{station.connector_types}</span>
                    </div>

                    <div className="station-card-actions">
                      <button
                        className="card-btn card-btn-secondary"
                        onClick={() => {
                          setSelectedStation(station);
                          setShowDetailModal(true);
                        }}
                      >
                        Chi tiết
                      </button>
                      <button
                        className="card-btn card-btn-primary"
                        onClick={() => navigate(`/bookings/create?station_id=${station.station_id}`)}
                      >
                        Đặt lịch
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <StationDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        station={selectedStation}
        onBooking={() => {
          setShowDetailModal(false);
          if (selectedStation) {
            navigate(`/bookings/create?station_id=${selectedStation.station_id}`);
          }
        }}
        onFavorite={() => {
          if (selectedStation) {
            handleAddFavorite(selectedStation.station_id);
          }
        }}
      />
    </div>
  );
};

export default StationList;
