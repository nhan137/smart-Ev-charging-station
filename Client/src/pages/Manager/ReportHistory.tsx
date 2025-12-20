import { useEffect, useMemo, useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { managerService } from '../../services/managerService';
import './ReportHistory.css';

type ReportStatus = 'resolved';

type ManagerReportHistoryItem = {
  report_id: string;
  station_id: number;
  station_name: string;
  title: string;
  status: ReportStatus;
  reported_at: string;
  updated_at?: string;
};

const statusLabel = (s: ReportStatus) => {
  switch (s) {
    case 'resolved':
      return 'Đã xử lý';
    default:
      return 'Đã xử lý';
  }
};

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('vi-VN');
};

const normalize = (input: any[]): ManagerReportHistoryItem[] => {
  return (input || []).map((r: any) => {
    // Backend chỉ trả về báo cáo đã được xử lý (status = 'resolved')
    const status: ReportStatus = 'resolved';

    return {
      report_id: r.report_id || r.id || `REP-${Date.now()}`,
      station_id: Number(r.station_id ?? 0),
      station_name: r.station_name || 'Không rõ',
      title: r.title || '',
      status,
      reported_at: r.reported_at || r.reportedAt || new Date().toISOString()
    };
  });
};

const ReportHistory = () => {
  const [reports, setReports] = useState<ManagerReportHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await managerService.getManagerHistory();
      
      if (response.success && response.data) {
        const reportsData = Array.isArray(response.data) ? response.data : (response.data.reports || []);
        const next = normalize(reportsData);
        setReports(next);
      }
    } catch (error: any) {
      console.error('Error loading report history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = useMemo(() => {
    // Backend đã filter theo manager, chỉ cần sort
    return reports.sort((a, b) => new Date(b.reported_at).getTime() - new Date(a.reported_at).getTime());
  }, [reports]);

  return (
    <div className="manager-report-history-page">
      <div className="report-history-header">
        <div className="header-left">
          <div className="header-icon">
            <FileText size={22} />
          </div>
          <div>
            <h1>Lịch sử báo cáo đã xử lý</h1>
            <p>Danh sách các báo cáo từ User đã được bạn xử lý trong Hộp thư</p>
          </div>
        </div>
      </div>

      <div className="report-history-table-card">
        <div className="report-history-table-wrapper">
          <table className="report-history-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên trạm</th>
                <th>Tiêu đề</th>
                <th>Trạng thái</th>
                <th>Báo cáo</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                    <Loader2 size={32} className="animate-spin" style={{ color: '#3b82f6', margin: '0 auto' }} />
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-cell">
                    Không có báo cáo nào
                  </td>
                </tr>
              ) : (
                filteredReports.map((r) => (
                  <tr key={r.report_id}>
                    <td className="mono">{r.report_id}</td>
                    <td>{r.station_name}</td>
                    <td className="title-cell">{r.title}</td>
                    <td>
                      <span className={`status-pill status-${r.status}`}>{statusLabel(r.status)}</span>
                    </td>
                    <td>{formatDateTime(r.reported_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportHistory;
