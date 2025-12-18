import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Car, Clock, DollarSign, Filter } from 'lucide-react';
import { mockStations } from '../../services/mockData';
import ConfirmModal from '../../components/shared/ConfirmModal';
import AlertModal from '../../components/shared/AlertModal';
import { generateConfirmationCode, saveConfirmationCode } from '../../services/emailService';
import { sendBookingConfirmationNotification } from '../../services/notificationService';
import './StationBookings.css';

const StationBookings = () => {
  const { station_id } = useParams();
  const navigate = useNavigate();
  const [station, setStation] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
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
  }, [station_id]);

  const loadData = () => {
    // Load station
    const foundStation = mockStations.find(s => s.station_id === Number(station_id));
    setStation(foundStation);

    // Mock bookings data
    const mockBookings = [
      {
        booking_id: 1,
        user_id: 1,
        user_name: 'Nguyễn Văn A',
        user_email: 'nguyenvana@email.com',
        vehicle_type: 'oto_ccs',
        start_time: '2025-01-20T14:00:00',
        end_time: '2025-01-20T16:00:00',
        status: 'pending',
        total_cost: 105000
      },
      {
        booking_id: 2,
        user_id: 1,
        user_name: 'Trần Thị B',
        user_email: 'tranthib@email.com',
        vehicle_type: 'xe_may_ccs',
        start_time: '2025-01-21T09:00:00',
        end_time: '2025-01-21T10:00:00',
        status: 'confirmed',
        total_cost: 32000
      },
      {
        booking_id: 3,
        user_id: 1,
        user_name: 'Lê Văn C',
        user_email: 'levanc@email.com',
        vehicle_type: 'xe_may_usb',
        start_time: '2025-01-19T16:00:00',
        end_time: '2025-01-19T17:00:00',
        status: 'completed',
        total_cost: 15000
      }
    ];
    setBookings(mockBookings);
  };

  const filteredBookings = bookings.filter(booking => {
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
          station?.station_name || ''
        );

        setAlertModal({
          show: true,
          title: 'Xác nhận thành công!',
          message: `Đã xác nhận booking #${confirmAction.bookingId}. Mã xác nhận ${confirmationCode} đã được gửi qua thông báo cho ${booking.user_name}`,
          type: 'success'
        });
      } else {
        const actionLabels: any = {
          cancel: 'hủy',
          complete: 'hoàn tất'
        };

        setAlertModal({
          show: true,
          title: 'Thành công!',
          message: `Đã ${actionLabels[confirmAction.type]} booking #${confirmAction.bookingId}`,
          type: 'success'
        });
      }

      // Reload bookings
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
                        <button
                          className="action-btn-text"
                          onClick={() => handleAction('cancel', booking.booking_id)}
                        >
                          Hủy
                        </button>
                      )}
                      {booking.status === 'charging' && (
                        <button
                          className="action-btn-text"
                          onClick={() => handleAction('complete', booking.booking_id)}
                        >
                          Hoàn tất
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
