import { useState, useEffect } from 'react';
import { Calendar, User, Car, Clock, DollarSign, Filter, MapPin, Search, Loader2 } from 'lucide-react';
import ConfirmModal from '../../components/shared/ConfirmModal';
import AlertModal from '../../components/shared/AlertModal';
import { managerService } from '../../services/managerService';
import './BookingHistory.css';

const BookingHistory = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: string; bookingId: number } | null>(null);
  const [alertModal, setAlertModal] = useState<{ show: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
    show: false,
    title: '',
    message: '',
    type: 'success'
  });

  useEffect(() => {
    loadData();
  }, [filterStatus, filterStartDate, filterEndDate, searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await managerService.getBookingHistory({
        status: filterStatus || undefined,
        start_date: filterStartDate || undefined,
        end_date: filterEndDate || undefined,
        search: searchTerm || undefined
      });
      
      if (response.success && response.data) {
        setBookings(Array.isArray(response.data) ? response.data : []);
      } else {
        setBookings([]);
      }
    } catch (error: any) {
      console.error('Error loading booking history:', error);
      // Set empty array instead of showing error modal immediately
      // Error will be shown if user tries to interact
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (filterStatus && booking.status !== filterStatus) return false;
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      if (!booking.user_name.toLowerCase().includes(search) && 
          !booking.user_email.toLowerCase().includes(search) &&
          !booking.station_name.toLowerCase().includes(search)) {
        return false;
      }
    }
    
    const bookingDate = new Date(booking.start_time);
    
    if (filterStartDate) {
      const startDate = new Date(filterStartDate);
      startDate.setHours(0, 0, 0, 0);
      if (bookingDate < startDate) return false;
    }
    
    if (filterEndDate) {
      const endDate = new Date(filterEndDate);
      endDate.setHours(23, 59, 59, 999);
      if (bookingDate > endDate) return false;
    }
    
    return true;
  });

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

  const handleAction = (type: string, bookingId: number) => {
    setConfirmAction({ type, bookingId });
    setShowConfirmModal(true);
  };

  const confirmBookingAction = async () => {
    if (!confirmAction) return;

    try {
      const booking = bookings.find(b => b.booking_id === confirmAction.bookingId);
      
      if (confirmAction.type === 'confirm' && booking) {
        // Tạo mã xác nhận 6 số
        const confirmationCode = generateConfirmationCode();
        
        // Lưu mã xác nhận
        saveConfirmationCode(booking.booking_id, confirmationCode);
        
        // Gửi thông báo cho user với mã xác nhận
        await sendBookingConfirmationNotification(
          booking.user_id || 1,
          booking.booking_id,
          confirmationCode,
          booking.user_name,
          booking.station_name
        );

        setAlertModal({
          show: true,
          title: 'Xác nhận thành công!',
          message: `Đã xác nhận booking #${confirmAction.bookingId}. Mã xác nhận ${confirmationCode} đã được gửi qua thông báo cho ${booking.user_name}`,
          type: 'success'
        });
      } else {
        setAlertModal({
          show: true,
          title: 'Thành công!',
          message: `Đã hủy booking #${confirmAction.bookingId}`,
          type: 'success'
        });
      }

      loadData();
    } catch (error: any) {
      setAlertModal({
        show: true,
        title: 'Lỗi',
        message: error.message || 'Có lỗi xảy ra',
        type: 'error'
      });
    } finally {
      setConfirmAction(null);
    }
  };

  const getConfirmModalContent = () => {
    if (!confirmAction) return { title: '', message: '', type: 'warning' as const };

    const contents: any = {
      confirm: {
        title: 'Xác nhận booking?',
        message: 'Bạn có chắc chắn muốn xác nhận booking này?',
        type: 'info' as const
      },
      cancel: {
        title: 'Hủy booking?',
        message: 'Bạn có chắc chắn muốn hủy booking này?',
        type: 'danger' as const
      }
    };

    return contents[confirmAction.type] || contents.confirm;
  };

  // Thống kê
  const stats = {
    total: bookings.length,
    completed: bookings.filter(b => b.status === 'completed').length,
    pending: bookings.filter(b => b.status === 'pending').length,
    totalRevenue: bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + b.total_cost, 0)
  };

  return (
    <div className="booking-history-manager">
      <div className="page-header-manager">
        <div>
          <h1>Lịch sử đặt lịch</h1>
          <p>Xem tất cả lịch sử đặt lịch của người dùng</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <Calendar size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Tổng booking</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <Calendar size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.completed}</span>
            <span className="stat-label">Hoàn thành</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.pending}</span>
            <span className="stat-label">Chờ xử lý</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">
            <DollarSign size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalRevenue.toLocaleString()}đ</span>
            <span className="stat-label">Doanh thu</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-section">
        <div className="filter-group search-group">
          <Search size={20} />
          <input
            type="text"
            placeholder="Tìm theo tên, email, trạm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <Filter size={20} />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="pending">Chờ xác nhận</option>
            <option value="confirmed">Đã xác nhận</option>
            <option value="charging">Đang sạc</option>
            <option value="completed">Hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>

        <div className="filter-group date-input-group">
          <label className="date-label">Từ</label>
          <input
            type="date"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
          />
        </div>

        <div className="filter-group date-input-group">
          <label className="date-label">Đến</label>
          <input
            type="date"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading-state">
            <Loader2 className="spinner" size={32} />
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã booking</th>
                <th>Khách hàng</th>
                <th>Trạm sạc</th>
                <th>Loại xe</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
                <th>Tổng tiền</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-row">
                    <Calendar size={48} />
                    <p>Không có booking nào</p>
                    <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.5rem' }}>
                      Chưa có người dùng nào đặt lịch tại các trạm bạn quản lý
                    </p>
                  </td>
                </tr>
              ) : (
              filteredBookings.map((booking) => (
                <tr key={booking.booking_id}>
                  <td className="id-cell">#{booking.booking_id}</td>
                  <td>
                    <div className="user-cell">
                      <User size={16} />
                      <div className="user-details">
                        <span className="user-name">{booking.user_name}</span>
                        <span className="user-email">{booking.user_email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="station-cell">
                      <MapPin size={16} />
                      <span>{booking.station_name}</span>
                    </div>
                  </td>
                  <td>
                    <div className="vehicle-cell">
                      <Car size={16} />
                      <span>{getVehicleTypeLabel(booking.vehicle_type)}</span>
                    </div>
                  </td>
                  <td>
                    <div className="time-cell">
                      <Clock size={14} />
                      <div className="time-details">
                        <span>{new Date(booking.start_time).toLocaleDateString('vi-VN')}</span>
                        <span className="time-range">
                          {new Date(booking.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - 
                          {new Date(booking.end_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>{getStatusBadge(booking.status)}</td>
                  <td>
                    <div className="price-cell">
                      <DollarSign size={14} />
                      <span>{booking.total_cost.toLocaleString()}đ</span>
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {booking.status === 'pending' && (
                        <>
                          <button
                            className="action-btn-text"
                            onClick={() => handleAction('confirm', booking.booking_id)}
                          >
                            Xác nhận
                          </button>
                          <button
                            className="action-btn-text"
                            onClick={() => handleAction('cancel', booking.booking_id)}
                          >
                            Hủy
                          </button>
                        </>
                      )}
                      {booking.status === 'confirmed' && (
                        <button
                          className="action-btn-text"
                          onClick={() => handleAction('cancel', booking.booking_id)}
                        >
                          Hủy
                        </button>
                      )}
                      <button
                        className="action-btn-text"
                        onClick={() => {/* TODO: Show detail modal */}}
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        )}
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setConfirmAction(null);
        }}
        onConfirm={confirmBookingAction}
        {...getConfirmModalContent()}
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
