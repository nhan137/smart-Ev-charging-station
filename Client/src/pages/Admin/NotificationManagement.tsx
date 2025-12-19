import { useState, useEffect } from 'react';
import { Bell, Send, Users, User, Clock, CheckCircle } from 'lucide-react';
import AlertModal from '../../components/shared/AlertModal';
import { adminService } from '../../services/adminService';
import './NotificationManagement.css';

const NotificationManagement = () => {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'system',
    target: 'all'
  });
  const [errors, setErrors] = useState<any>({});
  const [alertModal, setAlertModal] = useState({
    show: false,
    title: '',
    message: '',
    type: 'success' as 'success' | 'error' | 'info'
  });
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [sentNotifications, setSentNotifications] = useState<any[]>([]);

  useEffect(() => {
    loadUsers();
    loadSentNotifications();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await adminService.getUsers({ role_id: '1', limit: 100 });
      if (response.success && response.data) {
        const usersData = Array.isArray(response.data) ? response.data : (response.data.users || []);
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadSentNotifications = async () => {
    try {
      const response = await adminService.getNotificationHistory({ page: 1, limit: 50 });
      if (response.success && response.data) {
        const notificationsData = Array.isArray(response.data) ? response.data : (response.data.notifications || []);
        setSentNotifications(notificationsData);
      }
    } catch (error) {
      console.error('Error loading notification history:', error);
    }
  };

  const validate = () => {
    const newErrors: any = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Tiêu đề không được để trống';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Nội dung không được để trống';
    }

    if (!formData.type) {
      newErrors.type = 'Vui lòng chọn loại thông báo';
    }

    if (formData.target === 'specific' && selectedUsers.length === 0) {
      newErrors.target = 'Vui lòng chọn ít nhất 1 người dùng';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      const recipients = formData.target === 'all' ? 'all' : selectedUsers;
      
      const result = await adminService.sendNotification({
        title: formData.title,
        message: formData.message,
        type: formData.type,
        recipients
      });

      setAlertModal({
        show: true,
        title: 'Gửi thành công!',
        message: `Đã gửi thông báo đến ${result.data?.sent_count || 0} người dùng`,
        type: 'success'
      });

      // Reload notification history
      loadSentNotifications();

      // Reset form
      setFormData({
        title: '',
        message: '',
        type: 'system',
        target: 'all'
      });
      setSelectedUsers([]);
      setErrors({});
    } catch (error: any) {
      setAlertModal({
        show: true,
        title: 'Lỗi',
        message: error.message || 'Có lỗi xảy ra khi gửi thông báo',
        type: 'error'
      });
    }
  };

  const handleUserToggle = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.user_id));
    }
  };

  return (
    <div className="notification-management">
      <div className="page-header-admin">
        <div>
          <h1>Gửi Thông báo Hệ thống</h1>
          <p>Gửi thông báo đến người dùng</p>
        </div>
      </div>

      <div className="notification-container">
        <div className="notification-form-card">
          <div className="form-header">
            <Bell size={32} />
            <h2>Tạo thông báo mới</h2>
          </div>

          <form onSubmit={handleSubmit} className="notification-form">
            {/* Title */}
            <div className="form-group">
              <label>Tiêu đề *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="VD: Thông báo bảo trì hệ thống"
                className={errors.title ? 'error' : ''}
              />
              {errors.title && <span className="error-text">{errors.title}</span>}
            </div>

            {/* Message */}
            <div className="form-group">
              <label>Nội dung *</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Nhập nội dung thông báo..."
                rows={5}
                className={errors.message ? 'error' : ''}
              />
              {errors.message && <span className="error-text">{errors.message}</span>}
            </div>

            {/* Type */}
            <div className="form-group">
              <label>Loại thông báo *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className={errors.type ? 'error' : ''}
              >
                <option value="system">Hệ thống</option>
                <option value="payment">Thanh toán</option>
                <option value="promotion">Khuyến mãi</option>
                <option value="booking">Đặt lịch</option>
              </select>
              {errors.type && <span className="error-text">{errors.type}</span>}
            </div>

            {/* Target */}
            <div className="form-group">
              <label>Gửi đến *</label>
              <div className="radio-group">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="target"
                    value="all"
                    checked={formData.target === 'all'}
                    onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                  />
                  <Users size={20} />
                  <span>Tất cả user</span>
                </label>

                <label className="radio-option">
                  <input
                    type="radio"
                    name="target"
                    value="specific"
                    checked={formData.target === 'specific'}
                    onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                  />
                  <User size={20} />
                  <span>Chọn user cụ thể</span>
                </label>
              </div>
              {errors.target && <span className="error-text">{errors.target}</span>}
            </div>

            {/* User Selection */}
            {formData.target === 'specific' && (
              <div className="form-group">
                <div className="user-selection-header">
                  <label>Chọn người dùng ({selectedUsers.length}/{users.length})</label>
                  <button
                    type="button"
                    className="btn-select-all"
                    onClick={handleSelectAll}
                  >
                    {selectedUsers.length === users.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </button>
                </div>
                <div className="user-list">
                  {users.map((user) => (
                    <label key={user.user_id} className="user-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.user_id)}
                        onChange={() => handleUserToggle(user.user_id)}
                      />
                      <div className="user-info">
                        <span className="user-name">{user.full_name}</span>
                        <span className="user-email">{user.email}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button type="submit" className="btn-send">
              <Send size={20} />
              <span>Gửi thông báo</span>
            </button>
          </form>
        </div>

        {/* Preview Card */}
        <div className="notification-preview-card">
          <h3>Xem trước</h3>
          <div className="preview-notification">
            <div className="preview-header">
              <Bell size={20} />
              <span className="preview-type">{formData.type || 'system'}</span>
            </div>
            <div className="preview-title">
              {formData.title || 'Tiêu đề thông báo'}
            </div>
            <div className="preview-message">
              {formData.message || 'Nội dung thông báo sẽ hiển thị ở đây...'}
            </div>
            <div className="preview-footer">
              <span>Vừa xong</span>
            </div>
          </div>

          <div className="preview-info">
            <div className="info-item">
              <span className="info-label">Người nhận:</span>
              <span className="info-value">
                {formData.target === 'all' 
                  ? `Tất cả (${users.length} người)` 
                  : `${selectedUsers.length} người`}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Loại:</span>
              <span className="info-value">{formData.type || 'system'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sent Notifications History */}
      <div className="sent-notifications-section">
        <div className="section-header">
          <div className="header-left">
            <CheckCircle size={24} />
            <h2>Lịch sử thông báo đã gửi</h2>
          </div>
          <span className="notification-count">{sentNotifications.length} thông báo</span>
        </div>

        <div className="sent-notifications-list">
          {sentNotifications.length === 0 ? (
            <div className="empty-state">
              <Bell size={48} />
              <p>Chưa có thông báo nào được gửi</p>
            </div>
          ) : (
            sentNotifications.map((notif) => (
              <div key={notif.notification_id} className="sent-notification-item">
                <div className="notification-badge">
                  <Bell size={20} />
                  <span className={`type-badge ${notif.type}`}>
                    {notif.type === 'system' && 'Hệ thống'}
                    {notif.type === 'payment' && 'Thanh toán'}
                    {notif.type === 'promotion' && 'Khuyến mãi'}
                    {notif.type === 'booking' && 'Đặt lịch'}
                  </span>
                </div>
                
                <div className="notification-main">
                  <h3>{notif.title}</h3>
                  <p>{notif.message}</p>
                  
                  <div className="notification-meta">
                    <span className="meta-item">
                      <Users size={16} />
                      {notif.recipients === 'all' 
                        ? `Tất cả user (${notif.recipientCount})` 
                        : `${notif.recipientCount} user`}
                    </span>
                    <span className="meta-item">
                      <Clock size={16} />
                      {new Date(notif.sentAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>

                <div className="notification-status">
                  <CheckCircle size={20} color="#10b981" />
                  <span>Đã gửi</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Alert Modal */}
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

export default NotificationManagement;
