# 📁 Cấu trúc thư mục dự án

## 🏗️ Tổng quan cấu trúc

```
ev-charging-station/
│
├── 📂 public/                  # Static assets
│   └── vite.svg
│
├── 📂 src/                     # Source code chính
│   ├── 📂 assets/             # Images, icons
│   │   └── react.svg
│   │
│   ├── 📂 components/         # Shared components
│   │   └── 📂 shared/
│   │       ├── AlertModal.tsx
│   │       ├── ConfirmModal.tsx
│   │       └── Footer.tsx
│   │
│   ├── 📂 contexts/           # React contexts (empty - sẵn sàng mở rộng)
│   │
│   ├── 📂 pages/              # Pages theo role
│   │   ├── 🟢 User/
│   │   ├── 🟡 Manager/
│   │   ├── 🔴 Admin/
│   │   └── 🔐 Auth/
│   │
│   ├── 📂 services/           # API services
│   │   ├── api.ts            # Axios instance
│   │   ├── apiEndpoints.ts   # ⭐ Tập trung tất cả API endpoints
│   │   ├── authService.ts
│   │   ├── bookingService.ts
│   │   ├── favoriteService.ts
│   │   ├── feedbackService.ts
│   │   ├── paymentService.ts
│   │   ├── stationService.ts
│   │   └── mockData.ts       # Mock data cho development
│   │
│   ├── 📂 types/              # TypeScript types
│   │   └── index.ts
│   │
│   ├── App.tsx               # Main app với routing
│   ├── App.css
│   ├── main.tsx              # Entry point
│   └── index.css
│
├── 📄 .env                    # Environment variables
├── 📄 .env.example
├── 📄 package.json
├── 📄 vite.config.ts
├── 📄 tsconfig.json
│
└── 📚 Documentation/
    ├── API_DOCUMENTATION.md
    ├── DATABASE_SCHEMA.md
    ├── FOLDER_STRUCTURE.md    # ← File này
    ├── PROJECT_STRUCTURE.md
    ├── QUICK_START.md
    ├── TEST_ACCOUNTS.md
    └── seed_data.sql
```

---

## 📱 Chi tiết cấu trúc Pages

### 🟢 User Pages (Người dùng)
**Thư mục:** `src/pages/User/`

```
User/
├── Home.tsx                    # Trang chủ
├── Home.css
├── FeedbacksAndFavorites.tsx   # Đánh giá & yêu thích
├── FeedbacksAndFavorites.css
│
├── 📂 Bookings/               # Quản lý đặt chỗ
│   ├── CreateBooking.tsx      # Tạo booking mới
│   ├── CreateBooking.css
│   ├── BookingHistory.tsx     # Lịch sử booking
│   ├── BookingHistory.css
│   ├── ChargingStatus.tsx     # Trạng thái sạc
│   ├── ChargingStatus.css
│   ├── Payment.tsx            # Thanh toán
│   ├── Payment.css
│   ├── ChargingAndPayment.tsx # Sạc & thanh toán
│   └── ChargingAndPayment.css
│
├── 📂 Stations/               # Trạm sạc
│   ├── StationMap.tsx         # Bản đồ trạm
│   ├── StationMap.css
│   ├── StationList.tsx        # Danh sách trạm
│   ├── StationList.css
│   ├── StationDetail.tsx      # Chi tiết trạm
│   ├── StationDetailModal.tsx # Modal chi tiết
│   └── StationDetailModal.css
│
├── 📂 components/             # Components riêng User
│   ├── PublicLayout.tsx       # Layout chung
│   ├── PublicLayout.css
│   ├── BookingDetailModal.tsx
│   ├── BookingDetailModal.css
│   ├── QuickBookingModal.tsx
│   ├── QuickBookingModal.css
│   ├── StationDetailModal.tsx
│   └── StationDetailModal.css
│
└── README.md
```

**Routes:**
- `/` - Trang chủ
- `/map` - Bản đồ trạm sạc
- `/stations` - Danh sách trạm
- `/bookings/create` - Tạo booking
- `/bookings/list` - Lịch sử booking
- `/bookings/:id/charging` - Trạng thái sạc
- `/bookings/:id/payment` - Thanh toán
- `/user/feedbacks-favorites` - Đánh giá & yêu thích

---

### 🟡 Manager Pages (Quản lý trạm)
**Thư mục:** `src/pages/Manager/`

```
Manager/
├── Dashboard.tsx              # Dashboard thống kê
├── Dashboard.css
├── StationList.tsx            # Danh sách trạm quản lý
├── StationList.css
├── StationDetail.tsx          # Chi tiết trạm
├── StationDetail.css
├── StationBookings.tsx        # Booking tại trạm
├── StationBookings.css
├── UpdateStationStatus.tsx    # Cập nhật trạng thái
├── UpdateStationStatus.css
├── Reports.tsx                # Báo cáo
├── Reports.css
│
├── 📂 components/             # Components riêng Manager
│   ├── ManagerLayout.tsx      # Layout manager
│   ├── ManagerLayout.css
│   ├── SlotsModal.tsx         # Modal quản lý slots
│   └── SlotsModal.css
│
└── README.md
```

**Routes:**
- `/manager` - Dashboard
- `/manager/dashboard` - Dashboard
- `/manager/stations` - Danh sách trạm
- `/manager/stations/:id` - Chi tiết trạm
- `/manager/stations/:id/bookings` - Booking tại trạm
- `/manager/stations/:id/status` - Cập nhật trạng thái
- `/manager/reports` - Báo cáo

---

### 🔴 Admin Pages (Quản trị viên)
**Thư mục:** `src/pages/Admin/`

```
Admin/
├── AdminLogin.tsx             # Đăng nhập admin
├── AdminLogin.css
├── AdminDashboard.tsx         # Dashboard tổng quan
├── AdminDashboard.css
├── UserManagement.tsx         # Quản lý người dùng
├── UserManagement.css
├── StationManagement.tsx      # Quản lý trạm sạc
├── StationManagement.css
├── BookingManagement.tsx      # Quản lý booking
├── BookingManagement.css
├── PaymentManagement.tsx      # Quản lý thanh toán
├── PaymentManagement.css
├── NotificationManagement.tsx # Gửi thông báo
├── NotificationManagement.css
│
├── 📂 components/             # Components riêng Admin
│   ├── AdminLayout.tsx        # Layout admin
│   ├── AdminLayout.css
│   ├── AssignRoleModal.tsx    # Phân quyền
│   ├── AssignRoleModal.css
│   ├── CreateUserModal.tsx    # Tạo user
│   ├── CreateUserModal.css
│   ├── EditUserModal.tsx      # Sửa user
│   ├── EditUserModal.css
│   ├── UserDetailModal.tsx    # Chi tiết user
│   ├── UserDetailModal.css
│   ├── StationFormModal.tsx   # Form trạm sạc
│   └── StationFormModal.css
│
└── README.md
```

**Routes:**
- `/admin/login` - Đăng nhập admin
- `/admin` - Dashboard
- `/admin/dashboard` - Dashboard
- `/admin/users` - Quản lý người dùng
- `/admin/stations` - Quản lý trạm sạc
- `/admin/bookings` - Quản lý booking
- `/admin/payments` - Quản lý thanh toán
- `/admin/notifications` - Gửi thông báo

---

### 🔐 Auth Pages (Xác thực)
**Thư mục:** `src/pages/Auth/`

```
Auth/
├── LoginModal.tsx             # Modal đăng nhập
├── LoginModal.css
├── RegisterModal.tsx          # Modal đăng ký
├── RegisterModal.css
├── ForgotPasswordModal.tsx    # Modal quên mật khẩu
└── ForgotPasswordModal.css
```

**Shared cho tất cả roles**

---

## 🔧 Services Layer

### � srcr/services/

```
services/
├── api.ts                     # Axios instance với interceptors
├── apiEndpoints.ts            # ⭐ TẬP TRUNG TẤT CẢ API ENDPOINTS
├── authService.ts             # Authentication service
├── bookingService.ts          # Booking service
├── favoriteService.ts         # Favorite service
├── feedbackService.ts         # Feedback service
├── paymentService.ts          # Payment service
├── stationService.ts          # Station service
└── mockData.ts                # Mock data cho development
```

### ⭐ apiEndpoints.ts - File quan trọng nhất

File này tập trung **TẤT CẢ** API endpoints để dễ dàng quản lý và ghép API:

**Cấu trúc:**
```typescript
// Cấu hình chung
export const USE_MOCK = true; // Đổi false để dùng API thật

// Các module API
export const authAPI = { ... }        // Xác thực
export const stationAPI = { ... }     // Trạm sạc
export const bookingAPI = { ... }     // Đặt chỗ
export const favoriteAPI = { ... }    // Yêu thích
export const feedbackAPI = { ... }    // Đánh giá
export const paymentAPI = { ... }     // Thanh toán
export const userAPI = { ... }        // Người dùng
export const notificationAPI = { ... }// Thông báo
export const statisticsAPI = { ... } // Thống kê

// Export tất cả
export default {
  auth: authAPI,
  station: stationAPI,
  booking: bookingAPI,
  // ...
}
```

**Cách sử dụng:**
```typescript
import apiEndpoints from '@/services/apiEndpoints';

// Lấy danh sách trạm
const stations = await apiEndpoints.station.getAll();

// Đăng nhập
const { token, user } = await apiEndpoints.auth.login(email, password);

// Tạo booking
const booking = await apiEndpoints.booking.create(data);
```

**Để ghép API thật:**
1. Đặt `USE_MOCK = false` trong file `apiEndpoints.ts`
2. Cập nhật `VITE_API_BASE_URL` trong file `.env`
3. Tất cả endpoint đã được định nghĩa sẵn theo chuẩn RESTful

---

## 📦 Types & Interfaces

### 📂 src/types/

```
types/
└── index.ts                   # Tất cả TypeScript types & interfaces
```

**Bao gồm:**
- `User`, `Station`, `Booking`, `Payment`, `Feedback`, `Favorite`
- `StationType`, `VehicleType`, `StationStatus`, `BookingStatus`
- `PaymentStatus`, `PaymentMethod`

---

## 🎯 Phân loại theo Role

### 🟢 User (Người dùng) - role_id = 1
**Chức năng:**
- ✅ Xem bản đồ và danh sách trạm sạc
- ✅ Đặt lịch sạc xe
- ✅ Theo dõi trạng thái sạc
- ✅ Thanh toán (QR/Bank)
- ✅ Xem lịch sử booking
- ✅ Đánh giá trạm sạc
- ✅ Lưu trạm yêu thích

**Test Account:**
```
Email: user@test.com
Password: 123456
```

---

### 🟡 Manager (Quản lý trạm) - role_id = 2
**Chức năng:**
- ✅ Dashboard thống kê trạm
- ✅ Quản lý booking tại trạm
- ✅ Cập nhật trạng thái trạm (active/maintenance/inactive)
- ✅ Cập nhật số lượng slots
- ✅ Xem báo cáo doanh thu
- ✅ Xác nhận/Hủy booking

**Test Account:**
```
Email: manager@test.com
Password: 123456
```

---

### 🔴 Admin (Quản trị viên) - role_id = 3
**Chức năng:**
- ✅ Dashboard tổng quan hệ thống (KPI, Charts)
- ✅ Quản lý người dùng (CRUD, Lock/Unlock, Phân quyền)
- ✅ Quản lý trạm sạc (CRUD)
- ✅ Quản lý booking (View, Cancel)
- ✅ Quản lý thanh toán & doanh thu
- ✅ Gửi thông báo hệ thống

**Test Account:**
```
Email: admin@test.com
Password: admin123
```

---

## 🚀 Routing Structure

### User Routes (Public)
```
/                              → Home
/map                           → Bản đồ trạm sạc
/stations                      → Danh sách trạm
/bookings/create               → Tạo booking
/bookings/list                 → Lịch sử booking
/bookings/:id/charging         → Trạng thái sạc
/bookings/:id/payment          → Thanh toán
/bookings/history              → Lịch sử sạc & thanh toán
/user/feedbacks-favorites      → Đánh giá & yêu thích
```

### Manager Routes (Protected)
```
/manager                       → Dashboard
/manager/dashboard             → Dashboard
/manager/stations              → Danh sách trạm quản lý
/manager/stations/:id          → Chi tiết trạm
/manager/stations/:id/bookings → Booking tại trạm
/manager/stations/:id/status   → Cập nhật trạng thái
/manager/reports               → Báo cáo
```

### Admin Routes (Protected)
```
/admin/login                   → Đăng nhập admin
/admin                         → Dashboard
/admin/dashboard               → Dashboard
/admin/users                   → Quản lý người dùng
/admin/stations                → Quản lý trạm sạc
/admin/bookings                → Quản lý booking
/admin/payments                → Quản lý thanh toán
/admin/notifications           → Gửi thông báo
```

---

## ✨ Ưu điểm của cấu trúc này

### 1. **Tách biệt rõ ràng theo Role**
- Mỗi role có thư mục riêng
- Dễ tìm kiếm và maintain
- Không bị conflict code giữa các role

### 2. **API tập trung**
- File `apiEndpoints.ts` chứa TẤT CẢ endpoints
- Dễ dàng chuyển đổi mock ↔ real API
- Comment đầy đủ cho mỗi endpoint

### 3. **Component reusable**
- Shared components trong `src/components/shared/`
- Role-specific components trong từng thư mục role
- Layout riêng cho từng role

### 4. **Type-safe**
- TypeScript types tập trung trong `src/types/`
- Đảm bảo type safety cho toàn bộ app

### 5. **Dễ scale**
- Thêm tính năng mới vào đúng thư mục
- Thêm API mới vào `apiEndpoints.ts`
- Thêm type mới vào `src/types/index.ts`

---

## 📚 Tài liệu liên quan

- `API_DOCUMENTATION.md` - Chi tiết API endpoints
- `DATABASE_SCHEMA.md` - Schema database
- `PROJECT_STRUCTURE.md` - Tổng quan dự án
- `QUICK_START.md` - Hướng dẫn bắt đầu
- `TEST_ACCOUNTS.md` - Tài khoản test

---

## 🔄 Workflow Development

### 1. Thêm tính năng mới
```
1. Thêm type vào src/types/index.ts
2. Thêm API endpoint vào src/services/apiEndpoints.ts
3. Tạo component/page trong thư mục role tương ứng
4. Thêm route vào src/App.tsx
```

### 2. Ghép API thật
```
1. Mở src/services/apiEndpoints.ts
2. Đổi USE_MOCK = false
3. Cập nhật .env với VITE_API_BASE_URL
4. Test từng endpoint
```

### 3. Debug
```
1. Check console log
2. Check Network tab (DevTools)
3. Check mock data trong src/services/mockData.ts
4. Check API response format
```

---

**✅ Cấu trúc hoàn chỉnh!** Dự án đã được tổ chức theo best practices với phân chia rõ ràng theo role và API tập trung.
