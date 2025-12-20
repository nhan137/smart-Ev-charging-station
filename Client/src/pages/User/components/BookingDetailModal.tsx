import { X, Calendar, User, Building2, Car, Clock, DollarSign, Zap, CreditCard, MessageSquare } from 'lucide-react';
import './BookingDetailModal.css';

interface BookingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
}

const BookingDetailModal = ({ isOpen, onClose, booking }: BookingDetailModalProps) => {
  if (!isOpen || !booking) return null;

  const getVehicleTypeLabel = (type: string) => {
    const typeMap: any = {
      'xe_may_usb': 'Xe máy USB',
      'xe_may_ccs': 'Xe máy CCS',
      'oto_ccs': 'Ô tô CCS'
    };
    return typeMap[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      pending: { label: 'Chờ xác nhận', class: 'status-pending' },
      confirmed: { label: 'Đã xác nhận', class: 'status-confirmed' },
      charging: { label: 'Đang sạc', class: 'status-charging' },
      completed: { label: 'Hoàn thành', class: 'status-completed' },
      cancelled: { label: 'Đã hủy', class: 'status-cancelled' }
    };
    const config = statusConfig[status] || { label: status, class: '' };
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig: any = {
      pending: { label: 'Chờ thanh toán', class: 'payment-pending' },
      paid: { label: 'Đã thanh toán', class: 'payment-paid' },
      failed: { label: 'Thất bại', class: 'payment-failed' }
    };
    const config = statusConfig[status] || statusConfig['pending'];
    return <span className={`payment-badge ${config.class}`}>{config.label}</span>;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="booking-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="modal-header">
          <div className="modal-icon">
            <Calendar size={32} />
          </div>
          <h2>Chi tiết Booking</h2>
          <p>Mã đặt lịch: #{booking.booking_id}</p>
        </div>

        <div className="booking-detail-content">
          {/* Status Section */}
          <div className="detail-section">
            <h3>Trạng thái</h3>
            <div className="status-row">
              <div className="status-item">
                <span className="status-label">Trạng thái booking:</span>
                {getStatusBadge(booking.status)}
              </div>
              <div className="status-item">
                <span className="status-label">Thanh toán:</span>
                {getPaymentStatusBadge(booking.payment_status || 'pending')}
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="detail-section">
            <h3>Thông tin khách hàng</h3>
            <div className="info-grid">
              <div className="info-item">
                <User size={20} />
                <div>
                  <span className="info-label">Họ tên</span>
                  <span className="info-value">{booking.user_name}</span>
                </div>
              </div>
              <div className="info-item">
                <Car size={20} />
                <div>
                  <span className="info-label">Loại xe</span>
                  <span className="info-value">{getVehicleTypeLabel(booking.vehicle_type)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Station Info */}
          <div className="detail-section">
            <h3>Thông tin trạm sạc</h3>
            <div className="info-grid">
              <div className="info-item full-width">
                <Building2 size={20} />
                <div>
                  <span className="info-label">Tên trạm</span>
                  <span className="info-value">{booking.station_name}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Time Info */}
          <div className="detail-section">
            <h3>Thời gian</h3>
            <div className="info-grid">
              <div className="info-item">
                <Clock size={20} />
                <div>
                  <span className="info-label">Bắt đầu</span>
                  <span className="info-value">
                    {new Date(booking.start_time).toLocaleString('vi-VN')}
                  </span>
                </div>
              </div>
              <div className="info-item">
                <Clock size={20} />
                <div>
                  <span className="info-label">Kết thúc</span>
                  <span className="info-value">
                    {new Date(booking.end_time).toLocaleString('vi-VN')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Charging Session (if completed) */}
          {booking.status === 'completed' && (
            <div className="detail-section">
              <h3>Thông tin sạc</h3>
              <div className="info-grid">
                <div className="info-item">
                  <Zap size={20} />
                  <div>
                    <span className="info-label">Pin ban đầu</span>
                    <span className="info-value">{booking.start_battery || '20'}%</span>
                  </div>
                </div>
                <div className="info-item">
                  <Zap size={20} />
                  <div>
                    <span className="info-label">Pin sau sạc</span>
                    <span className="info-value">{booking.end_battery || '85'}%</span>
                  </div>
                </div>
                <div className="info-item">
                  <Zap size={20} />
                  <div>
                    <span className="info-label">Năng lượng tiêu thụ</span>
                    <span className="info-value">{booking.energy_consumed || '30'} kWh</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Info */}
          <div className="detail-section">
            <h3>Thanh toán</h3>
            <div className="info-grid">
              <div className="info-item">
                <DollarSign size={20} />
                <div>
                  <span className="info-label">Tổng tiền</span>
                  <span className="info-value price">{booking.total_cost.toLocaleString()}đ</span>
                </div>
              </div>
              <div className="info-item">
                <CreditCard size={20} />
                <div>
                  <span className="info-label">Phương thức</span>
                  <span className="info-value">{booking.payment_method || 'QR'}</span>
                </div>
              </div>
              {booking.promotion_code && (
                <div className="info-item">
                  <MessageSquare size={20} />
                  <div>
                    <span className="info-label">Mã giảm giá</span>
                    <span className="info-value promo">{booking.promotion_code}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div className="detail-section">
            <h3>Thông tin hệ thống</h3>
            <div className="info-grid">
              <div className="info-item">
                <Calendar size={20} />
                <div>
                  <span className="info-label">Ngày tạo</span>
                  <span className="info-value">
                    {new Date(booking.created_at || booking.start_time).toLocaleString('vi-VN')}
                  </span>
                </div>
              </div>
              <div className="info-item">
                <Calendar size={20} />
                <div>
                  <span className="info-label">Cập nhật lần cuối</span>
                  <span className="info-value">
                    {new Date(booking.updated_at || booking.start_time).toLocaleString('vi-VN')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-close" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailModal;
