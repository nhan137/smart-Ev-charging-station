import { useState, useEffect } from 'react';
import { Filter, Search, DollarSign, Download, Eye, CreditCard, TrendingUp } from 'lucide-react';
import { mockStations } from '../../services/mockData';
import AlertModal from '../../components/shared/AlertModal';
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
  const [filterStation, setFilterStation] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
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
  }, []);

  const loadPayments = () => {
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
    setPayments(mockPayments);
  };

  const filteredPayments = payments.filter(payment => {
    if (filterStation && payment.station_id !== Number(filterStation)) return false;
    if (filterStatus && payment.status !== filterStatus) return false;
    
    const paymentDate = new Date(payment.payment_date);
    
    if (filterStartDate) {
      const startDate = new Date(filterStartDate);
      startDate.setHours(0, 0, 0, 0);
      if (paymentDate < startDate) return false;
    }
    
    if (filterEndDate) {
      const endDate = new Date(filterEndDate);
      endDate.setHours(23, 59, 59, 999);
      if (paymentDate > endDate) return false;
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        payment.user_name.toLowerCase().includes(query) ||
        payment.station_name.toLowerCase().includes(query) ||
        payment.payment_id.toString().includes(query) ||
        payment.booking_id.toString().includes(query) ||
        payment.transaction_id?.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  const handleExportExcel = () => {
    // Convert to CSV
    const headers = ['Mã TT', 'Mã Booking', 'Người TT', 'Trạm', 'Số tiền', 'Phương thức', 'Trạng thái', 'Ngày TT'];
    const rows = filteredPayments.map(p => [
      p.payment_id,
      p.booking_id,
      p.user_name,
      p.station_name,
      p.amount,
      p.method,
      p.status,
      new Date(p.payment_date).toLocaleString('vi-VN')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `payments_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setAlertModal({
      show: true,
      title: 'Thành công!',
      message: 'Đã xuất file Excel thành công',
      type: 'success'
    });
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

  // Calculate revenue stats
  const totalRevenue = filteredPayments
    .filter(p => p.status === 'success')
    .reduce((sum, p) => sum + p.amount, 0);
  
  const pendingRevenue = filteredPayments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

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
            <span className="revenue-note">Từ {filteredPayments.filter(p => p.status === 'success').length} giao dịch</span>
          </div>
        </div>

        <div className="revenue-card">
          <div className="revenue-icon pending">
            <CreditCard size={28} />
          </div>
          <div className="revenue-content">
            <span className="revenue-label">Chờ xử lý</span>
            <span className="revenue-value pending">{pendingRevenue.toLocaleString()}đ</span>
            <span className="revenue-note">{filteredPayments.filter(p => p.status === 'pending').length} giao dịch</span>
          </div>
        </div>

        <div className="revenue-card">
          <div className="revenue-icon success">
            <TrendingUp size={28} />
          </div>
          <div className="revenue-content">
            <span className="revenue-label">Tỷ lệ thành công</span>
            <span className="revenue-value success">
              {filteredPayments.length > 0 
                ? ((filteredPayments.filter(p => p.status === 'success').length / filteredPayments.length) * 100).toFixed(1)
                : 0}%
            </span>
            <span className="revenue-note">Tổng {filteredPayments.length} giao dịch</span>
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
            {mockStations.map((station) => (
              <option key={station.station_id} value={station.station_id}>
                {station.station_name}
              </option>
            ))}
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
                      className="action-btn btn-view"
                      onClick={() => setDetailModal({ show: true, payment })}
                      title="Chi tiết"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
