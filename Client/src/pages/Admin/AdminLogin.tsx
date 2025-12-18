import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import AlertModal from '../../components/shared/AlertModal';
import './AdminLogin.css';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [alertModal, setAlertModal] = useState({
    show: false,
    title: '',
    message: '',
    type: 'error' as 'success' | 'error' | 'info'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // TODO: Call API
      // const response = await authService.login(formData.email, formData.password);
      
      // Mock check for admin role
      if (formData.email === 'admin@evcharge.com' && formData.password === 'admin123') {
        // Mock: Check role_id = 3 (Admin)
        localStorage.setItem('user', JSON.stringify({
          user_id: 1,
          email: formData.email,
          full_name: 'Admin',
          role_id: 3,
          role_name: 'Admin'
        }));
        
        navigate('/admin/dashboard');
      } else {
        setAlertModal({
          show: true,
          title: 'Đăng nhập thất bại',
          message: 'Email hoặc mật khẩu không đúng, hoặc bạn không có quyền Admin',
          type: 'error'
        });
      }
    } catch (error: any) {
      setAlertModal({
        show: true,
        title: 'Lỗi',
        message: error.message || 'Có lỗi xảy ra',
        type: 'error'
      });
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">
        <div className="admin-login-header">
          <div className="admin-icon">
            <Shield size={48} />
          </div>
          <h1>Admin Panel</h1>
          <p>Đăng nhập với tài khoản quản trị viên</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="form-group">
            <label>Email</label>
            <div className="input-with-icon">
              <Mail size={20} />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="admin@evcharge.com"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Mật khẩu</label>
            <div className="input-with-icon">
              <Lock size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button type="submit" className="admin-login-btn">
            Đăng nhập
          </button>
        </form>

        <div className="admin-login-footer">
          <p>Demo: admin@evcharge.com / admin123</p>
        </div>
      </div>

      <AlertModal
        isOpen={alertModal.show}
        onClose={() => setAlertModal({ ...alertModal, show: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />
    </div>
  );
};

export default AdminLogin;
