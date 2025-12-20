import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { Eye, EyeOff, X } from "lucide-react";
import './RegisterModal.css';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RegisterModal = ({ isOpen, onClose }: RegisterModalProps) => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<any>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Clear form errors when inputs change
  useEffect(() => {
    if (fullName || email || password || phone) {
      setFormErrors({});
    }
  }, [fullName, email, password, phone]);

  const validateForm = () => {
    const errors: any = {};

    if (!fullName.trim()) {
      errors.fullName = 'Họ tên không được để trống';
    }

    if (!phone.trim()) {
      errors.phone = 'Số điện thoại không được để trống';
    } else if (!/^[0-9]{10}$/.test(phone.trim())) {
      errors.phone = 'Số điện thoại phải có 10 chữ số';
    }

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
      await authService.register({
        full_name: fullName,
        phone: phone,
        email: email,
        password: password
      });
      onClose();
      navigate('/');
      window.location.reload(); // Reload to update auth state
    } catch (err: any) {
      console.error('Registration error:', err);
      const errorMessage = err.message || 'Đã xảy ra lỗi khi đăng ký';
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
        
        <div className="register-header">
          <h2>Đăng ký tài khoản</h2>
          <p>Tạo tài khoản để bắt đầu sử dụng dịch vụ</p>
        </div>

        {error && (
          <div className="error-alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label>Họ tên *</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className={formErrors.fullName ? 'input-error' : ''}
            />
            {formErrors.fullName && (
              <span className="error-message">{formErrors.fullName}</span>
            )}
          </div>

          <div className="form-group">
            <label>Số điện thoại *</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0123456789"
              className={formErrors.phone ? 'input-error' : ''}
            />
            {formErrors.phone && (
              <span className="error-message">{formErrors.phone}</span>
            )}
          </div>

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

          <button 
            type="submit" 
            disabled={loading}
            className="submit-button"
          >
            {loading ? 'Đang xử lý...' : 'Đăng ký'}
          </button>

          <div className="login-link">
            <span>Đã có tài khoản? </span>
            <button 
              type="button" 
              onClick={() => {
                onClose();
                // Trigger login modal from parent
                const event = new CustomEvent('openLoginModal');
                window.dispatchEvent(event);
              }}
              className="link-button"
            >
              Đăng nhập ngay
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterModal;
