import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/authService';
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import './ResetPassword.css';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState<any>({});

  useEffect(() => {
    if (!token) {
      setError('Liên kết không hợp lệ. Vui lòng yêu cầu đặt lại mật khẩu mới.');
    }
  }, [token]);

  const validateForm = () => {
    const errors: any = {};

    if (!password) {
      errors.password = 'Mật khẩu không được để trống';
    } else if (password.length < 6) {
      errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Liên kết không hợp lệ.');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword(token, password);
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-container">
          <div className="error-state">
            <XCircle size={64} className="error-icon" />
            <h2>Liên kết không hợp lệ</h2>
            <p>Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.</p>
            <button
              className="back-button"
              onClick={() => navigate('/')}
            >
              Quay về trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-container">
          <div className="success-state">
            <CheckCircle size={64} className="success-icon" />
            <h2>Đặt lại mật khẩu thành công!</h2>
            <p>Mật khẩu của bạn đã được cập nhật.</p>
            <p className="redirect-message">Đang chuyển hướng đến trang đăng nhập...</p>
            <button
              className="login-button"
              onClick={() => navigate('/')}
            >
              Đăng nhập ngay
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        <div className="reset-password-header">
          <h2>Đặt lại mật khẩu</h2>
          <p>Nhập mật khẩu mới của bạn</p>
        </div>

        {error && (
          <div className="error-alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="reset-password-form">
          <div className="form-group">
            <label>Mật khẩu mới *</label>
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

          <div className="form-group">
            <label>Xác nhận mật khẩu *</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                className={formErrors.confirmPassword ? 'input-error' : ''}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {formErrors.confirmPassword && (
              <span className="error-message">{formErrors.confirmPassword}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="submit-button"
          >
            {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
          </button>

          <button
            type="button"
            className="back-link"
            onClick={() => navigate('/')}
          >
            Quay về trang chủ
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;

