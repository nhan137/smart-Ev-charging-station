import { useState, useEffect } from 'react';
import { Filter, Calendar, Eye, X, MapPin, Clock } from 'lucide-react';
import ConfirmModal from '../../../components/shared/ConfirmModal';
import AlertModal from '../../../components/shared/AlertModal';
import { bookingService } from '../../../services/bookingService';
import './BookingHistory.css';

const BookingHistory = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    station: '',
    status: ''
  });
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<number | null>(null);
  const [alertModal, setAlertModal] = useState<{ show: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
    show: false,
    title: '',
    message: '',
    type: 'success'
  });

  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getMyBookings();
      setBookings(response.data || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get vehicle type label
  const getVehicleTypeLabel = (type: string) => {
    const typeMap: any = {
      'xe_may_usb': 'Xe máy USB',
      'xe_may_ccs': 'Xe máy CCS',
      'oto_ccs': 'Ô tô CCS'
    };
    return typeMap[type] || type;
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      pending: { label: 'Chờ xác nhận', class: 'status-pending' },
      confirmed: { label: 'Đã xác nhận', class: 'status-confirmed' },
      pending_cancel: { label: 'Chờ xử lý hủy', class: 'status-pending' },
      cancelled: { label: 'Đã hủy', class: 'status-cancelled' },
      completed: { label: 'Hoàn thành', class: 'status-completed' }
    };
    
    const config = statusConfig[status] || { label: status, class: '' };
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  // Handle view detail
  const handleViewDetail = (booking: any) => {
    setSelectedBooking(booking);
    setShowDetailModal(true);
  };

  // Handle cancel booking
  const handleCancelBooking = async () => {
    if (!bookingToCancel) return;

    try {
      // TODO: Call API to request cancel booking
      // await bookingService.requestCancel(bookingToCancel);
      
      // Update booking status to pending_cancel (waiting for admin approval)
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.booking_id === bookingToCancel 
            ? { ...booking, status: 'pending_cancel' }
            : booking
        )
      );
      
      setAlertModal({
        show: true,
        title: 'Thành công!',
        message: 'Yêu cầu hủy lịch đã được gửi. Vui lòng chờ admin xử lý.',
        type: 'success'
      });
    } catch (error: any) {
      setAlertModal({
        show: true,
        title: 'Lỗi',
        message: error.message || 'Có lỗi xảy ra khi gửi yêu cầu hủy lịch',
        type: 'error'
      });
    } finally {
      setBookingToCancel(null);
      setShowConfirmModal(false);
    }
  };

  return (
    <div className="booking-list-page">
      <div className="list-container">
        <div className="list-header">
          <h1>Lịch sử đặt lịch</h1>
          <p>Xem lại các lịch đặt sạc của bạn</p>
        </div>

        {/* Filter Bar */}
        <div className="filter-bar">
          <button 
            className="filter-toggle"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={20} />
            <span>Bộ lọc</span>
          </button>

          {showFilters && (
            <div className="filter-panel">
              <div className="filter-row">
                <div className="filter-group">
                  <label>Từ ngày</label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  />
                </div>

                <div className="filter-group">
                  <label>Đến ngày</label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  />
                </div>

                <div className="filter-group">
                  <label>Trạm sạc</label>
                  <select
                    value={filters.station}
                    onChange={(e) => setFilters({ ...filters, station: e.target.value })}
                  >
                    <option value="">Tất cả trạm</option>
                    <option value="1">Trạm sạc Hải Châu</option>
                    <option value="2">Trạm sạc Sơn Trà Premium</option>
                    <option value="3">Trạm sạc Ngũ Hành Sơn</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Trạng thái</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  >
                    <option value="">Tất cả</option>
                    <option value="pending">Chờ xác nhận</option>
                    <option value="confirmed">Đã xác nhận</option>
                    <option value="cancelled">Đã hủy</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bookings List */}
        <div className="bookings-list">
          {bookings.length === 0 ? (
            <div className="empty-state">
              <Calendar size={64} />
              <h3>Chưa có lịch đặt nào</h3>
              <p>Các lịch đặt sạc của bạn sẽ hiển thị tại đây</p>
            </div>
          ) : (
            bookings.map((booking) => (
              <div key={booking.booking_id} className="booking-card">
                <div className="booking-header-row">
                  <div className="booking-id">
                    <span className="id-label">Mã:</span>
                    <span className="id-value">#{booking.booking_id}</span>
                  </div>
                  {getStatusBadge(booking.status)}
                </div>

                <div className="booking-content">
                  <div className="station-info">
                    <MapPin size={20} className="station-icon" />
                    <div className="station-details">
                      <h3>{booking.station_name}</h3>
                      <p>{booking.station_address}</p>
                    </div>
                  </div>

                  <div className="booking-info-grid">
                    <div className="info-item">
                      <span className="info-label">Loại xe</span>
                      <span className="info-value">{getVehicleTypeLabel(booking.vehicle_type)}</span>
                    </div>

                    <div className="info-item">
                      <span className="info-label">Ngày đặt</span>
                      <span className="info-value">
                        {new Date(booking.start_time).toLocaleDateString('vi-VN')}
                      </span>
                    </div>

                    <div className="info-item">
                      <span className="info-label">Thời gian</span>
                      <span className="info-value">
                        <Clock size={16} />
                        {new Date(booking.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        {' - '}
                        {new Date(booking.end_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="info-item highlight">
                      <span className="info-label">Tổng tiền</span>
                      <span className="info-value total">{booking.total_cost.toLocaleString()}đ</span>
                    </div>
                  </div>
                </div>

                <div className="booking-actions">
                  {(booking.status === 'confirmed' || booking.status === 'pending') && (
                    <button 
                      className="action-btn action-btn-cancel"
                      onClick={() => {
                        setBookingToCancel(booking.booking_id);
                        setShowConfirmModal(true);
                      }}
                    >
                      <X size={18} />
                      <span>Hủy</span>
                    </button>
                  )}
                  <button 
                    className="action-btn action-btn-detail"
                    onClick={() => handleViewDetail(booking)}
                  >
                    <Eye size={18} />
                    <span>Chi tiết</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedBooking && (
        <div className="detail-modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="detail-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowDetailModal(false)}>
              <X size={24} />
            </button>

            <h2>Chi tiết đặt lịch #{selectedBooking.booking_id}</h2>

            <div className="modal-section">
              <h3>Thông tin trạm</h3>
              <div className="modal-info-grid">
                <div className="modal-info-item">
                  <span>Trạm sạc:</span>
                  <span>{selectedBooking.station_name}</span>
                </div>
                <div className="modal-info-item">
                  <span>Địa chỉ:</span>
                  <span>{selectedBooking.station_address}</span>
                </div>
                <div className="modal-info-item">
                  <span>Loại xe:</span>
                  <span>{getVehicleTypeLabel(selectedBooking.vehicle_type)}</span>
                </div>
              </div>
            </div>

            <div className="modal-section">
              <h3>Thời gian</h3>
              <div className="modal-info-grid">
                <div className="modal-info-item">
                  <span>Ngày:</span>
                  <span>{new Date(selectedBooking.start_time).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="modal-info-item">
                  <span>Giờ bắt đầu:</span>
                  <span>{new Date(selectedBooking.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="modal-info-item">
                  <span>Giờ kết thúc:</span>
                  <span>{new Date(selectedBooking.end_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>

            <div className="modal-section">
              <h3>Thanh toán</h3>
              <div className="modal-info-grid">
                <div className="modal-info-item">
                  <span>Trạng thái:</span>
                  {getStatusBadge(selectedBooking.status)}
                </div>
                <div className="modal-info-item highlight">
                  <span>Tổng tiền:</span>
                  <span className="total-value">{selectedBooking.total_cost.toLocaleString()}đ</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Cancel Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setBookingToCancel(null);
        }}
        onConfirm={handleCancelBooking}
        title="Hủy lịch đặt sạc?"
        message="Bạn có chắc chắn muốn hủy lịch đặt sạc này? Hành động này không thể hoàn tác."
        confirmText="Hủy lịch"
        cancelText="Giữ lại"
        type="danger"
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

export default BookingHistory;
