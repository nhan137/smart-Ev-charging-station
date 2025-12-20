import { useEffect, useState } from 'react';
import { X, MapPin, Phone, DollarSign, Zap, Clock, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { stationService } from '../../../services/stationService';
import './StationDetailModal.css';

interface StationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  station: any;
  onBooking: () => void;
  onFavorite: () => void;
}

interface StationDetails {
  station: any;
  rating_stats: {
    avg_rating: number;
    total_reviews: number;
    five_stars: number;
    four_stars: number;
    three_stars: number;
    two_stars: number;
    one_star: number;
  };
  recent_feedbacks: Array<{
    feedback_id: number;
    user_id: number;
    user_name: string;
    rating: number;
    comment: string;
    created_at: string;
  }>;
}

const StationDetailModal = ({ isOpen, onClose, station, onBooking, onFavorite }: StationDetailModalProps) => {
  const navigate = useNavigate();
  const [stationDetails, setStationDetails] = useState<StationDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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

  // Fetch station details when modal opens
  useEffect(() => {
    if (isOpen && station?.station_id) {
      loadStationDetails();
    } else {
      setStationDetails(null);
      setError(null);
    }
  }, [isOpen, station?.station_id]);

  const loadStationDetails = async () => {
    if (!station?.station_id) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await stationService.getStationById(station.station_id);
      
      if (response.success && response.data) {
        setStationDetails(response.data);
      } else {
        setError('Không thể tải thông tin trạm sạc');
      }
    } catch (err: any) {
      console.error('Error loading station details:', err);
      setError(err.message || 'Không thể tải thông tin trạm sạc');
    } finally {
      setLoading(false);
    }
  };
  
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

  // Use API data if available, otherwise use basic station data
  const displayStation = stationDetails?.station || station;
  const ratingStats = stationDetails?.rating_stats || {
    avg_rating: 0,
    total_reviews: 0,
    five_stars: 0,
    four_stars: 0,
    three_stars: 0,
    two_stars: 0,
    one_star: 0
  };
  const recentFeedbacks = stationDetails?.recent_feedbacks || [];
  
  const avgRating = ratingStats.avg_rating > 0 
    ? ratingStats.avg_rating.toFixed(1) 
    : '0.0';
  
  const ratingDistribution = [
    { star: 5, count: ratingStats.five_stars },
    { star: 4, count: ratingStats.four_stars },
    { star: 3, count: ratingStats.three_stars },
    { star: 2, count: ratingStats.two_stars },
    { star: 1, count: ratingStats.one_star }
  ];

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
            src={displayStation.avatar_url || 'https://via.placeholder.com/800x300/3b82f6/ffffff?text=EV+Station'} 
            alt={displayStation.station_name}
          />
        </div>

        {/* Station Info */}
        <div className="detail-content">
          {loading && (
            <div className="loading-overlay">
              <Loader2 className="spinner" size={32} />
              <p>Đang tải thông tin...</p>
            </div>
          )}
          
          {error && (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={loadStationDetails}>Thử lại</button>
            </div>
          )}

          <div className="detail-title-section">
            <h2>{displayStation.station_name}</h2>
            {getStatusBadge(displayStation.status || 'active')}
          </div>

          <div className="detail-info-grid">
            <div className="info-row">
              <MapPin size={18} />
              <div className="info-text">
                <span className="info-label">Địa chỉ</span>
                <span className="info-value">{displayStation.address}</span>
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayStation.address)}`}
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
                <a href={`tel:${displayStation.contact_phone || '0236-3888-999'}`} className="phone-link">
                  {displayStation.contact_phone || '0236-3888-999'}
                </a>
              </div>
            </div>

            <div className="info-row">
              <DollarSign size={18} />
              <div className="info-text">
                <span className="info-label">Giá</span>
                <span className="info-value">{displayStation.price_per_kwh?.toLocaleString()} đ/kWh</span>
              </div>
            </div>

            <div className="info-row">
              <Zap size={18} />
              <div className="info-text">
                <span className="info-label">Công suất</span>
                <span className="info-value">{displayStation.charging_power || '50'} kW</span>
              </div>
            </div>

            <div className="info-row">
              <Clock size={18} />
              <div className="info-text">
                <span className="info-label">Giờ mở cửa</span>
                <span className="info-value">{displayStation.opening_hours || '24/7'}</span>
              </div>
            </div>
          </div>

          <div className="detail-specs">
            <div className="spec-item">
              <span className="spec-label">Loại trạm</span>
              <span className="spec-value">{getStationTypeLabel(displayStation.station_type)}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Đầu sạc</span>
              <span className="spec-value">{displayStation.connector_types}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Chỗ trống</span>
              <span className="spec-value slots">{displayStation.available_slots}/{displayStation.total_slots} chỗ</span>
            </div>
          </div>

          {/* Rating Section */}
          <div className="rating-section">
            <h3>Đánh giá</h3>
            <div className="rating-summary">
              <div className="rating-average">
                <div className="avg-number">{avgRating}</div>
                <div className="avg-stars">{renderStars(Math.round(parseFloat(avgRating)))}</div>
                <div className="avg-count">({ratingStats.total_reviews} đánh giá)</div>
              </div>
              <div className="rating-bars">
                {ratingDistribution.map(({ star, count }) => (
                  <div key={star} className="rating-bar-row">
                    <span className="bar-label">{star}★</span>
                    <div className="bar-container">
                      <div 
                        className="bar-fill" 
                        style={{ width: `${ratingStats.total_reviews > 0 ? (count / ratingStats.total_reviews) * 100 : 0}%` }}
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
            {recentFeedbacks.length === 0 ? (
              <p className="no-reviews">Chưa có đánh giá nào</p>
            ) : (
              <div className="reviews-list">
                {recentFeedbacks.map((feedback) => (
                  <div key={feedback.feedback_id} className="review-item">
                    <div className="review-header">
                      <div className="review-avatar">
                        {feedback.user_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="review-info">
                        <div className="review-name">{feedback.user_name || 'User'}</div>
                        <div className="review-meta">
                          <span className="review-stars">{renderStars(feedback.rating)}</span>
                          <span className="review-date">{getRelativeTime(feedback.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <p className="review-comment">{feedback.comment}</p>
                  </div>
                ))}
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
                const destination = `${displayStation.latitude},${displayStation.longitude}`;
                if (displayStation.latitude && displayStation.longitude) {
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`, '_blank');
                } else {
                  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayStation.address)}`, '_blank');
                }
              }}
            >
              Chỉ đường
            </button>
            <button 
              className="detail-btn detail-btn-secondary"
              onClick={() => window.location.href = `tel:${displayStation.contact_phone || '0236-3888-999'}`}
            >
              Gọi liên hệ
            </button>
            <button 
              className="detail-btn detail-btn-primary" 
              onClick={() => {
                onClose();
                navigate(`/bookings/create?station_id=${displayStation.station_id}`);
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
