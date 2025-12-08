import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, AlertCircle } from 'lucide-react';
import { mockStations } from '../../services/mockData';
import AlertModal from '../../components/shared/AlertModal';
import './UpdateStationStatus.css';

const UpdateStationStatus = () => {
  const { station_id } = useParams();
  const navigate = useNavigate();
  const [station, setStation] = useState<any>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [alertModal, setAlertModal] = useState<{ show: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
    show: false,
    title: '',
    message: '',
    type: 'success'
  });

  useEffect(() => {
    loadStation();
  }, [station_id]);

  const loadStation = () => {
    const foundStation = mockStations.find(s => s.station_id === Number(station_id));
    setStation(foundStation);
    setNewStatus(foundStation?.status || 'active');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newStatus === station?.status) {
      setAlertModal({
        show: true,
        title: 'Thông báo',
        message: 'Trạng thái mới giống với trạng thái hiện tại',
        type: 'info'
      });
      return;
    }

    setLoading(true);
    try {
      // TODO: Call API
      // await stationService.updateStatus(station_id, newStatus);

      setAlertModal({
        show: true,
        title: 'Thành công!',
        message: 'Đã cập nhật trạng thái trạm',
        type: 'success'
      });

      // Navigate back after 1.5s
      setTimeout(() => {
        navigate('/manager/stations');
      }, 1500);
    } catch (error: any) {
      setAlertModal({
        show: true,
        title: 'Lỗi',
        message: error.message || 'Có lỗi xảy ra khi cập nhật trạng thái',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: any = {
      active: 'Hoạt động',
      maintenance: 'Bảo trì',
      inactive: 'Ngừng hoạt động'
    };
    return labels[status] || status;
  };

  const getStatusClass = (status: string) => {
    const classes: any = {
      active: 'status-active',
      maintenance: 'status-maintenance',
      inactive: 'status-inactive'
    };
    return classes[status] || '';
  };

  if (!station) {
    return <div className="loading-state">Đang tải...</div>;
  }

  return (
    <div className="update-station-status">
      <div className="page-header-manager">
        <div>
          <button className="back-btn" onClick={() => navigate('/manager/stations')}>
            <ArrowLeft size={20} />
            <span>Quay lại</span>
          </button>
          <h1>Cập nhật trạng thái trạm</h1>
          <p>Thay đổi trạng thái hoạt động của trạm sạc</p>
        </div>
      </div>

      <div className="form-container">
        <div className="station-info-box">
          <Building2 size={24} />
          <div>
            <h3>{station.station_name}</h3>
            <p>{station.address}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="status-form">
          <div className="form-group">
            <label>Trạng thái hiện tại</label>
            <div className={`current-status ${getStatusClass(station.status || 'active')}`}>
              {getStatusLabel(station.status || 'active')}
            </div>
          </div>

          <div className="form-group">
            <label>Thay đổi thành</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              required
            >
              <option value="active">Hoạt động</option>
              <option value="maintenance">Bảo trì</option>
              <option value="inactive">Ngừng hoạt động</option>
            </select>
          </div>

          <div className="info-box">
            <AlertCircle size={20} />
            <div>
              <strong>Lưu ý:</strong>
              <ul>
                <li><strong>Hoạt động:</strong> Trạm đang hoạt động bình thường, khách hàng có thể đặt lịch</li>
                <li><strong>Bảo trì:</strong> Trạm đang được bảo trì, tạm ngừng nhận booking mới</li>
                <li><strong>Ngừng hoạt động:</strong> Trạm không hoạt động, hủy tất cả booking đang chờ</li>
              </ul>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate('/manager/stations')}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
            >
              {loading ? 'Đang cập nhật...' : 'Cập nhật trạng thái'}
            </button>
          </div>
        </form>
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

export default UpdateStationStatus;
