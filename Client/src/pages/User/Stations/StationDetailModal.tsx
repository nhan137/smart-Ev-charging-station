import { useEffect } from 'react';
import { X, MapPin, Phone, DollarSign, Zap, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockFeedbacks, mockUsers } from '../../../services/mockData';
import './StationDetailModal.css';

interface StationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  station: any;
  onBooking: () => void;
  onFavorite: () => void;
}

const StationDetailModal = ({ isOpen, onClose, station, onBooking, onFavorite }: StationDetailModalProps) => {
  const navigate = useNavigate();
  
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  
  if (!isOpen || !station) return null;

  // Convert station type to Vietnamese
  const getStationTypeLabel = (type: string) => {
    const typeMap: any = {
      'xe_may': 'Xe máy',
      'oto': 'Ô tô',
      'ca_hai': 'Cả hai'
    };
    return typeMap[type] || type;
  };

  // Calculate ratings
  const stationFeedbacks = mockFeedbacks.filter(f => f.station_id === station.station_id);
  const avgRating = stationFeedbacks.length > 0
    ? (stationFeedbacks.reduce((sum, f) => sum + f.rating, 0) / stationFeedbacks.length).toFixed(1)
    : '0.0';
  
  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: stationFeedbacks.filter(f => f.rating === star).length
  }));

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Hôm nay';
    if (diffInDays === 1) return 'Hôm qua';
    if (diffInDays < 7) return `${diffInDays} ngày trước`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} tuần trước`;
    return `${Math.floor(diffInDays / 30)} tháng trước`;
  };

  const renderStars = (rating: number) => {
    return '⭐'.repeat(rating);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: any = {
      active: { label: 'Hoạt động', class: 'status-active' },
      maintenance: { label: 'Bảo trì', class: 'status-maintenance' },
      inactive: { label: 'Ngừng hoạt động', class: 'status-inactive' }
    };
    const statusInfo = statusMap[status] || statusMap.active;
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.label}</span>;
  };

  return (
    <div className="detail-modal-overlay" onClick={onClose}>
      <div className="detail-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="detail-modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        {/* Header Image */}
        <div className="detail-header-image">
          <img 
            src={station.avatar_url || 'https://via.placeholder.com/800x300/3b82f6/ffffff?text=EV+Station'} 
            alt={station.station_name}
          />
        </div>

        {/* Station Info */}
        <div className="detail-content">
          <div className="detail-title-section">
            <h2>{station.station_name}</h2>
            {getStatusBadge(station.status || 'active')}
          </div>

          <div className="detail-info-grid">
            <div className="info-row">
              <MapPin size={18} />
              <div className="info-text">
                <span className="info-label">Địa chỉ</span>
                <span className="info-value">{station.address}</span>
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(station.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="maps-link"
                >
                  Xem trên Google Maps →
                </a>
              </div>
            </div>

            <div className="info-row">
              <Phone size={18} />
              <div className="info-text">
                <span className="info-label">Số điện thoại</span>
                <a href={`tel:${station.contact_phone || '0236-3888-999'}`} className="phone-link">
                  {station.contact_phone || '0236-3888-999'}
                </a>
              </div>
            </div>

            <div className="info-row">
              <DollarSign size={18} />
              <div className="info-text">
                <span className="info-label">Giá</span>
                <span className="info-value">{station.price_per_kwh?.toLocaleString()} đ/kWh</span>
              </div>
            </div>

            <div className="info-row">
              <Zap size={18} />
              <div className="info-text">
                <span className="info-label">Công suất</span>
                <span className="info-value">{station.charging_power || '50'} kW</span>
              </div>
            </div>

            <div className="info-row">
              <Clock size={18} />
              <div className="info-text">
                <span className="info-label">Giờ mở cửa</span>
                <span className="info-value">{station.opening_hours || '24/7'}</span>
              </div>
            </div>
          </div>

          <div className="detail-specs">
            <div className="spec-item">
              <span className="spec-label">Loại trạm</span>
              <span className="spec-value">{getStationTypeLabel(station.station_type)}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Đầu sạc</span>
              <span className="spec-value">{station.connector_types}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Chỗ trống</span>
              <span className="spec-value slots">{station.available_slots}/{station.total_slots} chỗ</span>
            </div>
          </div>

          {/* Rating Section */}
          <div className="rating-section">
            <h3>Đánh giá</h3>
            <div className="rating-summary">
              <div className="rating-average">
                <div className="avg-number">{avgRating}</div>
                <div className="avg-stars">{renderStars(Math.round(parseFloat(avgRating)))}</div>
                <div className="avg-count">({stationFeedbacks.length} đánh giá)</div>
              </div>
              <div className="rating-bars">
                {ratingDistribution.map(({ star, count }) => (
                  <div key={star} className="rating-bar-row">
                    <span className="bar-label">{star}★</span>
                    <div className="bar-container">
                      <div 
                        className="bar-fill" 
                        style={{ width: `${stationFeedbacks.length > 0 ? (count / stationFeedbacks.length) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="bar-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="reviews-section">
            <h3>Đánh giá gần đây</h3>
            {stationFeedbacks.length === 0 ? (
              <p className="no-reviews">Chưa có đánh giá nào</p>
            ) : (
              <div className="reviews-list">
                {stationFeedbacks.slice(0, 5).map((feedback) => {
                  const user = mockUsers.find(u => u.user_id === feedback.user_id);
                  return (
                    <div key={feedback.feedback_id} className="review-item">
                      <div className="review-header">
                        <div className="review-avatar">
                          {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="review-info">
                          <div className="review-name">{user?.full_name || 'User'}</div>
                          <div className="review-meta">
                            <span className="review-stars">{renderStars(feedback.rating)}</span>
                            <span className="review-date">{getRelativeTime(feedback.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      <p className="review-comment">{feedback.comment}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="detail-actions">
            <button className="detail-btn detail-btn-secondary" onClick={onFavorite}>
              ❤️ Lưu
            </button>
            <button 
              className="detail-btn detail-btn-secondary"
              onClick={() => {
                // Get directions from current location to station
                const destination = `${station.latitude},${station.longitude}`;
                window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`, '_blank');
              }}
            >
              Chỉ đường
            </button>
            <button 
              className="detail-btn detail-btn-secondary"
              onClick={() => window.location.href = `tel:${station.contact_phone || '0236-3888-999'}`}
            >
              Gọi liên hệ
            </button>
            <button 
              className="detail-btn detail-btn-primary" 
              onClick={() => {
                onClose();
                navigate(`/bookings/create?station_id=${station.station_id}`);
              }}
            >
              Đặt lịch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StationDetailModal;
