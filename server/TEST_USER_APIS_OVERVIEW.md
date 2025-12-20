# TEST – User APIs Overview (Mobile/Web App)

## 1. Chuẩn bị

- Backend: `http://localhost:3000`
- User account (role_id = 1, status = 'active'), ví dụ:
  - `email = user@example.com`
  - `password = 123456`

### 1.1 Đăng nhập lấy USER_TOKEN

`POST /api/auth/login`

Body:

```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

Lưu `token` => `USER_TOKEN` dùng cho tất cả API user (header `Authorization: Bearer <USER_TOKEN>`).

---

## 2. User Profile

> Các API cụ thể xem thêm `API_DOCUMENTATION.md` – phần Auth/User.

- **GET /api/users/me** – Lấy thông tin user hiện tại.
- **PUT /api/users/me** – Cập nhật thông tin cá nhân (full_name, phone,...).

**Test nhanh**:

```http
GET /api/users/me
Authorization: Bearer <USER_TOKEN>
```

Kỳ vọng: trả về `user_id`, `full_name`, `email`, `role_id = 1`.

---

## 3. Station Browsing (Danh sách trạm, filter, chi tiết)

Routes chính: `stationRoutes.js`, controller `stationController.js`.

- **GET /api/stations** – Lấy danh sách trạm, có filter theo:
  - `status` (active / maintenance / inactive)
  - `station_type` (xe_may / oto / ca_hai)
- **GET /api/stations/:id** – Lấy chi tiết trạm, bao gồm:
  - thông tin trạm,
  - feedback / rating,
  - slots,...

**Test**:

```http
GET /api/stations?status=active
GET /api/stations/1
```

---

## 4. Booking – Đặt lịch & Lịch sử

Chi tiết luồng & test step-by-step: xem file `TEST_BOOKING_HISTORY.md`.

Các endpoint chính (từ `bookingRoutes.js`):

- **POST /api/bookings** – Tạo booking mới.
- **GET /api/bookings/my** – Lịch sử booking của user (bao gồm charging + payment history, dùng cho 2 UI lịch sử).
- **GET /api/bookings/:booking_id** – Xem chi tiết 1 booking của chính user.
- **GET /api/bookings/:booking_id/charging/status** – Theo dõi trạng thái sạc realtime.

**Test tạo booking mới** (tóm tắt):

```http
POST /api/bookings
Authorization: Bearer <USER_TOKEN>
Content-Type: application/json

{
  "station_id": 1,
  "vehicle_type": "oto",
  "start_time": "2025-12-20T14:00:00.000Z",
  "end_time": "2025-12-20T15:00:00.000Z"
}
```

Kỳ vọng: `success = true`, trả về `booking_id`.

---

## 5. Payments – Thanh toán

Chi tiết VNPay flow & test: xem `TEST_PAYMENT_GUIDE.md`.

Các endpoint chính (từ `paymentRoutes.js` + `paymentController.js`):

- **POST /api/payments/create-vnpay-url** – Tạo URL thanh toán VNPay cho 1 booking.
- **GET /api/payments/vnpay-return** – VNPay redirect lại (FE nhận & hiển thị).
- **GET /api/payments/my** (nếu có) – lịch sử thanh toán (thường dùng chung trong `GET /api/bookings/my`).

**Test tạo URL thanh toán**:

```http
POST /api/payments/create-vnpay-url
Authorization: Bearer <USER_TOKEN>
Content-Type: application/json

{
  "booking_id": 10,
  "amount": 50000,
  "bankCode": "NCB"
}
```

Kỳ vọng: trả về `paymentUrl` (redirect trên FE).

---

## 6. Notifications – Thông báo cho User

Chi tiết test đầy đủ: xem `TEST_NOTIFICATIONS_AND_HISTORY.md`.

User dùng controller `userNotificationController.js`, routes `notificationRoutes.js`:

- **GET /api/notifications/unread** – Lấy các thông báo chưa đọc (popup sau login).
- **GET /api/notifications/history** – Lịch sử thông báo (có filter + pagination).
- **PUT /api/notifications/:notification_id/read** – Đánh dấu 1 notification đã đọc.
- **PUT /api/notifications/read-all** – Đánh dấu tất cả đã đọc.

**Test nhanh – lấy lịch sử**:

```http
GET /api/notifications/history?page=1&limit=10
Authorization: Bearer <USER_TOKEN>
```

Kỳ vọng: trả về `items[]`, `unread_count`.

---

## 7. Favorites – Trạm yêu thích

Routes: `favoriteRoutes.js`, controller `favoriteController.js`.

- **GET /api/favorites** – Danh sách trạm yêu thích của user.
- **POST /api/favorites** – Thêm trạm vào danh sách yêu thích.
- **DELETE /api/favorites/:station_id** – Bỏ yêu thích trạm.

**Test thêm trạm yêu thích**:

```http
POST /api/favorites
Authorization: Bearer <USER_TOKEN>
Content-Type: application/json

{ "station_id": 1 }
```

---

## 8. Feedback – Đánh giá trạm

Routes: `feedbackRoutes.js`, controller `feedbackController.js`.  
Được dùng cho màn hình review sau khi sạc.

- **POST /api/feedbacks** – Tạo feedback mới cho booking/trạm.
- **GET /api/feedbacks/my** (nếu có) – lịch sử đánh giá của user.

**Test gửi feedback**:

```http
POST /api/feedbacks
Authorization: Bearer <USER_TOKEN>
Content-Type: application/json

{
  "station_id": 1,
  "rating": 5,
  "comment": "Trạm sạch sẽ, nhân viên hỗ trợ tốt."
}
```

---

## 9. Tóm tắt

- **Lịch sử sạc & thanh toán**: FE chỉ cần dùng **`GET /api/bookings/my` + `GET /api/bookings/:booking_id`** để build 2 màn hình lịch sử như yêu cầu.
- **Thông báo User**: dùng nhóm API `/api/notifications/*` (đọc chi tiết trong `TEST_NOTIFICATIONS_AND_HISTORY.md`).
- Các test chi tiết step-by-step đã được tách riêng ở các file:
  - `TEST_BOOKING_HISTORY.md`
  - `TEST_PAYMENT_GUIDE.md`
  - `TEST_NOTIFICATIONS_AND_HISTORY.md`


