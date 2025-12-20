import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MapPin, DollarSign, X, Send, Image as ImageIcon } from 'lucide-react';
import { stationService } from '../../services/stationService';
import { feedbackService } from '../../services/feedbackService';
import { bookingService } from '../../services/bookingService';
import StationDetailModal from './Stations/StationDetailModal';
import ConfirmModal from '../../components/shared/ConfirmModal';
import AlertModal from '../../components/shared/AlertModal';
import './FeedbacksAndFavorites.css';

const FeedbacksAndFavorites = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'feedback' | 'favorites'>('feedback');
  const [completedBookings, setCompletedBookings] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailStation, setDetailStation] = useState<any>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [stationToRemove, setStationToRemove] = useState<number | null>(null);
  const [alertModal, setAlertModal] = useState<{ show: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
    show: false,
    title: '',
    message: '',
    type: 'success'
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    if (activeTab === 'feedback') {
      // Load completed bookings for feedback
      try {
        const response = await bookingService.getMyBookings({ status: 'completed' });
        if (response.success && response.data) {
          // Map to format needed for dropdown
          const mappedBookings = response.data.map((b: any) => ({
            booking_id: b.booking_id,
            station_id: b.station_id || b.station?.station_id,
            station_name: b.station_name || b.station?.station_name || 'Không rõ'
          }));
          setCompletedBookings(mappedBookings);
        }
      } catch (error) {
        console.error('Error loading completed bookings:', error);
        setCompletedBookings([]);
      }
    } else {
      loadFavorites();
    }
  };

  const loadFavorites = async () => {
    try {
      const response = await stationService.getFavorites();
      setFavorites(response.data || []);
    } catch (error) {
      console.error('Error loading favorites:', error);
      setFavorites([]);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStation || rating === 0) {
      setAlertModal({
        show: true,
        title: 'Thiếu thông tin',
        message: 'Vui lòng chọn trạm và đánh giá số sao',
        type: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      await feedbackService.create({
        station_id: Number(selectedStation),
        rating,
        comment: comment || undefined
      });
      
      setAlertModal({
        show: true,
        title: 'Thành công!',
        message: 'Đánh giá của bạn đã được gửi thành công',
        type: 'success'
      });
      
      // Reset form
      setSelectedStation('');
      setRating(0);
      setComment('');
    } catch (error: any) {
      setAlertModal({
        show: true,
        title: 'Lỗi',
        message: error.message || 'Có lỗi xảy ra khi gửi đánh giá',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (stationId: number) => {
    setStationToRemove(stationId);
    setShowConfirmModal(true);
  };

  const confirmRemoveFavorite = async () => {
    if (!stationToRemove) return;

    try {
      await stationService.removeFavorite(stationToRemove);
      setAlertModal({
        show: true,
        title: 'Thành công!',
        message: 'Đã bỏ lưu trạm khỏi danh sách yêu thích',
        type: 'success'
      });
      loadFavorites();
    } catch (error: any) {
      setAlertModal({
        show: true,
        title: 'Lỗi',
        message: error.message || 'Có lỗi xảy ra khi bỏ lưu trạm',
        type: 'error'
      });
    } finally {
      setStationToRemove(null);
    }
  };

  const getStationTypeLabel = (type: string) => {
    const typeMap: any = {
      'xe_may': 'Xe máy',
      'oto': 'Ô tô',
      'ca_hai': 'Cả hai'
    };
    return typeMap[type] || type;
  };

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
    <div className="feedback-favorites-page">
      <div className="page-container">
        <div className="page-header">
          <h1>Đánh giá & Trạm Yêu thích</h1>
          <p>Gửi đánh giá hoặc quản lý trạm yêu thích của bạn</p>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'feedback' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('feedback')}
          >
            <Star size={20} />
            <span>Đánh giá trạm</span>
          </button>
          <button
            className={`tab ${activeTab === 'favorites' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('favorites')}
          >
            <MapPin size={20} />
            <span>Trạm yêu thích</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'feedback' ? (
          <div className="feedback-section">
            <div className="feedback-form-container">
              <h2>Gửi đánh giá</h2>
              <p className="form-subtitle">Chia sẻ trải nghiệm của bạn về trạm sạc</p>

              <form onSubmit={handleSubmitFeedback} className="feedback-form">
                <div className="form-group">
                  <label>Chọn trạm sạc</label>
                  <select
                    value={selectedStation}
                    onChange={(e) => setSelectedStation(e.target.value)}
                    required
                  >
                    <option value="">-- Chọn trạm đã sạc --</option>
                    {completedBookings.map((booking) => (
                      <option key={booking.booking_id} value={booking.station_id}>
                        {booking.station_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Đánh giá</label>
                  <div className="star-rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`star-btn ${star <= (hoverRating || rating) ? 'star-active' : ''}`}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                      >
                        <Star size={32} fill={star <= (hoverRating || rating) ? '#f59e0b' : 'none'} />
                      </button>
                    ))}
                  </div>
                  {rating > 0 && (
                    <p className="rating-text">
                      {rating === 1 && 'Rất tệ'}
                      {rating === 2 && 'Tệ'}
                      {rating === 3 && 'Bình thường'}
                      {rating === 4 && 'Tốt'}
                      {rating === 5 && 'Xuất sắc'}
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label>Nội dung phản hồi (Tùy chọn)</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Chia sẻ trải nghiệm của bạn..."
                    maxLength={500}
                    rows={5}
                  />
                  <span className="char-count">{comment.length}/500</span>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => {
                      setSelectedStation('');
                      setRating(0);
                      setComment('');
                    }}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={loading}
                  >
                    <Send size={20} />
                    <span>{loading ? 'Đang gửi...' : 'Gửi đánh giá'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="favorites-section">
            {favorites.length === 0 ? (
              <div className="empty-state">
                <MapPin size={64} />
                <h3>Bạn chưa lưu trạm nào</h3>
                <p>Khám phá và lưu các trạm sạc yêu thích của bạn</p>
                <button
                  className="btn-find-stations"
                  onClick={() => navigate('/stations')}
                >
                  Tìm trạm sạc
                </button>
              </div>
            ) : (
              <div className="favorites-grid">
                {favorites.map((station) => {
                  // Use avg_rating from API response if available
                  const avgRating = station.avg_rating !== undefined 
                    ? parseFloat(station.avg_rating).toFixed(1)
                    : '0.0';

                  return (
                    <div key={station.station_id} className="favorite-card">
                      <div className="favorite-card-image">
                        <img
                          src={station.avatar_url || 'https://via.placeholder.com/400x200/3b82f6/ffffff?text=EV+Station'}
                          alt={station.station_name}
                        />
                        <button
                          className="remove-favorite-btn"
                          onClick={() => handleRemoveFavorite(station.station_id)}
                        >
                          <X size={20} />
                        </button>
                      </div>

                      <div className="favorite-card-content">
                        <h3>{station.station_name}</h3>
                        
                        <div className="favorite-address">
                          <MapPin size={16} />
                          <span>{station.address.substring(0, 60)}...</span>
                        </div>

                        <div className="favorite-meta">
                          <div className="meta-item">
                            <DollarSign size={16} />
                            <span>{station.price_per_kwh?.toLocaleString()} đ/kWh</span>
                          </div>
                          <div className="meta-item rating">
                            <span>⭐ {avgRating}</span>
                          </div>
                        </div>

                        <div className="favorite-status">
                          {getStatusBadge(station.status || 'active')}
                        </div>

                        <button
                          className="btn-view-detail"
                          onClick={() => {
                            setDetailStation(station);
                            setShowDetailModal(true);
                          }}
                        >
                          Xem chi tiết
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <StationDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        station={detailStation}
        onBooking={() => {
          setShowDetailModal(false);
          if (detailStation) {
            navigate(`/bookings/create?station_id=${detailStation.station_id}`);
          }
        }}
        onFavorite={() => {
          if (detailStation) {
            handleRemoveFavorite(detailStation.station_id);
          }
        }}
      />

      {/* Confirm Remove Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setStationToRemove(null);
        }}
        onConfirm={confirmRemoveFavorite}
        title="Bỏ lưu trạm sạc?"
        message="Bạn có chắc chắn muốn bỏ lưu trạm sạc này khỏi danh sách yêu thích?"
        confirmText="Bỏ lưu"
        cancelText="Hủy"
        type="warning"
      />

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.show}
        onClose={() => setAlertModal({ ...alertModal, show: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />
    </div>
  );
};

export default FeedbacksAndFavorites;
