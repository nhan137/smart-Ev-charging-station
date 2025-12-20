# 🧪 Hướng dẫn Test Booking History API

## 📋 API Endpoint

**GET** `/api/bookings/my`

**Authentication:** Required (JWT Token)

**Query Parameters:**
- `status`: `'completed'` | `'cancelled'` (optional)
- `from_date`: date (optional) - format: `YYYY-MM-DD`
- `to_date`: date (optional) - format: `YYYY-MM-DD`
- `station_id`: number (optional)

---

## 🧪 TEST CASE 1: Lấy tất cả lịch sử booking

### **Bước 1: Đăng nhập để lấy JWT Token**

**API:** `POST /api/auth/login`

**Body:**
```json
{
  "email": "nhan@example.com",
  "password": "nhanoke123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "user_id": 6,
      "email": "nhan@example.com",
      "full_name": "Nguyễn Văn Nhân"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Copy token để dùng ở bước sau.**

---

### **Bước 2: Tạo dữ liệu test (nếu chưa có)**

**Chạy SQL để tạo booking test:**

```sql
-- Lưu ý: Thay user_id = 6 (user_id của bạn từ response login)
-- Kiểm tra user_id của bạn:
SELECT user_id, email FROM users WHERE email = 'nhan@example.com';

-- 1. Tạo booking đã hoàn thành với charging session và payment
INSERT INTO bookings (user_id, station_id, vehicle_type, start_time, end_time, actual_start, actual_end, status, total_cost, created_at)
VALUES (6, 1, 'oto_ccs', '2025-12-10 10:00:00', '2025-12-10 12:00:00', '2025-12-10 10:05:00', '2025-12-10 11:45:00', 'completed', 84000, '2025-12-10 09:00:00');

-- Lấy booking_id vừa tạo
SET @booking_id = LAST_INSERT_ID();

-- 2. Tạo charging session
INSERT INTO charging_sessions (booking_id, start_battery_percent, end_battery_percent, energy_consumed, actual_cost, started_at, ended_at)
VALUES (@booking_id, 20, 80, 30.000, 84000.00, '2025-12-10 10:05:00', '2025-12-10 11:45:00');

-- 3. Tạo payment
INSERT INTO payments (booking_id, user_id, amount, method, status, payment_date)
VALUES (@booking_id, 6, 84000.00, 'qr', 'success', '2025-12-10 11:50:00');

-- 4. Tạo thêm 1 booking khác (chưa có charging session và payment)
INSERT INTO bookings (user_id, station_id, vehicle_type, start_time, end_time, status, total_cost, created_at)
VALUES (6, 2, 'xe_may_ccs', '2025-12-09 14:00:00', '2025-12-09 16:00:00', 'pending', 50000, '2025-12-09 13:00:00');
```

---

### **Bước 3: Gọi API lấy tất cả lịch sử**

**API:** `GET /api/bookings/my`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response mong đợi:**
```json
{
  "success": true,
  "data": [
    {
      "booking_id": 1,
      "station_name": "Trạm sạc Hải Châu",
      "station_address": "123 Nguyễn Văn Linh",
      "vehicle_type": "oto_ccs",
      "vehicle_type_display": "Ô tô CCS",
      "start_time": "2025-12-10T10:00:00.000Z",
      "end_time": "2025-12-10T12:00:00.000Z",
      "actual_start": "2025-12-10T10:05:00.000Z",
      "actual_end": "2025-12-10T11:45:00.000Z",
      "charging_date": "10/12/2025",
      "duration": "1h 40m",
      "battery_range": "20% → 80%",
      "energy_consumed": 30,
      "total_cost": 84000,
      "payment_method": "qr",
      "payment_method_display": "QR",
      "payment_status": "success",
      "payment_status_display": "Thành công",
      "payment_date": "2025-12-10T11:50:00.000Z",
      "booking_status": "completed",
      "booking_status_display": "Hoàn thành",
      "created_at": "2025-12-10T09:00:00.000Z"
    },
    {
      "booking_id": 2,
      "station_name": "Trạm sạc Sơn Trà",
      "vehicle_type": "xe_may_ccs",
      "vehicle_type_display": "Xe máy CCS",
      "booking_status": "pending",
      "booking_status_display": "Chờ xác nhận",
      "duration": null,
      "battery_range": null,
      "energy_consumed": null,
      "total_cost": 50000,
      "payment_method": null,
      "payment_status": null
    }
  ],
  "count": 2
}
```

---

## 🧪 TEST CASE 2: Lọc theo status = 'completed'

**API:** `GET /api/bookings/my?status=completed`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response mong đợi:**
- Chỉ trả về các booking có `status = 'completed'`
- Có đầy đủ thông tin: `duration`, `battery_range`, `energy_consumed`, `payment_method`, `payment_status`

---

## 🧪 TEST CASE 3: Lọc theo khoảng thời gian

**API:** `GET /api/bookings/my?from_date=2025-12-10&to_date=2025-12-10`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response mong đợi:**
- Chỉ trả về các booking có `start_time` trong khoảng 2025-12-10

---

## 🧪 TEST CASE 4: Lọc theo station_id

**API:** `GET /api/bookings/my?station_id=1`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response mong đợi:**
- Chỉ trả về các booking tại `station_id = 1`

---

## 🧪 TEST CASE 5: Kết hợp nhiều filter

**API:** `GET /api/bookings/my?status=completed&from_date=2025-12-01&to_date=2025-12-31&station_id=1`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response mong đợi:**
- Trả về các booking:
  - `status = 'completed'`
  - `start_time` từ 2025-12-01 đến 2025-12-31
  - `station_id = 1`

---

## ✅ Checklist Test

### **Test Case 1: Lấy tất cả**
- [ ] Đăng nhập lấy JWT token
- [ ] Tạo dữ liệu test (booking, charging_session, payment)
- [ ] Gọi API `GET /api/bookings/my`
- [ ] Kiểm tra response có `success: true`
- [ ] Kiểm tra `data` là array
- [ ] Kiểm tra có đủ các trường: `booking_id`, `station_name`, `vehicle_type_display`, `duration`, `battery_range`, `energy_consumed`, `total_cost`, `payment_method_display`, `payment_status_display`, `booking_status_display`
- [ ] Kiểm tra `count` = số lượng booking

### **Test Case 2: Lọc theo status**
- [ ] Gọi API với `?status=completed`
- [ ] Kiểm tra tất cả booking có `booking_status = 'completed'`
- [ ] Gọi API với `?status=cancelled`
- [ ] Kiểm tra tất cả booking có `booking_status = 'cancelled'`

### **Test Case 3: Lọc theo thời gian**
- [ ] Gọi API với `?from_date=2025-12-10&to_date=2025-12-10`
- [ ] Kiểm tra tất cả booking có `start_time` trong khoảng này

### **Test Case 4: Lọc theo station_id**
- [ ] Gọi API với `?station_id=1`
- [ ] Kiểm tra tất cả booking có `station_id = 1`

### **Test Case 5: Kết hợp filter**
- [ ] Gọi API với nhiều filter cùng lúc
- [ ] Kiểm tra kết quả đúng với tất cả điều kiện

---

## 🔍 Kiểm tra chi tiết trong Database

### **Query để xem dữ liệu:**

```sql
SELECT 
  b.booking_id,
  b.user_id,
  b.status as booking_status,
  s.station_name,
  cs.start_battery_percent,
  cs.end_battery_percent,
  cs.energy_consumed,
  cs.actual_cost,
  p.method as payment_method,
  p.status as payment_status,
  b.actual_start,
  b.actual_end,
  TIMESTAMPDIFF(MINUTE, b.actual_start, b.actual_end) as duration_minutes
FROM bookings b
LEFT JOIN stations s ON b.station_id = s.station_id
LEFT JOIN charging_sessions cs ON b.booking_id = cs.booking_id
LEFT JOIN payments p ON b.booking_id = p.booking_id
WHERE b.user_id = 6  -- Thay bằng user_id của bạn
ORDER BY b.created_at DESC;
```

---

## 🐛 Troubleshooting

### **Vấn đề: Response trả về mảng rỗng**

**Nguyên nhân:**
- User chưa có booking nào
- JWT token không đúng user_id

**Giải pháp:**
1. Kiểm tra user_id trong JWT token (user_id = 6 cho tài khoản nhan@example.com)
2. Tạo booking test bằng SQL với `user_id = 6`
3. Kiểm tra `bookings.user_id` có khớp với `req.user.user_id` không

### **Vấn đề: Thiếu thông tin charging_session hoặc payment**

**Nguyên nhân:**
- Booking chưa có charging_session hoặc payment
- LEFT JOIN không lấy được dữ liệu

**Giải pháp:**
- Kiểm tra `charging_sessions.booking_id` và `payments.booking_id` có khớp không
- Kiểm tra associations trong models

### **Vấn đề: Filter không hoạt động**

**Nguyên nhân:**
- Query parameter không đúng format
- Logic filter có vấn đề

**Giải pháp:**
- Kiểm tra format date: `YYYY-MM-DD`
- Kiểm tra `status` chỉ nhận `'completed'` hoặc `'cancelled'`
- Kiểm tra `station_id` phải là number

---

## 📝 Lưu ý

- **JWT Token:** Phải gửi trong header `Authorization: Bearer <token>`
- **User ID:** API chỉ trả về booking của user đang đăng nhập
- **LEFT JOIN:** `charging_sessions` và `payments` dùng LEFT JOIN nên có thể NULL
- **Format:** `duration` và `battery_range` được format trong code, không phải từ database

---

## ✅ Kết quả mong đợi

Sau khi test thành công:

1. ✅ API trả về đúng danh sách booking của user
2. ✅ Có đầy đủ thông tin: station, charging session, payment
3. ✅ Filter hoạt động đúng: status, date range, station_id
4. ✅ Format đúng: duration, battery_range, vehicle_type_display
5. ✅ Sắp xếp đúng: mới nhất trước (created_at DESC)

Chúc bạn test thành công! 🎉

