import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, MapPin, DollarSign, Zap, Phone, Clock, Settings, Calendar } from 'lucide-react';
import { mockStations, mockFeedbacks, mockUsers } from '../../services/mockData';
import SlotsModal from './components/SlotsModal';
import './StationDetail.css';

const StationDetail = () => {
  const { station_id } = useParams();
  const navigate = useNavigate();
  const [station, setStation] = useState<any>(null);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [showSlotsModal, setShowSlotsModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [station_id]);

  const loadData = () => {
    const foundStation = mockStations.find(s => s.station_id === Number(station_id));
    setStation(foundStation);

    //  feedbacks
    const stationFeedbacks = mockFeedbacks.filter(f => f.station_id === Number(station_id));
    const feedbacksWithUsers = stationFeedbacks.map(f => ({
      ...f,
      user: mockUsers.find(u => u.user_id === f.user_id)
    }));
    setFeedbacks(feedbacksWithUsers);
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

  const avgRating = feedbacks.length > 0
    ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
    : '0.0';

  if (!station) {
    return <div className="loading-state">Đang tải...</div>;
  }

  return (
    <div className="station-detail-manager">
      <div className="page-header-manager">
        <div>
          <button className="back-btn" onClick={() => navigate('/manager/stations')}>
            <ArrowLeft size={20} />
            <span>Quay lại</span>
          </button>
          <h1>Chi tiết trạm sạc</h1>
          <p>Thông tin chi tiết và quản lý trạm</p>
        </div>
      </div>

      {/* Station Info Card */}
      <div className="detail-card">
        <div className="detail-header">
          <div className="detail-title">
            <Building2 size={32} />
            <div>
              <h2>{station.station_name}</h2>
              {getStatusBadge(station.status || 'active')}
            </div>
          </div>
          <div className="detail-actions">
            <button
              className="action-btn-large btn-primary"
              onClick={() => navigate(`/manager/stations/${station_id}/bookings`)}
            >
              <Calendar size={20} />
              <span>Xem booking</span>
            </button>
            <button
              className="action-btn-large btn-secondary"
              onClick={() => navigate(`/manager/stations/${station_id}/status`)}
            >
              <Settings size={20} />
              <span>Cập nhật trạng thái</span>
            </button>
          </div>
        </div>

        <div className="detail-grid">
          <div className="detail-item">
            <MapPin size={20} />
            <div>
              <span className="detail-label">Địa chỉ</span>
              <span className="detail-value">{station.address}</span>
            </div>
          </div>

          <div className="detail-item">
            <Phone size={20} />
            <div>
              <span className="detail-label">Số điện thoại</span>
              <span className="detail-value">{station.contact_phone || '0236-3888-999'}</span>
            </div>
          </div>

          <div className="detail-item">
            <DollarSign size={20} />
            <div>
              <span className="detail-label">Giá sạc</span>
              <span className="detail-value">{station.price_per_kwh?.toLocaleString()} đ/kWh</span>
            </div>
          </div>

          <div className="detail-item">
            <Zap size={20} />
            <div>
              <span className="detail-label">Công suất</span>
              <span className="detail-value">{station.charging_power || '50'} kW</span>
            </div>
          </div>

          <div className="detail-item">
            <Clock size={20} />
            <div>
              <span className="detail-label">Giờ mở cửa</span>
              <span className="detail-value">{station.opening_hours || '24/7'}</span>
            </div>
          </div>

          <div className="detail-item detail-item-clickable" onClick={() => setShowSlotsModal(true)}>
            <Zap size={20} />
            <div>
              <span className="detail-label">Số chỗ</span>
              <span className="detail-value slots-clickable">{station.available_slots}/{station.total_slots} chỗ trống</span>
            </div>
          </div>
        </div>

        <div className="detail-specs">
          <div className="spec-box">
            <span className="spec-label">Loại trạm</span>
            <span className="spec-value">{getStationTypeLabel(station.station_type)}</span>
          </div>
          <div className="spec-box">
            <span className="spec-label">Đầu sạc</span>
            <span className="spec-value">{station.connector_types}</span>
          </div>
          <div className="spec-box">
            <span className="spec-label">Đánh giá</span>
            <span className="spec-value">⭐ {avgRating} ({feedbacks.length} đánh giá)</span>
          </div>
        </div>
      </div>

      {/* Feedbacks */}
      <div className="detail-card">
        <h3>Đánh giá từ khách hàng</h3>
        {feedbacks.length === 0 ? (
          <div className="empty-feedbacks">
            <p>Chưa có đánh giá nào</p>
          </div>
        ) : (
          <div className="feedbacks-list">
            {feedbacks.map((feedback) => (
              <div key={feedback.feedback_id} className="feedback-item">
                <div className="feedback-header">
                  <div className="feedback-user">
                    <div className="feedback-avatar">
                      {feedback.user?.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4>{feedback.user?.full_name}</h4>
                      <div className="feedback-rating">
                        {'⭐'.repeat(feedback.rating)}
                      </div>
                    </div>
                  </div>
                  <span className="feedback-date">
                    {new Date(feedback.created_at).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                {feedback.comment && (
                  <p className="feedback-comment">{feedback.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Slots Modal */}
      <SlotsModal
        isOpen={showSlotsModal}
        onClose={() => setShowSlotsModal(false)}
        stationName={station.station_name}
        totalSlots={station.total_slots}
        availableSlots={station.available_slots}
      />
    </div>
  );
};

export default StationDetail;
