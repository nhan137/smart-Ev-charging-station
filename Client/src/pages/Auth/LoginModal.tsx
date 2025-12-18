import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { Eye, EyeOff, X } from 'lucide-react';
import ForgotPasswordModal from './ForgotPasswordModal';
import './LoginModal.css';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister?: () => void;
}

const LoginModal = ({ isOpen, onClose, onSwitchToRegister }: LoginModalProps) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<any>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Clear form errors when inputs change
  useEffect(() => {
    if (email || password) {
      setFormErrors({});
    }
  }, [email, password]);

  const validateForm = () => {
    const errors: any = {};

    if (!email.trim()) {
      errors.email = 'Email không được để trống';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email không hợp lệ';
    }

    if (!password) {
      errors.password = 'Mật khẩu không được để trống';
    } else if (password.length < 6) {
      errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await authService.login(email, password);
      onClose();
      
      // Redirect based on role_id (1=User, 2=Manager, 3=Admin)
      if (result.user.role_id === 3) {
        window.location.href = '/admin/dashboard';
      } else if (result.user.role_id === 2) {
        window.location.href = '/manager/dashboard';
      } else {
        window.location.href = '/';
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err.message || 'Đã xảy ra lỗi khi đăng nhập';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>
        
        <div className="login-header">
          <h2>Đăng nhập</h2>
          <p>Chào mừng bạn quay trở lại</p>
        </div>

        {error && (
          <div className="error-alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className={formErrors.email ? 'input-error' : ''}
            />
            {formErrors.email && (
              <span className="error-message">{formErrors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label>Mật khẩu *</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                className={formErrors.password ? 'input-error' : ''}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {formErrors.password && (
              <span className="error-message">{formErrors.password}</span>
            )}
          </div>

          <div className="forgot-password">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
            >
              Quên mật khẩu?
            </button>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="submit-button"
          >
            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>

          <div className="register-link">
            <span>Chưa có tài khoản? </span>
            <button 
              type="button" 
              onClick={() => {
                onClose();
                onSwitchToRegister?.();
              }}
              className="link-button"
            >
              Đăng ký ngay
            </button>
          </div>
        </form>
      </div>

      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onBackToLogin={() => setShowForgotPassword(false)}
      />
    </div>
  );
};

export default LoginModal;
