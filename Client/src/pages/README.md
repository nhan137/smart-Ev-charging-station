# Pages Structure

Cấu trúc tổ chức các trang theo vai trò người dùng

## 📁 Cấu trúc thư mục:

```
src/pages/
├── User/              # Trang dành cho User (role_id = 1)
│   ├── FeedbacksAndFavorites.tsx
│   └── README.md
│
├── Manager/           # Trang dành cho Manager (role_id = 2)
│   ├── Dashboard.tsx
│   ├── StationList.tsx
│   ├── StationDetail.tsx
│   ├── StationBookings.tsx
│   ├── UpdateStationStatus.tsx
│   ├── Reports.tsx
│   └── README.md
│
├── Admin/             # Trang dành cho Admin (role_id = 3)
│   ├── AdminLogin.tsx
│   ├── AdminDashboard.tsx
│   ├── UserManagement.tsx
│   ├── StationManagement.tsx
│   ├── BookingManagement.tsx
│   ├── PaymentManagement.tsx
│   ├── NotificationManagement.tsx
│   └── README.md
│
├── Auth/              # Trang xác thực chung
│   ├── LoginModal.tsx
│   └── ForgotPasswordModal.tsx
│
├── Bookings/          # Trang booking (User)
│   ├── CreateBooking.tsx
│   ├── ChargingStatus.tsx
│   ├── Payment.tsx
│   ├── ChargingAndPayment.tsx
│   └── BookingHistory.tsx
│
├── Stations/          # Trang trạm sạc (User)
│   ├── StationMap.tsx
│   ├── StationList.tsx
│   ├── StationDetail.tsx
│   └── StationDetailModal.tsx
│
└── Home.tsx           # Trang chủ (Public)
```

## 🎯 Phân quyền:

### User (role_id = 1):
- Xem danh sách và bản đồ trạm sạc
- Đặt lịch sạc xe
- Quản lý booking của mình
- Thanh toán
- Đánh giá và lưu trạm yêu thích

### Manager (role_id = 2):
- Dashboard quản lý trạm
- Quản lý booking tại trạm được phân công
- Cập nhật trạng thái trạm
- Xem báo cáo trạm

### Admin (role_id = 3):
- Dashboard tổng quan hệ thống
- Quản lý người dùng (CRUD, Lock/Unlock, Phân quyền)
- Quản lý trạm sạc (CRUD)
- Quản lý booking (View, Cancel)
- Quản lý thanh toán & doanh thu
- Gửi thông báo hệ thống
- Xem thống kê và báo cáo

## 🔐 Routes:

- `/` - Public routes (User)
- `/manager/*` - Manager routes
- `/admin/*` - Admin routes

## 📦 Layouts:

- `PublicLayout` - Layout cho User
- `ManagerLayout` - Layout cho Manager (sidebar navigation)
- `AdminLayout` - Layout cho Admin (sidebar navigation, purple theme)
