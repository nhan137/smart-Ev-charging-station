import { X } from 'lucide-react';
import './UserDetailModal.css';

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

const UserDetailModal = ({ isOpen, onClose, user }: UserDetailModalProps) => {
  if (!isOpen || !user) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        <h2>Chi tiết người dùng</h2>

        <div className="detail-section">
          <div className="detail-row">
            <span className="detail-label">ID:</span>
            <span className="detail-value">#{user.user_id}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Email:</span>
            <span className="detail-value">{user.email}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Họ tên:</span>
            <span className="detail-value">{user.full_name}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Số điện thoại:</span>
            <span className="detail-value">{user.phone || 'Chưa cập nhật'}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Vai trò:</span>
            <span className={`role-badge role-${user.role}`}>
              {user.role === 'admin' ? 'Admin' : user.role === 'manager' ? 'Manager' : 'User'}
            </span>
          </div>

          {user.managed_stations && user.managed_stations.length > 0 && (
            <div className="detail-row">
              <span className="detail-label">Trạm quản lý:</span>
              <span className="detail-value">{user.managed_stations.length} trạm</span>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="btn-submit">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;
