import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../../services/authService';
import { Home, MapPin, Building2, Calendar, Menu, X, History, LogOut, ChevronDown, Star, Bell } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import RegisterModal from '../../Auth/RegisterModal';
import LoginModal from '../../Auth/LoginModal';
import QuickBookingModal from './QuickBookingModal';
import NotificationPopup from '../../../components/shared/NotificationPopup';
import Footer from '../../../components/shared/Footer';
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Listen for custom event to open login modal from register modal
  useEffect(() => {
    const handleOpenLoginModal = () => {
      setShowLoginModal(true);
    };
    window.addEventListener('openLoginModal', handleOpenLoginModal);
    return () => {
      window.removeEventListener('openLoginModal', handleOpenLoginModal);
    };
  }, []);

  // Show notification popup when user logs in
  useEffect(() => {
    if (isAuthenticated) {
      // Check if we should show notification popup
      const hasShownPopup = sessionStorage.getItem('hasShownNotificationPopup');
      if (!hasShownPopup) {
        // Show popup after a short delay
        const timer = setTimeout(() => {
          setShowNotificationPopup(true);
          sessionStorage.setItem('hasShownNotificationPopup', 'true');
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [isAuthenticated]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    authService.logout();
    setShowUserDropdown(false);
    navigate('/');
    window.location.reload();
  };

  const handleNavClick = (item: any) => {
    if (item.requireAuth && !isAuthenticated) {
      setShowLoginModal(true);
    } else if (item.action === 'booking') {
      setShowBookingModal(true);
    } else if (item.path) {
      navigate(item.path);
    } else {
      // Tính năng đang phát triển
      alert('Tính năng đang được phát triển!');
    }
  };

  const navItems = [
    { icon: <Home size={18} />, label: 'Trang chủ', path: '/', requireAuth: false },
    { icon: <MapPin size={18} />, label: 'Bản đồ', path: '/map', requireAuth: false },
    { icon: <Building2 size={18} />, label: 'Trạm sạc', path: '/stations', requireAuth: false },
    { icon: <Calendar size={18} />, label: 'Đặt lịch', action: 'booking', requireAuth: true }
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="public-layout">
      {/* Header */}
      <header className="public-header">
        <div className="public-header-container">
          <div className="header-left">
            <h1 className="public-logo" onClick={() => navigate('/')}>
              ⚡ EV Charging
            </h1>

            {/* Desktop Navigation */}
            <nav className="desktop-nav">
              {navItems.map((item, index) => (
                <button
                  key={index}
                  className={`nav-link ${item.path && isActive(item.path) ? 'nav-link-active' : ''}`}
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
                  <ChevronDown size={18} className={`dropdown-icon ${showUserDropdown ? 'dropdown-icon-open' : ''}`} />
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
                    >
                      <Bell size={18} />
                      <span>Thông báo</span>
                    </button>
                    <div className="dropdown-divider"></div>
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
                  onClick={() => setShowLoginModal(true)}
                  className="nav-button nav-button-secondary"
                >
                  Đăng nhập
                </button>
                <button 
                  onClick={() => setShowRegisterModal(true)}
                  className="nav-button nav-button-primary"
                >
                  Đăng ký
                </button>
              </>
            )}

            {/* Mobile Menu Toggle */}
            <button 
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="mobile-nav">
            {navItems.map((item, index) => (
              <button
                key={index}
                className={`mobile-nav-link ${item.path && isActive(item.path) ? 'mobile-nav-link-active' : ''}`}
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

      {/* Main Content */}
      <main className="public-main">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />

      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onSwitchToRegister={() => setShowRegisterModal(true)}
      />

      {/* Register Modal */}
      <RegisterModal 
        isOpen={showRegisterModal} 
        onClose={() => setShowRegisterModal(false)} 
      />

      {/* Quick Booking Modal */}
      <QuickBookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
      />

      {/* Notification Popup */}
      {showNotificationPopup && (
        <NotificationPopup onClose={() => setShowNotificationPopup(false)} />
      )}
    </div>
  );
};

export default PublicLayout;
