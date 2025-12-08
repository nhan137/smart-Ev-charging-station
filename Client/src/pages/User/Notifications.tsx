import { useState, useEffect } from 'react';
import { Bell, Clock, CheckCircle, Trash2, RefreshCw } from 'lucide-react';
import { mockNotifications } from '../../services/mockData';
import { authService } from '../../services/authService';
import './Notifications.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const user = authService.getCurrentUser();

  useEffect(() => {
    loadNotifications();
    
    // Reload notifications every 5 seconds to get new ones
    const interval = setInterval(() => {
      loadNotifications();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = () => {
    // Load directly from mockNotifications
    const userNotifications = mockNotifications.map(notif => {
      // Kiểm tra xem notification này đã có trong state chưa để giữ trạng thái isRead
      const existingNotif = notifications.find(n => n.notification_id === notif.notification_id);
      
      return {
        ...notif,
        isRead: existingNotif ? existingNotif.isRead : false,
        receivedAt: notif.sentAt
      };
    });
    
    setNotifications(userNotifications);
  };

  const handleMarkAsRead = (notificationId: number) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.notification_id === notificationId
          ? { ...notif, isRead: true }
          : notif
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, isRead: true }))
    );
  };

  const handleDelete = (notificationId: number) => {
    setNotifications(prev =>
      prev.filter(notif => notif.notification_id !== notificationId)
    );
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notif.isRead;
    return notif.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

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

  return (
    <div className="user-notifications">
      <div className="notifications-header">
        <div className="header-title">
          <Bell size={32} />
          <div>
            <h1>Thông báo</h1>
            <p>Bạn có {unreadCount} thông báo chưa đọc</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-refresh" onClick={loadNotifications} title="Làm mới">
            <RefreshCw size={20} />
            <span>Làm mới</span>
          </button>
          {unreadCount > 0 && (
            <button className="btn-mark-all-read" onClick={handleMarkAllAsRead}>
              <CheckCircle size={20} />
              <span>Đánh dấu tất cả đã đọc</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="notifications-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Tất cả ({notifications.length})
        </button>
        <button
          className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          Chưa đọc ({unreadCount})
        </button>
        <button
          className={`filter-btn ${filter === 'system' ? 'active' : ''}`}
          onClick={() => setFilter('system')}
        >
          Hệ thống
        </button>
        <button
          className={`filter-btn ${filter === 'promotion' ? 'active' : ''}`}
          onClick={() => setFilter('promotion')}
        >
          Khuyến mãi
        </button>
        <button
          className={`filter-btn ${filter === 'payment' ? 'active' : ''}`}
          onClick={() => setFilter('payment')}
        >
          Thanh toán
        </button>
        <button
          className={`filter-btn ${filter === 'booking' ? 'active' : ''}`}
          onClick={() => setFilter('booking')}
        >
          Đặt lịch
        </button>
      </div>

      {/* Notifications List */}
      <div className="notifications-list">
        {filteredNotifications.length === 0 ? (
          <div className="empty-notifications">
            <Bell size={64} />
            <h3>Không có thông báo</h3>
            <p>Bạn chưa có thông báo nào trong mục này</p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.notification_id}
              className={`notification-card ${!notif.isRead ? 'unread' : ''}`}
              onClick={() => !notif.isRead && handleMarkAsRead(notif.notification_id)}
            >
              <div className="notification-indicator">
                {!notif.isRead && <div className="unread-dot"></div>}
              </div>

              <div className="notification-icon" style={{ background: `${getTypeColor(notif.type)}20` }}>
                <Bell size={24} color={getTypeColor(notif.type)} />
              </div>

              <div className="notification-content">
                <div className="notification-header-row">
                  <span className="notification-type" style={{ color: getTypeColor(notif.type) }}>
                    {getTypeLabel(notif.type)}
                  </span>
                  <span className="notification-time">
                    <Clock size={14} />
                    {new Date(notif.receivedAt).toLocaleString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                <h3 className="notification-title">{notif.title}</h3>
                <p className="notification-message">{notif.message}</p>

                {!notif.isRead && (
                  <button
                    className="btn-mark-read"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsRead(notif.notification_id);
                    }}
                  >
                    Đánh dấu đã đọc
                  </button>
                )}
              </div>

              <button
                className="btn-delete-notification"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(notif.notification_id);
                }}
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
