import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Battery, Zap, Clock, DollarSign, AlertCircle, X, AlertTriangle, Loader2 } from 'lucide-react';
import { bookingService } from '../../../services/bookingService';
import socketService from '../../../services/socketService';
import './ChargingStatus.css';

const ChargingStatus = () => {
  const navigate = useNavigate();
  const { booking_id } = useParams();
  const socketInitialized = useRef(false);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<any>(null);
  const [chargingData, setChargingData] = useState<any>(null);
  const [isCharging, setIsCharging] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isStopped, setIsStopped] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionType, setCompletionType] = useState<'completed' | 'stopped' | null>(null); // 'completed' = 100%, 'stopped' = IoT stopped
  const [socketConnected, setSocketConnected] = useState(false);

  // Load charging status from API (initial load only)
  const loadChargingStatus = async () => {
    if (!booking_id) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await bookingService.getChargingStatus(parseInt(booking_id));
      
      if (response.success && response.data) {
        const data = response.data;
        
        // CRITICAL: If booking is 'charging', don't use initial data from API
        // Instead, wait for real-time Socket.IO updates to ensure sync with IoT
        // Only use initial data if status is 'completed' or 'confirmed'
        if (data.status === 'charging') {
          console.log('[ChargingStatus] Booking is charging - waiting for real-time Socket.IO updates...');
          // Set minimal data, but wait for Socket.IO updates for actual values
          setChargingData({
            ...data,
            // Reset to initial values - will be updated by Socket.IO
            current_battery_percent: data.start_battery_percent || 50,
            energy_consumed: 0,
            estimated_cost: 0
          });
          setIsCharging(true);
          setIsCompleted(false);
        } else if (data.status === 'completed') {
          // If already completed, show final data
          setChargingData(data);
          setIsCharging(false);
          setIsCompleted(true);
        } else {
          // Status is 'confirmed' - waiting for charging to start
          setChargingData(data);
          setIsCharging(false);
          setIsCompleted(false);
        }
        
        // Set booking info from response
        setBooking({
          booking_id: data.booking_id,
          station_name: data.station_name,
          status: data.status,
          vehicle_type: data.vehicle_type || null
        });

        // Initialize WebSocket connection after initial load
        // Always initialize if we have a booking_id
        if (!socketInitialized.current && booking_id) {
          console.log('[ChargingStatus] Initializing WebSocket for booking:', booking_id);
          initializeWebSocket(parseInt(booking_id));
          socketInitialized.current = true;
        }
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải trạng thái sạc');
      console.error('Error loading charging status:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initialize WebSocket connection
  const initializeWebSocket = (bookingId: number) => {
    try {
      // Connect to Socket.IO server
      const socketInstance = socketService.connect();

      // Listen for connection status FIRST
      if (socketInstance) {
        socketInstance.on('connect', () => {
          setSocketConnected(true);
          console.log('[ChargingStatus] Socket connected, joining room...');
          // Join room after connection is established
          setTimeout(() => {
            socketService.joinBookingRoom(bookingId);
          }, 100);
        });

        socketInstance.on('disconnect', () => {
          setSocketConnected(false);
          console.log('[ChargingStatus] Socket disconnected');
        });

        socketInstance.on('room_joined', (data) => {
          console.log('[ChargingStatus] Successfully joined room:', data);
          setSocketConnected(true);
        });
      }

      // Join booking room (will wait for connection if needed)
      // CRITICAL: Ensure bookingId is a number
      const bookingIdNum = parseInt(booking_id || '0');
      if (bookingIdNum > 0) {
        console.log(`[ChargingStatus] Joining Socket.IO room for booking ${bookingIdNum}`);
        socketService.joinBookingRoom(bookingIdNum);
      } else {
        console.error(`[ChargingStatus] Invalid booking_id: ${booking_id}`);
      }

      // Listen for charging updates
      const handleChargingUpdate = (updateData: any) => {
        // CRITICAL: Only process updates for the current booking_id
        if (!booking_id || updateData.booking_id !== parseInt(booking_id)) {
          console.log('[ChargingStatus] ⏭️  Ignoring update for different booking:', updateData.booking_id, 'current:', booking_id);
          return;
        }
        
        console.log('[ChargingStatus] ✅ Received charging_update event for booking', booking_id, ':', {
          battery: updateData.current_battery_percent + '%',
          energy: updateData.energy_consumed + ' kWh',
          cost: updateData.estimated_cost + '₫',
          status: updateData.status
        });
        
        // CRITICAL: Always use real-time data from Socket.IO, don't merge with old data
        // This ensures frontend stays in sync with IoT simulator timing
        setChargingData((prev: any) => {
          const updated = {
            ...prev,
            ...updateData,
            // Always use latest values from Socket.IO (real-time)
            current_battery_percent: updateData.current_battery_percent ?? prev.current_battery_percent ?? 0,
            start_battery_percent: updateData.start_battery_percent ?? prev.start_battery_percent ?? 0,
            end_battery_percent: updateData.end_battery_percent ?? prev.end_battery_percent ?? 100,
            energy_consumed: updateData.energy_consumed ?? prev.energy_consumed ?? 0,
            estimated_cost: updateData.estimated_cost ?? prev.estimated_cost ?? 0,
            actual_cost: updateData.actual_cost ?? prev.actual_cost,
            time_remaining: updateData.time_remaining ?? prev.time_remaining,
            status: updateData.status || prev.status,
            is_completed: updateData.is_completed ?? false
          };
          console.log('[ChargingStatus] 📊 Updated charging data (real-time):', {
            battery: updated.current_battery_percent + '%',
            start: updated.start_battery_percent + '%',
            end: updated.end_battery_percent + '%',
            energy: updated.energy_consumed + ' kWh',
            cost: updated.estimated_cost + '₫',
            actual_cost: updated.actual_cost ? updated.actual_cost + '₫' : 'N/A'
          });
          return updated;
        });

        // Update charging/completed state based on battery % and status
        const batteryPercent = updateData.current_battery_percent ?? 0;
        const status = updateData.status || 'charging';
        
        // CRITICAL: Status logic
        // - If battery >= 100% OR status is 'completed' -> Completed
        // - If battery < 100% AND status is 'charging' -> Charging
        const isActuallyCompleted = batteryPercent >= 100 || (status === 'completed' && updateData.is_completed === true);
        
        setIsCharging(!isActuallyCompleted && status === 'charging');
        setIsCompleted(isActuallyCompleted);
        
        console.log('[ChargingStatus] 🔄 Status update:', {
          battery: batteryPercent + '%',
          status,
          is_completed: updateData.is_completed,
          isCharging: !isActuallyCompleted && status === 'charging',
          isCompleted: isActuallyCompleted
        });
      };
      
      socketService.onChargingUpdate(handleChargingUpdate);
      
      // Also listen for fallback broadcast events
      const socketInstance2 = socketService.getSocket();
      if (socketInstance2) {
        socketInstance2.on('charging_update_all', handleChargingUpdate);
        console.log('[ChargingStatus] ✅ Listening for charging_update_all events');
      }

      // Listen for charging completed (when battery reaches 100%)
      const handleChargingCompleted = (completedData: any) => {
        // CRITICAL: Only process updates for the current booking_id
        if (!booking_id || completedData.booking_id !== parseInt(booking_id)) {
          console.log('[ChargingStatus] Ignoring completed event for different booking:', completedData.booking_id);
          return;
        }
        
        console.log('[ChargingStatus] Charging completed:', completedData);
        
        setChargingData((prev: any) => ({
          ...prev,
          ...completedData,
          is_completed: true,
          status: 'completed',
          actual_cost: completedData.actual_cost ?? prev.actual_cost
        }));

        setIsCharging(false);
        setIsCompleted(true);
        
        // Show completion modal instead of redirecting immediately
        setCompletionType('completed');
        setShowCompletionModal(true);
      };
      
      socketService.onChargingCompleted(handleChargingCompleted);
      
      // Also listen for fallback broadcast events
      const socketInstance4 = socketService.getSocket();
      if (socketInstance4) {
        socketInstance4.on('charging_completed_all', handleChargingCompleted);
      }

      // Listen for charging stopped (when IoT Simulator is killed)
      const handleChargingStopped = (stoppedData: any) => {
        // CRITICAL: Only process updates for the current booking_id
        if (!booking_id || stoppedData.booking_id !== parseInt(booking_id)) {
          console.log('[ChargingStatus] Ignoring stopped event for different booking:', stoppedData.booking_id);
          return;
        }
        
        console.log('[ChargingStatus] Charging stopped event received:', stoppedData);
        
        setChargingData((prev: any) => ({
          ...prev,
          ...stoppedData,
          is_completed: true,
          status: 'completed',
          current_battery_percent: stoppedData.current_battery_percent ?? prev.current_battery_percent,
          actual_cost: stoppedData.actual_cost ?? prev.actual_cost
        }));

        setIsCharging(false);
        setIsCompleted(true);
        setIsStopped(true);
        
        // Show completion modal instead of redirecting immediately
        setCompletionType('stopped');
        setShowCompletionModal(true);
      };
      
      socketService.onChargingStopped(handleChargingStopped);

    } catch (err) {
      console.error('[ChargingStatus] Error initializing WebSocket:', err);
      // Fallback to polling if WebSocket fails
      setError('Không thể kết nối WebSocket. Đang sử dụng polling...');
    }
  };

  // Initial load
  useEffect(() => {
    loadChargingStatus();

    // Cleanup on unmount
    return () => {
      if (booking_id && socketInitialized.current) {
        socketService.leaveBookingRoom(parseInt(booking_id));
        socketService.removeChargingListeners();
      }
    };
  }, [booking_id]);

  // Handle completion modal - removed auto-redirect, now handled by modal

  // Get vehicle type label (if available from booking)
  const getVehicleTypeLabel = (type: string) => {
    const typeMap: any = {
      'xe_may_usb': 'Xe máy (USB/Type 2)',
      'xe_may_ccs': 'Xe máy (CCS)',
      'oto_ccs': 'Ô tô (CCS)'
    };
    return typeMap[type] || type;
  };

  // Handle completion modal OK button
  const handleCompletionOK = () => {
    setShowCompletionModal(false);
    navigate(`/bookings/${booking_id}/payment`);
  };

  // Calculate progress percentages
  // Get start battery from charging session (initial battery level)
  const startBattery = chargingData?.start_battery_percent ?? 0;
  const currentBattery = chargingData?.current_battery_percent ?? 0;
  // Always use 100% as the target end battery (not end_battery_percent which might be set early)
  const targetBattery = 100;
  
  // Calculate battery progress: from start to 100% (0% to 100% of progress bar)
  // This ensures the bar fills proportionally to actual battery percentage
  const batteryRange = targetBattery - startBattery;
  const batteryPercent = batteryRange > 0 
    ? Math.min(100, Math.max(0, ((currentBattery - startBattery) / batteryRange) * 100))
    : (currentBattery >= targetBattery ? 100 : 0);
  
  const energyConsumed = parseFloat(chargingData?.energy_consumed || 0);
  const estimatedCost = parseFloat(chargingData?.estimated_cost || 0);
  const actualCost = parseFloat(chargingData?.actual_cost || estimatedCost);
  
  // Get battery capacity from booking based on vehicle type
  // Match BATTERY_CAPACITY from backend: xe_may_usb: 5, xe_may_ccs: 5, oto_ccs: 50
  const getBatteryCapacity = (vehicleType: string | null | undefined): number => {
    if (!vehicleType) return 50; // Default to car capacity
    if (vehicleType === 'oto_ccs') return 50;
    if (vehicleType === 'xe_may_usb' || vehicleType === 'xe_may_ccs') return 5;
    return 50; // Default fallback
  };
  
  const estimatedBatteryCapacity = getBatteryCapacity(booking?.vehicle_type || chargingData?.vehicle_type);
  const energyPercent = estimatedBatteryCapacity > 0 
    ? Math.min(100, Math.max(0, (energyConsumed / estimatedBatteryCapacity) * 100))
    : 0;
  
  // Calculate cost progress: from 0 to estimated total cost
  const estimatedTotalCost = actualCost || estimatedCost;
  const costPercent = estimatedTotalCost > 0 
    ? Math.min(100, (estimatedCost / estimatedTotalCost) * 100)
    : 0;
  
  // Format dates
  const startedAt = chargingData?.started_at 
    ? new Date(chargingData.started_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : '--:--';
  
  const timeRemaining = chargingData?.time_remaining || '--';

  if (loading && !chargingData) {
    return (
      <div className="charging-status-page">
        <div className="charging-container">
          <div className="loading-state">
            <Loader2 className="spinner" size={48} />
            <p>Đang tải trạng thái sạc...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !chargingData || !booking) {
    return (
      <div className="charging-status-page">
        <div className="charging-container">
          <div className="error-state">
            <AlertCircle size={48} />
            <h3>Lỗi</h3>
            <p>{error || 'Không thể tải trạng thái sạc'}</p>
            <button onClick={loadChargingStatus}>Thử lại</button>
          </div>
        </div>
      </div>
    );
  }

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
        </div>

        {/* Info Cards */}
        <div className="info-cards">
          <div className="info-card">
            <Clock size={24} />
            <div className="info-card-content">
              <span className="info-label">Thời gian bắt đầu</span>
              <span className="info-value">{startedAt}</span>
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
              <span className="info-label">Trạng thái</span>
              <span className="info-value">
                {(() => {
                  const batteryPercent = chargingData?.current_battery_percent ?? 0;
                  const status = chargingData?.status;
                  
                  // CRITICAL: Show "Hoàn thành" only when battery >= 100% OR status is 'completed'
                  if (batteryPercent >= 100 || (status === 'completed' && chargingData?.is_completed)) {
                    return 'Hoàn thành';
                  }
                  // Show "Đang sạc" when battery < 100% and status is 'charging'
                  if (status === 'charging' || batteryPercent > 0) {
                    return 'Đang sạc';
                  }
                  return 'Chờ bắt đầu';
                })()}
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
                <span className="start-value">{startBattery}%</span>
                <span className="arrow">→</span>
                <span className="current-value">{currentBattery}%</span>
                <span className="arrow">→</span>
                <span className="end-value">100%</span>
              </div>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${Math.min(100, Math.max(0, batteryPercent))}%` }}>
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
                <span className="current-value">{energyConsumed.toFixed(1)} kWh</span>
                {estimatedBatteryCapacity > 0 && (
                  <>
                    <span className="arrow">→</span>
                    <span className="end-value">{estimatedBatteryCapacity} kWh</span>
                  </>
                )}
              </div>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar energy" style={{ width: `${Math.min(100, Math.max(0, energyPercent))}%` }}>
                <span className="progress-text">{energyConsumed.toFixed(1)} kWh</span>
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
                <span className="current-value">{estimatedCost.toLocaleString()}đ</span>
                {actualCost && actualCost > estimatedCost && (
                  <>
                    <span className="arrow">→</span>
                    <span className="end-value">{actualCost.toLocaleString()}đ</span>
                  </>
                )}
              </div>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar cost" style={{ width: `${Math.min(100, Math.max(0, costPercent))}%` }}>
                <span className="progress-text">{estimatedCost.toLocaleString()}đ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cost Summary */}
        <div className="cost-summary-card">
          <div className="cost-row">
            <span>Tiền tạm tính:</span>
            <span className="cost-current">{estimatedCost.toLocaleString()}đ</span>
          </div>
          {/* Always show actual cost if available, otherwise show estimated as actual */}
          <div className="cost-row total">
            <span>Tổng tiền thực tế:</span>
            <span className="cost-total">
              {actualCost && actualCost > 0 
                ? actualCost.toLocaleString() 
                : estimatedCost.toLocaleString()
              }đ
            </span>
          </div>
        </div>

        {/* Update Info */}
        <div className="update-info">
          <AlertCircle size={16} />
          <span>
            {socketConnected ? (
              <>Cập nhật real-time qua WebSocket</>
            ) : (
              <>Đang kết nối WebSocket...</>
            )}
          </span>
        </div>

        {/* No manual stop button - controlled by IoT Terminal only */}
      </div>

      {/* Completion Modal (Shown when IoT stops or reaches 100%) */}
      {showCompletionModal && (
        <div className="stop-modal-overlay">
          <div className="stop-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="stop-modal-icon">
              {completionType === 'stopped' ? (
                <AlertTriangle size={64} style={{ color: '#f59e0b' }} />
              ) : (
                <Battery size={64} style={{ color: '#10b981' }} />
              )}
            </div>

            <h2>
              {completionType === 'stopped' ? 'Phiên sạc đã dừng' : 'Sạc hoàn tất!'}
            </h2>
            <p>
              {completionType === 'stopped' 
                ? 'Quá trình sạc đã được dừng.'
                : ' Vui lòng thanh toán để hoàn tất.'}
            </p>

            <div className="stop-modal-info">
              <div className="info-row">
                <span>Pin hiện tại:</span>
                <span className="value">{currentBattery}%</span>
              </div>
              <div className="info-row">
                <span>Năng lượng đã sạc:</span>
                <span className="value">{energyConsumed.toFixed(1)} kWh</span>
              </div>
              <div className="info-row">
                <span>Tiền tạm tính:</span>
                <span className="value">{estimatedCost.toLocaleString()}đ</span>
              </div>
              {actualCost && actualCost > 0 && (
                <div className="info-row total">
                  <span>Tổng tiền thực tế:</span>
                  <span className="value highlight">{actualCost.toLocaleString()}đ</span>
                </div>
              )}
            </div>

            <div className="stop-modal-actions">
              <button 
                className="modal-btn modal-btn-confirm"
                onClick={handleCompletionOK}
                style={{ width: '100%' }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChargingStatus;
