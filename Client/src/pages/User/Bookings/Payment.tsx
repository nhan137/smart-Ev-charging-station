import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, CreditCard, QrCode, Building2, Clock, Battery, Zap, DollarSign, Tag, ArrowLeft } from 'lucide-react';
import AlertModal from '../../../components/shared/AlertModal';
import { mockBookings, getNextId } from '../../../services/mockData';
import { authService } from '../../../services/authService';
import './Payment.css';

const Payment = () => {
  const navigate = useNavigate();
  const { booking_id } = useParams();
  
  const [paymentMethod, setPaymentMethod] = useState<'QR' | 'Bank'>('QR');
  const [loading, setLoading] = useState(false);
  const [alertModal, setAlertModal] = useState<{ show: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
    show: false,
    title: '',
    message: '',
    type: 'success'
  });

  // Mock booking data
  const booking = {
    booking_id: booking_id || '12345',
    station_name: 'Trạm sạc Hải Châu',
    vehicle_type: 'oto_ccs',
    actual_start: '2024-01-15T14:05:00',
    actual_end: '2024-01-15T15:25:00',
    start_battery_percent: 20,
    end_battery_percent: 80,
    energy_consumed: 30,
    price_per_kwh: 3500,
    promotion_code: 'GIAM20',
    discount_percent: 20,
    max_discount: 50000,
    original_cost: 105000,
    discount_amount: 21000,
    total_cost: 84000
  };

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
    setLoading(true);

    try {
      // Mock payment processing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const user = authService.getCurrentUser();
      
      // Add completed booking to mockBookings
      const newBooking = {
        booking_id: getNextId(mockBookings, 'booking_id'),
        user_id: user?.user_id || 1,
        station_id: 1,
        port_id: 1,
        start_time: booking.actual_start || new Date().toISOString(),
        end_time: booking.actual_end || new Date().toISOString(),
        status: 'completed',
        total_kwh: booking.energy_consumed || 0,
        total_price: booking.total_cost || 0,
        payment_status: 'paid'
      };
      
      mockBookings.push(newBooking);
      
      // Mock success
      setAlertModal({
        show: true,
        title: 'Thành công!',
        message: 'Thanh toán thành công!',
        type: 'success'
      });
      
      setTimeout(() => {
        navigate('/bookings/history');
      }, 1500);
    } catch (error: any) {
      console.error('Payment error:', error);
      setAlertModal({
        show: true,
        title: 'Lỗi',
        message: error.message || 'Thanh toán thất bại, vui lòng thử lại',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

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
