import { X, Zap } from 'lucide-react';
import './SlotsModal.css';

interface SlotsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stationName: string;
  totalSlots: number;
  availableSlots: number;
}

const SlotsModal = ({ isOpen, onClose, stationName, totalSlots, availableSlots }: SlotsModalProps) => {
  if (!isOpen) return null;

  // Generate slots array
  const slots = Array.from({ length: totalSlots }, (_, i) => ({
    id: i + 1,
    status: i < (totalSlots - availableSlots) ? 'busy' : 'available'
  }));

  return (
    <div className="slots-modal-overlay" onClick={onClose}>
      <div className="slots-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="slots-modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        <h2>Trạng thái chỗ sạc</h2>
        <p className="slots-station-name">{stationName}</p>

        <div className="slots-summary">
          <div className="summary-item">
            <span className="summary-label">Tổng số chỗ:</span>
            <span className="summary-value">{totalSlots}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Đang trống:</span>
            <span className="summary-value available">{availableSlots}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Đang bận:</span>
            <span className="summary-value busy">{totalSlots - availableSlots}</span>
          </div>
        </div>

        <div className="slots-grid">
          {slots.map((slot) => (
            <div key={slot.id} className={`slot-item slot-${slot.status}`}>
              <Zap size={24} />
              <span className="slot-number">#{slot.id}</span>
              <span className="slot-status">
                {slot.status === 'busy' ? 'Đang bận' : 'Trống'}
              </span>
            </div>
          ))}
        </div>

        <div className="slots-legend">
          <div className="legend-item">
            <div className="legend-color legend-available"></div>
            <span>Trống</span>
          </div>
          <div className="legend-item">
            <div className="legend-color legend-busy"></div>
            <span>Đang bận</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlotsModal;
