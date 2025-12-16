# API Endpoints by Feature (Mapping for React Frontend)

> Tất cả endpoint đều có prefix `http://localhost:3000` (hoặc base URL bạn cấu hình trong FE).

---

## 1. Auth & User Profile

### 1.1 Auth

- **POST `/api/auth/login`**  
  - Mô tả: Đăng nhập (User / Manager / Admin chung 1 API).  
  - Body: `{ email, password }`  
  - Response: `{ token, user: { user_id, full_name, role_id, ... } }`

- (Nếu có) **POST `/api/auth/register`** – Đăng ký user mới.

### 1.2 User Profile

- **GET `/api/users/me`**  
  - Mô tả: Lấy thông tin user hiện tại.  
  - Auth: `Bearer <TOKEN>` (mọi role).

- **PUT `/api/users/me`**  
  - Mô tả: Cập nhật thông tin cá nhân (full_name, phone,...).  
  - Auth: `Bearer <TOKEN>`.

---

## 2. User – Station Browsing & Booking Flow

### 2.1 Station Browsing

- **GET `/api/stations`**  
  - Mô tả: Danh sách trạm (User & Manager & Admin đều dùng được).  
  - Query: `status`, `station_type`, search,...

- **GET `/api/stations/:station_id`**  
  - Mô tả: Chi tiết 1 trạm, rating, feedback.

### 2.2 Booking (User tạo booking)

- **POST `/api/bookings`**  
  - Mô tả: User đặt lịch sạc.  
  - Auth: `Bearer <USER_TOKEN>`.

- **GET `/api/bookings/my`**  
  - Mô tả: Lịch sử booking của user (bao gồm thông tin sạc + thanh toán).  
  - Dùng cho: 2 màn hình lịch sử sạc & lịch sử thanh toán (gộp).

- **GET `/api/bookings/:booking_id`**  
  - Mô tả: Xem chi tiết 1 booking của user hiện tại.

- **GET `/api/bookings/:booking_id/charging/status`**  
  - Mô tả: Theo dõi trạng thái sạc (Realtime page).

---

## 3. User – Payments (VNPay)

- **POST `/api/payments/create-vnpay-url`**  
  - Mô tả: Tạo URL thanh toán VNPay cho `booking_id`.  
  - Auth: `Bearer <USER_TOKEN>`.

- **GET `/api/payments/vnpay-return`**  
  - Mô tả: Endpoint VNPay redirect về; FE đọc query, hiển thị kết quả.

*(Các API phụ khác xem chi tiết trong `TEST_PAYMENT_GUIDE.md`)*

---

## 4. User – Notifications

> FE thường mount ở icon chuông + màn hình lịch sử thông báo.

- **GET `/api/notifications/unread`**  
  - Mô tả: Lấy danh sách thông báo chưa đọc (popup sau login).  
  - Auth: `Bearer <USER_TOKEN>`.

- **GET `/api/notifications/history`**  
  - Mô tả: Lịch sử thông báo (có phân trang).  
  - Query: `page`, `limit`, `type?`.

- **PUT `/api/notifications/:notification_id/read`**  
  - Mô tả: Đánh dấu 1 thông báo đã đọc.

- **PUT `/api/notifications/read-all`**  
  - Mô tả: Đánh dấu tất cả thông báo đã đọc.

---

## 5. User – Favorites & Feedback

### 5.1 Favorites

- **GET `/api/favorites`** – Danh sách trạm yêu thích.  
- **POST `/api/favorites`** – Body: `{ station_id }` – Thêm trạm yêu thích.  
- **DELETE `/api/favorites/:station_id`** – Bỏ yêu thích trạm.

### 5.2 Feedback

- **POST `/api/feedbacks`**  
  - Mô tả: Gửi đánh giá cho trạm (màn hình review).  
  - Body: `{ station_id, rating, comment }`.

---

## 6. User – Report (Gửi báo cáo sự cố/bảo trì)

- **POST `/api/reports`** (role = User)  
  - Mô tả: Gửi báo cáo sự cố/bảo trì cho **Manager trạm**.  
  - Form-data: `station_id`, `title`, `description`, `image?`.

*(User không trực tiếp gọi resolve/escalate – đó là phía Manager/Admin)*

---

## 7. Manager – Dashboard & Station / Booking Management

### 7.1 Manager Dashboard

- **GET `/api/manager/dashboard`**  
  - Mô tả: Lấy toàn bộ dữ liệu màn hình Dashboard Manager.  
  - Auth: `Bearer <MANAGER_TOKEN>`.
  - Response: `{ manager_name, stats, recent_bookings, capacity }`.

### 7.2 Station Management (Manager nhìn trạm của mình)

- **GET `/api/manager/stations`**  
  - Mô tả: Danh sách trạm manager đang quản lý (table dưới dashboard).  
  - Query: `status`.

- **GET `/api/manager/stations/:id`**  
  - Mô tả: Chi tiết trạm + rating + 5 feedback mới nhất.

- **PUT `/api/manager/stations/:id/status`**  
  - Mô tả: Đổi trạng thái trạm (active / maintenance / inactive).

### 7.3 Booking Management

- **GET `/api/manager/stations/:id/bookings`**  
  - Mô tả: Danh sách booking của 1 trạm (filter theo `status`, `start_date`, `end_date`).  
  - Dùng cho màn hình \"Lịch đặt\" trong Manager Panel.

- **PUT `/api/bookings/:booking_id/confirm`**  
  - Mô tả: Manager xác nhận booking (tạo `checkin_code`, gửi notification cho user).  
  - Auth: `Bearer <MANAGER_TOKEN>`.

- **PUT `/api/bookings/:booking_id/cancel`**  
  - Mô tả: Manager huỷ booking, cập nhật lại `available_slots`, gửi notification cho user.

---

## 8. Manager – Report System

### 8.1 Manager gửi báo cáo lên Admin

- **POST `/api/reports`** (role = Manager)  
  - Mô tả: Manager gửi báo cáo/bảo trì cho Admin (và optional broadcast user).  
  - Form-data: `station_id`, `title`, `description`, `image?`, `user_ids?` (JSON string).

### 8.2 Manager xử lý báo cáo từ User

- **PUT `/api/reports/:report_id/manager/resolve`**  
  - Mô tả: Manager đánh dấu báo cáo (từ User) đã xử lý xong; gửi notification cho user.

- **PUT `/api/reports/:report_id/manager/escalate`**  
  - Mô tả: Manager không xử lý được → chuyển báo cáo lên Admin; gửi notification cho user + admin.

*(Manager xem thông báo vẫn dùng group `/api/notifications/*` giống user)*

---

## 9. Admin – User & Station Management

> Prefix chung: `/api/admin/*`, Auth: `Bearer <ADMIN_TOKEN>`.

### 9.1 Admin – User Management

- **GET `/api/admin/users`** – Danh sách user (filter theo role, status, search).  
- **GET `/api/admin/users/:id`** – Chi tiết user.  
- **PUT `/api/admin/users/:id/status`** – Khoá / mở khoá tài khoản.

### 9.2 Admin – Station Management

- **GET `/api/admin/stations`** – Danh sách trạm (filter theo status, type, manager,...).  
- **GET `/api/admin/stations/:id`** – Chi tiết trạm.  
- **PUT `/api/admin/stations/:id`** – Cập nhật thông tin trạm.  
- **PUT `/api/admin/stations/:id/status`** – Đổi trạng thái trạm.

---

## 10. Admin – Booking Management

### 10.1 Stats & List

- **GET `/api/admin/bookings/stats`**  
  - Mô tả: Thống kê số booking (total, pending, charging, completed) cho dashboard admin.

- **GET `/api/admin/bookings`**  
  - Mô tả: Danh sách booking với filter (`station_id`, `status`, `start_date`, `end_date`, `search`, `page`, `limit`).  
  - Dùng cho màn hình bảng quản lý booking (Admin).

### 10.2 Detail & Cancel

- **GET `/api/admin/bookings/:booking_id`**  
  - Mô tả: Chi tiết booking (customer, station, payment...).  
  - Dùng cho modal \"Xem chi tiết\".

- **PUT `/api/admin/bookings/:booking_id/cancel`**  
  - Mô tả: Admin huỷ booking, cập nhật lại `available_slots` nếu còn giữ slot.

---

## 11. Admin – Payment Management

- **GET `/api/admin/payments/stats`** – 4 card thống kê payment (revenue, pending amount, pending count, success rate).  
- **GET `/api/admin/payments`** – Danh sách payment (filter + paging).  
- **GET `/api/admin/payments/:payment_id`** – Chi tiết 1 payment.  
- **GET `/api/admin/payments/export`** – Xuất CSV theo filter hiện tại.

---

## 12. Admin – Dashboard Tổng quan

- **GET `/api/admin/dashboard/overview`** – 4 card top: users, bookings, revenue, kWh.  
- **GET `/api/admin/dashboard/highlights`** – 4 card giữa: top station, top spender, cancel rate, maintenance stations.  
- **GET `/api/admin/dashboard/charts/revenue`** – Chart doanh thu theo tháng.  
- **GET `/api/admin/dashboard/charts/booking-trend`** – Chart booking theo ngày trong tuần.  
- **GET `/api/admin/dashboard/charts/station-types`** – Pie chart loại trạm.  
- **GET `/api/admin/dashboard/recent-activities`** – Sidebar: notifications + recent activities.

---

## 13. Admin – Notifications

- **POST `/api/admin/notifications`**  
  - Mô tả: Gửi thông báo hệ thống (cho all users, all managers, hoặc specific list).  
  - Body: `{ target, user_ids?, title, message, type }`.

- **GET `/api/admin/notifications/history`**  
  - Mô tả: Lịch sử các chiến dịch gửi thông báo.

---

## 14. Admin – Reports từ Manager

- **GET `/api/reports/admin`**  
  - Mô tả: Danh sách báo cáo do Manager gửi (dùng cho màn hình quản lý báo cáo Admin).

- **PUT `/api/reports/:report_id/status`**  
  - Mô tả: Admin cập nhật trạng thái báo cáo (`pending` / `resolved`), khi `resolved` sẽ gửi notification cho Manager reporter.

---

## 15. Gợi ý mapping nhanh FE

- **Mobile/Web User App**:
  - Auth/Profile: `/api/auth/login`, `/api/users/me`.
  - Home/Stations: `/api/stations`, `/api/stations/:id`.
  - Booking flow: `/api/bookings`, `/api/bookings/my`, `/api/bookings/:id`, `/api/bookings/:id/charging/status`.
  - Payment: `/api/payments/create-vnpay-url`, `/api/payments/vnpay-return`.
  - Notifications: `/api/notifications/*`.
  - Favorites/Feedback/Report: `/api/favorites/*`, `/api/feedbacks`, `/api/reports`.

- **Manager Panel**:
  - Dashboard: `/api/manager/dashboard`.
  - Station: `/api/manager/stations*`.
  - Booking: `/api/manager/stations/:id/bookings`, `/api/bookings/:id/confirm`, `/api/bookings/:id/cancel`.
  - Reports: `/api/reports` (POST as manager), `/api/reports/:id/manager/resolve`, `/api/reports/:id/manager/escalate`.

- **Admin Panel**:
  - User/Station: `/api/admin/users*`, `/api/admin/stations*`.
  - Booking/Payment: `/api/admin/bookings*`, `/api/admin/payments*`.
  - Dashboard: `/api/admin/dashboard/*`.
  - Notifications: `/api/admin/notifications*`.
  - Reports: `/api/reports/admin`, `/api/reports/:id/status`.


