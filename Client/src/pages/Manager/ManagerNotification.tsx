import { useEffect, useState } from 'react';
import { Bell, Clock, CheckCircle, Trash2, RefreshCw, Loader2 } from 'lucide-react';
import { authService } from '../../services/authService';
import { managerService } from '../../services/managerService';
import './ManagerNotifications.css';

const ManagerNotifications = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const user = authService.getCurrentUser();

  useEffect(() => {
    loadNotifications();
    // Tăng interval lên 10 giây để tránh reload quá nhanh
    const interval = setInterval(() => {
      loadNotifications();
    }, 10000);

    return () => clearInterval(interval);
  }, [filter]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filter === 'unread') {
        params.is_read = false;
      } else if (filter === 'system') {
        params.type = 'system';
      }

      const response = await managerService.getNotifications(params);
      
      if (response.success && response.data) {
        const notificationsData = Array.isArray(response.data) ? response.data : (response.data.notifications || []);
        // Giữ lại trạng thái isRead của các notification đã được đánh dấu
        const list = notificationsData
          .map((notif: any) => {
            const existing = notifications.find(n => (n.notification_id || n.id) === (notif.notification_id || notif.id));
            // Backend trả về status: 'unread' hoặc 'read'
            const isRead = existing ? existing.isRead : (notif.status === 'read' || notif.is_read || notif.isRead || false);
            return {
              ...notif,
              notification_id: notif.notification_id || notif.id,
              isRead: isRead,
              receivedAt: notif.sent_at || notif.sentAt || notif.created_at,
              title: notif.title || 'Thông báo',
              message: notif.message || notif.content || '',
              type: notif.type || 'system'
            };
          })
          .sort((a: any, b: any) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());

        setNotifications(list);
      }
    } catch (error: any) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await managerService.markNotificationAsRead(notificationId);
      setNotifications(prev =>
        prev.map(notif =>
          notif.notification_id === notificationId
            ? { ...notif, isRead: true }
            : notif
        )
      );
      // Trigger update badge count in layout
      window.dispatchEvent(new Event('notification-updated'));
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await managerService.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
      // Trigger update badge count in layout
      window.dispatchEvent(new Event('notification-updated'));
    } catch (error: any) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = async (notificationId: number) => {
    try {
      await managerService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(notif => notif.notification_id !== notificationId));
      // Trigger update badge count in layout
      window.dispatchEvent(new Event('notification-updated'));
    } catch (error: any) {
      console.error('Error deleting notification:', error);
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notif.isRead;
    return notif.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'system':
        return 'Hệ thống';
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'system':
        return '#3b82f6';
      default:
        return '#64748b';
    }
  };

  return (
    <div className="manager-notifications">
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
      </div>

      <div className="notifications-list">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem' }}>
            <Loader2 size={48} className="animate-spin" style={{ color: '#3b82f6' }} />
          </div>
        ) : filteredNotifications.length === 0 ? (
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

export default ManagerNotifications;