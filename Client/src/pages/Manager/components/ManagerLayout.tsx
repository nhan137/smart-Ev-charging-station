import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../../services/authService';
import { managerService } from '../../../services/managerService';
import { Building2, Calendar, FileText, LogOut, Menu, X, BarChart3, Mail, History, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import './ManagerLayout.css';

const ManagerLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getCurrentUser();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  const handleLogout = async () => {
    await authService.logout();
    navigate('/');
    window.location.reload();
  };

  const menuItems = [
    { icon: <BarChart3 size={20} />, label: 'Dashboard', path: '/manager/dashboard' },
    { icon: <Building2 size={20} />, label: 'Danh sách trạm', path: '/manager/stations' },
    { icon: <Calendar size={20} />, label: 'Lịch sử đặt lịch', path: '/manager/bookings' },
    { icon: <FileText size={20} />, label: 'Báo cáo sự cố', path: '/manager/reports' },
    { icon: <Mail size={20} />, label: 'Hộp thư', path: '/manager/mailbox' },
    { icon: <History size={20} />, label: 'Lịch sử báo cáo', path: '/manager/reporthistory' },
    { icon: <Bell size={20} />, label: 'Thông báo', path: '/manager/notifications' }
  ];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 5000); // Check every 5 seconds
    
    // Listen for notification updates
    const handleNotificationUpdate = () => {
      console.log('[ManagerLayout] Notification updated event received, reloading unread count...');
      // Delay slightly to ensure backend has updated
      setTimeout(() => {
        loadUnreadCount();
      }, 100);
    };
    window.addEventListener('notification-updated', handleNotificationUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('notification-updated', handleNotificationUpdate);
    };
  }, []);

  const loadUnreadCount = async () => {
    try {
      // Load all notifications to get unread_count from backend
      // Backend luôn trả về unread_count trong response.data
      const response = await managerService.getNotifications();
      console.log('[ManagerLayout] Load unread count response:', response);
      if (response.success && response.data) {
        // Backend trả về unread_count trong response.data
        if (response.data.unread_count !== undefined) {
          console.log('[ManagerLayout] Setting unread count to:', response.data.unread_count);
          setUnreadNotificationCount(response.data.unread_count);
        } else {
          // Fallback: đếm từ notifications array với status='unread'
          const notifications = Array.isArray(response.data) ? response.data : (response.data.notifications || []);
          const unreadCount = notifications.filter((n: any) => 
            n.status === 'unread'
          ).length;
          console.log('[ManagerLayout] Fallback: Unread count:', unreadCount, 'from', notifications.length, 'notifications');
          setUnreadNotificationCount(unreadCount);
        }
      } else {
        console.warn('[ManagerLayout] No data in response:', response);
        setUnreadNotificationCount(0);
      }
    } catch (error: any) {
      console.error('[ManagerLayout] Error loading unread count:', error);
      // Set to 0 on error to avoid showing stale count
      setUnreadNotificationCount(0);
    }
  };

  return (
    <div className="manager-layout">
      {/* Sidebar */}
      <aside className={`manager-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>

        <nav className="sidebar-nav">
          {menuItems.map((item, index) => {
            const isNotificationItem = item.path === '/manager/notifications';
            return (
              <button
                key={index}
                className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
                style={{ position: 'relative' }}
              >
                {item.icon}
                {sidebarOpen && <span>{item.label}</span>}
                {isNotificationItem && unreadNotificationCount > 0 && (
                  <span className="notification-badge">{unreadNotificationCount}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item logout" onClick={handleLogout}>
            <LogOut size={20} />
            {sidebarOpen && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="manager-main">
        {/* Header */}
        <header className="manager-header">
          <div className="header-left">
            <button
              className="sidebar-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h1 className="header-title">Manager Panel</h1>
          </div>

          <div className="header-right">
            <div className="user-info">
              <span className="user-name">{user?.full_name}</span>
              <span className="user-role">Manager</span>
            </div>
            <div className="user-avatar">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="manager-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ManagerLayout;