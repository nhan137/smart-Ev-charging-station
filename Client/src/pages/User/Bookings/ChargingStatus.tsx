import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Battery, Zap, Clock, DollarSign, AlertCircle, X, AlertTriangle } from 'lucide-react';
import './ChargingStatus.css';

const ChargingStatus = () => {
  const navigate = useNavigate();
  const { booking_id } = useParams();
  
  // Mock booking data
  const [booking] = useState({
    booking_id: 1,
    station_name: 'Trạm sạc Hải Châu',
    vehicle_type: 'oto_ccs',
    status: 'charging',
    actual_start: new Date().toISOString(),
    end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    total_cost: 175000,
    price_per_kwh: 3500,
    charging_power: 50
  });

  const [chargingSession, setChargingSession] = useState({
    start_battery_percent: 20,
    current_battery_percent: 20,
    end_battery_percent: 80,
    energy_consumed: 0,
    target_energy: 30 // kWh
  });

  const [currentCost, setCurrentCost] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isCharging, setIsCharging] = useState(true);
  const [showStopModal, setShowStopModal] = useState(false);

  // Get vehicle type label
  const getVehicleTypeLabel = (type: string) => {
    const typeMap: any = {
      'xe_may_usb': 'Xe máy (USB/Type 2)',
      'xe_may_ccs': 'Xe máy (CCS)',
      'oto_ccs': 'Ô tô (CCS)'
    };
    return typeMap[type] || type;
  };

  // Simulate charging progress
  useEffect(() => {
    if (!isCharging) return;

    const interval = setInterval(() => {
      setChargingSession(prev => {
        // Calculate progress (simulate 1% battery per 5 seconds)
        const batteryProgress = prev.current_battery_percent + 1;
        const energyProgress = prev.energy_consumed + 0.5; // 0.5 kWh per 5 seconds

        // Check if charging is complete
        if (batteryProgress >= prev.end_battery_percent || energyProgress >= prev.target_energy) {
          setIsCharging(false);
          return {
            ...prev,
            current_battery_percent: prev.end_battery_percent,
            energy_consumed: prev.target_energy
          };
        }

        return {
          ...prev,
          current_battery_percent: batteryProgress,
          energy_consumed: energyProgress
        };
      });
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [isCharging]);

  // Calculate current cost
  useEffect(() => {
    const cost = chargingSession.energy_consumed * booking.price_per_kwh;
    setCurrentCost(cost);
  }, [chargingSession.energy_consumed, booking.price_per_kwh]);

  // Calculate time remaining
  useEffect(() => {
    const batteryRemaining = chargingSession.end_battery_percent - chargingSession.current_battery_percent;
    const hoursRemaining = (batteryRemaining / booking.charging_power) * 60; // Convert to minutes
    
    if (hoursRemaining <= 0) {
      setTimeRemaining('Hoàn tất');
    } else if (hoursRemaining < 60) {
      setTimeRemaining(`${Math.ceil(hoursRemaining)} phút`);
    } else {
      const hours = Math.floor(hoursRemaining / 60);
      const minutes = Math.ceil(hoursRemaining % 60);
      setTimeRemaining(`${hours} giờ ${minutes} phút`);
    }
  }, [chargingSession.current_battery_percent, chargingSession.end_battery_percent, booking.charging_power]);

  // Auto complete when charging is done
  useEffect(() => {
    if (!isCharging && chargingSession.current_battery_percent >= chargingSession.end_battery_percent) {
      setTimeout(() => {
        navigate(`/bookings/${booking_id}/payment`);
      }, 3000);
    }
  }, [isCharging, chargingSession.current_battery_percent, chargingSession.end_battery_percent, booking_id, navigate]);

  const handleStopCharging = () => {
    setShowStopModal(true);
  };

  const confirmStopCharging = () => {
    setShowStopModal(false);
    setIsCharging(false);
    setTimeout(() => {
      navigate(`/bookings/${booking_id}/payment`);
    }, 1000);
  };

  const batteryPercent = ((chargingSession.current_battery_percent - chargingSession.start_battery_percent) / 
    (chargingSession.end_battery_percent - chargingSession.start_battery_percent)) * 100;
  
  const energyPercent = (chargingSession.energy_consumed / chargingSession.target_energy) * 100;
  
  const costPercent = (currentCost / booking.total_cost) * 100;

  return (
    <div className="charging-status-page">
      <div className="charging-container">
        {/* Header */}
        <div className="charging-header">
          <div className="status-badge-large">
            {isCharging ? (
              <>
                <Zap className="pulse-icon" size={32} />
                <span>Đang sạc...</span>
              </>
            ) : (
              <>
                <Battery size={32} />
                <span>Hoàn tất</span>
              </>
            )}
          </div>
          <h1>{booking.station_name}</h1>
          <p className="vehicle-type">{getVehicleTypeLabel(booking.vehicle_type)}</p>
        </div>

        {/* Info Cards */}
        <div className="info-cards">
          <div className="info-card">
            <Clock size={24} />
            <div className="info-card-content">
              <span className="info-label">Thời gian bắt đầu</span>
              <span className="info-value">
                {new Date(booking.actual_start).toLocaleTimeString('vi-VN', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          </div>

          <div className="info-card">
            <Clock size={24} />
            <div className="info-card-content">
              <span className="info-label">Thời gian còn lại</span>
              <span className="info-value highlight">{timeRemaining}</span>
            </div>
          </div>

          <div className="info-card">
            <Clock size={24} />
            <div className="info-card-content">
              <span className="info-label">Giờ kết thúc dự kiến</span>
              <span className="info-value">
                {new Date(booking.end_time).toLocaleTimeString('vi-VN', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="progress-section">
          <h2>Tiến trình sạc</h2>

          {/* Battery Progress */}
          <div className="progress-item">
            <div className="progress-header">
              <div className="progress-label">
                <Battery size={20} />
                <span>Pin</span>
              </div>
              <div className="progress-values">
                <span className="start-value">{chargingSession.start_battery_percent}%</span>
                <span className="arrow">→</span>
                <span className="current-value">{chargingSession.current_battery_percent}%</span>
                <span className="arrow">→</span>
                <span className="end-value">{chargingSession.end_battery_percent}%</span>
              </div>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${batteryPercent}%` }}>
                <span className="progress-text">{Math.round(batteryPercent)}%</span>
              </div>
            </div>
          </div>

          {/* Energy Progress */}
          <div className="progress-item">
            <div className="progress-header">
              <div className="progress-label">
                <Zap size={20} />
                <span>Năng lượng</span>
              </div>
              <div className="progress-values">
                <span className="start-value">0.0 kWh</span>
                <span className="arrow">→</span>
                <span className="current-value">{chargingSession.energy_consumed.toFixed(1)} kWh</span>
                <span className="arrow">→</span>
                <span className="end-value">{chargingSession.target_energy} kWh</span>
              </div>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar energy" style={{ width: `${energyPercent}%` }}>
                <span className="progress-text">{Math.round(energyPercent)}%</span>
              </div>
            </div>
          </div>

          {/* Cost Progress */}
          <div className="progress-item">
            <div className="progress-header">
              <div className="progress-label">
                <DollarSign size={20} />
                <span>Chi phí</span>
              </div>
              <div className="progress-values">
                <span className="start-value">0đ</span>
                <span className="arrow">→</span>
                <span className="current-value">{currentCost.toLocaleString()}đ</span>
                <span className="arrow">→</span>
                <span className="end-value">{booking.total_cost.toLocaleString()}đ</span>
              </div>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar cost" style={{ width: `${costPercent}%` }}>
                <span className="progress-text">{Math.round(costPercent)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cost Summary */}
        <div className="cost-summary-card">
          <div className="cost-row">
            <span>Tiền tạm tính:</span>
            <span className="cost-current">{currentCost.toLocaleString()}đ</span>
          </div>
          <div className="cost-row total">
            <span>Tổng tiền dự kiến:</span>
            <span className="cost-total">{booking.total_cost.toLocaleString()}đ</span>
          </div>
        </div>

        {/* Update Info */}
        <div className="update-info">
          <AlertCircle size={16} />
          <span>Cập nhật mỗi 5 giây</span>
        </div>

        {/* Actions */}
        {isCharging && (
          <div className="charging-actions">
            <button 
              className="stop-btn"
              onClick={handleStopCharging}
            >
              Dừng sạc
            </button>
          </div>
        )}

        {!isCharging && (
          <div className="complete-message">
            <Battery size={48} />
            <h3>Sạc hoàn tất!</h3>
            <p>Đang chuyển đến trang thanh toán...</p>
          </div>
        )}
      </div>

      {/* Stop Charging Confirmation Modal */}
      {showStopModal && (
        <div className="stop-modal-overlay" onClick={() => setShowStopModal(false)}>
          <div className="stop-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="stop-modal-close" onClick={() => setShowStopModal(false)}>
              <X size={24} />
            </button>

            <div className="stop-modal-icon">
              <AlertTriangle size={64} />
            </div>

            <h2>Dừng sạc xe?</h2>
            <p>Bạn có chắc chắn muốn dừng quá trình sạc không?</p>

            <div className="stop-modal-info">
              <div className="info-row">
                <span>Pin hiện tại:</span>
                <span className="value">{chargingSession.current_battery_percent}%</span>
              </div>
              <div className="info-row">
                <span>Năng lượng đã sạc:</span>
                <span className="value">{chargingSession.energy_consumed.toFixed(1)} kWh</span>
              </div>
              <div className="info-row">
                <span>Chi phí hiện tại:</span>
                <span className="value highlight">{currentCost.toLocaleString()}đ</span>
              </div>
            </div>

            <div className="stop-modal-actions">
              <button 
                className="modal-btn modal-btn-cancel"
                onClick={() => setShowStopModal(false)}
              >
                Tiếp tục sạc
              </button>
              <button 
                className="modal-btn modal-btn-confirm"
                onClick={confirmStopCharging}
              >
                Dừng sạc
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChargingStatus;
