import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Users, Building2, LogOut, Calendar, DollarSign, LayoutDashboard, Bell } from 'lucide-react';
import './AdminLayout.css';

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
    window.location.reload();
  };

  const menuItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/users', icon: Users, label: 'Quản lý người dùng' },
    { path: '/admin/stations', icon: Building2, label: 'Quản lý trạm sạc' },
    { path: '/admin/bookings', icon: Calendar, label: 'Quản lý đặt lịch' },
    { path: '/admin/payments', icon: DollarSign, label: 'Quản lý thanh toán' },
    { path: '/admin/notifications', icon: Bell, label: 'Gửi thông báo' }
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <Shield size={32} />
          <h2>Admin Panel</h2>
        </div>

        <nav className="admin-nav">
          {menuItems.map((item) => (
            <button
              key={item.path}
              className={`admin-nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-nav-item logout" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
