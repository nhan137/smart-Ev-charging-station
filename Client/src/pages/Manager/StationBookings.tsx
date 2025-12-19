import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Car, Clock, DollarSign, Filter, Loader2 } from 'lucide-react';
import { managerService } from '../../services/managerService';
import { stationService } from '../../services/stationService';
import ConfirmModal from '../../components/shared/ConfirmModal';
import AlertModal from '../../components/shared/AlertModal';
import './StationBookings.css';

const StationBookings = () => {
  const { station_id } = useParams();
  const navigate = useNavigate();
  const [station, setStation] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
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
    if (station_id) {
      loadStation();
      loadBookings();
    }
  }, [station_id, filterStatus, filterStartDate, filterEndDate]);

  const loadStation = async () => {
    try {
      const response = await stationService.getStationById(Number(station_id));
      if (response.success && response.data) {
        setStation(response.data.station);
      }
    } catch (error: any) {
      console.error('Error loading station:', error);
    }
  };

  const loadBookings = async () => {
    if (!station_id) return;
    
    try {
      setLoading(true);
      const response = await managerService.getStationBookings(Number(station_id), {
        status: filterStatus || undefined,
        start_date: filterStartDate || undefined,
        end_date: filterEndDate || undefined
      });
      
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
        message: error.message || 'Không thể tải danh sách đặt lịch',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtering is handled by API, so no need to filter again
  const filteredBookings = bookings;

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
      
      if (confirmAction.type === 'confirm') {
        // Call API to confirm booking
        const response = await managerService.confirmBooking(confirmAction.bookingId);
        
        if (response.success) {
          setAlertModal({
            show: true,
            title: 'Xác nhận thành công!',
            message: response.message || `Đã xác nhận booking #${confirmAction.bookingId}. Mã xác nhận đã được gửi cho khách hàng.`,
            type: 'success'
          });
        }
      } else if (confirmAction.type === 'cancel') {
        // Call API to cancel booking
        const response = await managerService.cancelBooking(confirmAction.bookingId);
        
        if (response.success) {
          setAlertModal({
            show: true,
            title: 'Hủy thành công!',
            message: response.message || `Đã hủy booking #${confirmAction.bookingId}`,
            type: 'success'
          });
        }
      }

      // Reload bookings
      await loadBookings();
    } catch (error: any) {
      setAlertModal({
        show: true,
        title: 'Lỗi',
        message: error.message || 'Có lỗi xảy ra',
        type: 'error'
      });
    } finally {
      setConfirmAction(null);
      setShowConfirmModal(false);
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
        message: 'Bạn có chắc chắn muốn hủy booking này? Hành động này không thể hoàn tác.',
        type: 'danger' as const
      },
      complete: {
        title: 'Hoàn tất booking?',
        message: 'Xác nhận rằng khách hàng đã hoàn thành sạc xe?',
        type: 'info' as const
      }
    };

    return contents[confirmAction.type] || contents.confirm;
  };

  return (
    <div className="station-bookings">
      <div className="page-header-manager">
        <div>
          <button className="back-btn" onClick={() => navigate('/manager/stations')}>
            <ArrowLeft size={20} />
            <span>Quay lại</span>
          </button>
          <h1>{station?.station_name}</h1>
          <p>Quản lý booking tại trạm</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-section">
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
          <label className="date-label">Start</label>
          <input
            type="date"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
            placeholder="dd/mm/yyyy"
          />
        </div>

        <div className="filter-group date-input-group">
          <label className="date-label">End</label>
          <input
            type="date"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
            placeholder="dd/mm/yyyy"
          />
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã booking</th>
              <th>Tên khách</th>
              <th>Loại xe</th>
              <th>Thời gian bắt đầu</th>
              <th>Thời gian kết thúc</th>
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
                    <div className="vehicle-cell">
                      <Car size={16} />
                      <span>{getVehicleTypeLabel(booking.vehicle_type)}</span>
                    </div>
                  </td>
                  <td>
                    <div className="time-cell">
                      <Clock size={14} />
                      <span>{new Date(booking.start_time).toLocaleString('vi-VN')}</span>
                    </div>
                  </td>
                  <td>
                    <div className="time-cell">
                      <Clock size={14} />
                      <span>{new Date(booking.end_time).toLocaleString('vi-VN')}</span>
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
                        <span className="action-status-text action-status-approved">
                          Đã phê duyệt
                        </span>
                      )}

                      {booking.status === 'cancelled' && (
                        <span className="action-status-text action-status-cancelled">
                          Đã hủy
                        </span>
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

export default StationBookings;
