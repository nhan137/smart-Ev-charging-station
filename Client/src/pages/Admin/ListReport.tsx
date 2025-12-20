import { useMemo, useState, useEffect } from 'react';
import { FileText, Image as ImageIcon, X, CheckCircle2, Clock3, Loader2 } from 'lucide-react';
import { adminService } from '../../services/adminService';
import './ListReport.css';

type ReportStatus = 'pending' | 'resolved';

type AdminManagerReport = {
  report_id: string;
  station_name: string;
  manager_id: number;
  manager_name: string;
  title: string;
  description: string;
  images: string[];
  status: ReportStatus;
  reported_at: string;
};

const statusLabel = (s: ReportStatus) => {
  return s === 'resolved' ? 'Đã xử lý' : 'Đang chờ';
};

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('vi-VN');
};

const truncate = (text: string, maxLen: number) => {
  if (!text) return '';
  const t = String(text);
  if (t.length <= maxLen) return t;
  return t.slice(0, maxLen).trimEnd() + '...';
};

const normalize = (input: any[]): AdminManagerReport[] => {
  return (input || []).map((r: any) => {
    const rawStatus: string = r.status;
    const status: ReportStatus = rawStatus === 'resolved' ? 'resolved' : 'pending';

    return {
      report_id: r.report_id || r.id || `REP-${Date.now()}`,
      station_name: r.station_name || 'Không rõ',
      manager_id: Number(r.manager_id ?? r.managerId ?? 0),
      manager_name: r.manager_name || r.managerName || 'Manager',
      title: r.title || '',
      description: r.description || '',
      images: Array.isArray(r.images) ? r.images : [],
      status,
      reported_at: r.reported_at || r.reportedAt || new Date().toISOString()
    };
  });
};

const ListReport = () => {
  const [reports, setReports] = useState<AdminManagerReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewImages, setPreviewImages] = useState<string[] | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await adminService.getReports({ page: 1, limit: 100 });
      if (response.success && response.data) {
        const reportsData = Array.isArray(response.data) ? response.data : (response.data.reports || []);
        const normalized = normalize(reportsData);
        setReports(normalized);
      }
    } catch (error: any) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortedReports = useMemo(() => {
    return [...reports].sort((a, b) => new Date(b.reported_at).getTime() - new Date(a.reported_at).getTime());
  }, [reports]);

  const handleToggleStatus = async (reportId: string) => {
    try {
      const report = reports.find((r) => r.report_id === reportId);
      if (!report) return;

      const newStatus: ReportStatus = report.status === 'pending' ? 'resolved' : 'pending';
      await adminService.updateReportStatus(parseInt(reportId), newStatus);
      
      // Update local state
      setReports((prev) =>
        prev.map((r) => (r.report_id === reportId ? { ...r, status: newStatus } : r))
      );
    } catch (error: any) {
      console.error('Error updating report status:', error);
    }
  };

  return (
    <div className="admin-list-report-page">
      <div className="list-report-header">
        <div className="header-left">
          <div className="header-icon">
            <FileText size={22} />
          </div>
          <div>
            <h1>Danh sách báo cáo</h1>
            <p>Danh sách báo cáo từ Manager gửi lên Admin</p>
          </div>
        </div>
      </div>

      <div className="list-report-table-card">
        <div className="list-report-table-wrapper">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <Loader2 size={32} className="animate-spin" style={{ color: '#3b82f6' }} />
            </div>
          ) : (
            <table className="list-report-table">
              <thead>
                <tr>
                  <th>report_id</th>
                  <th>station_name</th>
                  <th>manager_name</th>
                  <th>title</th>
                  <th>description</th>
                  <th>image</th>
                  <th>status</th>
                  <th>reported_at</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedReports.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="empty-cell">
                      Không có báo cáo nào
                    </td>
                  </tr>
                ) : (
                  sortedReports.map((r) => (
                    <tr key={r.report_id}>
                      <td className="mono">{r.report_id}</td>
                      <td>{r.station_name}</td>
                      <td>{r.manager_name}</td>
                      <td className="title-cell">{r.title}</td>
                      <td className="desc-cell" title={r.description}>
                        {truncate(r.description, 90)}
                      </td>
                      <td className="center">
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => setPreviewImages(r.images && r.images.length ? r.images : [])}
                          title={r.images && r.images.length ? 'Xem ảnh' : 'Không có ảnh'}
                          disabled={!r.images || r.images.length === 0}
                        >
                          <ImageIcon size={18} />
                        </button>
                      </td>
                      <td>
                        <span className={`status-pill status-${r.status}`}>
                          {r.status === 'resolved' ? <CheckCircle2 size={14} /> : <Clock3 size={14} />}
                          {statusLabel(r.status)}
                        </span>
                      </td>
                      <td>{formatDateTime(r.reported_at)}</td>
                      <td className="center">
                        <button
                          type="button"
                          className={`btn-action ${r.status === 'pending' ? 'btn-resolve' : 'btn-reopen'}`}
                          onClick={() => handleToggleStatus(r.report_id)}
                        >
                          {r.status === 'pending' ? 'Đã xử lý' : 'Mở lại'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {previewImages !== null && (
        <div className="image-modal-overlay" onClick={() => setPreviewImages(null)}>
          <div className="image-modal" onClick={(e) => e.stopPropagation()}>
            <div className="image-modal-header">
              <h3>Hình ảnh đính kèm</h3>
              <button type="button" className="btn-close" onClick={() => setPreviewImages(null)}>
                <X size={18} />
              </button>
            </div>

            {previewImages.length === 0 ? (
              <div className="image-empty">Không có ảnh</div>
            ) : (
              <div className="image-grid">
                {previewImages.map((src, idx) => (
                  <img key={idx} src={src} alt={`report-${idx}`} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ListReport;
