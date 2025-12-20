# Smart EV Charging Station – Backend

Backend server for a web/mobile system to manage EV charging stations with **three main roles**:

- **User** – Đặt lịch sạc, thanh toán, xem lịch sử sạc/thanh toán, đánh giá trạm, quản lý trạm yêu thích, nhận thông báo.
- **Manager** – Quản lý các trạm thuộc quyền quản lý (dashboard, danh sách trạm & booking), xử lý báo cáo sự cố/bảo trì từ user, gửi báo cáo/bảo trì lên Admin.
- **Admin** – Quản trị toàn hệ thống: user, trạm, booking, thanh toán, dashboard tổng quan, gửi thông báo hệ thống, xử lý báo cáo từ Manager.

## Tech Stack

- **Node.js + Express**
- **MySQL** với ORM **Sequelize**
- **JWT Authentication**, middleware `authenticate` + `authorize`
- Realtime charging (Socket.IO) cho theo dõi tiến trình sạc

## Thư mục chính (`server/`)

- `controllers/` – Business logic cho từng nhóm API:
  - User: `authController`, `userController`, `stationController`, `bookingController`, `paymentController`, `favoriteController`, `feedbackController`, `userNotificationController`
  - Manager: `managerStationController`, `managerBookingController`, `managerDashboardController`, `reportController`
  - Admin: `adminUserController`, `adminStationController`, `adminBookingController`, `adminPaymentController`, `adminDashboardController`, `adminNotificationController`
- `routes/` – Khai báo route:
  - `/api/auth`, `/api/users`, `/api/stations`, `/api/bookings`, `/api/payments`, `/api/favorites`, `/api/feedbacks`, `/api/notifications`
  - `/api/manager/*` – Manager Panel
  - `/api/admin/*` – Admin Panel
  - `/api/reports` – Hệ thống báo cáo sự cố/bảo trì (User ↔ Manager ↔ Admin)
- `models/` – Sequelize models mapping với file `smartchargingstation_mvp.sql`
- `middleware/` – `auth`, `validation`, `errorHandler`

## Luồng chính

### User

1. Đăng nhập (`POST /api/auth/login`).
2. Xem danh sách trạm, lọc theo loại/trạng thái (`GET /api/stations`).
3. Đặt lịch sạc (`POST /api/bookings`), theo dõi trạng thái sạc (`/api/bookings/:id/charging/status`).
4. Thanh toán (VNPay) qua `/api/payments/*`, lịch sử sạc & thanh toán gộp trong `GET /api/bookings/my`.
5. Quản lý trạm yêu thích (`/api/favorites/*`), gửi feedback (`/api/feedbacks`), nhận & đọc thông báo (`/api/notifications/*`).
6. Gửi báo cáo sự cố/bảo trì cho **Manager trạm** qua `POST /api/reports`.

### Manager

1. Dashboard tổng quan (`GET /api/manager/dashboard`).
2. Quản lý trạm (`/api/manager/stations/*`) và booking (`/api/manager/stations/:id/bookings`, confirm/cancel booking).
3. Nhận báo cáo từ User (qua notification + `reports`), xử lý được thì `resolve`, không được thì `escalate` lên Admin:
   - `PUT /api/reports/:report_id/manager/resolve`
   - `PUT /api/reports/:report_id/manager/escalate`
4. Gửi báo cáo/bảo trì trực tiếp lên Admin qua `POST /api/reports` (role Manager).

### Admin

1. Quản lý User & Station (`/api/admin/users`, `/api/admin/stations`).
2. Quản lý Booking (`/api/admin/bookings/*`) và Payment (`/api/admin/payments/*`, export CSV).
3. Dashboard tổng quan (`/api/admin/dashboard/*`) – overview, highlights, charts, recent activities.
4. Gửi thông báo hệ thống cho user/manager (`/api/admin/notifications/*`).
5. Nhận & xử lý báo cáo từ Manager:
   - Xem danh sách: `GET /api/reports/admin`
   - Cập nhật trạng thái: `PUT /api/reports/:report_id/status`

## Test Guides

Trong thư mục `server/` đã có các file hướng dẫn test chi tiết:

- **User**: `TEST_USER_APIS_OVERVIEW.md`, `TEST_BOOKING_HISTORY.md`, `TEST_PAYMENT_GUIDE.md`, `TEST_NOTIFICATIONS_AND_HISTORY.md`
- **Manager**: `TEST_MANAGER_APIS_OVERVIEW.md`, `TEST_MANAGER_PANEL.md`, `TEST_MANAGER_DASHBOARD_OVERVIEW.md`, `TEST_MANAGER_REPORT_SUBMIT.md`, `TEST_REPORT_SYSTEM.md`
- **Admin**: `TEST_ADMIN_APIS_OVERVIEW.md`

Sử dụng các file trên để test toàn bộ luồng theo từng role.
