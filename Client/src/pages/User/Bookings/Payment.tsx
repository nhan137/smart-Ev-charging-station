import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, CreditCard, QrCode, Building2, Clock, Battery, Zap, DollarSign, Tag, ArrowLeft, Loader2 } from 'lucide-react';
import AlertModal from '../../../components/shared/AlertModal';
import { bookingService } from '../../../services/bookingService';
import { paymentService } from '../../../services/paymentService';
import './Payment.css';

const Payment = () => {
  const navigate = useNavigate();
  const { booking_id } = useParams();
  
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
          
          // Format booking data for display
          const formattedBooking = {
            booking_id: bookingData.booking_id,
            station_name: bookingData.station?.station_name || 'N/A',
            vehicle_type: bookingData.vehicle_type,
            actual_start: bookingData.actual_start || bookingData.start_time,
            actual_end: bookingData.actual_end || bookingData.end_time,
            start_battery_percent: bookingData.chargingSession?.start_battery_percent || 0,
            end_battery_percent: bookingData.chargingSession?.end_battery_percent || bookingData.start_battery_percent || 0,
            energy_consumed: bookingData.chargingSession?.energy_consumed || 0,
            price_per_kwh: bookingData.station?.price_per_kwh || 0,
            promotion_code: bookingData.promotion?.code || null,
            discount_percent: bookingData.promotion?.discount_percent || 0,
            max_discount: bookingData.promotion?.max_discount || 0,
            original_cost: bookingData.total_cost || 0,
            discount_amount: bookingData.discount_amount || 0,
            total_cost: bookingData.total_cost || 0
          };
          
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

  // Calculate charging duration
  const getChargingDuration = () => {
    const start = new Date(booking.actual_start);
    const end = new Date(booking.actual_end);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
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
          <button className="back-button" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
            <span>Quay lại</span>
          </button>
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
        <button className="back-button" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          <span>Quay lại</span>
        </button>

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
                  {new Date(booking.actual_start).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  {' - '}
                  {new Date(booking.actual_end).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  {' '}({getChargingDuration()})
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
                  {booking.start_battery_percent}% → {booking.end_battery_percent}%
                </span>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon">
                <Zap size={20} />
              </div>
              <div className="detail-content">
                <span className="detail-label">Năng lượng tiêu thụ</span>
                <span className="detail-value">{booking.energy_consumed} kWh</span>
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
              <span className="cost-value">{booking.original_cost.toLocaleString()}đ</span>
            </div>
            <div className="cost-detail">
              {booking.energy_consumed} kWh × {booking.price_per_kwh.toLocaleString()}đ/kWh
            </div>

            {booking.promotion_code && (
              <>
                <div className="cost-row discount-row">
                  <div className="discount-label">
                    <Tag size={18} />
                    <span>Mã giảm giá: {booking.promotion_code}</span>
                  </div>
                  <span className="discount-value">-{booking.discount_amount.toLocaleString()}đ</span>
                </div>
                <div className="cost-detail">
                  Giảm {booking.discount_percent}% (tối đa {booking.max_discount.toLocaleString()}đ)
                </div>
              </>
            )}

            <div className="cost-divider"></div>

            <div className="cost-row total-row">
              <span>Tổng thanh toán</span>
              <span className="total-value">{booking.total_cost.toLocaleString()}đ</span>
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
    </div>
  );
};

export default Payment;
