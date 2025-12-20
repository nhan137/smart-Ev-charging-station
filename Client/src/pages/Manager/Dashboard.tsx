import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Calendar, DollarSign, Zap, TrendingUp, Users, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { authService } from '../../services/authService';
import { managerService } from '../../services/managerService';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const [stations, setStations] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStations: 0,
    activeStations: 0,
    totalBookings: 0,
    todayRevenue: 0,
    totalSlots: 0,
    availableSlots: 0,
    usedSlots: 0,
    capacityPercent: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await managerService.getDashboardOverview();
      console.log('[Dashboard] API Response:', response);
      
      if (response.success && response.data) {
        const data = response.data;
        console.log('[Dashboard] Data:', data);
        
        // Update stats
        setStats({
          totalStations: data.stats?.total_stations || 0,
          activeStations: data.stats?.active_stations || 0,
          totalBookings: data.stats?.today_bookings || 0,
          todayRevenue: data.stats?.today_revenue || 0,
          totalSlots: data.capacity?.total_slots || 0,
          availableSlots: (data.capacity?.total_slots || 0) - (data.capacity?.used_slots || 0),
          usedSlots: data.capacity?.used_slots || 0,
          capacityPercent: data.capacity?.percent || 0
        });

        // Update stations
        setStations(data.stations || []);

        // Update recent bookings
        const formattedBookings = (data.recent_bookings || []).map((booking: any) => ({
          id: booking.id || booking.booking_id,
          customer: booking.customer_name || 'Không rõ',
          station: booking.station_name || 'Không rõ',
          time: booking.start_time ? new Date(booking.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'N/A',
          status: booking.status || 'pending'
        }));
        setRecentBookings(formattedBookings);
      } else {
        console.error('[Dashboard] Response not successful:', response);
      }
    } catch (error: any) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
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




  const getStatusBadge = (status: string) => {
    const config: any = {
      pending: { label: 'Chờ xác nhận', class: 'status-pending' },
      confirmed: { label: 'Đã xác nhận', class: 'status-confirmed' },
      completed: { label: 'Hoàn thành', class: 'status-completed' }
    };
    const { label, class: className } = config[status] || { label: status, class: '' };
    return <span className={`status-badge ${className}`}>{label}</span>;
  };

  if (loading) {
    return (
      <div className="dashboard" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Loader2 size={48} className="animate-spin" style={{ color: '#3b82f6' }} />
      </div>
    );
  }

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
            {stations.length > 0 ? (
              stations.map((station) => (
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
              ))
            ) : (
              <p style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>Chưa có trạm sạc nào</p>
            )}
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="card">
          <div className="card-header">
            <h2>Booking gần đây</h2>
          </div>
          <div className="bookings-list-dashboard">
            {recentBookings.length > 0 ? (
              recentBookings.map((booking) => (
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
              ))
            ) : (
              <p style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>Chưa có booking nào</p>
            )}
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
              style={{ width: `${stats.capacityPercent || 0}%` }}
            />
          </div>
          <div className="capacity-stats">
            <div className="capacity-stat">
              <Zap size={20} />
              <div>
                <span className="capacity-label">Đang sử dụng</span>
                <span className="capacity-value">{stats.usedSlots}/{stats.totalSlots} chỗ</span>
              </div>
            </div>
            <div className="capacity-percentage">
              {stats.totalSlots > 0 ? `${stats.capacityPercent.toFixed(0)}%` : '0%'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
