import { useState, useEffect } from 'react';
import { Filter, Search, DollarSign, Download, CreditCard, TrendingUp, Loader2 } from 'lucide-react';
import AlertModal from '../../components/shared/AlertModal';
import { adminService } from '../../services/adminService';
import './PaymentManagement.css';

interface Payment {
  payment_id: number;
  booking_id: number;
  user_id: number;
  user_name: string;
  station_id: number;
  station_name: string;
  amount: number;
  method: string;
  status: string;
  payment_date: string;
  transaction_id?: string;
}

const PaymentManagement = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentStats, setPaymentStats] = useState({ totalRevenue: 0, pending: 0, successRate: 0, totalTransactions: 0 });
  const [filterStation, setFilterStation] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [alertModal, setAlertModal] = useState({
    show: false,
    title: '',
    message: '',
    type: 'success' as 'success' | 'error' | 'info'
  });
  const [detailModal, setDetailModal] = useState({
    show: false,
    payment: null as Payment | null
  });

  useEffect(() => {
    loadPayments();
    loadPaymentStats();
  }, [filterStation, filterStatus, filterStartDate, filterEndDate, searchQuery]);

  const loadPaymentStats = async () => {
    try {
      const response = await adminService.getPaymentStats();
      if (response.success && response.data) {
        setPaymentStats({
          totalRevenue: response.data.total_revenue || 0,
          pending: response.data.pending_amount || 0,
          successRate: response.data.success_rate || 0,
          totalTransactions: response.data.total_transactions || 0
        });
      }
    } catch (error: any) {
      console.error('Error loading payment stats:', error);
    }
  };

  const loadPayments = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: 1,
        limit: 100
      };
      
      if (filterStation) params.station_id = filterStation;
      if (filterStatus) params.status = filterStatus;
      if (searchQuery) params.search = searchQuery;
      if (filterStartDate) params.startDate = filterStartDate;
      if (filterEndDate) params.endDate = filterEndDate;

      const response = await adminService.getPayments(params);
      if (response.success && response.data) {
        const paymentsData = Array.isArray(response.data) ? response.data : (response.data.payments || []);
        const formattedPayments = paymentsData.map((payment: any) => ({
          payment_id: payment.payment_id,
          booking_id: payment.booking_id,
          user_id: payment.user_id,
          user_name: payment.user?.full_name || payment.user_name || 'N/A',
          station_id: payment.booking?.station_id || payment.station_id,
          station_name: payment.booking?.station?.station_name || payment.station_name || 'N/A',
          amount: parseFloat(payment.amount || 0),
          method: payment.method || 'bank',
          status: payment.status,
          payment_date: payment.payment_date,
          transaction_id: payment.transaction_id
        }));
        setPayments(formattedPayments);
      }
    } catch (error: any) {
      console.error('Error loading payments:', error);
      setAlertModal({
        show: true,
        title: 'Lỗi',
        message: error.message || 'Không thể tải danh sách thanh toán',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentsOld = () => {
    // Mock data
    const mockPayments: Payment[] = [
      {
        payment_id: 1,
        booking_id: 1,
        user_id: 1,
        user_name: 'Nguyễn Văn A',
        station_id: 1,
        station_name: 'Trạm sạc Hải Châu',
        amount: 105000,
        method: 'QR',
        status: 'success',
        payment_date: '2025-01-20T16:05:00',
        transaction_id: 'TXN001234567'
      },
      {
        payment_id: 2,
        booking_id: 2,
        user_id: 2,
        user_name: 'Trần Thị B',
        station_id: 2,
        station_name: 'Trạm sạc Sơn Trà Premium',
        amount: 32000,
        method: 'Bank',
        status: 'pending',
        payment_date: '2025-01-21T10:00:00'
      },
      {
        payment_id: 3,
        booking_id: 3,
        user_id: 3,
        user_name: 'Lê Văn C',
        station_id: 1,
        station_name: 'Trạm sạc Hải Châu',
        amount: 15000,
        method: 'QR',
        status: 'success',
        payment_date: '2025-01-19T17:05:00',
        transaction_id: 'TXN001234568'
      },
      {
        payment_id: 4,
        booking_id: 4,
        user_id: 1,
        user_name: 'Nguyễn Văn A',
        station_id: 3,
        station_name: 'Trạm sạc Ngũ Hành Sơn',
        amount: 90000,
        method: 'QR',
        status: 'pending',
        payment_date: '2025-01-22T12:00:00'
      },
      {
        payment_id: 5,
        booking_id: 5,
        user_id: 2,
        user_name: 'Trần Thị B',
        station_id: 2,
        station_name: 'Trạm sạc Sơn Trà Premium',
        amount: 12000,
        method: 'Bank',
        status: 'failed',
        payment_date: '2025-01-18T16:00:00'
      },
      {
        payment_id: 6,
        booking_id: 6,
        user_id: 1,
        user_name: 'Nguyễn Văn A',
        station_id: 2,
        station_name: 'Trạm sạc Sơn Trà Premium',
        amount: 75000,
        method: 'QR',
        status: 'success',
        payment_date: '2025-01-21T14:30:00',
        transaction_id: 'TXN001234569'
      }
    ];
    // setPayments(mockPayments); // Commented out - using API now
  };

  const filteredPayments = payments; // Backend already filters

  const handleExportExcel = async () => {
    try {
      const params: any = {};
      if (filterStatus) params.status = filterStatus;
      if (filterStartDate) params.startDate = filterStartDate;
      if (filterEndDate) params.endDate = filterEndDate;

      const blob = await adminService.exportPayments(params);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payments_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setAlertModal({
        show: true,
        title: 'Thành công!',
        message: 'Đã xuất file Excel thành công',
        type: 'success'
      });
    } catch (error: any) {
      setAlertModal({
        show: true,
        title: 'Lỗi',
        message: error.message || 'Không thể xuất file',
        type: 'error'
      });
    }
  };

  const getMethodBadge = (method: string) => {
    const methodConfig: any = {
      'QR': { label: 'QR Code', class: 'method-qr' },
      'Bank': { label: 'Chuyển khoản', class: 'method-bank' }
    };
    const config = methodConfig[method] || { label: method, class: '' };
    return <span className={`method-badge ${config.class}`}>{config.label}</span>;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      pending: { label: 'Chờ xử lý', class: 'status-pending' },
      success: { label: 'Thành công', class: 'status-success' },
      failed: { label: 'Thất bại', class: 'status-failed' }
    };
    const config = statusConfig[status] || { label: status, class: '' };
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  // Use stats from API
  const totalRevenue = paymentStats.totalRevenue;
  const pendingRevenue = paymentStats.pending;
  const successRate = paymentStats.successRate;

  return (
    <div className="payment-management">
      <div className="page-header-admin">
        <div>
          <h1>Quản lý Thanh toán & Doanh thu</h1>
          <p>Xem tất cả thanh toán và thống kê doanh thu</p>
        </div>
        <button className="btn-export" onClick={handleExportExcel}>
          <Download size={20} />
          <span>Xuất Excel</span>
        </button>
      </div>

      {/* Revenue Stats */}
      <div className="revenue-stats">
        <div className="revenue-card main">
          <div className="revenue-icon">
            <DollarSign size={32} />
          </div>
          <div className="revenue-content">
            <span className="revenue-label">Tổng doanh thu</span>
            <span className="revenue-value">{totalRevenue.toLocaleString()}đ</span>
            <span className="revenue-note">Từ {paymentStats.totalTransactions} giao dịch</span>
          </div>
        </div>

        <div className="revenue-card">
          <div className="revenue-icon pending">
            <CreditCard size={28} />
          </div>
          <div className="revenue-content">
            <span className="revenue-label">Chờ xử lý</span>
            <span className="revenue-value pending">{pendingRevenue.toLocaleString()}đ</span>
            <span className="revenue-note">{paymentStats.totalTransactions} giao dịch</span>
          </div>
        </div>

        <div className="revenue-card">
          <div className="revenue-icon success">
            <TrendingUp size={28} />
          </div>
          <div className="revenue-content">
            <span className="revenue-label">Tỷ lệ thành công</span>
            <span className="revenue-value success">
              {successRate.toFixed(1)}%
            </span>
            <span className="revenue-note">Tổng {paymentStats.totalTransactions} giao dịch</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-section">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo mã, người TT, trạm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <Filter size={20} />
          <select value={filterStation} onChange={(e) => setFilterStation(e.target.value)}>
            <option value="">Tất cả trạm</option>
            {/* Stations will be loaded from API if needed */}
          </select>
        </div>

        <div className="filter-group">
          <Filter size={20} />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            <option value="pending">Chờ xử lý</option>
            <option value="success">Thành công</option>
            <option value="failed">Thất bại</option>
          </select>
        </div>

        <div className="filter-group date-input-group">
          <label className="date-label">Start</label>
          <input
            type="date"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
          />
        </div>

        <div className="filter-group date-input-group">
          <label className="date-label">End</label>
          <input
            type="date"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
          />
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
                <th>Mã TT</th>
                <th>Mã Booking</th>
                <th>Người TT</th>
                <th>Trạm</th>
                <th>Số tiền</th>
                <th>Phương thức</th>
                <th>Trạng thái</th>
                <th>Ngày TT</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="empty-row">
                    <DollarSign size={48} />
                    <p>Không có thanh toán nào</p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                <tr key={payment.payment_id}>
                  <td className="id-cell">#{payment.payment_id}</td>
                  <td className="booking-cell">#{payment.booking_id}</td>
                  <td>{payment.user_name}</td>
                  <td className="station-cell">{payment.station_name}</td>
                  <td>
                    <div className="amount-cell">
                      <DollarSign size={14} />
                      <span>{payment.amount.toLocaleString()}đ</span>
                    </div>
                  </td>
                  <td>{getMethodBadge(payment.method)}</td>
                  <td>{getStatusBadge(payment.status)}</td>
                  <td className="date-cell">
                    {new Date(payment.payment_date).toLocaleString('vi-VN')}
                  </td>
                  <td>
                    <button
                      className="action-btn-text"
                      onClick={() => setDetailModal({ show: true, payment })}
                    >
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.show}
        onClose={() => setAlertModal({ ...alertModal, show: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />

      {/* Payment Detail Modal */}
      {detailModal.show && detailModal.payment && (
        <div className="modal-overlay" onClick={() => setDetailModal({ show: false, payment: null })}>
          <div className="payment-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setDetailModal({ show: false, payment: null })}>
              <span>×</span>
            </button>
            <h2>Chi tiết thanh toán</h2>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Mã thanh toán:</span>
                <span className="detail-value">#{detailModal.payment.payment_id}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Mã booking:</span>
                <span className="detail-value">#{detailModal.payment.booking_id}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Người thanh toán:</span>
                <span className="detail-value">{detailModal.payment.user_name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Trạm sạc:</span>
                <span className="detail-value">{detailModal.payment.station_name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Số tiền:</span>
                <span className="detail-value amount">{detailModal.payment.amount.toLocaleString()}đ</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Phương thức:</span>
                {getMethodBadge(detailModal.payment.method)}
              </div>
              <div className="detail-item">
                <span className="detail-label">Trạng thái:</span>
                {getStatusBadge(detailModal.payment.status)}
              </div>
              <div className="detail-item">
                <span className="detail-label">Ngày thanh toán:</span>
                <span className="detail-value">
                  {new Date(detailModal.payment.payment_date).toLocaleString('vi-VN')}
                </span>
              </div>
              {detailModal.payment.transaction_id && (
                <div className="detail-item full-width">
                  <span className="detail-label">Mã giao dịch:</span>
                  <span className="detail-value txn">{detailModal.payment.transaction_id}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentManagement;
