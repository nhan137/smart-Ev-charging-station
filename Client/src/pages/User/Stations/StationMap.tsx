import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { stationService } from '../../../services/stationService';
import { mockFeedbacks } from '../../../services/mockData';
import type { Station } from '../../../types';
import { StationType } from '../../../types';
import { MapPin, Zap, DollarSign, Heart } from 'lucide-react';
import StationDetailModal from './StationDetailModal';
import './StationMap.css';

const StationMap = () => {
  const navigate = useNavigate();
  const [stations, setStations] = useState<Station[]>([]);
  const [filters, setFilters] = useState<{
    station_type?: StationType;
    min_price: number;
    max_price: number;
    distance: number;
  }>({
    min_price: 0,
    max_price: 10000,
    distance: 50
  });
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadStations();
  }, [filters]);

  const loadStations = async () => {
    try {
      setLoading(true);
      const response = await stationService.getAllStations();
      let stationsList = response.data || [];
      
      // Apply filters
      if (filters.station_type) {
        stationsList = stationsList.filter((s: any) => s.station_type === filters.station_type);
      }
      if (filters.max_price) {
        stationsList = stationsList.filter((s: any) => s.price_per_kwh <= filters.max_price);
      }
      
      setStations(stationsList);
    } catch (error) {
      console.error('Error loading stations:', error);
      setStations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFavorite = async (stationId: number) => {
    try {
      await stationService.addFavorite(stationId);
      alert('Đã lưu trạm yêu thích');
    } catch (error: any) {
      alert(error.message || 'Có lỗi xảy ra');
      console.error('Error adding favorite:', error);
    }
  };

  return (
    <div className="station-map-page">
      <div className="map-container">
        {/* Sidebar */}
        <div className="map-sidebar">
          <div className="sidebar-header">
            <h2>Trạm sạc gần bạn</h2>
            <p className="sidebar-subtitle">Tìm thấy {stations.length} trạm sạc</p>
          </div>

          {/* Filters */}
          <div className="filters-section">
            <div className="filter-group">
              <label className="filter-label">Loại trạm</label>
              <select 
                className="filter-select"
                value={filters.station_type || ''}
                onChange={(e) => setFilters({ ...filters, station_type: e.target.value as StationType || undefined })}
              >
                <option value="">Tất cả loại trạm</option>
                <option value={StationType.XE_MAY}>Xe máy</option>
                <option value={StationType.OTO}>Ô tô</option>
                <option value={StationType.CA_HAI}>Cả hai</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Giá tối đa (đ/kWh)</label>
              <input
                type="range"
                className="filter-range"
                min="0"
                max="10000"
                step="500"
                value={filters.max_price}
                onChange={(e) => setFilters({ ...filters, max_price: Number(e.target.value) })}
              />
              <span className="range-value">{filters.max_price.toLocaleString()} đ</span>
            </div>

            <div className="filter-group">
              <label className="filter-label">Khoảng cách</label>
              <select 
                className="filter-select"
                value={filters.distance}
                onChange={(e) => setFilters({ ...filters, distance: Number(e.target.value) })}
              >
                <option value="1">Trong 1km</option>
                <option value="5">Trong 5km</option>
                <option value="10">Trong 10km</option>
                <option value="50">Trong 50km</option>
              </select>
            </div>
          </div>

          {/* Station List */}
          <div className="stations-list">
            {loading ? (
              <div className="loading-state">
                <p>Đang tải danh sách trạm...</p>
              </div>
            ) : stations.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📍</div>
                <p>Không tìm thấy trạm sạc phù hợp</p>
              </div>
            ) : (
              stations.map((station: any) => {
                // Calculate average rating
                const stationFeedbacks = mockFeedbacks.filter(f => f.station_id === station.station_id);
                const avgRating = stationFeedbacks.length > 0
                  ? (stationFeedbacks.reduce((sum, f) => sum + f.rating, 0) / stationFeedbacks.length).toFixed(1)
                  : '0.0';
                
                // Convert station type to Vietnamese
                const getStationTypeLabel = (type: string) => {
                  const typeMap: any = {
                    'xe_may': 'Xe máy',
                    'oto': 'Ô tô',
                    'ca_hai': 'Cả hai'
                  };
                  return typeMap[type] || type;
                };
                
                return (
                  <div 
                    key={station.station_id} 
                    className="station-card"
                  >
                    <img 
                      src={station.avatar_url || 'https://via.placeholder.com/300x120/3b82f6/ffffff?text=EV+Station'} 
                      alt={station.station_name}
                      className="station-image"
                    />
                    <h3 className="station-name">{station.station_name}</h3>
                    <div className="station-address">
                      <MapPin size={14} />
                      <span>{station.address.substring(0, 60)}...</span>
                    </div>
                    
                    <div className="station-meta">
                      <div className="meta-item">
                        <span className="meta-label">Loại:</span>
                        <span className="meta-value">{getStationTypeLabel(station.station_type)}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Đánh giá:</span>
                        <span className="meta-value rating">⭐ {avgRating}</span>
                      </div>
                    </div>
                    
                    <div className="station-info">
                      <div className="info-item">
                        <DollarSign size={16} />
                        <span>{station.price_per_kwh?.toLocaleString()} đ/kWh</span>
                      </div>
                      <div className="info-item">
                        <Zap size={16} />
                        <span>{station.available_slots}/{station.total_slots} chỗ</span>
                      </div>
                    </div>

                    <div className="connector-types">
                      <span className="connector-label">Đầu sạc:</span>
                      <span className="connector-value">{station.connector_types}</span>
                    </div>

                    <div className="station-actions">
                      <button 
                        className="action-btn action-btn-detail"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStation(station);
                          setShowDetailModal(true);
                        }}
                      >
                        Chi tiết
                      </button>
                      <button 
                        className="action-btn action-btn-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/bookings/create?station_id=${station.station_id}`);
                        }}
                      >
                        Đặt lịch
                      </button>
                      <button 
                        className="action-btn action-btn-favorite"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddFavorite(station.station_id);
                        }}
                        title="Yêu thích"
                      >
                        <Heart size={18} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Map Area */}
        <div className="map-area">
          <div className="map-wrapper">
            <iframe
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d122788.3984457253!2d108.14262!3d16.0544!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x314219c792252a13%3A0x1df0cb4b86727e06!2zxJDDoCBO4bq1bmcsIFZp4buHdCBOYW0!5e0!3m2!1svi!2s!4v1234567890123!5m2!1svi!2s"
            />
          </div>
        </div>
      </div>

      {/* Station Detail Modal */}
      <StationDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        station={selectedStation}
        onBooking={() => {
          setShowDetailModal(false);
          alert('Tính năng đặt lịch đang được phát triển!');
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

export default StationMap;
