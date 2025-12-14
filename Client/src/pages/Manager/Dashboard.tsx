import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Calendar, DollarSign, Zap, TrendingUp, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { authService } from '../../services/authService';
import { mockStations } from '../../services/mockData';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const [stations, setStations] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalStations: 0,
    activeStations: 0,
    totalBookings: 0,
    todayRevenue: 0,
    totalSlots: 0,
    availableSlots: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const managedStationIds = user?.managed_stations || [];
    const managedStations = mockStations.filter(s => 
      managedStationIds.includes(s.station_id)
    );
    setStations(managedStations);

    // Calculate stats
    const totalSlots = managedStations.reduce((sum, s) => sum + s.total_slots, 0);
    const availableSlots = managedStations.reduce((sum, s) => sum + s.available_slots, 0);
    const activeStations = managedStations.filter(s => s.status === 'active').length;

    setStats({
      totalStations: managedStations.length,
      activeStations,
      totalBookings: 24, // Mock data
      todayRevenue: 2450000, // Mock data
      totalSlots,
      availableSlots
    });
  };

  const statCards = [
    {
      icon: <Building2 size={32} />,
      label: 'Tổng số trạm',
      value: stats.totalStations,
      color: 'blue',
      trend: '+0%'
    },
    {
      icon: <CheckCircle size={32} />,
      label: 'Trạm hoạt động',
      value: stats.activeStations,
      color: 'green',
      trend: '+0%'
    },
    {
      icon: <Calendar size={32} />,
      label: 'Booking hôm nay',
      value: stats.totalBookings,
      color: 'purple',
      trend: '+12%'
    },
    {
      icon: <DollarSign size={32} />,
      label: 'Doanh thu hôm nay',
      value: `${(stats.todayRevenue / 1000).toFixed(0)}K`,
      color: 'orange',
      trend: '+8%'
    }
  ];



  const recentBookings = [
    { id: 1, customer: 'Nguyễn Văn A', station: 'Trạm sạc Hải Châu', time: '14:00', status: 'confirmed' },
    { id: 2, customer: 'Trần Thị B', station: 'Trạm sạc Sơn Trà', time: '15:30', status: 'pending' },
    { id: 3, customer: 'Lê Văn C', station: 'Trạm sạc Hải Châu', time: '16:00', status: 'completed' },
     { id: 33333333333333355555555555222222222222222655555555555555555555555555555, customer: 'Lê Văn C', station: 'Trạm sạc Hải Châu4444444444444444444444444', time: '16:00', status: 'completed' }
  ];

  const getStatusBadge = (status: string) => {
    const config: any = {
      pending: { label: 'Chờ xác nhận', class: 'status-pending' },
      confirmed: { label: 'Đã xác nhận', class: 'status-confirmed' },
      completed: { label: 'Hoàn thành', class: 'status-completed' }
    };
    const { label, class: className } = config[status] || { label: status, class: '' };
    return <span className={`status-badge ${className}`}>{label}</span>;
  };

  return (
    <div className="dashboard">
      {/* Welcome Section */}
      <div className="welcome-section">
        <div>
          <h1>Xin chào, {user?.full_name}! 👋</h1>
          <p>Đây là tổng quan về các trạm sạc của bạn</p>
        </div>
        <div className="quick-actions">
          <button className="quick-btn" onClick={() => navigate('/manager/reports')}>
            <AlertTriangle size={20} />
            <span>Báo cáo sự cố</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        {statCards.map((card, index) => (
          <div key={index} className={`stat-card stat-card-${card.color}`}>
            <div className="stat-icon">{card.icon}</div>
            <div className="stat-content">
              <span className="stat-label">{card.label}</span>
              <div className="stat-value-row">
                <span className="stat-value">{card.value}</span>
                <span className="stat-trend">
                  <TrendingUp size={16} />
                  {card.trend}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="content-grid">
        {/* Stations Overview */}
        <div className="card">
          <div className="card-header">
            <h2>Trạm phụ trách</h2>
            <button className="view-all-btn" onClick={() => navigate('/manager/stations')}>
              Xem tất cả →
            </button>
          </div>
          <div className="stations-list-dashboard">
            {stations.map((station) => (
              <div key={station.station_id} className="station-item-dashboard">
                <div className="station-info-dashboard">
                  <Building2 size={20} />
                  <div>
                    <h3>{station.station_name}</h3>
                    <p>{station.available_slots}/{station.total_slots} chỗ trống</p>
                  </div>
                </div>
                <div className="station-actions-dashboard">
                  <button
                    className="icon-btn"
                    onClick={() => navigate(`/manager/stations/${station.station_id}/bookings`)}
                    title="Xem booking"
                  >
                    <Calendar size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="card">
          <div className="card-header">
            <h2>Booking gần đây</h2>
          </div>
          <div className="bookings-list-dashboard">
            {recentBookings.map((booking) => (
              <div key={booking.id} className="booking-item-dashboard">
                <div className="booking-info-dashboard">
                  <div className="booking-avatar">
                    <Users size={18} />
                  </div>
                  <div>
                    <h4>{booking.customer}</h4>
                    <p>{booking.station} • {booking.time}</p>
                  </div>
                </div>
                {getStatusBadge(booking.status)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Capacity Chart */}
      <div className="card">
        <div className="card-header">
          <h2>Công suất sử dụng</h2>
        </div>
        <div className="capacity-chart">
          <div className="capacity-bar">
            <div 
              className="capacity-fill"
              style={{ width: `${((stats.totalSlots - stats.availableSlots) / stats.totalSlots * 100)}%` }}
            />
          </div>
          <div className="capacity-stats">
            <div className="capacity-stat">
              <Zap size={20} />
              <div>
                <span className="capacity-label">Đang sử dụng</span>
                <span className="capacity-value">{stats.totalSlots - stats.availableSlots}/{stats.totalSlots} chỗ</span>
              </div>
            </div>
            <div className="capacity-percentage">
              {Math.round((stats.totalSlots - stats.availableSlots) / stats.totalSlots * 100)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
