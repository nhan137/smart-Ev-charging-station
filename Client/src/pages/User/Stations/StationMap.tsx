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
    distance: 1
  });
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [mapCenter, setMapCenter] = useState<string>('Đà Nẵng, Việt Nam');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          console.log('📍 User location detected:', location);
          setUserLocation(location);
        },
        (error) => {
          console.error('❌ Error getting location:', error);
          alert('Không thể lấy vị trí của bạn. Vui lòng bật GPS và cho phép trình duyệt truy cập vị trí.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      alert('Trình duyệt của bạn không hỗ trợ GPS');
    }
  }, []);

  useEffect(() => {
    loadStations();
  }, [filters, userLocation]);

  const loadStations = async () => {
    try {
      setLoading(true);
      
      // Debug: Log user location and filters
      console.log('🔍 Loading stations with:', {
        userLocation,
        filters,
        hasLocation: !!userLocation
      });
      
      // Call API with filters and user location
      const response = await stationService.getAllStations({
        station_type: filters.station_type,
        min_price: filters.min_price,
        max_price: filters.max_price,
        radius: filters.distance,
        lat: userLocation?.lat,
        lng: userLocation?.lng
      });
      
      console.log('✅ Stations loaded:', response.data?.length || 0);
      setStations(response.data || []);
    } catch (error) {
      console.error('❌ Error loading stations:', error);
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
                    onClick={() => {
                      // Use exact GPS coordinates for map marker
                      if (station.latitude && station.longitude) {
                        setMapCenter(`${station.latitude},${station.longitude}`);
                      } else {
                        setMapCenter(station.address);
                      }
                    }}
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
                      <div className="meta-item meta-item-favorite">
                        <button 
                          className="favorite-btn-inline"
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
              key={mapCenter}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps?q=${encodeURIComponent(mapCenter)}&output=embed&z=15`}
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
