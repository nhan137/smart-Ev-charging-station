# 🧪 Test Guide: Notifications & Booking/Payment History

## 📋 Mục lục
1. [Chức năng Thông báo](#chức-năng-thông-báo)
2. [Chức năng Lịch sử Sạc & Thanh toán](#chức-năng-lịch-sử-sạc--thanh-toán)

---

## 🔔 Chức năng Thông báo

### **Chuẩn bị**

#### **Bước 1: Login Admin và lấy JWT Token**

**Postman:**
```
POST http://localhost:3000/api/auth/admin/login
```

**Body (JSON):**
```json
{
  "email": "admin@example.com",
  "password": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**✅ Copy `admin_token` để dùng cho Admin APIs**

---

#### **Bước 2: Login User và lấy JWT Token**

**Postman:**
```
POST http://localhost:3000/api/auth/login
```

**Body (JSON):**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**✅ Copy `user_token` để dùng cho User APIs**

---

### **📤 Admin APIs - Gửi Thông báo**

#### **API 1: POST /api/admin/notifications**
**Mục đích:** Admin gửi thông báo cho User/Manager

**Postman:**
```
POST http://localhost:3000/api/admin/notifications
```

**Headers:**
- `Authorization: Bearer <admin_token>`
- `Content-Type: application/json`

**Test Case 1.1: Gửi thông báo cho tất cả User và Manager**
```json
{
  "title": "Thông báo bảo trì hệ thống",
  "message": "Hệ thống sẽ bảo trì từ 2h-4h sáng ngày 26/11/2024. Vui lòng hoàn tất các giao dịch trước thời gian này.",
  "type": "system",
  "send_to": "all"
}
```

**Response mong đợi:**
```json
{
  "success": true,
  "message": "Notification queued."
}
```

**✅ Kiểm tra:**
- Response `success: true`
- Trong database: `notifications` table có 1 record với `user_id = NULL`

---

**Test Case 1.2: Gửi thông báo cho User cụ thể**
```json
{
  "title": "Khuyến mãi giảm 20% cuối tuần",
  "message": "Giảm 20% cho tất cả các booking trong tuần này (23-29/11). Áp dụng cho tất cả trạm sạc. Mã: WEEKEND20",
  "type": "promotion",
  "send_to": "selected",
  "user_ids": [1, 2, 3]
}
```

**Response mong đợi:**
```json
{
  "success": true,
  "message": "Notification queued."
}
```

**✅ Kiểm tra:**
- Response `success: true`
- Trong database: `notifications` table có 3 records với `user_id = 1, 2, 3`

---

**Test Case 1.3: Gửi thông báo cho Manager (role_id = 2) - Phải thành công**
```json
{
  "title": "Thông báo cho Manager",
  "message": "Thông báo này gửi cho Manager",
  "type": "system",
  "send_to": "selected",
  "user_ids": [5]
}
```
*(Giả sử user_id = 5 là Manager)*

**✅ Kiểm tra:**
- Response `success: true`
- Manager nhận được thông báo

---

**Test Case 1.4: Gửi thông báo cho Admin (role_id = 3) - Phải lỗi**
```json
{
  "title": "Thông báo cho Admin",
  "message": "Thông báo này gửi cho Admin",
  "type": "system",
  "send_to": "selected",
  "user_ids": [4]
}
```
*(Giả sử user_id = 4 là Admin)*

**Response mong đợi:**
```json
{
  "success": false,
  "message": "Cannot send notification to Admin users. Invalid user_ids: 4"
}
```

**✅ Kiểm tra:**
- Response `success: false`
- Error message rõ ràng

---

**Test Case 1.5: Thiếu required fields - Phải lỗi**
```json
{
  "title": "Thông báo",
  "type": "system"
}
```

**Response mong đợi:**
```json
{
  "success": false,
  "message": "Missing required fields"
}
```

---

**Test Case 1.6: Invalid type - Phải lỗi**
```json
{
  "title": "Thông báo",
  "message": "Nội dung",
  "type": "invalid_type",
  "send_to": "all"
}
```

**Response mong đợi:**
```json
{
  "success": false,
  "message": "Invalid type"
}
```

---

#### **API 2: GET /api/admin/notifications/history**
**Mục đích:** Lịch sử thông báo đã gửi (Admin Panel)

**Postman:**
```
GET http://localhost:3000/api/admin/notifications/history
```

**Headers:**
- `Authorization: Bearer <admin_token>`

**Query Params (Optional):**
- `limit`: int (Mặc định: 20)

**Test Case 2.1: Lấy lịch sử thông báo (mặc định)**
```
GET http://localhost:3000/api/admin/notifications/history
```

**Test Case 2.2: Lấy lịch sử với limit**
```
GET http://localhost:3000/api/admin/notifications/history?limit=10
```

**Response mong đợi:**
```json
{
  "success": true,
  "data": [
    {
      "title": "Thông báo bảo trì hệ thống",
      "message": "Hệ thống sẽ bảo trì từ 2h-4h sáng ngày 26/11/2024...",
      "type": "system",
      "created_minute": "2025-01-20 14:30",
      "created_at": "2025-01-20T14:30:00.000Z",
      "send_to_type": "all",
      "recipient_count": 1234
    },
    {
      "title": "Khuyến mãi giảm 20% cuối tuần",
      "message": "Giảm 20% cho tất cả các booking...",
      "type": "promotion",
      "created_minute": "2025-01-19 10:15",
      "created_at": "2025-01-19T10:15:00.000Z",
      "send_to_type": "selected",
      "recipient_count": 156
    }
  ]
}
```

**✅ Kiểm tra:**
- Response có mảng thông báo
- Mỗi item có: `title`, `message`, `type`, `send_to_type`, `recipient_count`
- `send_to_type`: `'all'` hoặc `'selected'`
- Sắp xếp theo `created_at` DESC (mới nhất trước)

---

### **📥 User APIs - Xem Thông báo**

#### **API 3: GET /api/notifications/unread**
**Mục đích:** Lấy thông báo chưa đọc (hiển thị modal sau khi đăng nhập)

**Postman:**
```
GET http://localhost:3000/api/notifications/unread
```

**Headers:**
- `Authorization: Bearer <user_token>`

**Response mong đợi:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": 1,
        "title": "Thông báo bảo trì hệ thống",
        "message": "Hệ thống sẽ bảo trì từ 2h-4h sáng ngày 26/11/2024...",
        "type": "system",
        "status": "unread",
        "created_at": "2025-01-20T14:30:00.000Z"
      },
      {
        "id": 2,
        "title": "Khuyến mãi giảm 20% cuối tuần",
        "message": "Giảm 20% cho tất cả các booking...",
        "type": "promotion",
        "status": "unread",
        "created_at": "2025-01-19T10:15:00.000Z"
      }
    ],
    "unread_count": 2
  }
}
```

**✅ Kiểm tra:**
- Response có mảng `notifications` (tối đa 10)
- Chỉ lấy `status = 'unread'`
- Bao gồm thông báo gửi riêng (`user_id = userId`) và thông báo hệ thống (`user_id = NULL`)
- Sắp xếp theo `created_at` DESC

---

#### **API 4: GET /api/notifications**
**Mục đích:** Lịch sử thông báo (trang "Thông báo" của user)

**Postman:**
```
GET http://localhost:3000/api/notifications
```

**Headers:**
- `Authorization: Bearer <user_token>`

**Query Params (Optional):**
- `type`: string (`system`, `promotion`, `payment`, `booking`, hoặc `all`)
- `status`: string (`unread`, `read`, hoặc `all`)
- `page`: int (Mặc định: 1)
- `limit`: int (Mặc định: 10)

**Test Case 4.1: Lấy tất cả thông báo (không filter)**
```
GET http://localhost:3000/api/notifications?page=1&limit=10
```

**Test Case 4.2: Filter theo type**
```
GET http://localhost:3000/api/notifications?type=system&page=1&limit=10
```

**Test Case 4.3: Filter theo status**
```
GET http://localhost:3000/api/notifications?status=unread&page=1&limit=10
```

**Test Case 4.4: Kết hợp filters**
```
GET http://localhost:3000/api/notifications?type=promotion&status=unread&page=1&limit=10
```

**Response mong đợi:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": 1,
        "title": "Thông báo bảo trì hệ thống",
        "message": "Hệ thống sẽ bảo trì từ 2h-4h sáng ngày 26/11/2024...",
        "type": "system",
        "status": "unread",
        "created_at": "2025-01-20T14:30:00.000Z"
      }
    ],
    "unread_count": 5,
    "pagination": {
      "total": 5,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

**✅ Kiểm tra:**
- Response có `notifications`, `unread_count`, và `pagination`
- `unread_count`: Số thông báo chưa đọc (để hiển thị "Bạn có 5 thông báo chưa đọc")
- Filters hoạt động đúng (`type`, `status`)
- Pagination hoạt động đúng (`page`, `limit`)

---

#### **API 5: PUT /api/notifications/:notification_id/read**
**Mục đích:** Đánh dấu 1 thông báo đã đọc

**⚠️ LƯU Ý QUAN TRỌNG:**
- API này **KHÔNG CẦN REQUEST BODY** - để trống hoặc không gửi body
- **BẮT BUỘC** phải có `Authorization: Bearer <user_token>` trong Headers
- Chỉ có thể đánh dấu thông báo của chính mình hoặc thông báo hệ thống (`user_id = NULL`)

**Postman:**
```
PUT http://localhost:3000/api/notifications/1/read
```

**Headers:**
- `Authorization: Bearer <user_token>` ⚠️ **BẮT BUỘC**
- `Content-Type: application/json` (không bắt buộc vì không có body)

**Body:**
- **KHÔNG CẦN** - Để trống hoặc không gửi body
- ❌ **SAI:** Gửi email/password trong body (đây là body của login API, không phải của API này)

**Response mong đợi:**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

**✅ Kiểm tra:**
- Response `success: true`
- Trong database: `notifications` table, record có `notification_id = 1`, `status = 'read'`

**Test Case 5.1: Đánh dấu thông báo hợp lệ (của chính mình)**
```
PUT http://localhost:3000/api/notifications/1/read
Headers: Authorization: Bearer <user_token>
Body: (để trống)
```
✅ Phải thành công

**Test Case 5.2: Đánh dấu thông báo hệ thống (user_id = NULL)**
```
PUT http://localhost:3000/api/notifications/5/read
Headers: Authorization: Bearer <user_token>
Body: (để trống)
```
*(Giả sử notification_id = 5 là thông báo hệ thống)*
✅ Phải thành công (vì thông báo hệ thống ai cũng có thể đánh dấu)

**Test Case 5.3: Đánh dấu thông báo không tồn tại - Phải lỗi 404**
```
PUT http://localhost:3000/api/notifications/99999/read
Headers: Authorization: Bearer <user_token>
Body: (để trống)
```

**Response mong đợi:**
```json
{
  "success": false,
  "message": "Notification not found"
}
```

**Test Case 5.4: Đánh dấu thông báo của user khác - Phải lỗi 403**
```
PUT http://localhost:3000/api/notifications/6/read
Headers: Authorization: Bearer <user_token>
Body: (để trống)
```
*(Giả sử notification_id = 6 thuộc user khác - user_id không null và không phải userId hiện tại)*

**Response mong đợi:**
```json
{
  "success": false,
  "message": "You do not have permission to access this notification"
}
```

**Test Case 5.5: Thiếu Authorization header - Phải lỗi 401**
```
PUT http://localhost:3000/api/notifications/1/read
Headers: (không có Authorization)
Body: (để trống)
```

**Response mong đợi:**
```json
{
  "success": false,
  "message": "Unauthorized" hoặc "Token not provided"
}
```

**🔍 Troubleshooting lỗi 403:**

**Cách API hoạt động với Token:**

1. **Token chứa thông tin user:**
   - Khi bạn login, server trả về JWT token
   - Token này chứa `user_id` của bạn (được mã hóa)
   - Mỗi request, server giải mã token để lấy `user_id`

2. **API kiểm tra quyền:**
   ```
   PUT /api/notifications/6/read
   Headers: Authorization: Bearer <token_của_user_A>
   ```
   
   Server sẽ:
   - Giải mã token → Lấy `user_id = A` (ví dụ: user_id = 1)
   - Tìm notification có `notification_id = 6`
   - Kiểm tra `notification.user_id`:
     - ✅ Nếu `notification.user_id = NULL` → Thông báo hệ thống → Cho phép
     - ✅ Nếu `notification.user_id = 1` (bằng user_id từ token) → Thông báo của chính mình → Cho phép
     - ❌ Nếu `notification.user_id = 2` (khác user_id từ token) → Thông báo của user khác → **403 Forbidden**

3. **Ví dụ cụ thể:**

   **Trường hợp 1: Thành công (Thông báo của chính mình)**
   ```sql
   -- Notification trong database
   notification_id = 6, user_id = 1
   
   -- Token của user_id = 1
   PUT /api/notifications/6/read
   Headers: Authorization: Bearer <token_user_1>
   
   → ✅ Thành công (vì notification.user_id = 1 = userId từ token)
   ```

   **Trường hợp 2: Thành công (Thông báo hệ thống)**
   ```sql
   -- Notification trong database
   notification_id = 5, user_id = NULL
   
   -- Token của bất kỳ user nào
   PUT /api/notifications/5/read
   Headers: Authorization: Bearer <token_bất_kỳ>
   
   → ✅ Thành công (vì notification.user_id = NULL → ai cũng có thể đánh dấu)
   ```

   **Trường hợp 3: Lỗi 403 (Thông báo của user khác)**
   ```sql
   -- Notification trong database
   notification_id = 6, user_id = 2
   
   -- Token của user_id = 1
   PUT /api/notifications/6/read
   Headers: Authorization: Bearer <token_user_1>
   
   → ❌ 403 Forbidden (vì notification.user_id = 2 ≠ 1 = userId từ token)
   ```

4. **Cách kiểm tra:**
   ```sql
   -- Xem notification thuộc về ai
   SELECT notification_id, user_id, title, status 
   FROM notifications 
   WHERE notification_id = 6;
   
   -- Xem user_id từ token của bạn (sau khi login)
   -- Token được decode sẽ có: { user_id: 1, ... }
   ```

5. **Giải pháp:**
   - ✅ Đảm bảo dùng đúng token của user đang sở hữu notification
   - ✅ Hoặc test với notification hệ thống (user_id = NULL)
   - ✅ Hoặc lấy danh sách notification của bạn trước:
     ```
     GET /api/notifications
     Headers: Authorization: Bearer <token_của_bạn>
     ```
     → Chọn một `notification_id` từ response → Dùng ID đó để test

---

#### **API 6: PUT /api/notifications/mark-all-read**
**Mục đích:** Đánh dấu tất cả thông báo đã đọc

**Postman:**
```
PUT http://localhost:3000/api/notifications/mark-all-read
```

**Headers:**
- `Authorization: Bearer <user_token>`

**Response mong đợi:**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

**✅ Kiểm tra:**
- Response `success: true`
- Trong database: Tất cả thông báo `unread` của user chuyển thành `read`

---

## 📊 Chức năng Lịch sử Sạc & Thanh toán

### **Chuẩn bị**

#### **Bước 1: Login User và lấy JWT Token**

**Postman:**
```
POST http://localhost:3000/api/auth/login
```

**Body (JSON):**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**✅ Copy `user_token` để dùng**

---

### **API: GET /api/bookings/my**
**Mục đích:** Lấy lịch sử sạc & thanh toán (kết hợp booking + payment + charging session)

**Postman:**
```
GET http://localhost:3000/api/bookings/my
```

**Headers:**
- `Authorization: Bearer <user_token>`

**Query Params (Optional):**
- `status`: string (`completed`, `cancelled`, hoặc không có = tất cả)
- `from_date`: string (VD: `2025-01-01`)
- `to_date`: string (VD: `2025-01-31`)
- `station_id`: int (VD: `1`)

**Test Case 1: Lấy tất cả lịch sử (không filter)**
```
GET http://localhost:3000/api/bookings/my
```

**Test Case 2: Filter theo status = completed**
```
GET http://localhost:3000/api/bookings/my?status=completed
```

**Test Case 3: Filter theo date range**
```
GET http://localhost:3000/api/bookings/my?from_date=2025-01-01&to_date=2025-01-31
```

**Test Case 4: Filter theo station_id**
```
GET http://localhost:3000/api/bookings/my?station_id=1
```

**Test Case 5: Kết hợp nhiều filters**
```
GET http://localhost:3000/api/bookings/my?status=completed&from_date=2025-01-01&to_date=2025-01-31&station_id=1
```

**Response mong đợi:**
```json
{
  "success": true,
  "data": [
    {
      "booking_id": 1,
      "station_name": "Trạm sạc Hải Châu",
      "station_address": "123 Đường ABC, Quận 1, TP.HCM",
      "vehicle_type": "oto_ccs",
      "vehicle_type_display": "Ô tô CCS",
      "start_time": "2025-01-15T14:05:00.000Z",
      "end_time": "2025-01-15T15:25:00.000Z",
      "actual_start": "2025-01-15T14:05:00.000Z",
      "actual_end": "2025-01-15T15:25:00.000Z",
      "charging_date": "15/1/2025",
      "duration": "1h 20m",
      "battery_range": "20% - 80%",
      "energy_consumed": 30.0,
      "total_cost": 84000.00,
      "payment_method": "qr",
      "payment_method_display": "QR",
      "payment_status": "success",
      "payment_status_display": "Thành công",
      "payment_date": "2025-01-15T15:30:00.000Z",
      "booking_status": "completed",
      "booking_status_display": "Hoàn thành",
      "created_at": "2025-01-15T10:00:00.000Z"
    },
    {
      "booking_id": 2,
      "station_name": "Trạm sạc Sơn Trà Premium",
      "station_address": "456 Đường XYZ, Quận 2, TP.HCM",
      "vehicle_type": "xe_may_ccs",
      "vehicle_type_display": "Xe máy CCS",
      "start_time": "2025-01-10T09:00:00.000Z",
      "end_time": "2025-01-10T09:45:00.000Z",
      "actual_start": "2025-01-10T09:00:00.000Z",
      "actual_end": "2025-01-10T09:45:00.000Z",
      "charging_date": "10/1/2025",
      "duration": "45m",
      "battery_range": "15% - 90%",
      "energy_consumed": 7.5,
      "total_cost": 24000.00,
      "payment_method": "bank",
      "payment_method_display": "BANK",
      "payment_status": "success",
      "payment_status_display": "Thành công",
      "payment_date": "2025-01-10T10:00:00.000Z",
      "booking_status": "completed",
      "booking_status_display": "Hoàn thành",
      "created_at": "2025-01-10T08:00:00.000Z"
    }
  ],
  "count": 2
}
```

**✅ Kiểm tra:**

**Thông tin cơ bản:**
- [ ] `booking_id`: Mã booking
- [ ] `station_name`: Tên trạm sạc
- [ ] `charging_date`: Ngày sạc (format: dd/MM/yyyy)
- [ ] `vehicle_type_display`: Loại xe (Xe máy USB/CCS, Ô tô CCS)

**Thông tin sạc:**
- [ ] `battery_range`: % pin (format: "20% - 80%")
- [ ] `duration`: Thời lượng (format: "1h 20m" hoặc "45m")
- [ ] `energy_consumed`: Năng lượng tiêu thụ (kWh)

**Thông tin thanh toán:**
- [ ] `payment_method_display`: Phương thức TT (QR/BANK)
- [ ] `payment_status_display`: Trạng thái TT (Thành công/Đang xử lý/Thất bại)
- [ ] `total_cost`: Tổng tiền

**Thông tin trạng thái:**
- [ ] `booking_status_display`: Trạng thái booking (Hoàn thành/Đang sạc/Chờ xác nhận/Đã hủy)

**Filters:**
- [ ] Filter `status` hoạt động
- [ ] Filter `from_date` và `to_date` hoạt động
- [ ] Filter `station_id` hoạt động
- [ ] Kết hợp nhiều filters hoạt động

**Sắp xếp:**
- [ ] Sắp xếp theo `created_at` DESC (mới nhất trước)

---

## ✅ Checklist Test Tổng hợp

### **Chức năng Thông báo:**
- [ ] **Admin gửi thông báo:**
  - [ ] Gửi cho tất cả (`send_to = 'all'`) thành công
  - [ ] Gửi cho User cụ thể (`send_to = 'selected'`) thành công
  - [ ] Gửi cho Manager (role_id = 2) thành công
  - [ ] Gửi cho Admin (role_id = 3) bị từ chối
  - [ ] Validation thiếu fields hoạt động
  - [ ] Validation invalid type hoạt động
- [ ] **Admin xem lịch sử:**
  - [ ] Lấy được lịch sử thông báo đã gửi
  - [ ] Group đúng (theo title, message, type, created_minute)
  - [ ] `send_to_type` và `recipient_count` đúng
- [ ] **User xem thông báo:**
  - [ ] Lấy được thông báo chưa đọc (unread) - Modal sau login
  - [ ] Response có `unread_count` để hiển thị số thông báo chưa đọc
  - [ ] Lấy được lịch sử thông báo (có pagination) - Trang "Thông báo"
  - [ ] Response có `unread_count` trong GET /api/notifications
  - [ ] Filter theo `type` hoạt động (system, promotion, payment, booking, all)
  - [ ] Filter theo `status` hoạt động (unread, read, all)
  - [ ] Pagination hoạt động đúng (page, limit)
  - [ ] Đánh dấu 1 thông báo đã đọc thành công
  - [ ] Đánh dấu tất cả thông báo đã đọc thành công
  - [ ] Không thể đánh dấu thông báo của user khác

### **Chức năng Lịch sử Sạc & Thanh toán:**
- [ ] **GET /api/bookings/my:**
  - [ ] Lấy được lịch sử booking với đầy đủ thông tin
  - [ ] Có thông tin sạc: battery_range (format "20% - 80%"), duration, energy_consumed
  - [ ] Có thông tin thanh toán: payment_method, payment_status, total_cost
  - [ ] Filter `status` hoạt động
  - [ ] Filter `from_date` và `to_date` hoạt động
  - [ ] Filter `station_id` hoạt động
  - [ ] Kết hợp nhiều filters hoạt động
  - [ ] Sắp xếp theo thời gian (mới nhất trước)
- [ ] **GET /api/bookings/:booking_id:**
  - [ ] Lấy được chi tiết booking hợp lệ
  - [ ] Response có 4 sections: station_info, charging_time, energy_info, payment_info
  - [ ] Format datetime đúng ("HH:mm:ss dd/MM/yyyy")
  - [ ] Có mã giảm giá (discount_code) nếu booking có promo
  - [ ] Trả về 404 khi booking không tồn tại
  - [ ] Trả về 404 khi booking thuộc user khác

---

### **API: GET /api/bookings/:booking_id**
**Mục đích:** Lấy chi tiết booking để hiển thị modal "Chi tiết đặt lịch" (khi click nút "Chi tiết" trong danh sách lịch sử)

**Postman:**
```
GET http://localhost:3000/api/bookings/1
```

**Headers:**
- `Authorization: Bearer <user_token>`

**Test Case 1: Lấy booking hợp lệ**
```
GET http://localhost:3000/api/bookings/1
```

**Response mong đợi:**
```json
{
  "success": true,
  "data": {
    "station_info": {
      "station_name": "Trạm sạc Hải Châu",
      "vehicle_type": "Ô tô CCS"
    },
    "charging_time": {
      "start": "14:05:00 15/1/2025",
      "end": "15:25:00 15/1/2025",
      "duration": "1h 20m"
    },
    "energy_info": {
      "start_battery": 20,
      "end_battery": 80,
      "energy_consumed": 30.0
    },
    "payment_info": {
      "method": "QR",
      "status": "Thành công",
      "status_raw": "success",
      "discount_code": "GIAM20",
      "total_amount": 84000.00
    }
  }
}
```

**✅ Kiểm tra:**

**Thông tin trạm:**
- [ ] `station_info.station_name`: Tên trạm sạc
- [ ] `station_info.vehicle_type`: Loại xe (đã translate: "Ô tô CCS", "Xe máy CCS", "Xe máy USB")

**Thời gian sạc:**
- [ ] `charging_time.start`: Bắt đầu (format: "HH:mm:ss dd/MM/yyyy")
- [ ] `charging_time.end`: Kết thúc (format: "HH:mm:ss dd/MM/yyyy")
- [ ] `charging_time.duration`: Thời lượng (format: "1h 20m" hoặc "45m")

**Năng lượng:**
- [ ] `energy_info.start_battery`: Pin ban đầu (%)
- [ ] `energy_info.end_battery`: Pin sau sạc (%)
- [ ] `energy_info.energy_consumed`: Năng lượng tiêu thụ (kWh)

**Thanh toán:**
- [ ] `payment_info.method`: Phương thức (QR/BANK)
- [ ] `payment_info.status`: Trạng thái (đã translate: Thành công/Đang xử lý/Thất bại)
- [ ] `payment_info.status_raw`: Trạng thái raw (success/pending/failed)
- [ ] `payment_info.discount_code`: Mã giảm giá (nếu có, có thể null)
- [ ] `payment_info.total_amount`: Tổng tiền

**Test Case 2: Booking không tồn tại - Phải lỗi**
```
GET http://localhost:3000/api/bookings/99999
```

**Response mong đợi:**
```json
{
  "success": false,
  "message": "Booking not found or you do not have permission to view this booking"
}
```

**Test Case 3: Booking của user khác - Phải lỗi**
```
GET http://localhost:3000/api/bookings/2
```
*(Giả sử booking_id = 2 thuộc user khác)*

**Response mong đợi:**
```json
{
  "success": false,
  "message": "Booking not found or you do not have permission to view this booking"
}
```

**Test Case 4: Booking không có charging session - Phải xử lý gracefully**
```
GET http://localhost:3000/api/bookings/3
```
*(Giả sử booking_id = 3 chưa có charging session)*

**✅ Kiểm tra:**
- Response vẫn trả về thành công
- `energy_info.start_battery`, `end_battery`, `energy_consumed` có thể là `null`
- `charging_time.start`, `end` fallback về `start_time`, `end_time` từ booking

---

## 🔍 Troubleshooting

### **Lỗi 1: "401 Unauthorized"**
**Nguyên nhân:** Token không hợp lệ hoặc đã hết hạn
**Giải pháp:** Login lại và lấy token mới

### **Lỗi 2: "403 Forbidden" (Admin APIs)**
**Nguyên nhân:** User không có quyền Admin (role_id !== 3)
**Giải pháp:** Đảm bảo đang login bằng tài khoản Admin

### **Lỗi 3: "Cannot send notification to Admin users"**
**Nguyên nhân:** Đang cố gửi thông báo cho user có role_id = 3
**Giải pháp:** Chỉ gửi cho User (role_id = 1) hoặc Manager (role_id = 2)

### **Lỗi 4: "You do not have permission to access this notification"**
**Nguyên nhân:** User đang cố đánh dấu thông báo của user khác
**Giải pháp:** Chỉ có thể đánh dấu thông báo của chính mình hoặc thông báo hệ thống

---

## 📊 Sample Data để Test

Nếu chưa có data, có thể insert sample data:

```sql
-- Insert sample notifications
INSERT INTO notifications (user_id, title, message, type, status, created_at) VALUES
(NULL, 'Thông báo bảo trì hệ thống', 'Hệ thống sẽ bảo trì từ 2h-4h sáng ngày 26/11/2024. Vui lòng hoàn tất các giao dịch trước thời gian này.', 'system', 'unread', NOW()),
(1, 'Khuyến mãi giảm 20% cuối tuần', 'Giảm 20% cho tất cả các booking trong tuần này (23-29/11). Áp dụng cho tất cả trạm sạc. Mã: WEEKEND20', 'promotion', 'unread', NOW() - INTERVAL 1 DAY),
(1, 'Thanh toán thành công', 'Thanh toán cho booking #1 đã thành công. Số tiền: 84,000₫', 'payment', 'read', NOW() - INTERVAL 2 DAY);

-- Insert sample bookings với charging sessions và payments
INSERT INTO bookings (user_id, station_id, vehicle_type, start_time, end_time, actual_start, actual_end, total_cost, status, created_at) VALUES
(1, 1, 'oto_ccs', '2025-01-15 14:05:00', '2025-01-15 15:25:00', '2025-01-15 14:05:00', '2025-01-15 15:25:00', 84000.00, 'completed', '2025-01-15 10:00:00'),
(1, 2, 'xe_may_ccs', '2025-01-10 09:00:00', '2025-01-10 09:45:00', '2025-01-10 09:00:00', '2025-01-10 09:45:00', 24000.00, 'completed', '2025-01-10 08:00:00');

INSERT INTO charging_sessions (booking_id, start_battery_percent, end_battery_percent, energy_consumed, actual_cost, started_at, ended_at) VALUES
(1, 20, 80, 30.000, 84000.00, '2025-01-15 14:05:00', '2025-01-15 15:25:00'),
(2, 15, 90, 7.500, 24000.00, '2025-01-10 09:00:00', '2025-01-10 09:45:00');

INSERT INTO payments (booking_id, user_id, amount, method, status, payment_date) VALUES
(1, 1, 84000.00, 'qr', 'success', '2025-01-15 15:30:00'),
(2, 1, 24000.00, 'bank', 'success', '2025-01-10 10:00:00');
```

---

## 🎯 Kết luận

**Tóm tắt các API:**

### **🔔 Chức năng Thông báo (6 APIs):**

#### **Admin APIs (2 APIs):**
1. **POST /api/admin/notifications**
   - Gửi thông báo cho tất cả user/manager hoặc user cụ thể
   - Validation: Không được gửi cho Admin (role_id = 3)
   - Types: system, promotion, payment, booking

2. **GET /api/admin/notifications/history**
   - Lịch sử thông báo đã gửi (Admin Panel)
   - Group theo title, message, type, created_minute
   - Hiển thị send_to_type (all/selected) và recipient_count

#### **User APIs (4 APIs):**
3. **GET /api/notifications/unread**
   - Thông báo chưa đọc (Modal sau login)
   - Tối đa 10 thông báo mới nhất
   - Bao gồm thông báo riêng và thông báo hệ thống

4. **GET /api/notifications**
   - Lịch sử thông báo (Trang "Thông báo")
   - Filters: type (system/promotion/payment/booking/all), status (unread/read/all)
   - Pagination: page, limit
   - Response có `unread_count` để hiển thị "Bạn có X thông báo chưa đọc"

5. **PUT /api/notifications/:notification_id/read**
   - Đánh dấu 1 thông báo đã đọc
   - Validation: Chỉ có thể đánh dấu thông báo của chính mình hoặc thông báo hệ thống

6. **PUT /api/notifications/mark-all-read**
   - Đánh dấu tất cả thông báo đã đọc
   - Áp dụng cho tất cả thông báo của user (riêng + hệ thống)

---

### **📊 Chức năng Lịch sử Sạc & Thanh toán (2 APIs):**

1. **GET /api/bookings/my**
   - Lịch sử sạc & thanh toán (Trang "Lịch sử sạc & thanh toán")
   - Kết hợp: booking + payment + charging session
   - Filters: status (completed/cancelled), from_date, to_date, station_id
   - Response format: battery_range ("20% - 80%"), duration ("1h 20m"), payment_method_display, etc.

2. **GET /api/bookings/:booking_id**
   - Chi tiết booking (Modal "Chi tiết đặt lịch")
   - 4 sections: station_info, charging_time, energy_info, payment_info
   - Format datetime: "HH:mm:ss dd/MM/yyyy"
   - Validation: Chỉ có thể xem booking của chính mình

---

## 📝 Test Checklist Tổng hợp

### **✅ Chức năng Thông báo:**

**Admin:**
- [ ] POST /api/admin/notifications - Gửi cho tất cả thành công
- [ ] POST /api/admin/notifications - Gửi cho user cụ thể thành công
- [ ] POST /api/admin/notifications - Gửi cho Manager (role_id = 2) thành công
- [ ] POST /api/admin/notifications - Gửi cho Admin (role_id = 3) bị từ chối
- [ ] POST /api/admin/notifications - Validation thiếu fields
- [ ] POST /api/admin/notifications - Validation invalid type
- [ ] GET /api/admin/notifications/history - Lấy lịch sử thành công
- [ ] GET /api/admin/notifications/history - Group đúng và có recipient_count

**User:**
- [ ] GET /api/notifications/unread - Lấy thông báo chưa đọc (Modal)
- [ ] GET /api/notifications - Lấy lịch sử với pagination
- [ ] GET /api/notifications - Response có unread_count
- [ ] GET /api/notifications - Filter type hoạt động
- [ ] GET /api/notifications - Filter status hoạt động
- [ ] PUT /api/notifications/:id/read - Đánh dấu 1 thông báo đã đọc
- [ ] PUT /api/notifications/:id/read - Không thể đánh dấu thông báo của user khác
- [ ] PUT /api/notifications/mark-all-read - Đánh dấu tất cả đã đọc

### **✅ Chức năng Lịch sử Sạc & Thanh toán:**

- [ ] GET /api/bookings/my - Lấy lịch sử với đầy đủ thông tin
- [ ] GET /api/bookings/my - Filter status hoạt động
- [ ] GET /api/bookings/my - Filter from_date/to_date hoạt động
- [ ] GET /api/bookings/my - Filter station_id hoạt động
- [ ] GET /api/bookings/my - Kết hợp nhiều filters
- [ ] GET /api/bookings/my - Format battery_range đúng ("20% - 80%")
- [ ] GET /api/bookings/:booking_id - Lấy chi tiết booking thành công
- [ ] GET /api/bookings/:booking_id - Response có 4 sections đầy đủ
- [ ] GET /api/bookings/:booking_id - Format datetime đúng
- [ ] GET /api/bookings/:booking_id - Có discount_code nếu có promo
- [ ] GET /api/bookings/:booking_id - Booking không tồn tại trả về 404
- [ ] GET /api/bookings/:booking_id - Booking của user khác trả về 404

---

**Thời gian test:** ~45-60 phút (test đầy đủ tất cả APIs)

