import { useState } from 'react';
import { Filter, Calendar, Eye, X } from 'lucide-react';
import './ChargingAndPayment.css';

const ChargingAndPayment = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    station: '',
    status: ''
  });
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Mock booking history data
  const bookings = [
    {
      booking_id: 1,
      station_name: 'Trạm sạc Hải Châu',
      vehicle_type: 'oto_ccs',
      start_time: '2025-01-15T14:05:00',
      actual_start: '2025-01-15T14:05:00',
      actual_end: '2025-01-15T15:25:00',
      start_battery_percent: 20,
      end_battery_percent: 80,
      energy_consumed: 30,
      total_cost: 84000,
      payment_method: 'QR',
      booking_status: 'completed',
      payment_status: 'success',
      promotion_code: 'GIAM20'
    },
    {
      booking_id: 2,
      station_name: 'Trạm sạc Sơn Trà Premium',
      vehicle_type: 'xe_may_ccs',
      start_time: '2025-01-10T09:30:00',
      actual_start: '2025-01-10T09:30:00',
      actual_end: '2025-01-10T10:15:00',
      start_battery_percent: 15,
      end_battery_percent: 90,
      energy_consumed: 7.5,
      total_cost: 24000,
      payment_method: 'Bank',
      booking_status: 'completed',
      payment_status: 'success',
      promotion_code: null
    },
    {
      booking_id: 3,
      station_name: 'Trạm sạc Ngũ Hành Sơn',
      vehicle_type: 'xe_may_usb',
      start_time: '2025-01-05T16:00:00',
      actual_start: '2025-01-05T16:00:00',
      actual_end: '2025-01-05T16:30:00',
      start_battery_percent: 30,
      end_battery_percent: 100,
      energy_consumed: 3.5,
      total_cost: 10500,
      payment_method: 'QR',
      booking_status: 'completed',
      payment_status: 'success',
      promotion_code: null
    }
  ];

  // Get vehicle type label
  const getVehicleTypeLabel = (type: string) => {
    const typeMap: any = {
      'xe_may_usb': 'Xe máy USB',
      'xe_may_ccs': 'Xe máy CCS',
      'oto_ccs': 'Ô tô CCS'
    };
    return typeMap[type] || type;
  };

  // Calculate duration
  const getDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Get status badge
  const getStatusBadge = (status: string, type: 'booking' | 'payment') => {
    const statusConfig: any = {
      booking: {
        completed: { label: 'Hoàn thành', class: 'status-success' },
        cancelled: { label: 'Đã hủy', class: 'status-cancelled' },
        charging: { label: 'Đang sạc', class: 'status-charging' }
      },
      payment: {
        success: { label: 'Thành công', class: 'status-success' },
        failed: { label: 'Thất bại', class: 'status-failed' },
        pending: { label: 'Chờ xử lý', class: 'status-pending' }
      }
    };
    
    const config = statusConfig[type][status] || { label: status, class: '' };
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  // Handle view detail
  const handleViewDetail = (booking: any) => {
    setSelectedBooking(booking);
    setShowDetailModal(true);
  };

  return (
    <div className="booking-history-page">
      <div className="history-container">
        <div className="history-header">
          <h1>Lịch sử sạc & thanh toán</h1>
          <p>Xem lại tất cả các lần sạc đã thực hiện</p>
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
                    <option value="completed">Hoàn thành</option>
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
              <h3>Chưa có lịch sử sạc</h3>
              <p>Các lần sạc của bạn sẽ hiển thị tại đây</p>
            </div>
          ) : (
            bookings.map((booking) => (
              <div key={booking.booking_id} className="booking-card">
                <div className="booking-header-row">
                  <div className="booking-id">
                    <span className="id-label">Mã:</span>
                    <span className="id-value">#{booking.booking_id}</span>
                  </div>
                  <div className="booking-statuses">
                    {getStatusBadge(booking.booking_status, 'booking')}
                    {getStatusBadge(booking.payment_status, 'payment')}
                  </div>
                </div>

                <div className="booking-content">
                  <div className="booking-info-grid">
                    <div className="info-item">
                      <span className="info-label">Trạm sạc</span>
                      <span className="info-value">{booking.station_name}</span>
                    </div>

                    <div className="info-item">
                      <span className="info-label">Loại xe</span>
                      <span className="info-value">{getVehicleTypeLabel(booking.vehicle_type)}</span>
                    </div>

                    <div className="info-item">
                      <span className="info-label">Ngày sạc</span>
                      <span className="info-value">
                        {new Date(booking.start_time).toLocaleDateString('vi-VN')}
                      </span>
                    </div>

                    <div className="info-item">
                      <span className="info-label">Thời lượng</span>
                      <span className="info-value">
                        {getDuration(booking.actual_start, booking.actual_end)}
                      </span>
                    </div>

                    <div className="info-item">
                      <span className="info-label">% pin</span>
                      <span className="info-value">
                        {booking.start_battery_percent}% → {booking.end_battery_percent}%
                      </span>
                    </div>

                    <div className="info-item">
                      <span className="info-label">Năng lượng</span>
                      <span className="info-value">{booking.energy_consumed} kWh</span>
                    </div>

                    <div className="info-item">
                      <span className="info-label">Phương thức TT</span>
                      <span className="info-value">{booking.payment_method}</span>
                    </div>

                    <div className="info-item highlight">
                      <span className="info-label">Tổng tiền</span>
                      <span className="info-value total">{booking.total_cost.toLocaleString()}đ</span>
                    </div>
                  </div>
                </div>

                <div className="booking-actions">
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
                  <span>Loại xe:</span>
                  <span>{getVehicleTypeLabel(selectedBooking.vehicle_type)}</span>
                </div>
              </div>
            </div>

            <div className="modal-section">
              <h3>Thời gian sạc</h3>
              <div className="modal-info-grid">
                <div className="modal-info-item">
                  <span>Bắt đầu:</span>
                  <span>{new Date(selectedBooking.actual_start).toLocaleString('vi-VN')}</span>
                </div>
                <div className="modal-info-item">
                  <span>Kết thúc:</span>
                  <span>{new Date(selectedBooking.actual_end).toLocaleString('vi-VN')}</span>
                </div>
                <div className="modal-info-item">
                  <span>Thời lượng:</span>
                  <span>{getDuration(selectedBooking.actual_start, selectedBooking.actual_end)}</span>
                </div>
              </div>
            </div>

            <div className="modal-section">
              <h3>Năng lượng</h3>
              <div className="modal-info-grid">
                <div className="modal-info-item">
                  <span>Pin ban đầu:</span>
                  <span>{selectedBooking.start_battery_percent}%</span>
                </div>
                <div className="modal-info-item">
                  <span>Pin sau sạc:</span>
                  <span>{selectedBooking.end_battery_percent}%</span>
                </div>
                <div className="modal-info-item">
                  <span>Năng lượng tiêu thụ:</span>
                  <span>{selectedBooking.energy_consumed} kWh</span>
                </div>
              </div>
            </div>

            <div className="modal-section">
              <h3>Thanh toán</h3>
              <div className="modal-info-grid">
                <div className="modal-info-item">
                  <span>Phương thức:</span>
                  <span>{selectedBooking.payment_method}</span>
                </div>
                <div className="modal-info-item">
                  <span>Trạng thái:</span>
                  {getStatusBadge(selectedBooking.payment_status, 'payment')}
                </div>
                {selectedBooking.promotion_code && (
                  <div className="modal-info-item">
                    <span>Mã giảm giá:</span>
                    <span>{selectedBooking.promotion_code}</span>
                  </div>
                )}
                <div className="modal-info-item highlight">
                  <span>Tổng tiền:</span>
                  <span className="total-value">{selectedBooking.total_cost.toLocaleString()}đ</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChargingAndPayment;
