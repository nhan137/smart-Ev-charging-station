import { useState, useEffect } from 'react';
import { Users, Calendar, DollarSign, Zap, TrendingUp, AlertTriangle, Award, Filter, Bell, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { adminService } from '../../services/adminService';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [filterPeriod, setFilterPeriod] = useState<'month' | 'year'>('month');
  const [loading, setLoading] = useState(true);
  
  // KPI Data
  const [kpiData, setKpiData] = useState({
    totalUsers: 0,
    totalBookings: 0,
    totalRevenue: 0,
    totalEnergy: 0
  });

  // Statistics
  const [statistics, setStatistics] = useState({
    topStation: { name: 'N/A', count: 0 },
    topUser: { name: 'N/A', amount: 0 },
    cancelRate: 0,
    maintenanceStations: 0
  });

  // Chart Data
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [stationTypeData, setStationTypeData] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [systemNotifications, setSystemNotifications] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [filterPeriod]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load overview stats
      const overviewRes = await adminService.getDashboardOverview(filterPeriod);
      if (overviewRes.success && overviewRes.data) {
        const data = overviewRes.data;
        setKpiData({
          totalUsers: data.total_users || 0,
          totalBookings: data.total_bookings || 0,
          totalRevenue: data.total_revenue || 0,
          totalEnergy: data.total_kwh || 0
        });
      }

      // Load highlights
      const highlightsRes = await adminService.getDashboardHighlights();
      if (highlightsRes.success && highlightsRes.data) {
        const data = highlightsRes.data;
        setStatistics({
          topStation: {
            name: data.top_station?.station_name || data.most_active_station?.station_name || 'Chưa có dữ liệu',
            count: data.top_station?.total_bookings || data.most_active_station?.total_bookings || 0
          },
          topUser: {
            name: data.top_spender?.full_name || data.top_spending_user?.full_name || 'Chưa có dữ liệu',
            amount: data.top_spender?.total_spent || data.top_spending_user?.total_spent || 0
          },
          cancelRate: data.cancel_rate || data.cancellation_rate || 0,
          maintenanceStations: data.maintenance_stations || 0
        });
      }

      // Load revenue chart
      const revenueRes = await adminService.getRevenueChart();
      if (revenueRes.success && revenueRes.data) {
        const data = revenueRes.data;
        // Format data for chart
        const formatted = data.map((item: any) => ({
          month: item.month || item.date || 'N/A',
          revenue: parseFloat(item.revenue || 0)
        }));
        setRevenueData(formatted);
      }

      // Load station types chart
      const stationTypesRes = await adminService.getStationTypesChart();
      if (stationTypesRes.success && stationTypesRes.data) {
        const data = stationTypesRes.data;
        const colors = ['#3b82f6', '#f59e0b', '#10b981'];
        const formatted = data.map((item: any, index: number) => ({
          name: item.type || 'N/A',
          value: parseInt(item.count || 0),
          color: colors[index % colors.length]
        }));
        setStationTypeData(formatted);
      }

      // Load recent activities
      const activitiesRes = await adminService.getRecentActivities();
      if (activitiesRes.success && activitiesRes.data) {
        const data = activitiesRes.data;
        // Format activities with icons
        const formatted = data.map((item: any) => {
          let icon = CheckCircle;
          let color = '#10b981';
          if (item.type === 'payment') {
            icon = DollarSign;
            color = '#3b82f6';
          } else if (item.type === 'cancel') {
            icon = XCircle;
            color = '#ef4444';
          } else if (item.type === 'maintenance') {
            icon = AlertTriangle;
            color = '#f59e0b';
          } else if (item.type === 'user') {
            icon = Users;
            color = '#8b5cf6';
          }
          return {
            id: item.id,
            type: item.type,
            icon,
            color,
            title: item.title || item.message || 'Hoạt động',
            description: item.description || item.message || '',
            time: item.time || item.created_at || 'Vừa xong'
          };
        });
        setRecentActivities(formatted);
      }

      // System notifications from recent activities
      if (activitiesRes.success && activitiesRes.data) {
        const activities = activitiesRes.data;
        const notifications = activities
          .filter((a: any) => a.type === 'notification' || a.type === 'warning')
          .slice(0, 3)
          .map((item: any) => ({
            id: item.id,
            type: item.type === 'warning' ? 'warning' : 'info',
            message: item.message || item.description || '',
            time: item.time || item.created_at || 'Vừa xong'
          }));
        setSystemNotifications(notifications);
      }
    } catch (error: any) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Loader2 size={48} className="animate-spin" style={{ color: '#3b82f6' }} />
      </div>
    );
  }

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
            <select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value as 'month' | 'year')}>
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
              {systemNotifications.length > 0 ? (
                systemNotifications.map((notif) => (
                  <div key={notif.id} className={`notification-item ${notif.type}`}>
                    <div className="notification-content">
                      <p>{notif.message}</p>
                      <span className="notification-time">
                        <Clock size={14} />
                        {notif.time}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="notification-item">
                  <div className="notification-content">
                    <p>Không có thông báo mới</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activities */}
          <div className="activities-card">
            <div className="card-header">
              <TrendingUp size={20} />
              <h3>Hoạt động gần đây</h3>
            </div>
            <div className="activities-list">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => {
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
                })
              ) : (
                <div className="activity-item">
                  <div className="activity-content">
                    <p>Không có hoạt động gần đây</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
