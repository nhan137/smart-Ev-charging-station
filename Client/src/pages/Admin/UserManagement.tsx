import { useState, useEffect } from 'react';
import { Filter, Lock, Unlock, Edit, Trash2, Search, Eye, UserPlus, Loader2 } from 'lucide-react';
import ConfirmModal from '../../components/shared/ConfirmModal';
import AlertModal from '../../components/shared/AlertModal';
import UserDetailModal from './components/UserDetailModal';
import EditUserModal from './components/EditUserModal';
import CreateUserModal from './components/CreateUserModal';
import { adminService } from '../../services/adminService';
import './UserManagement.css';

interface User {
  user_id: number;
  full_name: string;
  email: string;
  phone: string;
  role_id: number;
  role_name: string;
  status: 'active' | 'locked';
  created_at: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [userStats, setUserStats] = useState({ total: 0, active: 0, locked: 0 });
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    message: '',
    type: 'warning' as 'warning' | 'danger' | 'info',
    onConfirm: () => {}
  });
  const [alertModal, setAlertModal] = useState({
    show: false,
    title: '',
    message: '',
    type: 'success' as 'success' | 'error' | 'info'
  });
  const [detailModal, setDetailModal] = useState<{
    show: boolean;
    user: User | null;
  }>({
    show: false,
    user: null
  });
  const [editModal, setEditModal] = useState<{
    show: boolean;
    user: User | null;
  }>({
    show: false,
    user: null
  });
  const [createModal, setCreateModal] = useState(false);

  useEffect(() => {
    loadUsers();
    loadUserStats();
  }, [filterRole, filterStatus, searchQuery]);

  const loadUserStats = async () => {
    try {
      const response = await adminService.getUserStats();
      if (response.success && response.data) {
        setUserStats({
          total: response.data.total || 0,
          active: response.data.active || 0,
          locked: response.data.locked || 0
        });
      }
    } catch (error: any) {
      console.error('Error loading user stats:', error);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: 1,
        limit: 100
      };
      
      if (filterRole) params.role_id = filterRole;
      if (filterStatus) params.status = filterStatus;
      if (searchQuery) params.search = searchQuery;

      const response = await adminService.getUsers(params);
      if (response.success && response.data) {
        const usersData = Array.isArray(response.data) ? response.data : (response.data.users || []);
        const formattedUsers = usersData.map((user: any) => ({
          user_id: user.user_id,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone || '',
          role_id: user.role_id,
          role_name: user.role?.role_name || (user.role_id === 1 ? 'User' : user.role_id === 2 ? 'Manager' : 'Admin'),
          status: user.status || 'active',
          created_at: user.created_at
        }));
        setUsers(formattedUsers);
      }
    } catch (error: any) {
      console.error('Error loading users:', error);
      setAlertModal({
        show: true,
        title: 'Lỗi',
        message: error.message || 'Không thể tải danh sách người dùng',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users; // Backend already filters

  const handleLockUser = (user: User) => {
    setConfirmModal({
      show: true,
      title: 'Khóa tài khoản?',
      message: `Bạn có chắc chắn muốn khóa tài khoản của ${user.full_name}?`,
      type: 'warning',
      onConfirm: async () => {
        try {
          await adminService.updateUserStatus(user.user_id, 'locked');
          setAlertModal({
            show: true,
            title: 'Thành công!',
            message: `Đã khóa tài khoản ${user.full_name}`,
            type: 'success'
          });
          loadUsers();
          loadUserStats();
        } catch (error: any) {
          setAlertModal({
            show: true,
            title: 'Lỗi',
            message: error.message || 'Có lỗi xảy ra',
            type: 'error'
          });
        }
      }
    });
  };

  const handleUnlockUser = (user: User) => {
    setConfirmModal({
      show: true,
      title: 'Mở khóa tài khoản?',
      message: `Bạn có chắc chắn muốn mở khóa tài khoản của ${user.full_name}?`,
      type: 'info',
      onConfirm: async () => {
        try {
          await adminService.updateUserStatus(user.user_id, 'active');
          setAlertModal({
            show: true,
            title: 'Thành công!',
            message: `Đã mở khóa tài khoản ${user.full_name}`,
            type: 'success'
          });
          loadUsers();
          loadUserStats();
        } catch (error: any) {
          setAlertModal({
            show: true,
            title: 'Lỗi',
            message: error.message || 'Có lỗi xảy ra',
            type: 'error'
          });
        }
      }
    });
  };

  const handleDeleteUser = (user: User) => {
    setConfirmModal({
      show: true,
      title: 'Xóa người dùng?',
      message: `Bạn có chắc chắn muốn xóa ${user.full_name}? Hành động này không thể hoàn tác.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await adminService.deleteUser(user.user_id);
          setAlertModal({
            show: true,
            title: 'Thành công!',
            message: `Đã xóa người dùng ${user.full_name}`,
            type: 'success'
          });
          loadUsers();
          loadUserStats();
        } catch (error: any) {
          setAlertModal({
            show: true,
            title: 'Lỗi',
            message: error.message || 'Có lỗi xảy ra',
            type: 'error'
          });
        }
      }
    });
  };

  const handleEditUser = async (data: any) => {
    if (!editModal.user) return;

    try {
      await adminService.updateUser(editModal.user.user_id, data);
      setAlertModal({
        show: true,
        title: 'Thành công!',
        message: `Đã cập nhật thông tin của ${data.full_name}`,
        type: 'success'
      });
      setEditModal({ show: false, user: null });
      loadUsers();
    } catch (error: any) {
      setAlertModal({
        show: true,
        title: 'Lỗi',
        message: error.message || 'Có lỗi xảy ra',
        type: 'error'
      });
    }
  };

  const handleCreateUser = async (data: any) => {
    try {
      await adminService.createUser(data);
      setAlertModal({
        show: true,
        title: 'Thành công!',
        message: `Đã tạo người dùng ${data.full_name}`,
        type: 'success'
      });
      setCreateModal(false);
      loadUsers();
      loadUserStats();
    } catch (error: any) {
      setAlertModal({
        show: true,
        title: 'Lỗi',
        message: error.message || 'Có lỗi xảy ra',
        type: 'error'
      });
    }
  };

  const getRoleBadge = (roleName: string) => {
    const roleConfig: any = {
      'User': { class: 'role-user', icon: '👤' },
      'Manager': { class: 'role-manager', icon: '👔' },
      'Admin': { class: 'role-admin', icon: '👑' }
    };
    const config = roleConfig[roleName] || roleConfig['User'];
    return (
      <span className={`role-badge ${config.class}`}>
        <span>{config.icon}</span>
        {roleName}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <span className="status-badge status-active">Hoạt động</span>
    ) : (
      <span className="status-badge status-locked">Đã khóa</span>
    );
  };

  return (
    <div className="user-management">
      <div className="page-header-admin">
        <div>
          <h1>Quản lý Người dùng</h1>
          <p>Quản lý tất cả người dùng trong hệ thống</p>
        </div>
        <button className="btn-add-user" onClick={() => setCreateModal(true)}>
          <UserPlus size={20} />
          <span>Thêm người dùng</span>
        </button>
      </div>

      {/* Filters */}
      <div className="filter-section">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email, SĐT..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <Filter size={20} />
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
            <option value="">Tất cả vai trò</option>
            <option value="1">User</option>
            <option value="2">Manager</option>
            <option value="3">Admin</option>
          </select>
        </div>

        <div className="filter-group">
          <Filter size={20} />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="locked">Đã khóa</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{userStats.total}</div>
          <div className="stat-label">Tổng người dùng</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{userStats.active}</div>
          <div className="stat-label">Đang hoạt động</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{userStats.locked}</div>
          <div className="stat-label">Đã khóa</div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <Loader2 size={32} className="animate-spin" style={{ color: '#3b82f6' }} />
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Họ tên</th>
                <th>Email</th>
                <th>SĐT</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
              <tr key={user.user_id}>
                <td className="id-cell">#{user.user_id}</td>
                <td className="name-cell">{user.full_name}</td>
                <td>{user.email}</td>
                <td>{user.phone}</td>
                <td>{getRoleBadge(user.role_name)}</td>
                <td>{getStatusBadge(user.status)}</td>
                <td>{new Date(user.created_at).toLocaleDateString('vi-VN')}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="action-btn-text btn-edit"
                      onClick={() => setEditModal({ show: true, user })}
                    >
                      Sửa
                    </button>
                    <button
                      className="action-btn-text btn-view"
                      onClick={() => setDetailModal({ show: true, user })}
                    >
                      Chi tiết
                    </button>
                    {user.status === 'active' ? (
                      <button
                        className="action-btn-text btn-lock"
                        onClick={() => handleLockUser(user)}
                      >
                        Khóa
                      </button>
                    ) : (
                      <button
                        className="action-btn-text btn-unlock"
                        onClick={() => handleUnlockUser(user)}
                      >
                        Mở khóa
                      </button>
                    )}
                    <button
                      className="action-btn-text btn-delete"
                      onClick={() => handleDeleteUser(user)}
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>
                    Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.show}
        onClose={() => setConfirmModal({ ...confirmModal, show: false })}
        onConfirm={() => {
          confirmModal.onConfirm();
          setConfirmModal({ ...confirmModal, show: false });
        }}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.show}
        onClose={() => setAlertModal({ ...alertModal, show: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />

      {/* User Detail Modal */}
      <UserDetailModal
        isOpen={detailModal.show}
        onClose={() => setDetailModal({ show: false, user: null })}
        user={detailModal.user}
      />

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={editModal.show}
        onClose={() => setEditModal({ show: false, user: null })}
        onUpdate={(userId, data) => handleEditUser(data)}
        user={editModal.user}
      />

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        onCreate={handleCreateUser}
      />
    </div>
  );
};

export default UserManagement;
