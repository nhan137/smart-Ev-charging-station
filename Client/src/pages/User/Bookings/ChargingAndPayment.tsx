import { useState, useEffect } from 'react';
import { Filter, Calendar, Eye, X } from 'lucide-react';
import { bookingService } from '../../../services/bookingService';
import { stationService } from '../../../services/stationService';
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
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stations, setStations] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load bookings from API
  useEffect(() => {
    loadBookings();
  }, [filters]);

  // Load stations for filter dropdown
  useEffect(() => {
    const loadStations = async () => {
      try {
        const response = await stationService.getAllStations();
        if (response.success && response.data) {
          const stationsData = Array.isArray(response.data) ? response.data : [];
          setStations(stationsData);
        }
      } catch (err) {
        console.error('Error loading stations:', err);
      }
    };
    loadStations();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await bookingService.getMyBookings({
        status: filters.status || undefined,
        from_date: filters.dateFrom || undefined,
        to_date: filters.dateTo || undefined,
        station_id: filters.station || undefined
      });

      if (response.success && response.data) {
        // Filter only completed/cancelled bookings for charging history
        // Backend returns booking_status, but also check status field
        const completedBookings = response.data.filter((b: any) => {
          const status = b.booking_status || b.status;
          return status === 'completed' || status === 'cancelled';
        });
        setBookings(completedBookings);
      } else {
        setError('Không thể tải lịch sử sạc');
      }
    } catch (err: any) {
      console.error('Error loading bookings:', err);
      setError(err.message || 'Không thể tải lịch sử sạc');
    } finally {
      setLoading(false);
    }
  };

  // Mock booking history data (removed - using API now)
  const oldBookings = [
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

  // Handle view detail - Load full booking data with chargingSession
  const handleViewDetail = async (booking: any) => {
    try {
      // Load full booking details from API to get chargingSession data
      const response = await bookingService.getBookingById(booking.booking_id);
      console.log('[ChargingAndPayment] getBookingById response:', response);
      if (response.success && response.data) {
        const apiData = response.data;
        
        // Backend trả về cả structured data (station_info, charging_time, energy_info, payment_info) và raw data (station, chargingSession, payment)
        // Map sang flat structure để tương thích với UI
        const fullBooking: any = {
          ...booking, // Giữ lại data từ list
          // Station info - ưu tiên structured, sau đó raw, cuối cùng là booking
          station_name: apiData.station_info?.station_name || apiData.station?.station_name || apiData.station_name || booking.station_name,
          vehicle_type: apiData.station_info?.vehicle_type || apiData.vehicle_type || booking.vehicle_type,
          // Charging time - ưu tiên structured, sau đó raw
          actual_start: apiData.charging_time?.start ? new Date(apiData.charging_time.start).toISOString() : (apiData.actual_start || booking.actual_start),
          actual_end: apiData.charging_time?.end ? new Date(apiData.charging_time.end).toISOString() : (apiData.actual_end || booking.actual_end),
          duration: apiData.charging_time?.duration || booking.duration,
          // Energy info - ưu tiên structured, sau đó chargingSession, cuối cùng là booking
          start_battery_percent: apiData.energy_info?.start_battery ?? apiData.chargingSession?.start_battery_percent ?? booking.start_battery_percent,
          end_battery_percent: apiData.energy_info?.end_battery ?? apiData.chargingSession?.end_battery_percent ?? booking.end_battery_percent,
          energy_consumed: apiData.energy_info?.energy_consumed ?? apiData.chargingSession?.energy_consumed ?? booking.energy_consumed,
          // Payment info - ưu tiên structured, sau đó payment object, cuối cùng là booking
          payment_method: apiData.payment_info?.method || apiData.payment?.method || booking.payment_method,
          payment_method_display: apiData.payment_info?.method || apiData.payment_method_display || booking.payment_method_display,
          payment_status: apiData.payment_info?.status_raw || apiData.payment?.status || apiData.payment_status || booking.payment_status,
          total_cost: apiData.payment_info?.total_amount ?? apiData.total_cost ?? booking.total_cost,
          promotion_code: apiData.payment_info?.discount_code || apiData.promotion_code || booking.promotion_code,
          // Keep chargingSession and payment for fallback
          chargingSession: apiData.chargingSession || booking.chargingSession,
          payment: apiData.payment || booking.payment
        };
        
        console.log('[ChargingAndPayment] Mapped full booking data:', fullBooking);
        setSelectedBooking(fullBooking);
      } else {
        // Fallback to original booking data
        console.warn('[ChargingAndPayment] No data in response, using original booking');
        setSelectedBooking(booking);
      }
    } catch (err: any) {
      console.error('[ChargingAndPayment] Error loading booking detail:', err);
      // Fallback to original booking data
      setSelectedBooking(booking);
    }
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
                    {stations.map((station) => (
                      <option key={station.station_id} value={station.station_id}>
                        {station.station_name}
                      </option>
                    ))}
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
          {loading ? (
            <div className="empty-state">
              <Calendar size={64} />
              <h3>Đang tải...</h3>
              <p>Vui lòng chờ trong giây lát</p>
            </div>
          ) : error ? (
            <div className="empty-state">
              <Calendar size={64} />
              <h3>Lỗi</h3>
              <p>{error}</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="empty-state">
              <Calendar size={64} />
              <h3>Chưa có lịch sử sạc</h3>
              <p>Các lần sạc của bạn sẽ hiển thị tại đây</p>
            </div>
          ) : (
            bookings.map((booking: any) => (
              <div key={booking.booking_id} className="booking-card">
                <div className="booking-header-row">
                  <div className="booking-id">
                    <span className="id-label">Mã:</span>
                    <span className="id-value">#{booking.booking_id}</span>
                  </div>
                  <div className="booking-statuses">
                    {getStatusBadge(booking.booking_status || booking.status, 'booking')}
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
                        {booking.charging_date || (booking.actual_start ? new Date(booking.actual_start).toLocaleDateString('vi-VN') : booking.start_time ? new Date(booking.start_time).toLocaleDateString('vi-VN') : 'N/A')}
                      </span>
                    </div>

                    <div className="info-item">
                      <span className="info-label">Thời lượng</span>
                      <span className="info-value">
                        {booking.duration || (booking.actual_start && booking.actual_end ? getDuration(booking.actual_start, booking.actual_end) : 'N/A')}
                      </span>
                    </div>

                    <div className="info-item">
                      <span className="info-label">% pin</span>
                      <span className="info-value">
                        {booking.battery_range || (booking.start_battery_percent !== undefined && booking.end_battery_percent !== undefined ? `${booking.start_battery_percent}% → ${booking.end_battery_percent}%` : 'N/A')}
                      </span>
                    </div>

                    <div className="info-item">
                      <span className="info-label">Năng lượng</span>
                      <span className="info-value">{booking.energy_consumed ? `${booking.energy_consumed} kWh` : 'N/A'}</span>
                    </div>

                    <div className="info-item">
                      <span className="info-label">Phương thức TT</span>
                      <span className="info-value">{booking.payment_method_display || booking.payment_method || 'N/A'}</span>
                    </div>

                    <div className="info-item highlight">
                      <span className="info-label">Tổng tiền</span>
                      <span className="info-value total">{booking.total_cost ? booking.total_cost.toLocaleString('vi-VN') + 'đ' : 'N/A'}</span>
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
                  <span>{selectedBooking.station_name || selectedBooking.station?.station_name || 'N/A'}</span>
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
                  <span>{selectedBooking.actual_start ? new Date(selectedBooking.actual_start).toLocaleString('vi-VN') : (selectedBooking.start_time ? new Date(selectedBooking.start_time).toLocaleString('vi-VN') : 'N/A')}</span>
                </div>
                <div className="modal-info-item">
                  <span>Kết thúc:</span>
                  <span>{selectedBooking.actual_end ? new Date(selectedBooking.actual_end).toLocaleString('vi-VN') : (selectedBooking.end_time ? new Date(selectedBooking.end_time).toLocaleString('vi-VN') : 'N/A')}</span>
                </div>
                <div className="modal-info-item">
                  <span>Thời lượng:</span>
                  <span>{selectedBooking.duration || (selectedBooking.actual_start && selectedBooking.actual_end ? getDuration(selectedBooking.actual_start, selectedBooking.actual_end) : 'N/A')}</span>
                </div>
              </div>
            </div>

            <div className="modal-section">
              <h3>Năng lượng</h3>
              <div className="modal-info-grid">
                <div className="modal-info-item">
                  <span>Pin ban đầu:</span>
                  <span>
                    {selectedBooking.start_battery_percent !== undefined && selectedBooking.start_battery_percent !== null
                      ? `${selectedBooking.start_battery_percent}%`
                      : (selectedBooking.chargingSession?.start_battery_percent !== undefined
                        ? `${selectedBooking.chargingSession.start_battery_percent}%`
                        : 'N/A')}
                  </span>
                </div>
                <div className="modal-info-item">
                  <span>Pin sau sạc:</span>
                  <span>
                    {selectedBooking.end_battery_percent !== undefined && selectedBooking.end_battery_percent !== null
                      ? `${selectedBooking.end_battery_percent}%`
                      : (selectedBooking.chargingSession?.end_battery_percent !== undefined
                        ? `${selectedBooking.chargingSession.end_battery_percent}%`
                        : 'N/A')}
                  </span>
                </div>
                <div className="modal-info-item">
                  <span>Năng lượng tiêu thụ:</span>
                  <span>
                    {selectedBooking.energy_consumed !== undefined && selectedBooking.energy_consumed !== null
                      ? `${selectedBooking.energy_consumed} kWh`
                      : (selectedBooking.chargingSession?.energy_consumed !== undefined && selectedBooking.chargingSession?.energy_consumed !== null
                        ? `${selectedBooking.chargingSession.energy_consumed} kWh`
                        : 'N/A')}
                  </span>
                </div>
              </div>
            </div>

            <div className="modal-section">
              <h3>Thanh toán</h3>
              <div className="modal-info-grid">
                <div className="modal-info-item">
                  <span>Phương thức:</span>
                  <span>
                    {selectedBooking.payment_method_display 
                      || selectedBooking.payment_method 
                      || selectedBooking.payment?.method 
                      || 'N/A'}
                  </span>
                </div>
                <div className="modal-info-item">
                  <span>Trạng thái:</span>
                  {selectedBooking.payment_status || selectedBooking.payment?.status
                    ? getStatusBadge(selectedBooking.payment_status || selectedBooking.payment?.status, 'payment')
                    : <span>N/A</span>}
                </div>
                {selectedBooking.promotion_code && (
                  <div className="modal-info-item">
                    <span>Mã giảm giá:</span>
                    <span>{selectedBooking.promotion_code}</span>
                  </div>
                )}
                <div className="modal-info-item highlight">
                  <span>Tổng tiền:</span>
                  <span className="total-value">{selectedBooking.total_cost ? selectedBooking.total_cost.toLocaleString('vi-VN') + 'đ' : 'N/A'}</span>
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
