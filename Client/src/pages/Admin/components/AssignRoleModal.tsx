import { useState } from 'react';
import { X } from 'lucide-react';
import './AssignRoleModal.css';

interface AssignRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onAssign: (userId: number, role: string, stationIds?: number[]) => void;
}

const AssignRoleModal = ({ isOpen, onClose, user, onAssign }: AssignRoleModalProps) => {
  const [selectedRole, setSelectedRole] = useState(user?.role || 'user');
  const [selectedStations, setSelectedStations] = useState<number[]>([]);

  if (!isOpen || !user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAssign(user.user_id, selectedRole, selectedStations);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        <h2>Phân quyền người dùng</h2>
        <p className="modal-subtitle">Người dùng: {user.full_name}</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Vai trò</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              required
            >
              <option value="user">User</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {selectedRole === 'manager' && (
            <div className="form-group">
              <label>Chọn trạm quản lý</label>
              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    value="1"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedStations([...selectedStations, 1]);
                      } else {
                        setSelectedStations(selectedStations.filter(id => id !== 1));
                      }
                    }}
                  />
                  Trạm sạc Hải Châu
                </label>
                <label>
                  <input
                    type="checkbox"
                    value="2"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedStations([...selectedStations, 2]);
                      } else {
                        setSelectedStations(selectedStations.filter(id => id !== 2));
                      }
                    }}
                  />
                  Trạm sạc Sơn Trà Premium
                </label>
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Hủy
            </button>
            <button type="submit" className="btn-submit">
              Xác nhận
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignRoleModal;
