# TEST – Admin APIs Overview (Admin Panel)

## 1. Chuẩn bị chung

- Backend: `http://localhost:3000`
- Admin account (role_id = 3, status = 'active'), ví dụ:
  - `email = admin@example.com`
  - `password = 123456`

### 1.1 Đăng nhập lấy ADMIN_TOKEN

`POST /api/auth/login`

```json
{
  "email": "admin@example.com",
  "password": "123456"
}
```

Header dùng chung:

```text
Authorization: Bearer <ADMIN_TOKEN>
```

---

## 2. User Management (Quản lý User)

Controller: `adminUserController.js`, Route: `adminRoutes.js` (prefix `/api/admin`).

> Nếu cần test chi tiết từng API, có thể tái tạo lại theo cấu trúc trong `API_DOCUMENTATION.md`.

Các nhóm API thường có:

- **GET /api/admin/users** – danh sách user với filter (role, status, search,...).
- **GET /api/admin/users/:id** – chi tiết user.
- **PUT /api/admin/users/:id/status** – khoá/mở khoá tài khoản.

**Test nhanh**:

```http
GET /api/admin/users?role=user&status=active
Authorization: Bearer <ADMIN_TOKEN>
```

Kỳ vọng: chỉ trả về user có `role_id = 1`, `status = 'active'`.

---

## 3. Station Management (Quản lý trạm)

Controller: `adminStationController.js`.

- **GET /api/admin/stations** – list trạm (filter theo status, type, manager,...).
- **GET /api/admin/stations/:id** – chi tiết 1 trạm.
- **PUT /api/admin/stations/:id** – cập nhật thông tin trạm.
- **PUT /api/admin/stations/:id/status** – đổi trạng thái trạm (active/maintenance/inactive).

**Test gợi ý**:

```http
GET /api/admin/stations?status=active
Authorization: Bearer <ADMIN_TOKEN>
```

---

## 4. Booking Management (Admin)

Controller: `adminBookingController.js`.

### 4.1 Thống kê Booking

**GET /api/admin/bookings/stats**

Kỳ vọng: trả về:

```json
{
  "success": true,
  "data": {
    "total": 100,
    "pending": 10,
    "charging": 5,
    "completed": 80
  }
}
```

### 4.2 Danh sách Booking với filter + paging

**GET /api/admin/bookings**

Query:

- `station_id`
- `status`
- `start_date`, `end_date`
- `search` (booking_id, customer name)
- `page`, `limit`

### 4.3 Chi tiết 1 Booking

**GET /api/admin/bookings/:booking_id**

- Join user, station, payment → dùng cho popup chi tiết.

### 4.4 Cancel Booking từ Admin

**PUT /api/admin/bookings/:booking_id/cancel**

- Không cho huỷ nếu booking đã `completed` hoặc `cancelled`.
- Nếu huỷ thành công → cập nhật lại `stations.available_slots` (đã fix logic).

---

## 5. Payment Management (Admin)

Controller: `adminPaymentController.js`.  
Chi tiết test thanh toán: `TEST_PAYMENT_GUIDE.md` (phần Admin).

### 5.1 Thống kê thanh toán

**GET /api/admin/payments/stats**

Trả về:

- `total_revenue`
- `pending_amount`
- `pending_count`
- `success_rate`

### 5.2 Danh sách thanh toán

**GET /api/admin/payments**

Query:

- `station_id`
- `status` (pending/success/failed)
- `start_date`, `end_date`
- `search` (booking_id, tên user)
- `page`, `limit`

### 5.3 Chi tiết Thanh toán

**GET /api/admin/payments/:payment_id**

### 5.4 Export CSV

**GET /api/admin/payments/export**

- Áp dụng chung filter như API list.
- Trả về file CSV (Excel mở được).

---

## 6. Admin Dashboard (Thống kê tổng quan)

Controller: `adminDashboardController.js`.

### 6.1 Overview

**GET /api/admin/dashboard/overview**

- `Total Users`, `Total Bookings`, `Total Revenue`, `Total kWh`.

### 6.2 Highlights

**GET /api/admin/dashboard/highlights**

- `Top Station`, `Top Spender`, `Cancel Rate`, `Maintenance Stations`.

### 6.3 Charts

- **GET /api/admin/dashboard/charts/revenue** – doanh thu 6 tháng gần nhất.
- **GET /api/admin/dashboard/charts/booking-trend** – số booking theo ngày trong tuần hiện tại.
- **GET /api/admin/dashboard/charts/station-types** – số lượng trạm theo loại.

### 6.4 Recent Activities

**GET /api/admin/dashboard/recent-activities**

- Notification hệ thống + hoạt động booking/payment gần đây.

---

## 7. Admin Notifications

Controller: `adminNotificationController.js`.  
Giao tiếp với bảng `notifications` – chi tiết test ở `TEST_NOTIFICATIONS_AND_HISTORY.md`.

### 7.1 Gửi thông báo

**POST /api/admin/notifications**

Body:

- `target`:
  - `all_users` – tất cả user (role 1)
  - `all_managers` – tất cả manager (role 2)
  - `specific` – gửi theo `user_ids`
- `user_ids`: `[1,2,3]` khi `target = specific`
- `title`, `message`, `type`

### 7.2 Lịch sử gửi thông báo

**GET /api/admin/notifications/history**

- Group theo chiến dịch gửi.

---

## 8. Report từ Manager gửi lên Admin

Controller: `reportController.js` – phần dành cho Admin.

- **GET /api/reports/admin** – danh sách báo cáo do Manager gửi (`reporter.role_id = 2`).
- **PUT /api/reports/:report_id/status** – `status = 'pending' | 'resolved'`
  - Khi `resolved` → gửi notification cho Manager: \"Báo cáo của bạn đã được Admin xử lý\".

Chi tiết flow tổng thể (User → Manager → Admin): xem `TEST_REPORT_SYSTEM.md`.

---

## 9. Bảo mật & Phân quyền

- Tất cả API trong nhóm `/api/admin/*` + `/api/reports/admin` + `PUT /api/reports/:id/status`:
  - Yêu cầu `Authorization: Bearer <ADMIN_TOKEN>`.
  - Middleware: `authenticate` + `authorize('admin')`.
- Nên test thêm với token User/Manager để xác nhận trả về `403 Access denied`.


