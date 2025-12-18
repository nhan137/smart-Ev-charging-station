import { useState, useEffect } from 'react';
import { Bell, X, ExternalLink } from 'lucide-react';
import { mockNotifications } from '../../services/mockData';
import { useNavigate } from 'react-router-dom';
import './NotificationPopup.css';

interface NotificationPopupProps {
  onClose: () => void;
}

const NotificationPopup = ({ onClose }: NotificationPopupProps) => {
  const [latestNotifications, setLatestNotifications] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Lấy 3 thông báo mới nhất
    const latest = mockNotifications.slice(0, 3);
    setLatestNotifications(latest);
  }, []);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'system': return 'Hệ thống';
      case 'payment': return 'Thanh toán';
      case 'promotion': return 'Khuyến mãi';
      case 'booking': return 'Đặt lịch';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'system': return '#3b82f6';
      case 'payment': return '#10b981';
      case 'promotion': return '#f59e0b';
      case 'booking': return '#a855f7';
      default: return '#64748b';
    }
  };

  const handleViewAll = () => {
    navigate('/user/notifications');
    onClose();
  };

  if (latestNotifications.length === 0) {
    return null;
  }

  return (
    <div className="notification-popup-overlay" onClick={onClose}>
      <div className="notification-popup" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <div className="popup-header-left">
            <Bell size={24} />
            <h3>Thông báo mới</h3>
          </div>
          <button className="popup-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="popup-content">
          {latestNotifications.map((notif) => (
            <div key={notif.notification_id} className="popup-notification-item">
              <div className="popup-notif-icon" style={{ background: `${getTypeColor(notif.type)}20` }}>
                <Bell size={20} color={getTypeColor(notif.type)} />
              </div>
              <div className="popup-notif-content">
                <span className="popup-notif-type" style={{ color: getTypeColor(notif.type) }}>
                  {getTypeLabel(notif.type)}
                </span>
                <h4>{notif.title}</h4>
                <p>{notif.message}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="popup-footer">
          <button className="btn-view-all" onClick={handleViewAll}>
            <ExternalLink size={18} />
            <span>Xem tất cả thông báo</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPopup;
