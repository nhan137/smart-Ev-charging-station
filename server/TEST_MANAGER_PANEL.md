# 🧪 Test Guide: Manager Panel APIs

## 📋 Mục lục
1. [Chuẩn bị](#chuẩn-bị)
2. [Station Management APIs](#station-management-apis)
3. [Booking Management APIs](#booking-management-apis)

---

## 🔐 Chuẩn bị

### **Bước 1: Chạy SQL để thêm checkin_code**

Trước khi test, cần chạy SQL script để thêm cột `checkin_code`:

```sql
-- File: server/ADD_CHECKIN_CODE.sql
ALTER TABLE `bookings`
ADD COLUMN `checkin_code` VARCHAR(6) DEFAULT NULL COMMENT 'Mã check-in 6 ký tự (Uppercase Letters + Numbers)' 
AFTER `status`;

ALTER TABLE `bookings`
ADD INDEX `idx_checkin_code` (`checkin_code`);
```

---

### **Bước 2: Login Manager và lấy JWT Token**

**Postman:**
```
POST http://localhost:3000/api/auth/manager/login
```

**Body (JSON):**
```json
{
  "email": "quanli@example.com",
  "password": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Manager login successful",
  "data": {
    "user": {
      "user_id": 5,
      "full_name": "Quản Lý",
      "email": "quanli@example.com",
      "role_id": 2,
      "status": "active"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**✅ Copy `manager_token` để dùng cho tất cả Manager APIs**

**⚠️ Lưu ý:** 
- Manager phải có `role_id = 2`
- Manager phải có `status = 'active'`
- Manager phải được gán vào ít nhất 1 trạm sạc (`manager_id` trong bảng `stations`)

---

### **Bước 3: Tạo sample data (nếu chưa có)**

```sql
-- Tạo Manager account (nếu chưa có)
INSERT INTO users (full_name, email, password, phone, role_id, status) VALUES
('Quản Lý', 'quanli@example.com', '$2a$10$...', '0901234567', 2, 'active');

-- Gán manager cho trạm sạc
UPDATE stations SET manager_id = 5 WHERE station_id IN (1, 2);

-- Tạo sample bookings để test
INSERT INTO bookings (user_id, station_id, vehicle_type, start_time, end_time, status, total_cost) VALUES
(1, 1, 'oto_ccs', '2025-01-20 14:00:00', '2025-01-20 16:00:00', 'pending', 105000.00),
(2, 1, 'xe_may_ccs', '2025-01-21 09:00:00', '2025-01-21 10:00:00', 'pending', 32000.00),
(3, 2, 'xe_may_usb', '2025-01-19 16:00:00', '2025-01-19 17:00:00', 'pending', 15000.00);
```

---

## 🏢 Station Management APIs

### **API 1: GET /api/manager/stations**
**Mục đích:** Lấy danh sách trạm sạc mà manager quản lý (Dashboard Table)

**Postman:**
```
GET http://localhost:3000/api/manager/stations
```

**Headers:**
- `Authorization: Bearer <manager_token>`

**Query Params (Optional):**
- `status`: string (`active`, `maintenance`, `inactive`)

**Test Case 1.1: Lấy tất cả trạm (không filter)**
```
GET http://localhost:3000/api/manager/stations
```

**Response mong đợi:**
```json
{
  "success": true,
  "data": [
    {
      "station_id": 1,
      "station_name": "Trạm sạc Hải Châu",
      "address": "123 Trần Phú, Hải Châu, Đà Nẵng - Gần Cầu Rồng và Bãi biển Mỹ Khê",
      "price_per_kwh": "3500.00",
      "total_slots": 6,
      "available_slots": 3,
      "status": "active"
    },
    {
      "station_id": 2,
      "station_name": "Trạm sạc Sơn Trà Premium",
      "address": "456 Võ Nguyên Giáp, Sơn Trà, Đà Nẵng - Khu vực Bán đảo Sơn Trà",
      "price_per_kwh": "3200.00",
      "total_slots": 8,
      "available_slots": 5,
      "status": "active"
    }
  ],
  "count": 2
}
```

**✅ Kiểm tra:**
- Response có mảng `data` chứa các trạm sạc
- Chỉ trả về trạm có `manager_id = managerId` từ token
- Mỗi item có: `station_id`, `station_name`, `address`, `price_per_kwh`, `total_slots`, `available_slots`, `status`

---

**Test Case 1.2: Filter theo status = active**
```
GET http://localhost:3000/api/manager/stations?status=active
```

**✅ Kiểm tra:**
- Chỉ trả về trạm có `status = 'active'`

---

**Test Case 1.3: Filter theo status = maintenance**
```
GET http://localhost:3000/api/manager/stations?status=maintenance
```

**✅ Kiểm tra:**
- Chỉ trả về trạm có `status = 'maintenance'`

---

**Test Case 1.4: Manager không có trạm nào**
```
GET http://localhost:3000/api/manager/stations
```
*(Giả sử manager này chưa được gán trạm nào)*

**Response mong đợi:**
```json
{
  "success": true,
  "data": [],
  "count": 0
}
```

---

### **API 2: GET /api/manager/stations/:id**
**Mục đích:** Lấy chi tiết trạm sạc và đánh giá (Station Detail View)

**Postman:**
```
GET http://localhost:3000/api/manager/stations/1
```

**Headers:**
- `Authorization: Bearer <manager_token>`

**Test Case 2.1: Lấy chi tiết trạm hợp lệ**
```
GET http://localhost:3000/api/manager/stations/1
```

**Response mong đợi:**
```json
{
  "success": true,
  "data": {
    "station_id": 1,
    "station_name": "Trạm sạc Hải Châu",
    "address": "123 Trần Phú, Hải Châu, Đà Nẵng - Gần Cầu Rồng và Bãi biển Mỹ Khê",
    "latitude": "16.061400",
    "longitude": "108.226700",
    "price_per_kwh": "3500.00",
    "station_type": "ca_hai",
    "total_slots": 6,
    "available_slots": 3,
    "charging_power": "50.00",
    "connector_types": "Type 2, CCS2, CHAdeMO",
    "opening_hours": "24/7",
    "contact_phone": "0901234567",
    "status": "active",
    "manager_id": 5,
    "average_rating": "4.5",
    "total_reviews": 2,
    "recent_reviews": [
      {
        "user_name": "Nguyễn Văn A",
        "rating": 5,
        "comment": "Trạm sạc rất tốt, nhanh và tiện lợi!",
        "created_at": "2025-12-11T00:00:00.000Z"
      },
      {
        "user_name": "Nguyễn Văn A",
        "rating": 4,
        "comment": "Tốt, nhưng đôi khi hơi đông",
        "created_at": "2025-12-09T00:00:00.000Z"
      }
    ]
  }
}
```

**✅ Kiểm tra:**
- Response có đầy đủ thông tin trạm
- `average_rating`: Điểm trung bình (có thể null nếu chưa có đánh giá)
- `total_reviews`: Tổng số đánh giá
- `recent_reviews`: 5 đánh giá mới nhất (có `user_name`, `rating`, `comment`, `created_at`)

---

**Test Case 2.2: Trạm không tồn tại - Phải lỗi 404**
```
GET http://localhost:3000/api/manager/stations/99999
```

**Response mong đợi:**
```json
{
  "success": false,
  "message": "Station not found"
}
```

---

**Test Case 2.3: Trạm không thuộc về manager - Phải lỗi 403**
```
GET http://localhost:3000/api/manager/stations/3
```
*(Giả sử station_id = 3 thuộc manager khác)*

**Response mong đợi:**
```json
{
  "success": false,
  "message": "You do not have permission to access this station"
}
```

---

### **API 3: PUT /api/manager/stations/:id/status**
**Mục đích:** Cập nhật trạng thái trạm sạc (Quick Action)

**Postman:**
```
PUT http://localhost:3000/api/manager/stations/1/status
```

**Headers:**
- `Authorization: Bearer <manager_token>`
- `Content-Type: application/json`

**Test Case 3.1: Cập nhật status = maintenance**
```json
{
  "status": "maintenance"
}
```

**Response mong đợi:**
```json
{
  "success": true,
  "message": "Station status updated successfully",
  "data": {
    "station_id": 1,
    "station_name": "Trạm sạc Hải Châu",
    "status": "maintenance"
  }
}
```

**✅ Kiểm tra:**
- Response `success: true`
- Trong database: `stations` table, `status = 'maintenance'`

---

**Test Case 3.2: Cập nhật status = active**
```json
{
  "status": "active"
}
```

**✅ Kiểm tra:**
- Status được cập nhật thành công

---

**Test Case 3.3: Cập nhật status = inactive**
```json
{
  "status": "inactive"
}
```

**✅ Kiểm tra:**
- Status được cập nhật thành công

---

**Test Case 3.4: Invalid status - Phải lỗi 400**
```json
{
  "status": "invalid_status"
}
```

**Response mong đợi:**
```json
{
  "success": false,
  "message": "Invalid status. Must be: active, maintenance, or inactive"
}
```

---

**Test Case 3.5: Trạm không thuộc về manager - Phải lỗi 403**
```
PUT http://localhost:3000/api/manager/stations/3/status
Body: { "status": "maintenance" }
```
*(Giả sử station_id = 3 thuộc manager khác)*

**Response mong đợi:**
```json
{
  "success": false,
  "message": "You do not have permission to update this station"
}
```

---

## 📅 Booking Management APIs

### **API 4: GET /api/manager/stations/:id/bookings**
**Mục đích:** Lấy danh sách booking của trạm sạc (Booking Management View)

**Postman:**
```
GET http://localhost:3000/api/manager/stations/1/bookings
```

**Headers:**
- `Authorization: Bearer <manager_token>`

**Query Params (Optional):**
- `status`: string (`pending`, `confirmed`, `charging`, `completed`, `cancelled`)
- `start_date`: string (VD: `2025-01-01`)
- `end_date`: string (VD: `2025-01-31`)

**Test Case 4.1: Lấy tất cả booking (không filter)**
```
GET http://localhost:3000/api/manager/stations/1/bookings
```

**Response mong đợi:**
```json
{
  "success": true,
  "data": [
    {
      "booking_id": 1,
      "customer_name": "Nguyễn Văn A",
      "customer_phone": "0901234567",
      "vehicle_type": "oto_ccs",
      "start_time": "2025-01-20T14:00:00.000Z",
      "end_time": "2025-01-20T16:00:00.000Z",
      "status": "pending",
      "checkin_code": null,
      "total_cost": 105000.00,
      "created_at": "2025-01-19T10:00:00.000Z"
    },
    {
      "booking_id": 2,
      "customer_name": "Trần Thị B",
      "customer_phone": "0901234568",
      "vehicle_type": "xe_may_ccs",
      "start_time": "2025-01-21T09:00:00.000Z",
      "end_time": "2025-01-21T10:00:00.000Z",
      "status": "pending",
      "checkin_code": null,
      "total_cost": 32000.00,
      "created_at": "2025-01-20T08:00:00.000Z"
    }
  ],
  "count": 2
}
```

**✅ Kiểm tra:**
- Response có mảng `data` chứa các booking
- Mỗi booking có: `booking_id`, `customer_name`, `customer_phone`, `vehicle_type`, `start_time`, `end_time`, `status`, `checkin_code`, `total_cost`
- Sắp xếp theo `created_at` DESC (mới nhất trước)

---

**Test Case 4.2: Filter theo status = pending**
```
GET http://localhost:3000/api/manager/stations/1/bookings?status=pending
```

**✅ Kiểm tra:**
- Chỉ trả về booking có `status = 'pending'`

---

**Test Case 4.3: Filter theo date range**
```
GET http://localhost:3000/api/manager/stations/1/bookings?start_date=2025-01-01&end_date=2025-01-31
```

**✅ Kiểm tra:**
- Chỉ trả về booking có `start_time` trong khoảng từ `start_date` đến `end_date`

---

**Test Case 4.4: Kết hợp filters**
```
GET http://localhost:3000/api/manager/stations/1/bookings?status=pending&start_date=2025-01-01&end_date=2025-01-31
```

**✅ Kiểm tra:**
- Filters hoạt động kết hợp đúng

---

**Test Case 4.5: Trạm không thuộc về manager - Phải lỗi 403**
```
GET http://localhost:3000/api/manager/stations/3/bookings
```
*(Giả sử station_id = 3 thuộc manager khác)*

**Response mong đợi:**
```json
{
  "success": false,
  "message": "You do not have permission to access this station"
}
```

---

### **API 5: PUT /api/bookings/:booking_id/confirm**
**Mục đích:** Manager xác nhận booking và tạo mã check-in

**Postman:**
```
PUT http://localhost:3000/api/bookings/1/confirm
```

**Headers:**
- `Authorization: Bearer <manager_token>`
- `Content-Type: application/json`

**Body:**
- **KHÔNG CẦN** - API này không cần body

**Test Case 5.1: Xác nhận booking pending thành công**
```
PUT http://localhost:3000/api/bookings/1/confirm
```

**Response mong đợi:**
```json
{
  "success": true,
  "message": "Booking confirmed successfully",
  "data": {
    "booking_id": 1,
    "status": "confirmed",
    "checkin_code": "X9A2B1",
    "station_name": "Trạm sạc Hải Châu"
  }
}
```

**✅ Kiểm tra:**
- Response `success: true`
- `checkin_code`: Mã 6 ký tự (Uppercase Letters + Numbers)
- Trong database:
  - `bookings` table: `status = 'confirmed'`, `checkin_code = 'X9A2B1'`
  - `notifications` table: Có 1 record mới với:
    - `user_id` = user_id của booking
    - `title` = "Đặt lịch thành công"
    - `message` = "Trạm [Station Name] đã xác nhận. Mã check-in: [CODE]. Vui lòng đưa mã này khi đến sạc."
    - `type` = "booking"
    - `status` = "unread"

---

**Test Case 5.2: Booking không phải pending - Phải lỗi 400**
```
PUT http://localhost:3000/api/bookings/2/confirm
```
*(Giả sử booking_id = 2 có status = 'confirmed' hoặc 'completed')*

**Response mong đợi:**
```json
{
  "success": false,
  "message": "Cannot confirm booking. Current status is 'confirmed'. Only 'pending' bookings can be confirmed."
}
```

---

**Test Case 5.3: Booking không tồn tại - Phải lỗi 404**
```
PUT http://localhost:3000/api/bookings/99999/confirm
```

**Response mong đợi:**
```json
{
  "success": false,
  "message": "Booking not found"
}
```

---

**Test Case 5.4: Booking không thuộc trạm của manager - Phải lỗi 403**
```
PUT http://localhost:3000/api/bookings/3/confirm
```
*(Giả sử booking_id = 3 thuộc trạm của manager khác)*

**Response mong đợi:**
```json
{
  "success": false,
  "message": "You do not have permission to confirm this booking"
}
```

---

**Test Case 5.5: Kiểm tra mã check-in là unique**
```
PUT http://localhost:3000/api/bookings/1/confirm
PUT http://localhost:3000/api/bookings/2/confirm
PUT http://localhost:3000/api/bookings/3/confirm
```

**✅ Kiểm tra:**
- Mỗi booking có mã check-in khác nhau
- Mã check-in format: 6 ký tự, Uppercase Letters + Numbers

---

### **API 6: PUT /api/bookings/:booking_id/cancel**
**Mục đích:** Manager hủy booking

**Postman:**
```
PUT http://localhost:3000/api/bookings/1/cancel
```

**Headers:**
- `Authorization: Bearer <manager_token>`
- `Content-Type: application/json`

**Body:**
- **KHÔNG CẦN** - API này không cần body

**Test Case 6.1: Hủy booking pending thành công**
```
PUT http://localhost:3000/api/bookings/1/cancel
```

**Response mong đợi:**
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "data": {
    "booking_id": 1,
    "status": "cancelled",
    "station_name": "Trạm sạc Hải Châu"
  }
}
```

**✅ Kiểm tra:**
- Response `success: true`
- Trong database:
  - `bookings` table: `status = 'cancelled'`
  - `stations` table: `available_slots` tăng lên 1 (nếu booking là pending/confirmed/charging)
  - `notifications` table: Có 1 record mới với:
    - `user_id` = user_id của booking
    - `title` = "Lịch đặt đã bị hủy"
    - `message` = "Lịch đặt tại trạm [Station Name] đã bị hủy bởi quản lý."
    - `type` = "booking"
    - `status` = "unread"

---

**Test Case 6.2: Hủy booking completed - Phải lỗi 400**
```
PUT http://localhost:3000/api/bookings/2/cancel
```
*(Giả sử booking_id = 2 có status = 'completed')*

**Response mong đợi:**
```json
{
  "success": false,
  "message": "Cannot cancel a completed booking"
}
```

---

**Test Case 6.3: Hủy booking đã cancelled - Phải lỗi 400**
```
PUT http://localhost:3000/api/bookings/3/cancel
```
*(Giả sử booking_id = 3 có status = 'cancelled')*

**Response mong đợi:**
```json
{
  "success": false,
  "message": "Booking is already cancelled"
}
```

---

**Test Case 6.4: Kiểm tra restore slot**
```
-- Trước khi cancel
SELECT available_slots FROM stations WHERE station_id = 1;
-- Giả sử: available_slots = 3

PUT http://localhost:3000/api/bookings/1/cancel
-- Booking có status = 'pending'

-- Sau khi cancel
SELECT available_slots FROM stations WHERE station_id = 1;
-- Phải là: available_slots = 4
```

**✅ Kiểm tra:**
- `available_slots` tăng lên 1
- `available_slots` không vượt quá `total_slots`

---

**Test Case 6.5: Booking không thuộc trạm của manager - Phải lỗi 403**
```
PUT http://localhost:3000/api/bookings/3/cancel
```
*(Giả sử booking_id = 3 thuộc trạm của manager khác)*

**Response mong đợi:**
```json
{
  "success": false,
  "message": "You do not have permission to cancel this booking"
}
```

---

## ✅ Checklist Test Tổng hợp

### **Station Management:**
- [ ] GET /api/manager/stations - Lấy danh sách trạm thành công
- [ ] GET /api/manager/stations - Filter theo status hoạt động
- [ ] GET /api/manager/stations/:id - Lấy chi tiết trạm thành công
- [ ] GET /api/manager/stations/:id - Có average_rating và total_reviews
- [ ] GET /api/manager/stations/:id - Có recent_reviews (5 mới nhất)
- [ ] GET /api/manager/stations/:id - Trạm không thuộc manager trả về 403
- [ ] PUT /api/manager/stations/:id/status - Cập nhật status thành công
- [ ] PUT /api/manager/stations/:id/status - Invalid status trả về 400
- [ ] PUT /api/manager/stations/:id/status - Trạm không thuộc manager trả về 403

### **Booking Management:**
- [ ] GET /api/manager/stations/:id/bookings - Lấy danh sách booking thành công
- [ ] GET /api/manager/stations/:id/bookings - Filter theo status hoạt động
- [ ] GET /api/manager/stations/:id/bookings - Filter theo date range hoạt động
- [ ] GET /api/manager/stations/:id/bookings - Kết hợp filters hoạt động
- [ ] PUT /api/bookings/:booking_id/confirm - Xác nhận booking thành công
- [ ] PUT /api/bookings/:booking_id/confirm - Tạo mã check-in 6 ký tự
- [ ] PUT /api/bookings/:booking_id/confirm - Tạo notification cho user
- [ ] PUT /api/bookings/:booking_id/confirm - Booking không pending trả về 400
- [ ] PUT /api/bookings/:booking_id/confirm - Booking không thuộc manager trả về 403
- [ ] PUT /api/bookings/:booking_id/cancel - Hủy booking thành công
- [ ] PUT /api/bookings/:booking_id/cancel - Restore slot (available_slots + 1)
- [ ] PUT /api/bookings/:booking_id/cancel - Tạo notification cho user
- [ ] PUT /api/bookings/:booking_id/cancel - Booking completed trả về 400
- [ ] PUT /api/bookings/:booking_id/cancel - Booking không thuộc manager trả về 403

---

## 🔍 Troubleshooting

### **Lỗi 1: "401 Unauthorized"**
**Nguyên nhân:** Token không hợp lệ hoặc đã hết hạn
**Giải pháp:** Login lại và lấy token mới

### **Lỗi 2: "403 Forbidden" - "Tài khoản không có quyền Manager"**
**Nguyên nhân:** User không có `role_id = 2`
**Giải pháp:** Đảm bảo đang login bằng tài khoản Manager

### **Lỗi 3: "403 Forbidden" - "You do not have permission to access this station"**
**Nguyên nhân:** Manager không sở hữu trạm này (`manager_id` không khớp)
**Giải pháp:** 
- Kiểm tra `manager_id` trong bảng `stations`
- Đảm bảo manager được gán vào trạm: `UPDATE stations SET manager_id = ? WHERE station_id = ?`

### **Lỗi 4: "Cannot confirm booking. Current status is 'confirmed'"**
**Nguyên nhân:** Booking đã được xác nhận hoặc có status khác 'pending'
**Giải pháp:** Chỉ có thể confirm booking có `status = 'pending'`

### **Lỗi 5: "Failed to generate unique check-in code"**
**Nguyên nhân:** Không thể tạo mã check-in unique sau 10 lần thử
**Giải pháp:** Rất hiếm, có thể do database có quá nhiều mã. Thử lại hoặc tăng số lần thử trong code

### **Lỗi 6: "Cannot cancel a completed booking"**
**Nguyên nhân:** Booking đã hoàn thành (`status = 'completed'`)
**Giải pháp:** Không thể hủy booking đã hoàn thành

---

## 📊 Sample Data để Test

```sql
-- 1. Tạo Manager account
INSERT INTO users (full_name, email, password, phone, role_id, status) VALUES
('Quản Lý', 'quanli@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '0901234567', 2, 'active');

-- 2. Gán manager cho trạm sạc
UPDATE stations SET manager_id = 5 WHERE station_id IN (1, 2);

-- 3. Tạo sample bookings
INSERT INTO bookings (user_id, station_id, vehicle_type, start_time, end_time, status, total_cost, created_at) VALUES
(1, 1, 'oto_ccs', '2025-01-20 14:00:00', '2025-01-20 16:00:00', 'pending', 105000.00, NOW()),
(2, 1, 'xe_may_ccs', '2025-01-21 09:00:00', '2025-01-21 10:00:00', 'pending', 32000.00, NOW()),
(3, 2, 'xe_may_usb', '2025-01-19 16:00:00', '2025-01-19 17:00:00', 'pending', 15000.00, NOW()),
(1, 1, 'oto_ccs', '2025-01-15 10:00:00', '2025-01-15 12:00:00', 'completed', 84000.00, NOW() - INTERVAL 5 DAY);

-- 4. Tạo sample feedbacks để test API 2
INSERT INTO feedbacks (user_id, station_id, booking_id, rating, comment, created_at) VALUES
(1, 1, 4, 5, 'Trạm sạc rất tốt, nhanh và tiện lợi!', NOW() - INTERVAL 2 DAY),
(1, 1, 4, 4, 'Tốt, nhưng đôi khi hơi đông', NOW() - INTERVAL 4 DAY);
```

---

## 🎯 Kết luận

**Tóm tắt các API:**

### **Station Management (3 APIs):**
1. **GET /api/manager/stations** - Danh sách trạm của manager
2. **GET /api/manager/stations/:id** - Chi tiết trạm + đánh giá
3. **PUT /api/manager/stations/:id/status** - Cập nhật trạng thái trạm

### **Booking Management (3 APIs):**
1. **GET /api/manager/stations/:id/bookings** - Danh sách booking của trạm
2. **PUT /api/bookings/:booking_id/confirm** - Xác nhận booking (tạo mã check-in)
3. **PUT /api/bookings/:booking_id/cancel** - Hủy booking (restore slot)

**Thời gian test:** ~30-40 phút

**Lưu ý quan trọng:**
- Tất cả APIs đều yêu cầu `Authorization: Bearer <manager_token>`
- Manager phải có `role_id = 2` và `status = 'active'`
- Manager phải được gán vào trạm (`manager_id` trong bảng `stations`)
- Mã check-in được tạo tự động khi confirm booking (6 ký tự: A-Z, 0-9)
- Notification được tạo tự động khi confirm/cancel booking

