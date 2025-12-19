import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, AlertCircle, Loader2 } from 'lucide-react';
import { managerService } from '../../services/managerService';
import AlertModal from '../../components/shared/AlertModal';
import './UpdateStationStatus.css';

const UpdateStationStatus = () => {
  const { station_id } = useParams();
  const navigate = useNavigate();
  const [station, setStation] = useState<any>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingStation, setLoadingStation] = useState(false);
  const [alertModal, setAlertModal] = useState<{ show: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
    show: false,
    title: '',
    message: '',
    type: 'success'
  });

  useEffect(() => {
    loadStation();
  }, [station_id]);

  const loadStation = async () => {
    if (!station_id) return;
    
    try {
      setLoadingStation(true);
      const response = await managerService.getStationDetail(Number(station_id));
      
      if (response.success && response.data) {
        // Backend trả về data là object trạm
        const stationData = response.data;
        setStation(stationData);
        setNewStatus(stationData.status || 'active');
      } else {
        throw new Error('Không tìm thấy trạm sạc');
      }
    } catch (error: any) {
      console.error('Error loading station:', error);
      setAlertModal({
        show: true,
        title: 'Lỗi',
        message: error.message || 'Không thể tải thông tin trạm',
        type: 'error'
      });
    } finally {
      setLoadingStation(false);
    }
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
      if (!station_id) {
        throw new Error('Không tìm thấy ID trạm');
      }
      
      const response = await managerService.updateStationStatus(Number(station_id), newStatus);
      
      if (response.success) {
        setAlertModal({
          show: true,
          title: 'Thành công!',
          message: response.message || 'Đã cập nhật trạng thái trạm',
          type: 'success'
        });

        // Navigate back after 1.5s
        setTimeout(() => {
          navigate('/manager/stations');
        }, 1500);
      } else {
        throw new Error(response.message || 'Cập nhật thất bại');
      }
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

  if (loadingStation) {
    return (
      <div className="loading-state">
        <Loader2 className="spinner" size={32} />
        <p>Đang tải...</p>
      </div>
    );
  }

  if (!station) {
    return <div className="loading-state">Không tìm thấy trạm sạc</div>;
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
