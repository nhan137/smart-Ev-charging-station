# TEST – Manager APIs Overview (Manager Panel)

## 1. Chuẩn bị chung

- Backend: `http://localhost:3000`
- Manager account (role_id = 2, status = 'active'), đã được gán vào các trạm (`stations.manager_id`).

### 1.1 Đăng nhập lấy MANAGER_TOKEN

`POST /api/auth/login`

```json
{
  "email": "manager@example.com",
  "password": "123456"
}
```

Header cho tất cả API Manager:

```text
Authorization: Bearer <MANAGER_TOKEN>
```

---

## 2. Dashboard – Overview Screen

Chi tiết test: `TEST_MANAGER_DASHBOARD_OVERVIEW.md`

- **GET /api/manager/dashboard**

**Kiểm tra nhanh**:

```http
GET /api/manager/dashboard
Authorization: Bearer <MANAGER_TOKEN>
```

Kỳ vọng:

- `manager_name` đúng theo user đang đăng nhập.
- `stats.total_stations`, `active_stations`, `today_bookings`, `today_revenue` khớp với SQL.
- `recent_bookings` chứa tối đa 5 booking mới nhất cho các trạm manager quản lý.
- `capacity` đúng công thức: `used_slots = total_slots - available_slots`.

---

## 3. Station Management

Chi tiết full flow: `TEST_MANAGER_PANEL.md` – phần Station Management.

### 3.1 Danh sách trạm thuộc quyền quản lý

**GET /api/manager/stations**

Query optional:

- `status=active|maintenance|inactive`

**Test**:

```http
GET /api/manager/stations?status=active
Authorization: Bearer <MANAGER_TOKEN>
```

Kỳ vọng: trả về các trạm có `manager_id = current_user` và `status = 'active'`.

### 3.2 Chi tiết 1 trạm + đánh giá

**GET /api/manager/stations/:id**

Lấy:

- Thông tin trạm
- `average_rating`, `total_reviews`
- `recent_reviews[]`

### 3.3 Cập nhật trạng thái trạm

**PUT /api/manager/stations/:id/status**

Body (JSON):

```json
{ "status": "maintenance" }
```

Kỳ vọng: chỉ cập nhật được trạm có `manager_id` là manager hiện tại.

---

## 4. Booking Management

Chi tiết luồng confirm/cancel: xem `TEST_MANAGER_PANEL.md` – Booking Management.

### 4.1 Danh sách booking của 1 trạm

**GET /api/manager/stations/:id/bookings**

Query:

- `status` (pending/confirmed/charging/completed/cancelled)
- `start_date`, `end_date`

### 4.2 Confirm Booking (tạo check-in code + gửi notification)

Endpoint nằm trong `bookingRoutes.js` (Manager dùng cùng endpoint với user, nhưng logic xác thực trong `managerBookingController` / `bookingController`).

Tham khảo `TEST_MANAGER_PANEL.md` để test:

- **PUT /api/bookings/:booking_id/confirm**
- **PUT /api/bookings/:booking_id/cancel**

---

## 5. Report – Báo cáo sự cố/Bảo trì

Chi tiết toàn bộ flow: `TEST_MANAGER_REPORT_SUBMIT.md` + `TEST_REPORT_SYSTEM.md`.

### 5.1 Gửi báo cáo từ Manager (bảo trì / sự cố lớn)

**POST /api/reports**

Form-data:

- `station_id` (text)
- `title` (text)
- `description` (text)
- `image` (file, optional)
- `user_ids` (text – JSON string `["6","7"]`, optional để broadcast cho users từng booking)

Kỳ vọng:

- Tạo 1 dòng mới trong `reports` với `reporter_id = manager_id`.
- Notification tới **Admin** (role_id = 3) + (optional) tới Users trong `user_ids` hợp lệ.

### 5.2 Xử lý báo cáo từ User (Manager tự xử lý)

User gửi report: `POST /api/reports` với role = User.  
Manager dùng:

**PUT /api/reports/:report_id/manager/resolve**

- Chỉ áp dụng cho report:
  - Thuộc trạm manager hiện tại (`stations.manager_id = manager_id`)
  - `reporter` là User (role_id = 1)

Kết quả:

- Cập nhật `reports.status = 'resolved'`.
- Tạo notification cho User: \"Báo cáo đã được Quản lý xử lý\".

### 5.3 Chuyển báo cáo User lên Admin

**PUT /api/reports/:report_id/manager/escalate**

Kỳ vọng:

- Gửi notification cho User: \"Báo cáo đã được chuyển cho Admin\".
- Tạo **report mới** với `reporter_id = manager_id` để Admin xử lý.
- Thông báo tới tất cả Admin (role_id = 3).

---

## 6. Notifications nhìn từ phía Manager

Manager nhận:

- Thông báo **báo cáo mới từ User** (role 1).
- Thông báo **Admin đã xử lý báo cáo** khi dùng API `/api/reports/:id/status`.

Manager đọc thông báo vẫn dùng cùng group API cho User:

- **GET /api/notifications/unread**
- **GET /api/notifications/history**
- **PUT /api/notifications/:notification_id/read**
- **PUT /api/notifications/read-all**

Chi tiết test: xem `TEST_NOTIFICATIONS_AND_HISTORY.md`.

---

## 7. Tóm tắt

- Manager có 3 nhóm chức năng chính:
  1. **Dashboard** – `/api/manager/dashboard`.
  2. **Station & Booking Management** – `/api/manager/stations/*` + các API confirm/cancel booking.
  3. **Report System** – `/api/reports` + các API `/manager/resolve` và `/manager/escalate`.
- Tất cả yêu cầu header: `Authorization: Bearer <MANAGER_TOKEN>` và role `manager` (role_id = 2).


