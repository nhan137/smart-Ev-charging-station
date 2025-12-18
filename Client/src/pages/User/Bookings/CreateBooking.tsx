import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Zap, DollarSign, Tag } from 'lucide-react';
import { stationService } from '../../../services/stationService';
import AlertModal from '../../../components/shared/AlertModal';
import './CreateBooking.css';

const CreateBooking = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const stationId = searchParams.get('station_id');
  
  const [station, setStation] = useState<any>(null);
  const [vehicleType, setVehicleType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState('');
  const [loading, setLoading] = useState(false);
  const [alertModal, setAlertModal] = useState<{ show: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
    show: false,
    title: '',
    message: '',
    type: 'success'
  });

  // Mock promotions data
  const mockPromotions = [
    {
      code: 'GIAM20',
      discount_percent: 20,
      max_discount: 50000,
      min_amount: 50000,
      valid_from: '2024-01-01',
      valid_to: '2025-12-31',
      status: 'active'
    },
    {
      code: 'NEWUSER',
      discount_percent: 30,
      max_discount: 100000,
      min_amount: 100000,
      valid_from: '2024-01-01',
      valid_to: '2025-12-31',
      status: 'active'
    }
  ];

  useEffect(() => {
    loadStation();
  }, [stationId]);

  const loadStation = async () => {
    try {
      if (stationId) {
        // Load station from API
        const response = await stationService.getStationById(Number(stationId));
        setStation(response.data);
      } else {
        // Load first station as default
        const response = await stationService.getAllStations();
        if (response.data && response.data.length > 0) {
          setStation(response.data[0]);
        }
      }
    } catch (error) {
      console.error('Error loading station:', error);
      // Fallback to mock data if API fails
      setStation({
        station_id: 1,
        station_name: 'Trạm sạc Hải Châu',
        price_per_kwh: 3500,
        connector_types: 'Type 2, CCS2, CHAdeMO'
      });
    }

    // Set default dates
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);
    
    setStartDate(today);
    setStartTime(currentTime);
    setEndDate(today);
  };

  // Get vehicle type options based on connector types
  const getVehicleTypeOptions = () => {
    const connectors = station?.connector_types?.toLowerCase() || '';
    const options = [];
    
    if (connectors.includes('type 2') || connectors.includes('schuko')) {
      options.push({ value: 'xe_may_usb', label: 'Xe máy (USB/Type 2)' });
    }
    if (connectors.includes('ccs')) {
      options.push({ value: 'xe_may_ccs', label: 'Xe máy (CCS)' });
      options.push({ value: 'oto_ccs', label: 'Ô tô (CCS)' });
    }
    
    return options;
  };

  // Calculate battery capacity based on vehicle type
  const getBatteryCapacity = (type: string) => {
    const capacityMap: any = {
      'xe_may_usb': 5,
      'xe_may_ccs': 10,
      'oto_ccs': 50
    };
    return capacityMap[type] || 0;
  };

  // Calculate estimated cost
  const batteryCapacity = getBatteryCapacity(vehicleType);
  const baseCost = batteryCapacity * (station?.price_per_kwh || 0);
  const finalCost = baseCost - promoDiscount;

  // Validate and apply promo code
  const applyPromoCode = () => {
    setPromoError('');
    setPromoDiscount(0);

    if (!promoCode.trim()) return;

    const promo = mockPromotions.find(p => p.code.toUpperCase() === promoCode.toUpperCase());
    
    if (!promo) {
      setPromoError('Mã giảm giá không tồn tại');
      return;
    }

    if (promo.status !== 'active') {
      setPromoError('Mã giảm giá không còn hiệu lực');
      return;
    }

    const now = new Date();
    const validFrom = new Date(promo.valid_from);
    const validTo = new Date(promo.valid_to);

    if (now < validFrom || now > validTo) {
      setPromoError('Mã giảm giá đã hết hạn');
      return;
    }

    if (baseCost < promo.min_amount) {
      setPromoError(`Đơn hàng tối thiểu ${promo.min_amount.toLocaleString()}đ`);
      return;
    }

    const discount = Math.min(
      (baseCost * promo.discount_percent) / 100,
      promo.max_discount
    );

    setPromoDiscount(discount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!vehicleType) {
      setAlertModal({
        show: true,
        title: 'Thiếu thông tin',
        message: 'Vui lòng chọn loại xe',
        type: 'error'
      });
      return;
    }

    if (!startDate || !startTime || !endDate || !endTime) {
      setAlertModal({
        show: true,
        title: 'Thiếu thông tin',
        message: 'Vui lòng điền đầy đủ thời gian',
        type: 'error'
      });
      return;
    }

    setLoading(true);

    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock booking_id
      const mockBookingId = Math.floor(Math.random() * 1000) + 1;
      
      setAlertModal({
        show: true,
        title: 'Thành công!',
        message: 'Đặt lịch thành công!',
        type: 'success'
      });
      
      setTimeout(() => {
        navigate(`/bookings/${mockBookingId}/charging`);
      }, 1500);
    } catch (error) {
      setAlertModal({
        show: true,
        title: 'Lỗi',
        message: 'Có lỗi xảy ra, vui lòng thử lại',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!station) return <div className="loading-page">Đang tải...</div>;

  return (
    <div className="create-booking-page">
      <div className="booking-container">
        <button className="back-button" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          <span>Quay lại</span>
        </button>

        <div className="booking-header">
          <h1>Đặt lịch sạc xe</h1>
          <p>Điền thông tin để đặt lịch sạc tại trạm</p>
        </div>

        <form onSubmit={handleSubmit} className="booking-form">
          {/* Station Name */}
          <div className="form-section">
            <h3>Thông tin trạm</h3>
            <div className="form-group">
              <label>Trạm sạc</label>
              <input
                type="text"
                value={station.station_name}
                readOnly
                className="input-readonly"
              />
            </div>
          </div>

          {/* Vehicle Type */}
          <div className="form-section">
            <h3>Thông tin xe</h3>
            <div className="form-group">
              <label>Loại xe *</label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="form-select"
                required
              >
                <option value="">-- Chọn loại xe --</option>
                {getVehicleTypeOptions().map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Time */}
          <div className="form-section">
            <h3>Thời gian sạc</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Ngày bắt đầu *</label>
                <div className="input-with-icon">
                  <Calendar size={18} />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setEndDate(e.target.value);
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Giờ bắt đầu *</label>
                <div className="input-with-icon">
                  <Clock size={18} />
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Ngày kết thúc *</label>
                <div className="input-with-icon">
                  <Calendar size={18} />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Giờ kết thúc *</label>
                <div className="input-with-icon">
                  <Clock size={18} />
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Battery & Cost */}
          {vehicleType && (
            <div className="form-section">
              <h3>Chi phí dự kiến</h3>
              
              <div className="form-group">
                <label>Dung lượng pin (dự kiến)</label>
                <div className="input-with-icon">
                  <Zap size={18} />
                  <input
                    type="text"
                    value={`${batteryCapacity} kWh`}
                    readOnly
                    className="input-readonly"
                  />
                </div>
              </div>

              <div className="cost-summary">
                <div className="cost-row">
                  <span>Giá dự kiến:</span>
                  <span className="cost-value">{baseCost.toLocaleString()}đ</span>
                </div>
                <div className="cost-detail">
                  {batteryCapacity} kWh × {station.price_per_kwh?.toLocaleString()}đ/kWh
                </div>
              </div>
            </div>
          )}

          {/* Promo Code */}
          {vehicleType && (
            <div className="form-section">
              <h3>Mã giảm giá</h3>
              <div className="form-group">
                <label>Mã giảm giá (nếu có)</label>
                <div className="promo-input-group">
                  <div className="input-with-icon">
                    <Tag size={18} />
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => {
                        setPromoCode(e.target.value.toUpperCase());
                        setPromoError('');
                        setPromoDiscount(0);
                      }}
                      placeholder="Nhập mã giảm giá"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={applyPromoCode}
                    className="apply-promo-btn"
                    disabled={!promoCode.trim()}
                  >
                    Áp dụng
                  </button>
                </div>
                {promoError && <span className="error-message">{promoError}</span>}
                {promoDiscount > 0 && (
                  <span className="success-message">✓ Giảm {promoDiscount.toLocaleString()}đ</span>
                )}
              </div>

              {promoDiscount > 0 && (
                <div className="cost-summary discount-summary">
                  <div className="cost-row">
                    <span>Tiền giảm:</span>
                    <span className="discount-value">-{promoDiscount.toLocaleString()}đ</span>
                  </div>
                </div>
              )}

              <div className="cost-summary final-summary">
                <div className="cost-row final-row">
                  <span>Tổng tiền:</span>
                  <span className="final-value">{finalCost.toLocaleString()}đ</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="booking-actions">
            <button
              type="submit"
              disabled={loading || !vehicleType}
              className="booking-btn booking-btn-submit"
            >
              {loading ? 'Đang xử lý...' : 'Xác nhận đặt lịch'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="booking-btn booking-btn-cancel"
            >
              Hủy
            </button>
          </div>
        </form>
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

export default CreateBooking;
