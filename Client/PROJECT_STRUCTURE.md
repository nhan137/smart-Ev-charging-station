# EV Charging Station - Project Structure

## 📋 Tổng quan dự án

Hệ thống quản lý trạm sạc xe điện với 3 vai trò: User, Manager, Admin

---

## 🗂️ Cấu trúc thư mục

```
ev-charging-station/
├── src/
│   ├── components/          # Shared components
│   │   ├── PublicLayout.tsx
│   │   ├── ManagerLayout.tsx
│   │   ├── AdminLayout.tsx
│   │   ├── ConfirmModal.tsx
│   │   ├── AlertModal.tsx
│   │   ├── QuickBookingModal.tsx
│   │   ├── SlotsModal.tsx
│   │   ├── AssignRoleModal.tsx
│   │   ├── UserDetailModal.tsx
│   │   ├── EditUserModal.tsx
│   │   ├── CreateUserModal.tsx
│   │   ├── StationFormModal.tsx
│   │   ├── StationDetailModal.tsx
│   │   └── BookingDetailModal.tsx
│   │
│   ├── pages/
│   │   ├── User/            # User pages (role_id = 1)
│   │   │   └── FeedbacksAndFavorites.tsx
│   │   │
│   │   ├── Manager/         # Manager pages (role_id = 2)
│   │   │   ├── Dashboard.tsx
│   │   │   ├── StationList.tsx
│   │   │   ├── StationDetail.tsx
│   │   │   ├── StationBookings.tsx
│   │   │   ├── UpdateStationStatus.tsx
│   │   │   └── Reports.tsx
│   │   │
│   │   ├── Admin/           # Admin pages (role_id = 3)
│   │   │   ├── AdminLogin.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── UserManagement.tsx
│   │   │   ├── StationManagement.tsx
│   │   │   ├── BookingManagement.tsx
│   │   │   ├── PaymentManagement.tsx
│   │   │   └── NotificationManagement.tsx
│   │   │
│   │   ├── Auth/            # Authentication
│   │   │   ├── LoginModal.tsx
│   │   │   └── ForgotPasswordModal.tsx
│   │   │
│   │   ├── Bookings/        # Booking pages
│   │   │   ├── CreateBooking.tsx
│   │   │   ├── ChargingStatus.tsx
│   │   │   ├── Payment.tsx
│   │   │   ├── ChargingAndPayment.tsx
│   │   │   └── BookingHistory.tsx
│   │   │
│   │   ├── Stations/        # Station pages
│   │   │   ├── StationMap.tsx
│   │   │   ├── StationList.tsx
│   │   │   └── StationDetail.tsx
│   │   │
│   │   └── Home.tsx
│   │
│   ├── services/            # API services & mock data
│   │   ├── authService.ts
│   │   └── mockData.ts
│   │
│   ├── App.tsx              # Main app with routes
│   ├── App.css
│   └── main.tsx
│
├── public/
├── DATABASE_SCHEMA.md       # Database schema documentation
├── API_DOCUMENTATION.md     # API documentation
├── QUICK_START.md          # Quick start guide
├── PROJECT_STRUCTURE.md    # This file
├── package.json
└── vite.config.ts
```

---

## 👥 Vai trò & Quyền hạn

### 🟢 User (role_id = 1)
**Mục đích:** Người dùng cuối, khách hàng sử dụng dịch vụ sạc xe

**Tính năng:**
- Xem bản đồ và danh sách trạm sạc
- Tìm kiếm trạm sạc theo vị trí, loại xe
- Đặt lịch sạc xe
- Thanh toán (QR Code, Chuyển khoản)
- Xem lịch sử booking và thanh toán
- Đánh giá trạm sạc
- Lưu trạm yêu thích

**Routes:** `/`, `/map`, `/stations`, `/bookings/*`

---

### 🟡 Manager (role_id = 2)
**Mục đích:** Quản lý vận hành các trạm sạc được phân công

**Tính năng:**
- Dashboard thống kê trạm của mình
- Xem danh sách trạm được quản lý
- Quản lý booking tại trạm (Xác nhận, Hủy, Hoàn tất)
- Cập nhật trạng thái trạm (Active, Maintenance, Inactive)
- Xem báo cáo doanh thu, booking
- Xem chi tiết slot trạm sạc

**Routes:** `/manager/*`

**Layout:** ManagerLayout (Sidebar với menu)

---

### 🔴 Admin (role_id = 3)
**Mục đích:** Quản trị viên hệ thống, toàn quyền quản lý

**Tính năng:**

#### Dashboard & Analytics:
- KPI: Tổng user, booking, doanh thu, kWh
- Biểu đồ doanh thu theo tháng (Bar Chart)
- Biểu đồ phân loại trạm (Pie Chart)
- Biểu đồ xu hướng booking (Line Chart)
- Thống kê: Trạm hot nhất, User chi tiêu nhiều, Tỷ lệ hủy

#### Quản lý Người dùng:
- CRUD người dùng
- Lock/Unlock tài khoản
- Phân quyền (User/Manager/Admin)
- Xem chi tiết người dùng & thống kê
- Filter theo vai trò, trạng thái
- Search theo tên, email, SĐT

#### Quản lý Trạm sạc:
- CRUD trạm sạc
- Xem chi tiết trạm & thống kê
- Filter theo loại trạm, trạng thái
- Phân công Manager cho trạm

#### Quản lý Booking:
- Xem tất cả booking (Read-only)
- Hủy booking
- Filter theo trạm, trạng thái, khoảng thời gian
- Xem chi tiết booking đầy đủ

#### Quản lý Thanh toán & Doanh thu:
- Xem tất cả giao dịch
- Thống kê doanh thu
- Filter theo trạm, trạng thái, thời gian
- Xuất Excel (CSV)

#### Gửi Thông báo:
- Gửi thông báo hệ thống
- Chọn gửi tất cả hoặc user cụ thể
- Loại thông báo: System, Payment, Promotion, Booking

**Routes:** `/admin/*`

**Layout:** AdminLayout (Sidebar với menu, Purple theme)

---

## 🎨 Design System

### Colors:
- **Admin Theme:** Purple gradient (#667eea → #764ba2)
- **Manager Theme:** Blue/Orange
- **User Theme:** Blue/Green
- **Success:** #10b981
- **Warning:** #f59e0b
- **Error:** #ef4444

### Components:
- Modal overlays với backdrop blur
- Card-based layouts
- Gradient buttons
- Badge components cho status
- Responsive tables
- Stats cards với icons

---

## 🔐 Authentication Flow

1. **User/Manager Login:**
   - LoginModal component
   - Check role → Redirect:
     - User → `/`
     - Manager → `/manager/dashboard`
     - Admin → `/admin/dashboard`

2. **Admin Login:**
   - Separate AdminLogin page (`/admin/login`)
   - Only accept role_id = 3
   - Redirect → `/admin/dashboard`

---

## 📊 Database Schema

Xem chi tiết trong `DATABASE_SCHEMA.md`

**Tables:**
- users, roles
- stations
- bookings, charging_sessions
- payments
- feedbacks, favorites
- promotions
- notifications (future)

---

## 🚀 Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Routing:** React Router v6
- **Charts:** Recharts
- **Icons:** Lucide React
- **Styling:** CSS Modules
- **State:** React Hooks (useState, useEffect)

---

## 📝 Development Notes

### Mock Data:
- `src/services/mockData.ts` - Mock users, stations, bookings
- `src/services/authService.ts` - Mock authentication

### Demo Accounts:
- **User:** user@gmail.com / 123456
- **Manager:** manager@gmail.com / 123456
- **Admin:** admin@evcharge.com / admin123

### TODO:
- [ ] Connect to real backend API
- [ ] Add real-time updates (WebSocket)
- [ ] Add notifications system
- [ ] Add image upload for stations
- [ ] Add map integration (Google Maps/Mapbox)
- [ ] Add payment gateway integration
- [ ] Add email notifications
- [ ] Add mobile responsive improvements
- [ ] Add unit tests
- [ ] Add E2E tests

---

## 📖 Documentation

- `DATABASE_SCHEMA.md` - Database structure
- `API_DOCUMENTATION.md` - API endpoints
- `QUICK_START.md` - Getting started guide
- `src/pages/README.md` - Pages structure
- `src/pages/User/README.md` - User pages
- `src/pages/Manager/README.md` - Manager pages
- `src/pages/Admin/README.md` - Admin pages

---

## 🎯 Key Features Implemented

✅ Multi-role authentication (User, Manager, Admin)
✅ Station map & list with filters
✅ Booking system with payment
✅ Manager dashboard & station management
✅ Admin dashboard with KPI & charts
✅ User management (CRUD, Lock/Unlock, Role assignment)
✅ Station management (CRUD)
✅ Booking management (View, Cancel)
✅ Payment & revenue management
✅ Notification system
✅ Responsive design
✅ Modal-based UI
✅ Form validation
✅ Export to Excel (CSV)

---

**Last Updated:** January 2025
**Version:** 1.0.0
