import { useState } from 'react';
import { Users, Calendar, DollarSign, Zap, TrendingUp, AlertTriangle, Award, Filter, Bell, CheckCircle, XCircle, Clock } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [filterPeriod, setFilterPeriod] = useState<string>('month');
  const [filterStation, setFilterStation] = useState<string>('');

  // Mock KPI Data
  const kpiData = {
    totalUsers: 1234,
    totalBookings: 567,
    totalRevenue: 125000000,
    totalEnergy: 8450
  };

  // Mock Statistics
  const statistics = {
    topStation: { name: 'Trạm sạc Hải Châu', count: 250 },
    topUser: { name: 'Nguyễn Văn A', amount: 5000000 },
    cancelRate: 5.2,
    maintenanceStations: 2
  };

  // Mock Revenue by Month (6 months)
  const revenueData = [
    { month: 'T7', revenue: 18000000 },
    { month: 'T8', revenue: 22000000 },
    { month: 'T9', revenue: 19500000 },
    { month: 'T10', revenue: 25000000 },
    { month: 'T11', revenue: 28000000 },
    { month: 'T12', revenue: 32000000 }
  ];

  // Mock Station Type Distribution
  const stationTypeData = [
    { name: 'Xe máy', value: 180, color: '#3b82f6' },
    { name: 'Ô tô', value: 220, color: '#f59e0b' },
    { name: 'Cả hai', value: 167, color: '#10b981' }
  ];

  // Mock Booking Trend (7 days)
  const bookingTrendData = [
    { day: 'T2', bookings: 45 },
    { day: 'T3', bookings: 52 },
    { day: 'T4', bookings: 48 },
    { day: 'T5', bookings: 61 },
    { day: 'T6', bookings: 55 },
    { day: 'T7', bookings: 73 },
    { day: 'CN', bookings: 68 }
  ];

  // Mock Recent Activities
  const recentActivities = [
    {
      id: 1,
      type: 'booking',
      icon: CheckCircle,
      color: '#10b981',
      title: 'Booking mới được tạo',
      description: 'Nguyễn Văn A đặt lịch tại Trạm Hải Châu',
      time: '5 phút trước'
    },
    {
      id: 2,
      type: 'payment',
      icon: DollarSign,
      color: '#3b82f6',
      title: 'Thanh toán thành công',
      description: 'Trần Thị B thanh toán 150,000đ',
      time: '15 phút trước'
    },
    {
      id: 3,
      type: 'cancel',
      icon: XCircle,
      color: '#ef4444',
      title: 'Booking bị hủy',
      description: 'Lê Văn C hủy booking #1234',
      time: '30 phút trước'
    },
    {
      id: 4,
      type: 'maintenance',
      icon: AlertTriangle,
      color: '#f59e0b',
      title: 'Trạm cần bảo trì',
      description: 'Trạm Thanh Khê báo lỗi connector',
      time: '1 giờ trước'
    },
    {
      id: 5,
      type: 'user',
      icon: Users,
      color: '#8b5cf6',
      title: 'User mới đăng ký',
      description: 'Phạm Thị D vừa tạo tài khoản',
      time: '2 giờ trước'
    }
  ];

  // Mock System Notifications
  const systemNotifications = [
    {
      id: 1,
      type: 'warning',
      message: 'Có 3 booking đang chờ xác nhận',
      time: 'Vừa xong'
    },
    {
      id: 2,
      type: 'info',
      message: 'Doanh thu tháng này tăng 15% so với tháng trước',
      time: '1 giờ trước'
    },
    {
      id: 3,
      type: 'alert',
      message: '2 trạm đang trong trạng thái bảo trì',
      time: '3 giờ trước'
    }
  ];

  return (
    <div className="admin-dashboard">
      <div className="page-header-admin">
        <div>
          <h1>Dashboard</h1>
          <p>Thống kê & Báo cáo tổng hợp</p>
        </div>
        <div className="dashboard-filters">
          <div className="filter-group">
            <Filter size={20} />
            <select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)}>
              <option value="day">Ngày</option>
              <option value="month">Tháng</option>
              <option value="year">Năm</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: '#dbeafe' }}>
            <Users size={28} color="#3b82f6" />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Tổng User</span>
            <span className="kpi-value">{kpiData.totalUsers.toLocaleString()}</span>
            <span className="kpi-note">Khách hàng</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: '#fef3c7' }}>
            <Calendar size={28} color="#f59e0b" />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Tổng Booking</span>
            <span className="kpi-value">{kpiData.totalBookings.toLocaleString()}</span>
            <span className="kpi-note">Đặt lịch</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: '#d1fae5' }}>
            <DollarSign size={28} color="#10b981" />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Tổng Doanh thu</span>
            <span className="kpi-value">{(kpiData.totalRevenue / 1000000).toFixed(1)}M</span>
            <span className="kpi-note">Tháng này</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: '#e9d5ff' }}>
            <Zap size={28} color="#a855f7" />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Tổng kWh</span>
            <span className="kpi-value">{kpiData.totalEnergy.toLocaleString()}</span>
            <span className="kpi-note">Năng lượng tiêu thụ</span>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-section">
        <h2>Thống kê nổi bật</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <Award size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Trạm hoạt động nhiều nhất</span>
              <span className="stat-value">{statistics.topStation.name}</span>
              <span className="stat-note">{statistics.topStation.count} booking</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <TrendingUp size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">User chi tiêu nhiều nhất</span>
              <span className="stat-value">{statistics.topUser.name}</span>
              <span className="stat-note">{statistics.topUser.amount.toLocaleString()}đ</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon warning">
              <AlertTriangle size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Tỷ lệ hủy booking</span>
              <span className="stat-value warning">{statistics.cancelRate}%</span>
              <span className="stat-note">Cần cải thiện</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon maintenance">
              <AlertTriangle size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Trạm đang bảo trì</span>
              <span className="stat-value">{statistics.maintenanceStations}</span>
              <span className="stat-note">Trạm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Activities Section */}
      <div className="dashboard-content">
        {/* Left Column - Charts */}
        <div className="charts-column">
          {/* Revenue Chart */}
          <div className="chart-card">
            <h3>Doanh thu theo tháng</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => `${(value / 1000000).toFixed(1)}M đ`}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#667eea" name="Doanh thu" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Station Type Chart */}
          <div className="chart-card">
            <h3>Phân loại trạm</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stationTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stationTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Booking Trend Chart */}
          <div className="chart-card full-width">
            <h3>Xu hướng booking theo ngày</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={bookingTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="bookings" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  name="Số booking"
                  dot={{ fill: '#10b981', r: 6 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column - Activities & Notifications */}
        <div className="activities-column">
          {/* System Notifications */}
          <div className="notifications-card">
            <div className="card-header">
              <Bell size={20} />
              <h3>Thông báo hệ thống</h3>
            </div>
            <div className="notifications-list">
              {systemNotifications.map((notif) => (
                <div key={notif.id} className={`notification-item ${notif.type}`}>
                  <div className="notification-content">
                    <p>{notif.message}</p>
                    <span className="notification-time">
                      <Clock size={14} />
                      {notif.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activities */}
          <div className="activities-card">
            <div className="card-header">
              <TrendingUp size={20} />
              <h3>Hoạt động gần đây</h3>
            </div>
            <div className="activities-list">
              {recentActivities.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-icon" style={{ background: `${activity.color}20` }}>
                      <Icon size={20} color={activity.color} />
                    </div>
                    <div className="activity-content">
                      <p className="activity-title">{activity.title}</p>
                      <p className="activity-description">{activity.description}</p>
                      <span className="activity-time">
                        <Clock size={14} />
                        {activity.time}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
