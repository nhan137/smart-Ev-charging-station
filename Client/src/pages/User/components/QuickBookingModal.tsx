import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MapPin, Zap, DollarSign, Search } from 'lucide-react';
import { stationService } from '../../../services/stationService';
import './QuickBookingModal.css';

interface QuickBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QuickBookingModal = ({ isOpen, onClose }: QuickBookingModalProps) => {
  const navigate = useNavigate();
  const [stations, setStations] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadStations();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const loadStations = async () => {
    try {
      setLoading(true);
      const response = await stationService.getAllStations();
      setStations(response.data || []);
    } catch (error) {
      console.error('Error loading stations:', error);
      setStations([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredStations = stations.filter(station =>
    station.station_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    station.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectStation = (stationId: number) => {
    onClose();
    navigate(`/bookings/create?station_id=${stationId}`);
  };

  if (!isOpen) return null;

  return (
    <div className="quick-booking-overlay" onClick={onClose}>
      <div className="quick-booking-content" onClick={(e) => e.stopPropagation()}>
        <button className="quick-booking-close" onClick={onClose}>
          <X size={24} />
        </button>

        <h2>Chọn trạm sạc</h2>
        <p className="quick-booking-subtitle">Chọn trạm sạc để đặt lịch</p>

        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm trạm sạc..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="stations-list-quick">
          {loading ? (
            <div className="loading-state">Đang tải...</div>
          ) : filteredStations.length === 0 ? (
            <div className="empty-state">Không tìm thấy trạm sạc</div>
          ) : (
            filteredStations.map((station) => (
              <div
                key={station.station_id}
                className="station-item-quick"
                onClick={() => handleSelectStation(station.station_id)}
              >
                <img
                  src={station.avatar_url || 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=EV'}
                  alt={station.station_name}
                  className="station-thumb"
                />
                <div className="station-info-quick">
                  <h3>{station.station_name}</h3>
                  <div className="station-address-quick">
                    <MapPin size={14} />
                    <span>{station.address.substring(0, 50)}...</span>
                  </div>
                  <div className="station-meta-quick">
                    <div className="meta-item-quick">
                      <DollarSign size={14} />
                      <span>{station.price_per_kwh?.toLocaleString()} đ/kWh</span>
                    </div>
                    <div className="meta-item-quick">
                      <Zap size={14} />
                      <span>{station.available_slots}/{station.total_slots} chỗ</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickBookingModal;
