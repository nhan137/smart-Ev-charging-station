import { useState } from 'react';
import { X, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { authService } from '../../services/authService';
import './ForgotPasswordModal.css';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToLogin: () => void;
}

const ForgotPasswordModal = ({ isOpen, onClose, onBackToLogin }: ForgotPasswordModalProps) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setError('');
    setSuccess(false);
    onClose();
  };

  const handleBackToLogin = () => {
    setEmail('');
    setError('');
    setSuccess(false);
    onBackToLogin();
  };

  if (!isOpen) return null;

  return (
    <div className="forgot-password-overlay" onClick={handleClose}>
      <div className="forgot-password-content" onClick={(e) => e.stopPropagation()}>
        <button className="forgot-password-close" onClick={handleClose}>
          <X size={24} />
        </button>

        {!success ? (
          <>
            <div className="forgot-password-header">
              <div className="forgot-password-icon">
                <Mail size={32} />
              </div>
              <h2>Quên mật khẩu?</h2>
              <p>Nhập email của bạn để nhận liên kết đặt lại mật khẩu</p>
            </div>

            <form onSubmit={handleSubmit} className="forgot-password-form">
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              <div className="form-group">
                <label>Email</label>
                <div className="input-with-icon">
                  <Mail size={20} />
                  <input
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={loading}
              >
                {loading ? 'Đang gửi...' : 'Gửi liên kết đặt lại'}
              </button>

              <button
                type="button"
                className="back-to-login-btn"
                onClick={handleBackToLogin}
              >
                <ArrowLeft size={18} />
                <span>Quay lại đăng nhập</span>
              </button>
            </form>
          </>
        ) : (
          <div className="success-state">
            <div className="success-icon">
              <CheckCircle size={64} />
            </div>
            <h2>Email đã được gửi!</h2>
            <p>
              Chúng tôi đã gửi liên kết đặt lại mật khẩu đến email <strong>{email}</strong>
            </p>
            <p className="success-note">
              Vui lòng kiểm tra hộp thư đến (hoặc thư rác) và làm theo hướng dẫn để đặt lại mật khẩu.
            </p>
            <button
              className="back-to-login-btn-success"
              onClick={handleBackToLogin}
            >
              Quay lại đăng nhập
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
