import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Calendar, Eye, X, MapPin, Clock, Lock, Zap } from 'lucide-react';
import ConfirmModal from '../../../components/shared/ConfirmModal';
import AlertModal from '../../../components/shared/AlertModal';
import { bookingService } from '../../../services/bookingService';
import './BookingHistory.css';

const BookingHistory = () => {
  const navigate = useNavigate();
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
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [selectedBookingForCode, setSelectedBookingForCode] = useState<any>(null);
  const [confirmationCode, setConfirmationCode] = useState('');

  const [bookings, setBookings] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); // Hiển thị 5 booking mỗi trang
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    document.body.classList.add('booking-history-page');
    return () => {
      document.body.classList.remove('booking-history-page');
    };
  }, []);

  useEffect(() => {
    loadBookings();
  }, [filters]); // Reload when filters change

  useEffect(() => {
    // Tính số trang khi bookings thay đổi
    const pages = Math.ceil(bookings.length / itemsPerPage);
    setTotalPages(pages || 1);
    // Reset về trang 1 nếu currentPage vượt quá totalPages
    if (currentPage > pages && pages > 0) {
      setCurrentPage(1);
    }
  }, [bookings, itemsPerPage]);

  const loadBookings = async () => {
    try {
      // Build query parameters from filters
      const params: any = {};
      if (filters.dateFrom) {
        params.startDate = filters.dateFrom;
      }
      if (filters.dateTo) {
        params.endDate = filters.dateTo;
      }
      if (filters.station) {
        params.stationId = filters.station;
      }
      if (filters.status) {
        params.status = filters.status;
      }

      const response = await bookingService.getMyBookingList(params);
      if (response.success && response.data) {
        setBookings(response.data);
      } else {
        setBookings([]);
      }
    } catch (error: any) {
      console.error('Error loading bookings:', error);
      setAlertModal({
        show: true,
        title: 'Lỗi',
        message: error.message || 'Không thể tải lịch sử đặt lịch',
        type: 'error'
      });
    }
  };

  // Format date safely
  const formatDate = (dateString: string | Date | null | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      if (isNaN(date.getTime())) {
        // Try parsing as ISO string or other formats
        const parsed = new Date(dateString.toString().replace(' ', 'T'));
        if (isNaN(parsed.getTime())) {
          return 'N/A';
        }
        return parsed.toLocaleDateString('vi-VN');
      }
      return date.toLocaleDateString('vi-VN');
    } catch (error) {
      console.error('Date parsing error:', error, dateString);
      return 'N/A';
    }
  };

  // Format time safely
  const formatTime = (dateString: string | Date | null | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      if (isNaN(date.getTime())) {
        const parsed = new Date(dateString.toString().replace(' ', 'T'));
        if (isNaN(parsed.getTime())) {
          return 'N/A';
        }
        return parsed.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.error('Time parsing error:', error, dateString);
      return 'N/A';
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

  // Handle view detail - Fetch full booking details from API
  const handleViewDetail = async (booking: any) => {
    try {
      const response = await bookingService.getBookingById(booking.booking_id);
      if (response.success && response.data) {
        // Merge API data with existing booking data
        setSelectedBooking({
          ...booking,
          ...response.data,
          station_address: response.data.station_info?.address || booking.station_address,
          station_name: response.data.station_info?.station_name || booking.station_name
        });
        setShowDetailModal(true);
      } else {
        // Fallback to existing booking data
        setSelectedBooking(booking);
        setShowDetailModal(true);
      }
    } catch (error: any) {
      console.error('Error loading booking details:', error);
      // Fallback to existing booking data
      setSelectedBooking(booking);
      setShowDetailModal(true);
    }
  };

  // Handle start charging with code
  const handleStartCharging = (booking: any) => {
    setSelectedBookingForCode(booking);
    setConfirmationCode('');
    setShowCodeModal(true);
  };

  // Handle verify code (call backend verify-checkin API)
  const handleVerifyCode = async () => {
    if (!selectedBookingForCode || !confirmationCode) {
      setAlertModal({
        show: true,
        title: 'Lỗi',
        message: 'Vui lòng nhập mã xác nhận',
        type: 'error'
      });
      return;
    }

    try {
      const response = await bookingService.verifyCheckinCode(
        selectedBookingForCode.booking_id,
        confirmationCode
      );

      if (response.success && response.data?.can_start_charging) {
        setShowCodeModal(false);
        setConfirmationCode('');
        setSelectedBookingForCode(null);
        
        // Chuyển hướng đến trang sạc
        navigate(`/bookings/${selectedBookingForCode.booking_id}/charging`);
      } else {
        setAlertModal({
          show: true,
          title: 'Lỗi',
          message: response.message || 'Mã xác nhận không đúng hoặc đã hết hạn. Vui lòng thử lại.',
          type: 'error'
        });
      }
    } catch (error: any) {
      setAlertModal({
        show: true,
        title: 'Lỗi',
        message: error.message || 'Có lỗi xảy ra',
        type: 'error'
      });
    }
  };

  // Handle cancel booking - Cancel immediately
  const handleCancelBooking = async () => {
    if (!bookingToCancel) return;

    try {
      // Call API to cancel booking immediately
      await bookingService.cancelBookingByUser(bookingToCancel);
      
      // Update booking status to cancelled
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.booking_id === bookingToCancel 
            ? { ...booking, status: 'cancelled', booking_status: 'cancelled' }
            : booking
        )
      );
      
      setAlertModal({
        show: true,
        title: 'Thành công!',
        message: 'Lịch đặt đã được hủy thành công.',
        type: 'success'
      });
      
      // Reload bookings to get updated data
      loadBookings();
    } catch (error: any) {
      setAlertModal({
        show: true,
        title: 'Lỗi',
        message: error.message || 'Có lỗi xảy ra khi hủy lịch đặt',
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
        <div className="bookings-list-container">
          <div className="bookings-list">
            {bookings.length === 0 ? (
              <div className="empty-state">
                <Calendar size={64} />
                <h3>Chưa có lịch đặt nào</h3>
                <p>Các lịch đặt sạc của bạn sẽ hiển thị tại đây</p>
              </div>
            ) : (
              bookings
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((booking) => (
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
                        {formatDate(booking.start_time || booking.created_at || booking.booking_date)}
                      </span>
                    </div>

                    <div className="info-item">
                      <span className="info-label">Thời gian</span>
                      <span className="info-value">
                        <Clock size={16} />
                        {formatTime(booking.start_time) || 'N/A'}
                        {' - '}
                        {formatTime(booking.end_time) || 'N/A'}
                      </span>
                    </div>

                  </div>
                </div>

                <div className="booking-actions">
                  {/* Show "Monitor Charging" button if status is charging */}
                  {(booking.status === 'charging' || booking.booking_status === 'charging') && (
                    <button 
                      className="action-btn action-btn-monitor"
                      onClick={() => navigate(`/bookings/${booking.booking_id}/charging`)}
                    >
                      <Zap size={18} />
                      <span>Theo dõi sạc</span>
                    </button>
                  )}
                  
                  {/* Only show "Enter Code" and "Cancel" for pending or confirmed bookings */}
                  {(booking.booking_status === 'pending' || booking.status === 'pending' ||
                    booking.booking_status === 'confirmed' || booking.status === 'confirmed') && (
                    <>
                      {booking.booking_status === 'confirmed' || booking.status === 'confirmed' ? (
                        <button 
                          className="action-btn action-btn-start-charging"
                          onClick={() => handleStartCharging(booking)}
                        >
                          <Lock size={18} />
                          <span>Nhập mã để bắt đầu sạc</span>
                        </button>
                      ) : null}
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
                    </>
                  )}
                  {/* Always show "Details" button */}
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

          {/* Pagination - Hiển thị khi có booking */}
          {bookings.length > 0 && (
            <div className="pagination-container">
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Trước
              </button>
              <div className="pagination-info">
                Trang {currentPage} / {totalPages} ({bookings.length} booking)
              </div>
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Sau
              </button>
            </div>
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
                  <span>{formatDate(selectedBooking.start_time || selectedBooking.created_at)}</span>
                </div>
                <div className="modal-info-item">
                  <span>Giờ bắt đầu:</span>
                  <span>{formatTime(selectedBooking.start_time)}</span>
                </div>
                <div className="modal-info-item">
                  <span>Giờ kết thúc:</span>
                  <span>{formatTime(selectedBooking.end_time)}</span>
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

      {/* Code Input Modal */}
      {showCodeModal && selectedBookingForCode && (
        <div className="code-modal-overlay" onClick={() => setShowCodeModal(false)}>
          <div className="code-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowCodeModal(false)}>
              <X size={24} />
            </button>

            <h2>Nhập mã để bắt đầu sạc</h2>
            <p className="modal-subtitle">Booking #{selectedBookingForCode.booking_id} - {selectedBookingForCode.station_name}</p>

            <div className="code-input-section">
              <label>Mã xác nhận (kí tự và số)</label>
              <input
                type="text"
                maxLength={6}
                placeholder="ABC123"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value.replace(/[^A-Z0-9]/gi, '').toUpperCase())}
                className="code-input"
                autoFocus
              />
              <p className="code-hint">Mã xác nhận đã được gửi đến thông báo của bạn</p>
            </div>

            <div className="modal-actions">
              <button 
                className="btn-cancel"
                onClick={() => setShowCodeModal(false)}
              >
                Hủy
              </button>
              <button 
                className="btn-confirm"
                onClick={handleVerifyCode}
                disabled={confirmationCode.length !== 6}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

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
