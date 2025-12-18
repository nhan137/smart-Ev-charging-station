import { useEffect, useMemo, useRef, useState } from 'react';
import { FileText } from 'lucide-react';
import { authService } from '../../services/authService';
import { getNextId, mockAdminReports, mockManagerNotifications } from '../../services/mockData';
import './ReportHistory.css';

type ReportStatus = 'pending_admin' | 'admin_handled';

type AdminReportItem = {
  report_id: string;
  station_id: number;
  station_name: string;
  title: string;
  status: ReportStatus;
  reported_at: string;
};

const statusLabel = (s: ReportStatus) => {
  switch (s) {
    case 'pending_admin':
      return 'Đang chờ ';
    case 'admin_handled':
      return 'Đã xử lý';
    default:
      return s;
  }
};

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('vi-VN');
};

const normalize = (input: any[]): AdminReportItem[] => {
  return (input || []).map((r: any) => {
    const rawStatus: string = r.status;
    const status: ReportStatus = rawStatus === 'admin_handled' ? 'admin_handled' : 'pending_admin';

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
  const user = authService.getCurrentUser();
  const [reports, setReports] = useState<AdminReportItem[]>([]);
  const notifiedHandledIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const load = () => {
      const next = normalize(mockAdminReports as any);

      const managedStationIds: number[] = user?.managed_stations || [];
      const newlyHandled = next.filter(
        (r) =>
          managedStationIds.includes(r.station_id) &&
          r.status === 'admin_handled' &&
          !notifiedHandledIdsRef.current.has(r.report_id)
      );

      if (newlyHandled.length > 0) {
        const nowIso = new Date().toISOString();
        newlyHandled.forEach((r) => {
          notifiedHandledIdsRef.current.add(r.report_id);
          const notificationId = getNextId(mockManagerNotifications as any, 'notification_id');
          (mockManagerNotifications as any).push({
            notification_id: notificationId,
            title: 'Admin đã phê duyệt / xử lý báo cáo',
            message: `Báo cáo ${r.report_id} tại ${r.station_name} đã được Admin xử lý.`,
            type: 'system',
            recipients: 'specific',
            recipientCount: 1,
            sentAt: nowIso,
            sentBy: 'Admin System',
            status: 'sent',
            target_manager_id: user?.user_id
          });
        });
      }

      setReports(next);
    };

    // seed notified list for already-handled items
    normalize(mockAdminReports as any).forEach((r) => {
      if (r.status === 'admin_handled') notifiedHandledIdsRef.current.add(r.report_id);
    });

    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredReports = useMemo(() => {
    const managedStationIds: number[] = user?.managed_stations || [];
    return reports
      .filter((r) => managedStationIds.includes(r.station_id))
      .sort((a, b) => new Date(b.reported_at).getTime() - new Date(a.reported_at).getTime());
  }, [reports, user?.managed_stations]);

  return (
    <div className="manager-report-history-page">
      <div className="report-history-header">
        <div className="header-left">
          <div className="header-icon">
            <FileText size={22} />
          </div>
          <div>
            <h1>Lịch sử báo cáo gửi lên Admin</h1>
            <p>Danh sách các báo cáo đã được chuyển lên admin để xử lý</p>
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
              {filteredReports.length === 0 ? (
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
