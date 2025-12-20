import { useState, useEffect } from 'react';
import { FileText, AlertTriangle, Send, Loader2 } from 'lucide-react';
import { authService } from '../../services/authService';
import { managerService } from '../../services/managerService';
import AlertModal from '../../components/shared/AlertModal';
import './Reports.css';

const Reports = () => {
  const user = authService.getCurrentUser();
  const [stations, setStations] = useState<any[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [alertModal, setAlertModal] = useState<{ show: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
    show: false,
    title: '',
    message: '',
    type: 'success'
  });

  useEffect(() => {
    loadStations();
  }, []);

  const loadStations = async () => {
    try {
      const response = await managerService.getManagerStations();
      if (response.success && response.data) {
        const stationsData = Array.isArray(response.data) ? response.data : (response.data.stations || []);
        setStations(stationsData);
        
        // Auto select first station
        if (stationsData.length > 0) {
          setSelectedStation(stationsData[0].station_id.toString());
        }
      }
    } catch (error: any) {
      console.error('Error loading stations:', error);
      setAlertModal({
        show: true,
        title: 'Lỗi',
        message: error.message || 'Không thể tải danh sách trạm',
        type: 'error'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStation || !title.trim()) {
      setAlertModal({
        show: true,
        title: 'Thiếu thông tin',
        message: 'Vui lòng chọn trạm và nhập tiêu đề sự cố',
        type: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      await managerService.createReport({
        station_id: Number(selectedStation),
        title: title.trim(),
        description: description.trim()
      });

      setAlertModal({
        show: true,
        title: 'Thành công!',
        message: 'Báo cáo sự cố đã được gửi thành công',
        type: 'success'
      });

      setTitle('');
      setDescription('');
    } catch (error: any) {
      setAlertModal({
        show: true,
        title: 'Lỗi',
        message: error.message || 'Có lỗi xảy ra khi gửi báo cáo',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reports-page">
      <div className="page-header-manager">
        <div>
          <h1>Báo cáo sự cố / Bảo trì</h1>
          <p>Gửi báo cáo về sự cố hoặc yêu cầu bảo trì tại trạm</p>
        </div>
      </div>

      <div className="form-container">
        <div className="form-header">
          <AlertTriangle size={32} />
          <div>
            <h2>Gửi báo cáo mới</h2>
            <p>Mô tả chi tiết sự cố để được hỗ trợ nhanh chóng</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="report-form">
          <div className="form-group">
            <label>Trạm sạc</label>
            <select
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
              required
            >
              <option value="">-- Chọn trạm --</option>
              {stations.map((station) => (
                <option key={station.station_id} value={station.station_id}>
                  {station.station_name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Tiêu đề sự cố</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Cổng sạc bị hỏng"
              maxLength={200}
              required
            />
            <span className="char-count">{title.length}/200</span>
          </div>

          <div className="form-group">
            <label>Mô tả chi tiết</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả chi tiết về sự cố, thời gian xảy ra, mức độ nghiêm trọng..."
              rows={6}
              maxLength={1000}
            />
            <span className="char-count">{description.length}/1000</span>
          </div>

          <div className="form-group">
            <label>Upload ảnh (Tùy chọn)</label>
            <div className="upload-box">
              <FileText size={32} />
              <p>Kéo thả ảnh vào đây hoặc click để chọn</p>
              <input type="file" accept="image/*" multiple />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => {
                setTitle('');
                setDescription('');
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
            >
              <Send size={20} />
              <span>{loading ? 'Đang gửi...' : 'Gửi báo cáo'}</span>
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

export default Reports;
