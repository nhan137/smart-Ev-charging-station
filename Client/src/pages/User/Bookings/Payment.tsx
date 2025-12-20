import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle, CreditCard, QrCode, Building2, Clock, Battery, Zap, DollarSign, Tag, ArrowLeft, Loader2, XCircle } from 'lucide-react';
import AlertModal from '../../../components/shared/AlertModal';
import { bookingService } from '../../../services/bookingService';
import { paymentService } from '../../../services/paymentService';
import './Payment.css';

const Payment = () => {
  const navigate = useNavigate();
  const { booking_id } = useParams();
  const [searchParams] = useSearchParams();
  
  const [paymentMethod, setPaymentMethod] = useState<'QR' | 'Bank'>('Bank'); // Default to Bank (VNPay)
  const [loading, setLoading] = useState(false);
  const [loadingBooking, setLoadingBooking] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [alertModal, setAlertModal] = useState<{ show: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
    show: false,
    title: '',
    message: '',
    type: 'success'
  });
  const [showPaymentSuccessModal, setShowPaymentSuccessModal] = useState(false);
  const [showPaymentFailedModal, setShowPaymentFailedModal] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{ status: string; message?: string; error_code?: string } | null>(null);

  // Check for payment callback from VNPay
  useEffect(() => {
    const paymentStatus = searchParams.get('payment_status');
    const errorCode = searchParams.get('error_code');
    const errorMessage = searchParams.get('message');
    const paymentId = searchParams.get('payment_id');

    if (paymentStatus === 'success') {
      setPaymentResult({
        status: 'success',
        message: 'Thanh toán thành công!'
      });
      setShowPaymentSuccessModal(true);
      // Remove query params from URL
      window.history.replaceState({}, '', window.location.pathname);
      // Lỗi 4: Redirect to Notification screen after payment success
      setTimeout(() => {
        navigate('/user/notifications');
      }, 2000);
    } else if (paymentStatus === 'failed') {
      setPaymentResult({
        status: 'failed',
        message: errorMessage || 'Thanh toán thất bại',
        error_code: errorCode || undefined
      });
      setShowPaymentFailedModal(true);
      // Remove query params from URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams]);

  // Load booking data from backend
  useEffect(() => {
    const loadBooking = async () => {
      if (!booking_id) {
        setAlertModal({
          show: true,
          title: 'Lỗi',
          message: 'Không tìm thấy mã đặt lịch',
          type: 'error'
        });
        setLoadingBooking(false);
        return;
      }

      try {
        setLoadingBooking(true);
        const response = await bookingService.getBookingById(parseInt(booking_id));
        
        if (response.success && response.data) {
          const bookingData = response.data;
          
          // Backend returns both structured data and raw data
          // Use structured data if available, otherwise fallback to raw data
          const stationInfo = bookingData.station_info || {};
          const chargingTime = bookingData.charging_time || {};
          const energyInfo = bookingData.energy_info || {};
          const paymentInfo = bookingData.payment_info || {};
          
          // Get actual cost from payment_info (already has discount applied) or calculate
          const originalCost = paymentInfo.original_amount || bookingData.chargingSession?.actual_cost 
            ? parseFloat(bookingData.chargingSession?.actual_cost || paymentInfo.original_amount)
            : (bookingData.total_cost ? parseFloat(bookingData.total_cost) : 0);
          
          // Get discount from payment_info or calculate
          const discountAmount = paymentInfo.discount_amount || 0;
          const finalCost = paymentInfo.total_amount || (originalCost - discountAmount);
          
          // Get dates from charging_time or fallback to raw data
          // Parse dates from formatted string or use raw dates
          const parseDate = (dateStr: string | Date | null | undefined): Date | null => {
            if (!dateStr) return null;
            if (dateStr instanceof Date) return dateStr;
            if (typeof dateStr === 'string') {
              // Try parsing formatted date string (HH:mm:ss DD/MM/YYYY)
              const match = dateStr.match(/(\d{2}):(\d{2}):(\d{2})\s+(\d{2})\/(\d{2})\/(\d{4})/);
              if (match) {
                const [, hours, minutes, seconds, day, month, year] = match;
                return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), parseInt(seconds));
              }
              // Try ISO date string
              const parsed = new Date(dateStr);
              if (!isNaN(parsed.getTime())) return parsed;
            }
            return null;
          };
          
          const actualStart = parseDate(chargingTime.start) || 
                             bookingData.chargingSession?.started_at || 
                             bookingData.actual_start || 
                             bookingData.start_time;
          const actualEnd = parseDate(chargingTime.end) || 
                           bookingData.chargingSession?.ended_at || 
                           bookingData.actual_end || 
                           bookingData.end_time;
          
          const formattedBooking = {
            booking_id: bookingData.booking_id,
            station_name: stationInfo.station_name || bookingData.station?.station_name || 'N/A',
            vehicle_type: bookingData.vehicle_type || stationInfo.vehicle_type || null,
            actual_start: actualStart,
            actual_end: actualEnd,
            start_battery_percent: energyInfo.start_battery ?? bookingData.chargingSession?.start_battery_percent ?? null,
            end_battery_percent: energyInfo.end_battery ?? bookingData.chargingSession?.end_battery_percent ?? null,
            energy_consumed: energyInfo.energy_consumed ?? bookingData.chargingSession?.energy_consumed ?? 0,
            price_per_kwh: bookingData.price_per_kwh ?? bookingData.station?.price_per_kwh ?? 0,
            promotion_code: paymentInfo.discount_code || bookingData.promotion?.code || null,
            discount_percent: bookingData.promotion?.discount_percent || 0,
            max_discount: bookingData.promotion?.max_discount || 0,
            original_cost: originalCost,
            discount_amount: discountAmount,
            total_cost: finalCost
          };
          
          console.log('[Payment] Formatted booking:', formattedBooking);
          console.log('[Payment] Raw booking data:', bookingData);
          
          setBooking(formattedBooking);
        } else {
          throw new Error('Không tìm thấy thông tin đặt lịch');
        }
      } catch (error: any) {
        console.error('Error loading booking:', error);
        setAlertModal({
          show: true,
          title: 'Lỗi',
          message: error.message || 'Không thể tải thông tin đặt lịch',
          type: 'error'
        });
      } finally {
        setLoadingBooking(false);
      }
    };

    loadBooking();
  }, [booking_id]);

  // Get vehicle type label
  const getVehicleTypeLabel = (type: string) => {
    const typeMap: any = {
      'xe_may_usb': 'Xe máy (USB/Type 2)',
      'xe_may_ccs': 'Xe máy (CCS)',
      'oto_ccs': 'Ô tô (CCS)'
    };
    return typeMap[type] || type;
  };

  // Calculate charging duration (Lỗi 3: Handle null dates)
  const getChargingDuration = () => {
    if (!booking.actual_start || !booking.actual_end) return 'N/A';
    try {
      const start = new Date(booking.actual_start);
      const end = new Date(booking.actual_end);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'N/A';
      const diffMs = end.getTime() - start.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const hours = Math.floor(diffMins / 60);
      const minutes = diffMins % 60;
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    } catch (e) {
      return 'N/A';
    }
  };

  const handlePayment = async () => {
    if (!booking_id || !booking) {
      setAlertModal({
        show: true,
        title: 'Lỗi',
        message: 'Thông tin đặt lịch không hợp lệ',
        type: 'error'
      });
      return;
    }

    setLoading(true);

    try {
      // Initialize VNPay payment
      const response = await paymentService.vnpayInit(parseInt(booking_id));
      
      if (response.success && response.data?.redirect_url) {
        // Redirect to VNPay payment page
        window.location.href = response.data.redirect_url;
      } else {
        throw new Error('Không thể khởi tạo thanh toán');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      setAlertModal({
        show: true,
        title: 'Lỗi',
        message: error.message || 'Thanh toán thất bại, vui lòng thử lại',
        type: 'error'
      });
      setLoading(false);
    }
  };

  if (loadingBooking) {
    return (
      <div className="payment-page">
        <div className="payment-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Loader2 size={48} className="animate-spin" style={{ color: '#10b981' }} />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="payment-page">
        <div className="payment-container">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Không tìm thấy thông tin đặt lịch</p>
            <button onClick={() => navigate('/bookings/history')} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              Về lịch sử đặt lịch
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="payment-container">
        <div className="payment-header">
          <CheckCircle size={64} className="success-icon" />
          <h1>Thanh toán</h1>
          <p className="booking-code">Mã đặt lịch: #{booking.booking_id}</p>
        </div>

        {/* Booking Details */}
        <div className="payment-section">
          <h2>Thông tin đặt lịch</h2>
          
          <div className="detail-grid">
            <div className="detail-item">
              <div className="detail-icon">
                <Building2 size={20} />
              </div>
              <div className="detail-content">
                <span className="detail-label">Trạm sạc</span>
                <span className="detail-value">{booking.station_name}</span>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon">
                <CreditCard size={20} />
              </div>
              <div className="detail-content">
                <span className="detail-label">Loại xe</span>
                <span className="detail-value">{getVehicleTypeLabel(booking.vehicle_type)}</span>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon">
                <Clock size={20} />
              </div>
              <div className="detail-content">
                <span className="detail-label">Thời gian sạc</span>
                <span className="detail-value">
                  {booking.actual_start ? (() => {
                    try {
                      const startDate = booking.actual_start instanceof Date 
                        ? booking.actual_start 
                        : new Date(booking.actual_start);
                      const endDate = booking.actual_end 
                        ? (booking.actual_end instanceof Date 
                            ? booking.actual_end 
                            : new Date(booking.actual_end))
                        : null;
                      
                      if (isNaN(startDate.getTime())) return 'N/A';
                      
                      return (
                        <>
                          {startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          {' - '}
                          {endDate && !isNaN(endDate.getTime()) 
                            ? endDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                            : 'Đang sạc'}
                          {' '}({getChargingDuration()})
                        </>
                      );
                    } catch (e) {
                      console.error('[Payment] Error parsing dates:', e);
                      return 'N/A';
                    }
                  })() : 'N/A'}
                </span>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon">
                <Battery size={20} />
              </div>
              <div className="detail-content">
                <span className="detail-label">% pin</span>
                <span className="detail-value">
                  {booking.start_battery_percent !== null && booking.start_battery_percent !== undefined && 
                   booking.end_battery_percent !== null && booking.end_battery_percent !== undefined
                    ? `${booking.start_battery_percent}% → ${booking.end_battery_percent}%`
                    : 'N/A'}
                </span>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon">
                <Zap size={20} />
              </div>
              <div className="detail-content">
                <span className="detail-label">Năng lượng tiêu thụ</span>
                <span className="detail-value">{booking.energy_consumed > 0 ? `${booking.energy_consumed} kWh` : 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="payment-section">
          <h2>Chi tiết giá</h2>
          
          <div className="cost-breakdown">
            <div className="cost-row">
              <span>Giá gốc</span>
              <span className="cost-value">{booking.original_cost > 0 ? booking.original_cost.toLocaleString('vi-VN') + 'đ' : 'N/A'}</span>
            </div>
            <div className="cost-detail">
              {booking.energy_consumed > 0 && booking.price_per_kwh > 0 
                ? `${booking.energy_consumed} kWh × ${booking.price_per_kwh.toLocaleString('vi-VN')}đ/kWh`
                : 'N/A'}
            </div>

            {booking.promotion_code && (
              <>
                <div className="cost-row discount-row">
                  <div className="discount-label">
                    <Tag size={18} />
                    <span>Mã giảm giá: {booking.promotion_code}</span>
                  </div>
                  <span className="discount-value">-{booking.discount_amount > 0 ? booking.discount_amount.toLocaleString('vi-VN') + 'đ' : '0đ'}</span>
                </div>
                <div className="cost-detail">
                  Giảm {booking.discount_percent}% {booking.max_discount > 0 ? `(tối đa ${booking.max_discount.toLocaleString('vi-VN')}đ)` : ''}
                </div>
              </>
            )}

            <div className="cost-divider"></div>

            <div className="cost-row total-row">
              <span>Tổng thanh toán</span>
              <span className="total-value">{booking.total_cost > 0 ? booking.total_cost.toLocaleString('vi-VN') + 'đ' : 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="payment-section">
          <h2>Phương thức thanh toán</h2>
          
          <div className="payment-methods">
            <label className={`payment-method-card ${paymentMethod === 'QR' ? 'active' : ''}`}>
              <input
                type="radio"
                name="payment"
                value="QR"
                checked={paymentMethod === 'QR'}
                onChange={() => setPaymentMethod('QR')}
              />
              <div className="method-content">
                <QrCode size={32} />
                <div className="method-info">
                  <span className="method-name">Quét mã QR</span>
                  <span className="method-desc">Thanh toán qua ví điện tử</span>
                </div>
              </div>
            </label>

            <label className={`payment-method-card ${paymentMethod === 'Bank' ? 'active' : ''}`}>
              <input
                type="radio"
                name="payment"
                value="Bank"
                checked={paymentMethod === 'Bank'}
                onChange={() => setPaymentMethod('Bank')}
              />
              <div className="method-content">
                <Building2 size={32} />
                <div className="method-info">
                  <span className="method-name">Chuyển khoản ngân hàng</span>
                  <span className="method-desc">Chuyển khoản trực tiếp</span>
                </div>
              </div>
            </label>
          </div>

          {/* Payment Details */}
          {paymentMethod === 'QR' && (
            <div className="payment-details qr-section">
              <div className="qr-code-container">
                <img 
                  src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PAYMENT_MOCK_QR_CODE" 
                  alt="QR Code"
                  className="qr-code"
                />
              </div>
              <p className="payment-instruction">
                Quét mã QR bằng ứng dụng ngân hàng hoặc ví điện tử để thanh toán
              </p>
              <div className="payment-note">
                <strong>Lưu ý:</strong> Đây là mã QR mô phỏng cho mục đích demo
              </div>
            </div>
          )}

          {paymentMethod === 'Bank' && (
            <div className="payment-details bank-section">
              <div className="bank-info">
                <div className="bank-row">
                  <span className="bank-label">Ngân hàng:</span>
                  <span className="bank-value">Vietcombank</span>
                </div>
                <div className="bank-row">
                  <span className="bank-label">Số tài khoản:</span>
                  <span className="bank-value">1234567890</span>
                </div>
                <div className="bank-row">
                  <span className="bank-label">Chủ tài khoản:</span>
                  <span className="bank-value">CONG TY EV CHARGING</span>
                </div>
                <div className="bank-row">
                  <span className="bank-label">Số tiền:</span>
                  <span className="bank-value highlight">{booking.total_cost.toLocaleString()}đ</span>
                </div>
                <div className="bank-row">
                  <span className="bank-label">Nội dung:</span>
                  <span className="bank-value">THANHTOAN {booking.booking_id}</span>
                </div>
              </div>
              <div className="payment-note">
                <strong>Lưu ý:</strong> Đây là thông tin mô phỏng cho mục đích demo
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="payment-actions">
          <button
            className="payment-btn payment-btn-cancel"
            onClick={() => navigate(`/bookings/${booking_id}/charging`)}
          >
            Hủy
          </button>
          <button
            className="payment-btn payment-btn-submit"
            onClick={handlePayment}
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
          </button>
        </div>
      </div>

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.show}
        onClose={() => setAlertModal({ ...alertModal, show: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />

      {/* Payment Success Modal - Lỗi 4: Redirect to notifications */}
      <AlertModal
        isOpen={showPaymentSuccessModal}
        onClose={() => {
          setShowPaymentSuccessModal(false);
          navigate('/user/notifications');
        }}
        title="Thanh toán thành công!"
        message={paymentResult?.message || 'Thanh toán của bạn đã được xử lý thành công.'}
        type="success"
      />

      {/* Payment Failed Modal */}
      <AlertModal
        isOpen={showPaymentFailedModal}
        onClose={() => setShowPaymentFailedModal(false)}
        title="Thanh toán thất bại"
        message={paymentResult?.message || 'Thanh toán của bạn không thành công. Vui lòng thử lại.'}
        type="error"
      />
    </div>
  );
};

export default Payment;
