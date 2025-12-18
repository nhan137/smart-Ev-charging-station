import { useState, useEffect } from 'react';
import { Filter, Search, Calendar, User, Building2, Clock, DollarSign } from 'lucide-react';
import { mockStations } from '../../services/mockData';
import ConfirmModal from '../../components/shared/ConfirmModal';
import AlertModal from '../../components/shared/AlertModal';
import BookingDetailModal from '../User/components/BookingDetailModal';
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
  const [filterStation, setFilterStation] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
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
  }, []);

  const loadBookings = () => {
    // Mock data with additional fields
    const mockBookings: Booking[] = [
      {
        booking_id: 1,
        user_id: 1,
        user_name: 'Nguyễn Văn A',
        station_id: 1,
        station_name: 'Trạm sạc Hải Châu',
        vehicle_type: 'oto_ccs',
        start_time: '2025-01-20T14:00:00',
        end_time: '2025-01-20T16:00:00',
        status: 'pending',
        total_cost: 105000,
        payment_status: 'pending',
        payment_method: 'QR',
        created_at: '2025-01-19T10:00:00',
        updated_at: '2025-01-19T10:00:00'
      } as any,
      {
        booking_id: 2,
        user_id: 2,
        user_name: 'Trần Thị B',
        station_id: 2,
        station_name: 'Trạm sạc Sơn Trà Premium',
        vehicle_type: 'xe_may_ccs',
        start_time: '2025-01-21T09:00:00',
        end_time: '2025-01-21T10:00:00',
        status: 'confirmed',
        total_cost: 32000,
        payment_status: 'pending',
        payment_method: 'Bank',
        created_at: '2025-01-20T08:00:00',
        updated_at: '2025-01-20T08:30:00'
      } as any,
      {
        booking_id: 3,
        user_id: 3,
        user_name: 'Lê Văn C',
        station_id: 1,
        station_name: 'Trạm sạc Hải Châu',
        vehicle_type: 'xe_may_usb',
        start_time: '2025-01-19T16:00:00',
        end_time: '2025-01-19T17:00:00',
        status: 'completed',
        total_cost: 15000,
        payment_status: 'paid',
        payment_method: 'QR',
        start_battery: 20,
        end_battery: 85,
        energy_consumed: 30,
        created_at: '2025-01-18T14:00:00',
        updated_at: '2025-01-19T17:00:00'
      } as any,
      {
        booking_id: 4,
        user_id: 1,
        user_name: 'Nguyễn Văn A',
        station_id: 3,
        station_name: 'Trạm sạc Ngũ Hành Sơn',
        vehicle_type: 'oto_ccs',
        start_time: '2025-01-22T10:00:00',
        end_time: '2025-01-22T12:00:00',
        status: 'charging',
        total_cost: 90000,
        payment_status: 'pending',
        payment_method: 'QR',
        promotion_code: 'SUMMER10',
        created_at: '2025-01-21T09:00:00',
        updated_at: '2025-01-22T10:00:00'
      } as any,
      {
        booking_id: 5,
        user_id: 2,
        user_name: 'Trần Thị B',
        station_id: 2,
        station_name: 'Trạm sạc Sơn Trà Premium',
        vehicle_type: 'xe_may_usb',
        start_time: '2025-01-18T15:00:00',
        end_time: '2025-01-18T16:00:00',
        status: 'cancelled',
        total_cost: 12000,
        payment_status: 'failed',
        payment_method: 'Bank',
        created_at: '2025-01-17T14:00:00',
        updated_at: '2025-01-18T14:30:00'
      } as any
    ];
    setBookings(mockBookings);
  };

  const filteredBookings = bookings.filter(booking => {
    if (filterStation && booking.station_id !== Number(filterStation)) return false;
    if (filterStatus && booking.status !== filterStatus) return false;
    
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

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        booking.user_name.toLowerCase().includes(query) ||
        booking.station_name.toLowerCase().includes(query) ||
        booking.booking_id.toString().includes(query)
      );
    }
    
    return true;
  });

  const handleConfirmBooking = (booking: Booking) => {
    setConfirmModal({
      show: true,
      title: 'Xác nhận booking?',
      message: `Bạn có chắc chắn muốn xác nhận booking #${booking.booking_id} của ${booking.user_name}?`,
      type: 'info',
      onConfirm: async () => {
        try {
          // TODO: Call API
          // await bookingService.confirmBooking(booking.booking_id);
          
          setAlertModal({
            show: true,
            title: 'Thành công!',
            message: `Đã xác nhận booking #${booking.booking_id}`,
            type: 'success'
          });
          loadBookings();
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
          // TODO: Call API
          // await bookingService.cancelBooking(booking.booking_id);
          
          setAlertModal({
            show: true,
            title: 'Thành công!',
            message: `Đã hủy booking #${booking.booking_id}`,
            type: 'success'
          });
          loadBookings();
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
            {mockStations.map((station) => (
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
          <div className="stat-value">{bookings.length}</div>
          <div className="stat-label">Tổng booking</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{bookings.filter(b => b.status === 'pending').length}</div>
          <div className="stat-label">Chờ xác nhận</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{bookings.filter(b => b.status === 'charging').length}</div>
          <div className="stat-label">Đang sạc</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{bookings.filter(b => b.status === 'completed').length}</div>
          <div className="stat-label">Hoàn thành</div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
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
