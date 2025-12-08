# Admin Pages

Thư mục này chứa các trang dành cho **Admin** (role_id = 3)

## Các trang hiện có:

### Authentication:
- `AdminLogin.tsx` - Trang đăng nhập admin riêng

### Dashboard & Analytics:
- `AdminDashboard.tsx` - Dashboard tổng quan với KPI và biểu đồ

### Management:
- `UserManagement.tsx` - Quản lý người dùng (CRUD, Lock/Unlock, Phân quyền)
- `StationManagement.tsx` - Quản lý trạm sạc (CRUD)
- `BookingManagement.tsx` - Quản lý tất cả booking (View only, Cancel)
- `PaymentManagement.tsx` - Quản lý thanh toán & doanh thu

### Communication:
- `NotificationManagement.tsx` - Gửi thông báo hệ thống đến user

## Quyền truy cập:
- Admin có toàn quyền quản lý hệ thống
- Admin quản lý tất cả users, stations, bookings, payments
- Admin xem thống kê và báo cáo tổng hợp
- Admin gửi thông báo đến người dùng

## Layout:
- Sử dụng `AdminLayout.tsx` với sidebar navigation
- Route prefix: `/admin/*`
- Gradient theme: Purple (#667eea → #764ba2)

## Modals & Components:
- `AssignRoleModal` - Phân quyền tài khoản
- `UserDetailModal` - Xem chi tiết người dùng
- `EditUserModal` - Chỉnh sửa người dùng
- `CreateUserModal` - Tạo người dùng mới
- `StationFormModal` - Thêm/sửa trạm sạc
- `StationDetailModal` - Xem chi tiết trạm sạc
- `BookingDetailModal` - Xem chi tiết booking
