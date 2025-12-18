import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import './AlertModal.css';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info';
}

const AlertModal = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'success'
}: AlertModalProps) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={48} />;
      case 'error':
        return <AlertCircle size={48} />;
      case 'info':
        return <Info size={48} />;
      default:
        return <CheckCircle size={48} />;
    }
  };

  return (
    <div className="alert-modal-overlay" onClick={onClose}>
      <div className="alert-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="alert-modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        <div className={`alert-icon alert-icon-${type}`}>
          {getIcon()}
        </div>

        <h2>{title}</h2>
        <p>{message}</p>

        <button className={`btn-alert btn-alert-${type}`} onClick={onClose}>
          Đóng
        </button>
      </div>
    </div>
  );
};

export default AlertModal;
