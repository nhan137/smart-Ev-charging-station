import { useState, useEffect } from 'react';
import { Filter, Search, Calendar, User, Building2, Clock, DollarSign, Loader2 } from 'lucide-react';
import ConfirmModal from '../../components/shared/ConfirmModal';
import AlertModal from '../../components/shared/AlertModal';
import BookingDetailModal from '../User/components/BookingDetailModal';
import { adminService } from '../../services/adminService';
import './BookingManagement.css';

interface Booking {
  booking_id: number;
  user_id: number;
  user_name: string;
  station_id: number;
  station_name: string;
  vehicle_type: string;
  start_time: string;
  end_time: string;
  status: string;
  total_cost: number;
}

const BookingManagement = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingStats, setBookingStats] = useState({ total: 0, pending: 0, charging: 0, completed: 0 });
  const [stations, setStations] = useState<any[]>([]);
  const [filterStation, setFilterStation] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    message: '',
    type: 'warning' as 'warning' | 'danger' | 'info',
    onConfirm: () => {}
  });
  const [alertModal, setAlertModal] = useState({
    show: false,
    title: '',
    message: '',
    type: 'success' as 'success' | 'error' | 'info'
  });
  const [detailModal, setDetailModal] = useState({
    show: false,
    booking: null as Booking | null
  });

  useEffect(() => {
    loadBookings();
    loadBookingStats();
    loadStations();
  }, [filterStation, filterStatus, filterStartDate, filterEndDate, searchQuery]);

  const loadStations = async () => {
    try {
      const response = await adminService.getStations({ page: 1, limit: 100 });
      if (response.success && response.data) {
        const stationsData = Array.isArray(response.data) ? response.data : (response.data.stations || []);
        setStations(stationsData);
      }
    } catch (error: any) {
      console.error('Error loading stations:', error);
    }
  };

  const loadBookingStats = async () => {
    try {
      const response = await adminService.getBookingStats();
      if (response.success && response.data) {
        setBookingStats({
          total: response.data.total || 0,
          pending: response.data.pending || 0,
          charging: response.data.charging || 0,
          completed: response.data.completed || 0
        });
      }
    } catch (error: any) {
      console.error('Error loading booking stats:', error);
    }
  };

  const loadBookings = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: 1,
        limit: 100
      };
      
      if (filterStation) params.station_id = filterStation;
      if (filterStatus) params.status = filterStatus;
      if (searchQuery) params.search = searchQuery;
      if (filterStartDate) params.startDate = filterStartDate;
      if (filterEndDate) params.endDate = filterEndDate;

      const response = await adminService.getBookings(params);
      if (response.success && response.data) {
        const bookingsData = Array.isArray(response.data) ? response.data : (response.data.bookings || []);
        const formattedBookings = bookingsData.map((booking: any) => ({
          booking_id: booking.booking_id,
          user_id: booking.user_id,
          user_name: booking.user?.full_name || booking.user_name || 'N/A',
          station_id: booking.station_id,
          station_name: booking.station?.station_name || booking.station_name || 'N/A',
          vehicle_type: booking.vehicle_type,
          start_time: booking.start_time,
          end_time: booking.end_time,
          status: booking.status,
          total_cost: parseFloat(booking.total_cost || 0)
        }));
        setBookings(formattedBookings);
      }
    } catch (error: any) {
      console.error('Error loading bookings:', error);
      setAlertModal({
        show: true,
        title: 'Lỗi',
        message: error.message || 'Không thể tải danh sách đặt lịch',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings; // Backend already filters

  const handleConfirmBooking = (booking: Booking) => {
    setConfirmModal({
      show: true,
      title: 'Xác nhận booking?',
      message: `Bạn có chắc chắn muốn xác nhận booking #${booking.booking_id} của ${booking.user_name}?`,
      type: 'info',
      onConfirm: async () => {
        try {
          await adminService.confirmBooking(booking.booking_id);
          setAlertModal({
            show: true,
            title: 'Thành công!',
            message: `Đã xác nhận booking #${booking.booking_id}`,
            type: 'success'
          });
          loadBookings();
          loadBookingStats();
        } catch (error: any) {
          setAlertModal({
            show: true,
            title: 'Lỗi',
            message: error.message || 'Có lỗi xảy ra',
            type: 'error'
          });
        }
      }
    });
  };

  const handleCancelBooking = (booking: Booking) => {
    setConfirmModal({
      show: true,
      title: 'Hủy booking?',
      message: `Bạn có chắc chắn muốn hủy booking #${booking.booking_id} của ${booking.user_name}?`,
      type: 'warning',
      onConfirm: async () => {
        try {
          await adminService.cancelBooking(booking.booking_id);
          setAlertModal({
            show: true,
            title: 'Thành công!',
            message: `Đã hủy booking #${booking.booking_id}`,
            type: 'success'
          });
          loadBookings();
          loadBookingStats();
        } catch (error: any) {
          setAlertModal({
            show: true,
            title: 'Lỗi',
            message: error.message || 'Có lỗi xảy ra',
            type: 'error'
          });
        }
      }
    });
  };

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

  return (
    <div className="booking-management">
      <div className="page-header-admin">
        <div>
          <h1>Quản lý Booking</h1>
          <p>Xem tất cả booking trong hệ thống</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-section">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo mã, người đặt, trạm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <Filter size={20} />
          <select value={filterStation} onChange={(e) => setFilterStation(e.target.value)}>
            <option value="">Tất cả trạm</option>
            {stations.map((station) => (
              <option key={station.station_id} value={station.station_id}>
                {station.station_name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <Filter size={20} />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            <option value="pending">Chờ xác nhận</option>
            <option value="confirmed">Đã xác nhận</option>
            <option value="charging">Đang sạc</option>
            <option value="completed">Hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>

        <div className="filter-group date-input-group">
          <label className="date-label">Start</label>
          <input
            type="date"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
          />
        </div>

        <div className="filter-group date-input-group">
          <label className="date-label">End</label>
          <input
            type="date"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{bookingStats.total}</div>
          <div className="stat-label">Tổng booking</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{bookingStats.pending}</div>
          <div className="stat-label">Chờ xác nhận</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{bookingStats.charging}</div>
          <div className="stat-label">Đang sạc</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{bookingStats.completed}</div>
          <div className="stat-label">Hoàn thành</div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <Loader2 size={32} className="animate-spin" style={{ color: '#3b82f6' }} />
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã đặt lịch</th>
                <th>Người đặt</th>
                <th>Loại xe</th>
                <th>Tên trạm</th>
                <th>Thời gian bắt đầu</th>
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
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                <tr key={booking.booking_id}>
                  <td className="id-cell">#{booking.booking_id}</td>
                  <td>
                    <div className="user-cell">
                      <User size={16} />
                      <span>{booking.user_name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="vehicle-badge">
                      {getVehicleTypeLabel(booking.vehicle_type)}
                    </span>
                  </td>
                  <td>
                    <div className="station-cell">
                      <Building2 size={16} />
                      <span>{booking.station_name}</span>
                    </div>
                  </td>
                  <td>
                    <div className="time-cell">
                      <Clock size={14} />
                      <span>{new Date(booking.start_time).toLocaleString('vi-VN')}</span>
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
                      <button
                        className="action-btn-text"
                        onClick={() => setDetailModal({ show: true, booking })}
                      >
                        Xem chi tiết
                      </button>
                      {booking.status === 'pending' && (booking as any).payment_status === 'pending' && (
                        <button
                          className="action-btn-text"
                          onClick={() => handleConfirmBooking(booking)}
                        >
                          Xác nhận
                        </button>
                      )}
                      {(booking.status === 'pending' || booking.status === 'confirmed') && (
                        <button
                          className="action-btn-text"
                          onClick={() => handleCancelBooking(booking)}
                        >
                          Hủy
                        </button>
                      )}
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
        isOpen={confirmModal.show}
        onClose={() => setConfirmModal({ ...confirmModal, show: false })}
        onConfirm={() => {
          confirmModal.onConfirm();
          setConfirmModal({ ...confirmModal, show: false });
        }}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.show}
        onClose={() => setAlertModal({ ...alertModal, show: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />

      {/* Booking Detail Modal */}
      <BookingDetailModal
        isOpen={detailModal.show}
        onClose={() => setDetailModal({ show: false, booking: null })}
        booking={detailModal.booking}
      />
    </div>
  );
};

export default BookingManagement;
