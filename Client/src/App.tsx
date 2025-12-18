import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

/* User Pages */
import Home from './pages/User/Home';
import StationMap from './pages/User/Stations/StationMap';
import CreateBooking from './pages/User/Bookings/CreateBooking';
import ChargingStatus from './pages/User/Bookings/ChargingStatus';
import Payment from './pages/User/Bookings/Payment';
import ChargingAndPayment from './pages/User/Bookings/ChargingAndPayment';
import BookingHistory from './pages/User/Bookings/BookingHistory';
import StationList from './pages/User/Stations/StationList';
import FeedbacksAndFavorites from './pages/User/FeedbacksAndFavorites';
import Notifications from './pages/User/Notifications';
import UserReportForm from './pages/User/Stations/UserReportForm';
import UserReportHistory from './pages/User/Reports/UserReportHistory';
import PublicLayout from './pages/User/components/PublicLayout';

/* Manager Pages */
import ManagerLayout from './pages/Manager/components/ManagerLayout';
import ManagerStationList from './pages/Manager/StationList';
import StationBookings from './pages/Manager/StationBookings';
import UpdateStationStatus from './pages/Manager/UpdateStationStatus';
import Reports from './pages/Manager/Reports';
import Dashboard from './pages/Manager/Dashboard';
import StationDetail from './pages/Manager/StationDetail';
import ManagerBookingHistory from './pages/Manager/BookingHistory';
import MailBox from './pages/Manager/MailBox';
import ReportHistory from './pages/Manager/ReportHistory';
import ManagerNotifications from './pages/Manager/ManagerNotification';

/* Admin Pages */
import AdminLayout from './pages/Admin/components/AdminLayout';
import AdminLogin from './pages/Admin/AdminLogin';
import AdminDashboard from './pages/Admin/AdminDashboard';
import UserManagement from './pages/Admin/UserManagement';
import StationManagement from './pages/Admin/StationManagement';
import BookingManagement from './pages/Admin/BookingManagement';
import PaymentManagement from './pages/Admin/PaymentManagement';
import NotificationManagement from './pages/Admin/NotificationManagement';
import ListReport from './pages/Admin/ListReport';

import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public Routes */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="map" element={<StationMap />} />
          <Route path="stations" element={<StationList />} />

          <Route path="bookings/create" element={<CreateBooking />} />
          <Route path="bookings/:booking_id/charging" element={<ChargingStatus />} />
          <Route path="bookings/:booking_id/payment" element={<Payment />} />
          <Route path="bookings/list" element={<BookingHistory />} />
          <Route path="bookings/history" element={<ChargingAndPayment />} />

          <Route path="user/feedbacks-favorites" element={<FeedbacksAndFavorites />} />
          <Route path="user/notifications" element={<Notifications />} />

          {/* ✅ USER REPORT */}
          <Route path="user/report/create" element={<UserReportForm />} />
          <Route path="user/report/history" element={<UserReportHistory />} />
        </Route>

        {/* Manager Routes */}
        <Route path="/manager" element={<ManagerLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="stations" element={<ManagerStationList />} />
          <Route path="stations/:station_id" element={<StationDetail />} />
          <Route path="stations/:station_id/bookings" element={<StationBookings />} />
          <Route path="stations/:station_id/status" element={<UpdateStationStatus />} />
          <Route path="bookings" element={<ManagerBookingHistory />} />
          <Route path="reports" element={<Reports />} />
          <Route path="mailbox" element={<MailBox />} />
          <Route path="reporthistory" element={<ReportHistory />} />
          <Route path="notifications" element={<ManagerNotifications />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="stations" element={<StationManagement />} />
          <Route path="bookings" element={<BookingManagement />} />
          <Route path="payments" element={<PaymentManagement />} />
          <Route path="notifications" element={<NotificationManagement />} />
          <Route path="reports" element={<ListReport />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
