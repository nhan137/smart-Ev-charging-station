import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../../services/authService';
import {
  Home,
  MapPin,
  Building2,
  Calendar,
  Menu,
  X,
  History,
  LogOut,
  ChevronDown,
  Star,
  Bell,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import RegisterModal from '../../Auth/RegisterModal';
import LoginModal from '../../Auth/LoginModal';
import QuickBookingModal from './QuickBookingModal';
import NotificationPopup from '../../../components/shared/NotificationPopup';
import Footer from '../../../components/shared/Footer';
import { notificationService } from '../../../services/notificationService';
import './PublicLayout.css';

const PublicLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getCurrentUser();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  const dropdownRef = useRef<HTMLDivElement>(null);

  /* ---------------- Effects ---------------- */

  useEffect(() => {
    const handleOpenLoginModal = () => setShowLoginModal(true);
    window.addEventListener('openLoginModal', handleOpenLoginModal);
    return () => window.removeEventListener('openLoginModal', handleOpenLoginModal);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const hasShown = sessionStorage.getItem('hasShownNotificationPopup');
    if (!hasShown) {
      const timer = setTimeout(() => {
        setShowNotificationPopup(true);
        sessionStorage.setItem('hasShownNotificationPopup', 'true');
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  // Load unread notification count
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadNotificationCount(0);
      return;
    }

    const loadUnreadCount = async () => {
      try {
        const response = await notificationService.getNotificationHistory({
          status: 'unread',
          limit: 100
        });
        if (response.success && response.data) {
          const unreadNotifications = response.data.notifications || [];
          // Also check isRead field
          const unreadCount = unreadNotifications.filter((n: any) => 
            n.status === 'unread' || !n.isRead
          ).length;
          setUnreadNotificationCount(unreadCount);
        }
      } catch (error) {
        console.error('Error loading unread count:', error);
        setUnreadNotificationCount(0);
      }
    };

    loadUnreadCount();
    
    // Refresh every 10 seconds for real-time updates
    const interval = setInterval(loadUnreadCount, 10000);
    
    // Listen for notification updates (when marked as read)
    const handleNotificationUpdate = () => {
      loadUnreadCount();
    };
    window.addEventListener('notification-updated', handleNotificationUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('notification-updated', handleNotificationUpdate);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* ---------------- Handlers ---------------- */

  const handleLogout = async () => {
    await authService.logout();
    setShowUserDropdown(false);
    navigate('/');
    window.location.reload();
  };

  const handleNavClick = (item: any) => {
    if (item.requireAuth && !isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    if (item.action === 'booking') {
      setShowBookingModal(true);
      return;
    }

    if (item.path) {
      navigate(item.path);
      return;
    }

    alert('Tính năng đang được phát triển!');
  };

  /* ---------------- Navigation ---------------- */

  const navItems = [
    { icon: <Home size={18} />, label: 'Trang chủ', path: '/' },
    { icon: <MapPin size={18} />, label: 'Bản đồ', path: '/map' },
    { icon: <Building2 size={18} />, label: 'Trạm sạc', path: '/stations' },
    { icon: <Calendar size={18} />, label: 'Đặt lịch', action: 'booking', requireAuth: true }
  ];

  const isActive = (path: string) => location.pathname === path;

  /* ---------------- Render ---------------- */

  return (
    <div className="public-layout">
      {/* ================= HEADER ================= */}
      <header className="public-header">
        <div className="public-header-container">
          <div className="header-left">
            <h1 className="public-logo" onClick={() => navigate('/')}>
              ⚡ EV Charging
            </h1>

            <nav className="desktop-nav">
              {navItems.map((item, i) => (
                <button
                  key={i}
                  className={`nav-link ${
                    item.path && isActive(item.path) ? 'nav-link-active' : ''
                  }`}
                  onClick={() => handleNavClick(item)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="header-right">
            {isAuthenticated ? (
              <div className="user-menu" ref={dropdownRef}>
                <button
                  className="user-menu-button"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                >
                  <span className="user-avatar-small">
                    {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                  <span className="user-name-text">{user?.full_name}</span>
                  <ChevronDown
                    size={18}
                    className={`dropdown-icon ${
                      showUserDropdown ? 'dropdown-icon-open' : ''
                    }`}
                  />
                </button>

                {showUserDropdown && (
                  <div className="user-dropdown">
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        navigate('/bookings/list');
                        setShowUserDropdown(false);
                      }}
                    >
                      <Calendar size={18} />
                      <span>Lịch sử đặt lịch</span>
                    </button>

                    <button
                      className="dropdown-item"
                      onClick={() => {
                        navigate('/bookings/history');
                        setShowUserDropdown(false);
                      }}
                    >
                      <History size={18} />
                      <span>Lịch sử sạc & Thanh toán</span>
                    </button>

                    <button
                      className="dropdown-item"
                      onClick={() => {
                        navigate('/user/feedbacks-favorites');
                        setShowUserDropdown(false);
                      }}
                    >
                      <Star size={18} />
                      <span>Đánh giá & Trạm yêu thích</span>
                    </button>

                    <button
                      className="dropdown-item"
                      onClick={() => {
                        navigate('/user/notifications');
                        setShowUserDropdown(false);
                      }}
                      style={{ position: 'relative', paddingRight: unreadNotificationCount > 0 ? '2.5rem' : '1rem' }}
                    >
                      <Bell size={18} />
                      <span>Thông báo</span>
                      {unreadNotificationCount > 0 && (
                        <span style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: '#ef4444',
                          color: 'white',
                          borderRadius: '50%',
                          minWidth: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          padding: '0 6px',
                          boxSizing: 'border-box',
                          lineHeight: '20px'
                        }}>
                          {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                        </span>
                      )}
                    </button>

                    {/* ===== NEW ITEMS ===== */}
                    <button
                      className="dropdown-item"
                      type="button"
                      onClick={() => {
                        navigate('/user/report/create');
                        setShowUserDropdown(false);
                      }}
                    >
                      <AlertTriangle size={18} />
                      <span>Báo cáo sự cố</span>
                    </button>


                    <button
                      className="dropdown-item"
                      onClick={() => {
                        navigate('/user/report/history');
                        setShowUserDropdown(false);
                      }}
                    >
                      <FileText size={18} />
                      <span>Lịch sử báo cáo sự cố</span>
                    </button>

                    <div className="dropdown-divider" />

                    <button
                      className="dropdown-item dropdown-item-danger"
                      onClick={handleLogout}
                    >
                      <LogOut size={18} />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  className="nav-button nav-button-secondary"
                  onClick={() => setShowLoginModal(true)}
                >
                  Đăng nhập
                </button>
                <button
                  className="nav-button nav-button-primary"
                  onClick={() => setShowRegisterModal(true)}
                >
                  Đăng ký
                </button>
              </>
            )}

            <button
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="mobile-nav">
            {navItems.map((item, i) => (
              <button
                key={i}
                className={`mobile-nav-link ${
                  item.path && isActive(item.path) ? 'mobile-nav-link-active' : ''
                }`}
                onClick={() => {
                  handleNavClick(item);
                  setMobileMenuOpen(false);
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        )}
      </header>

      {/* ================= MAIN ================= */}
      <main className="public-main">
        <Outlet />
      </main>

      <Footer />

      {/* ================= MODALS ================= */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToRegister={() => setShowRegisterModal(true)}
      />

      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
      />

      <QuickBookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
      />

      {showNotificationPopup && (
        <NotificationPopup onClose={() => setShowNotificationPopup(false)} />
      )}
    </div>
  );
};

export default PublicLayout;
