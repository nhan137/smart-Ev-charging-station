import { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, FileText, MapPin, X } from 'lucide-react';
import { reportService } from '../../../services/reportService';
import './UserReportHistory.css';

type ReportStatus = 'pending' | 'handled';

type StatusHistoryItem = {
  status: ReportStatus;
  at: string; // ISO
  note?: string;
};

type UserReport = {
  report_id: string;
  station_id?: number | string;
  station_name: string;
  title: string;
  description: string;
  status: ReportStatus;
  reported_at: string; // ISO
  last_update_at?: string; // ISO
  images?: string[];
  status_history?: StatusHistoryItem[];
};

const statusLabel = (status: ReportStatus) => {
  switch (status) {
    case 'pending':
      return 'Đang chờ';
    case 'handled':
      return 'Đã xử lí';
    default:
      return status;
  }
};

const formatDateTime = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('vi-VN');
};

const normalizeReports = (input: any[]): UserReport[] => {
  return (input || [])
    .map((r: any) => {
      // Backend returns: report_id, report_code, station_id, station_name, title, description, status, reported_at
      // report_code is like "REP-0001", report_id is numeric
      const report_id = r.report_code || (r.report_id ? `REP-${String(r.report_id).padStart(4, '0')}` : null) || r.id || r.reportId || `REP-${Date.now()}`;
      const station_name = r.station_name || r.stationName || r.station?.station_name || r.station?.name || 'Không rõ';
      const title = r.title || '';
      const description = r.description || '';

      const reported_at =
        r.reported_at ||
        r.reportedAt ||
        (r.createdAt ? new Date(r.createdAt).toISOString() : undefined) ||
        (r.created_at ? new Date(r.created_at).toISOString() : undefined) ||
        new Date().toISOString();

      const last_update_at =
        r.last_update_at ||
        r.lastUpdateAt ||
        (r.updatedAt ? new Date(r.updatedAt).toISOString() : undefined) ||
        (r.updated_at ? new Date(r.updated_at).toISOString() : undefined);

      const rawStatus: string = r.status;
      const status: ReportStatus =
        rawStatus === 'handled' ||
        rawStatus === 'manager_handled' ||
        rawStatus === 'admin_handled' ||
        rawStatus === 'resolved' ||
        rawStatus === 'in_progress'
          ? 'handled'
          : 'pending';

      // Parse image_url from backend (can be JSON array string or single URL)
      let images: string[] = [];
      if (r.image_url) {
        try {
          const parsed = JSON.parse(r.image_url);
          images = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {
          // If not JSON, treat as single URL or comma-separated
          if (r.image_url.includes(',')) {
            images = r.image_url.split(',').map((url: string) => url.trim()).filter((url: string) => url);
          } else {
            images = [r.image_url];
          }
        }
      } else if (Array.isArray(r.images)) {
        images = r.images;
      }

      // Build status_history from backend response or create default
      let status_history: StatusHistoryItem[] = [];
      if (r.status_history && Array.isArray(r.status_history)) {
        // Backend returns status_history with status, timestamp, description
        status_history = r.status_history.map((h: any) => {
          const hs: string = h.status || h.label || '';
          const normalizedStatus: ReportStatus =
            hs === 'handled' || hs === 'manager_handled' || hs === 'admin_handled' || hs === 'resolved' || hs === 'in_progress'
              ? 'handled'
              : 'pending';
          return {
            status: normalizedStatus,
            at: h.timestamp || h.at || reported_at,
            note: h.description || h.note
          };
        });
      } else {
        // Default status_history
        status_history = [
          {
            status,
            at: last_update_at || reported_at,
            note: status === 'handled' ? 'Báo cáo đã được xử lý' : 'Báo cáo đang chờ xử lý'
          }
        ];
      }

      return {
        report_id,
        station_id: r.station_id ?? r.stationId,
        station_name,
        title,
        description,
        status,
        reported_at,
        last_update_at,
        images,
        status_history
      };
    })
    .sort((a, b) => new Date(b.reported_at).getTime() - new Date(a.reported_at).getTime());
};

const UserReportHistory = () => {
  const [reports, setReports] = useState<UserReport[]>([]);
  const [selected, setSelected] = useState<UserReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load reports from API
  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await reportService.getMyReports();
        
        if (response.success && response.data) {
          const normalizedReports = normalizeReports(response.data);
          setReports(normalizedReports);
        } else {
          setError('Không thể tải lịch sử báo cáo');
        }
      } catch (err: any) {
        console.error('[UserReportHistory] Error loading reports:', err);
        setError(err.message || 'Không thể tải lịch sử báo cáo');
      } finally {
        setLoading(false);
      }
    };
    
    loadReports();
  }, []);

  // Load detailed report when selected (to get images and full status_history)
  useEffect(() => {
    const loadReportDetail = async () => {
      if (!selected) return;
      
      // Extract numeric report_id from report_code (e.g., "REP-0001" -> "1")
      // Backend API expects numeric ID
      let numericId = selected.report_id;
      if (selected.report_id.startsWith('REP-')) {
        numericId = selected.report_id.replace('REP-', '').replace(/^0+/, '') || selected.report_id;
      }
      
      try {
        const response = await reportService.getReportDetail(numericId);
        if (response.success && response.data) {
          const detailedReport = normalizeReports([response.data])[0];
          setSelected(detailedReport);
        }
      } catch (err: any) {
        console.error('[UserReportHistory] Error loading report detail:', err);
        // If detail load fails, keep the selected report as is (it already has basic info)
      }
    };
    
    loadReportDetail();
  }, [selected?.report_id]);

  const empty = !loading && reports.length === 0;

  const tableRows = useMemo(() => reports, [reports]);

  return (
    <div className="user-report-history-page">
      <div className="history-header">
        <div className="header-left">
          <div className="header-icon">
            <FileText size={24} />
          </div>
          <div>
            <h1>Lịch sử báo cáo sự cố</h1>
            <p>Xem các báo cáo bạn đã gửi và trạng thái xử lý</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <div className="empty-icon">
            <FileText size={40} />
          </div>
          <h2>Đang tải...</h2>
          <p>Vui lòng chờ trong giây lát</p>
        </div>
      ) : error ? (
        <div className="empty-state">
          <div className="empty-icon">
            <FileText size={40} />
          </div>
          <h2>Lỗi</h2>
          <p>{error}</p>
        </div>
      ) : empty ? (
        <div className="empty-state">
          <div className="empty-icon">
            <FileText size={40} />
          </div>
          <h2>Chưa có báo cáo nào</h2>
          <p>Bạn chưa gửi báo cáo sự cố. Hãy tạo một báo cáo mới để theo dõi tại đây.</p>
        </div>
      ) : (
        <div className="table-card">
          <div className="table-wrapper">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Trạm sạc</th>
                  <th>Tiêu đề</th>
                  <th>Trạng thái</th>
                  <th>Thời gian báo cáo</th>
                  <th>Cập nhật</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((r) => (
                  <tr key={r.report_id} className="table-row" onClick={() => setSelected(r)}>
                    <td className="mono">{r.report_id}</td>
                    <td>
                      <div className="station-cell">
                        <MapPin size={16} />
                        <span>{r.station_name}</span>
                      </div>
                    </td>
                    <td className="title-cell">{r.title}</td>
                    <td>
                      <span className={`status-pill status-${r.status}`}>{statusLabel(r.status)}</span>
                    </td>
                    <td>
                      <div className="time-cell">
                        <Calendar size={16} />
                        <span>{formatDateTime(r.reported_at)}</span>
                      </div>
                    </td>
                    <td>
{r.last_update_at ? (
                        <div className="time-cell">
                          <Clock size={16} />
                          <span>{formatDateTime(r.last_update_at)}</span>
                        </div>
                      ) : (
                        <span className="muted">-</span>
                      )}
                    </td>
                    <td className="action-cell">
                      <button
                        type="button"
                        className="btn-view-detail"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(r);
                        }}
                      >
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && (
        <div className="detail-overlay" onClick={() => setSelected(null)}>
          <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}>
              <X size={20} />
            </button>

            <div className="detail-head">
              <div>
                <div className="detail-id mono">{selected.report_id}</div>
                <h2 className="detail-title">{selected.title}</h2>
                <div className="detail-station">
                  <MapPin size={16} />
                  <span>{selected.station_name}</span>
                </div>
              </div>
              <div>
                <span className={`status-pill status-${selected.status}`}>{statusLabel(selected.status)}</span>
              </div>
            </div>

            <div className="detail-meta">
              <div className="meta-item">
                <Calendar size={16} />
                <div>
                  <div className="meta-label">Báo cáo lúc</div>
                  <div className="meta-value">{formatDateTime(selected.reported_at)}</div>
                </div>
              </div>
              <div className="meta-item">
                <Clock size={16} />
                <div>
                  <div className="meta-label">Cập nhật gần nhất</div>
                  <div className="meta-value">{selected.last_update_at ? formatDateTime(selected.last_update_at) : '-'}</div>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h3>Mô tả</h3>
              <p className="detail-description">{selected.description}</p>
            </div>

            <div className="detail-section">
              <h3>Hình ảnh</h3>
              {selected.images && selected.images.length > 0 ? (
                <div className="image-grid">
                  {selected.images.map((src, idx) => (
<img key={`${src}-${idx}`} src={src} alt={`report-${selected.report_id}-${idx}`} className="detail-image" />
                  ))}
                </div>
              ) : (
                <p className="muted">Không có hình ảnh</p>
              )}
            </div>

            <div className="detail-section">
              <h3>Lịch sử trạng thái</h3>
              <div className="timeline">
                {(selected.status_history || []).map((h, idx) => (
                  <div key={`${h.status}-${h.at}-${idx}`} className="timeline-item">
                    <div className="timeline-dot" />
                    <div className="timeline-content">
                      <div className="timeline-row">
                        <span className={`status-pill status-${h.status}`}>{statusLabel(h.status)}</span>
                        <span className="muted">{formatDateTime(h.at)}</span>
                      </div>
                      {h.note && <div className="timeline-note">{h.note}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserReportHistory;