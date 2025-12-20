import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, Filter, Mail, Loader2 } from 'lucide-react';
import { authService } from '../../services/authService';
import { managerService } from '../../services/managerService';
import AlertModal from '../../components/shared/AlertModal';
import './MailBox.css';

type ManagerReportStatus = 'pending' | 'resolved' | 'escalated';

type ManagerReportItem = {
  report_id: string;
  user_id: number;
  user_name: string;
  station_id: number;
  station_name: string;
  title: string;
  description: string;
  status: ManagerReportStatus;
  reported_at: string;
  last_update_at?: string;
};

const statusLabel = (s: ManagerReportStatus) => {
  switch (s) {
    case 'pending':
      return 'pending';
    case 'resolved':
      return 'resolved';
    case 'escalated':
      return 'escalated';
    default:
      return s;
  }
};

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('vi-VN');
};

const truncate = (text: string, maxLen: number) => {
  const t = (text || '').trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen)}...`;
};

const normalizeManagerReports = (input: any[]): ManagerReportItem[] => {
  return (input || []).map((r: any) => {
    const rawStatus: string = r.status;

    const status: ManagerReportStatus =
      rawStatus === 'resolved' || rawStatus === 'handled' || rawStatus === 'admin_handled' || rawStatus === 'manager_handled'
        ? 'resolved'
        : rawStatus === 'escalated' || rawStatus === 'escalated_admin'
          ? 'escalated'
          : 'pending';

    return {
      report_id: r.report_id || r.id || `REP-${Date.now()}`,
      user_id: (r.user_id || r.reporter_id) ?? 1,
      user_name: r.user_name || r.reporter_name || r.userName || 'Người dùng',
      station_id: Number((r.station_id ?? r.stationId) ?? 0),
      station_name: r.station_name || r.stationName || 'Không rõ',
      title: r.title || '',
      description: r.description || '',
      status,
      reported_at: r.reported_at || r.reportedAt || r.created_at || new Date().toISOString(),
      last_update_at: r.last_update_at || r.lastUpdateAt || r.updated_at
    };
  });
};

const MailBox = () => {
  const user = authService.getCurrentUser();

  const [stations, setStations] = useState<any[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>('all');
  const [reports, setReports] = useState<ManagerReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [alertModal, setAlertModal] = useState<{ show: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
    show: false,
    title: '',
    message: '',
    type: 'success'
  });

  useEffect(() => {
    loadData();
  }, [selectedStation]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Log current user info
      const currentUser = authService.getCurrentUser();
      console.log('[MailBox] Current user:', currentUser);
      console.log('[MailBox] User ID:', currentUser?.user_id || currentUser?.id);
      
      // Load stations
      const stationsResponse = await managerService.getManagerStations();
      if (stationsResponse.success && stationsResponse.data) {
        const stationsData = Array.isArray(stationsResponse.data) ? stationsResponse.data : (stationsResponse.data.stations || []);
        setStations(stationsData);
      }

      // Load reports - chỉ lấy báo cáo từ User có status = 'pending' (chờ Manager xử lý)
      // Lưu ý: ReportHistory hiển thị báo cáo do Manager gửi lên Admin (khác với MailBox)
      const reportsResponse = await managerService.getManagerInbox({
        station_id: selectedStation !== 'all' ? Number(selectedStation) : undefined,
        status: 'pending' // Chỉ lấy báo cáo chưa xử lý từ User
      });
      
      if (reportsResponse.success && reportsResponse.data) {
        const reportsData = Array.isArray(reportsResponse.data) ? reportsResponse.data : (reportsResponse.data.reports || []);
        console.log('[MailBox] Full API Response:', JSON.stringify(reportsResponse, null, 2));
        console.log('[MailBox] Reports data array:', reportsData);
        console.log('[MailBox] Loaded reports:', reportsData.length);
        const normalized = normalizeManagerReports(reportsData);
        console.log('[MailBox] Normalized reports:', normalized);
        setReports(normalized);
      } else {
        console.warn('[MailBox] Response not successful or no data:', reportsResponse);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      setAlertModal({
        show: true,
        title: 'Lỗi',
        message: error.message || 'Không thể tải dữ liệu',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = useMemo(() => {
    // Backend đã filter theo manager, chỉ cần filter theo selectedStation
    return reports
      .filter((r) => {
        if (selectedStation === 'all') return true;
        return r.station_id.toString() === selectedStation;
      })
      .sort((a, b) => new Date(b.reported_at).getTime() - new Date(a.reported_at).getTime());
  }, [reports, selectedStation]);

  const markResolved = async (reportId: string) => {
    try {
      await managerService.resolveReport(Number(reportId));
      
      setReports((prev) =>
        prev.map((r) => (r.report_id === reportId ? { ...r, status: 'resolved', last_update_at: new Date().toISOString() } : r))
      );

      setAlertModal({
        show: true,
        title: 'Thành công',
        message: 'Đã cập nhật trạng thái báo cáo sang resolved',
        type: 'success'
      });
      
      // Reload data
      loadData();
    } catch (error: any) {
      setAlertModal({
        show: true,
        title: 'Lỗi',
        message: error.message || 'Không thể xử lý báo cáo',
        type: 'error'
      });
    }
  };

  return (
    <div className="mailbox-page">
      <div className="mailbox-header">
        <div className="mailbox-title">
          <div className="mailbox-icon">
            <Mail size={22} />
          </div>
          <div>
            <h1>Hộp thư báo cáo từ User</h1>
            <p>Theo dõi các báo cáo sự cố do user gửi lên</p>
          </div>
        </div>

        <div className="mailbox-filters">
          <div className="filter-item">
            <Filter size={18} />
            <select value={selectedStation} onChange={(e) => setSelectedStation(e.target.value)}>
              <option value="all">Tất cả trạm</option>
              {stations.map((s) => (
                <option key={s.station_id} value={s.station_id.toString()}>
                  {s.station_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mailbox-table-card">
        <div className="mailbox-table-wrapper">
<table className="mailbox-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên người dùng</th>
                <th>Tên trạm sạc</th>
                <th>Tiêu đề</th>
                <th>Mô tả</th>
                <th>Trạng thái</th>
                <th>Thời gian báo cáo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>
                    <Loader2 size={32} className="animate-spin" style={{ color: '#3b82f6', margin: '0 auto' }} />
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="mailbox-empty">
                    Không có báo cáo nào
                  </td>
                </tr>
              ) : (
                filteredReports.map((r) => (
                  <tr key={r.report_id}>
                    <td className="mono">{r.report_id}</td>
                    <td>{r.user_name}</td>
                    <td>{r.station_name}</td>
                    <td className="title-cell">{truncate(r.title, 60)}</td>
                    <td className="desc-cell" title={r.description}>
                      {truncate(r.description, 80)}
                    </td>
                    <td>
                      <span className={`status-pill status-${r.status}`}>{statusLabel(r.status)}</span>
                    </td>
                    <td>{formatDateTime(r.reported_at)}</td>
                    <td className="action-cell">
                      <button
                        type="button"
                        className="btn-resolve"
                        disabled={r.status === 'resolved'}
                        onClick={() => markResolved(r.report_id)}
                      >
                        <CheckCircle size={16} />
                        <span>Đã xử lý</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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

export default MailBox;