# API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
Tất cả các endpoint (trừ login/register) cần header:
```
Authorization: Bearer <token>
```

---

## 1. Authentication APIs

### POST /auth/login
Đăng nhập

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "user_id": 1,
    "email": "user@example.com",
    "full_name": "Nguyen Van A",
    "phone": "0123456789",
    "role_id": 1
  }
}
```

### POST /auth/register
Đăng ký tài khoản mới

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "Nguyen Van A",
  "phone": "0123456789",
  "role_id": 1
}
```

**Response:** Giống login

---

## 2. Station APIs

### GET /stations
Lấy danh sách trạm sạc

**Query Parameters:**
- `station_type` (optional): xe_may | oto | ca_hai
- `min_price` (optional): number
- `max_price` (optional): number
- `distance` (optional): number (km)
- `lat` (optional): latitude
- `lng` (optional): longitude

**Response:**
```json
[
  {
    "station_id": 1,
    "station_name": "Trạm sạc ABC",
    "address": "123 Đường XYZ",
    "latitude": 10.762622,
    "longitude": 106.660172,
    "station_type": "ca_hai",
    "price_per_kwh": 5000,
    "charging_power": 50,
    "connector_types": "USB-C, CCS",
    "opening_hours": "24/7",
    "contact_phone": "0123456789",
    "available_slots": 5,
    "total_slots": 10,
    "status": "active",
    "avatar_url": "https://example.com/image.jpg"
  }
]
```

### GET /stations/:id
Lấy chi tiết trạm

**Response:** Object giống trên

### GET /stations/:id/feedbacks
Lấy đánh giá của trạm

**Response:**
```json
[
  {
    "feedback_id": 1,
    "user_id": 1,
    "station_id": 1,
    "booking_id": 1,
    "rating": 5,
    "comment": "Trạm tốt, sạc nhanh",
    "created_at": "2025-11-07T10:00:00Z"
  }
]
```

---

## 3. Booking APIs

### POST /bookings
Tạo đặt lịch sạc

**Request Body:**
```json
{
  "station_id": 1,
  "vehicle_type": "xe_may_usb",
  "start_time": "2025-11-07T14:00:00",
  "end_time": "2025-11-07T16:00:00",
  "promotion_code": "SUMMER10"
}
```

**Response:**
```json
{
  "booking_id": 1,
  "user_id": 1,
  "station_id": 1,
  "vehicle_type": "xe_may_usb",
  "start_time": "2025-11-07T14:00:00",
  "end_time": "2025-11-07T16:00:00",
  "total_cost": 25000,
  "status": "confirmed",
  "promotion_code": "SUMMER10"
}
```

### GET /bookings/:id
Lấy chi tiết đặt lịch

**Response:**
```json
{
  "booking": {
    "booking_id": 1,
    "user_id": 1,
    "station_id": 1,
    "vehicle_type": "xe_may_usb",
    "start_time": "2025-11-07T14:00:00",
    "end_time": "2025-11-07T16:00:00",
    "actual_start": "2025-11-07T14:05:00",
    "actual_end": "2025-11-07T15:25:00",
    "total_cost": 25000,
    "status": "charging",
    "promotion_code": "SUMMER10"
  },
  "session": {
    "session_id": 1,
    "booking_id": 1,
    "start_battery_percent": 20,
    "end_battery_percent": 80,
    "energy_consumed": 3.0
  },
  "station": {
    "station_id": 1,
    "station_name": "Trạm ABC",
    "price_per_kwh": 5000
  }
}
```

### PUT /bookings/:id/stop
Dừng sạc

**Response:**
```json
{
  "message": "Đã dừng sạc",
  "booking": { ... }
}
```

### GET /bookings/history
Lấy lịch sử sạc

**Query Parameters:**
- `from_date` (optional): YYYY-MM-DD
- `to_date` (optional): YYYY-MM-DD
- `station_id` (optional): number
- `status` (optional): completed | cancelled

**Response:**
```json
[
  {
    "booking": { ... },
    "session": { ... },
    "station": { ... },
    "payment": {
      "payment_id": 1,
      "booking_id": 1,
      "amount": 25000,
      "method": "QR",
      "status": "success"
    }
  }
]
```

---

## 4. Promotion APIs

### POST /promotions/validate
Validate mã giảm giá

**Request Body:**
```json
{
  "code": "SUMMER10",
  "total_cost": 25000
}
```

**Response:**
```json
{
  "valid": true,
  "promotion": {
    "promotion_id": 1,
    "code": "SUMMER10",
    "discount_percent": 10,
    "max_discount": 5000,
    "min_amount": 10000
  },
  "discount_amount": 2500
}
```

---

## 5. Payment APIs

### POST /payments
Tạo thanh toán

**Request Body:**
```json
{
  "booking_id": 1,
  "amount": 25000,
  "method": "QR"
}
```

**Response:**
```json
{
  "payment_id": 1,
  "booking_id": 1,
  "amount": 25000,
  "method": "QR",
  "status": "success",
  "transaction_id": "TXN123456",
  "created_at": "2025-11-07T15:30:00Z"
}
```

---

## 6. Feedback APIs

### POST /feedbacks
Gửi đánh giá

**Request Body:**
```json
{
  "station_id": 1,
  "booking_id": 1,
  "rating": 5,
  "comment": "Trạm tốt, sạc nhanh"
}
```

**Response:**
```json
{
  "feedback_id": 1,
  "user_id": 1,
  "station_id": 1,
  "booking_id": 1,
  "rating": 5,
  "comment": "Trạm tốt, sạc nhanh",
  "created_at": "2025-11-07T16:00:00Z"
}
```

---

## 7. Favorite APIs

### GET /favorites
Lấy danh sách trạm yêu thích

**Response:**
```json
[
  {
    "favorite_id": 1,
    "user_id": 1,
    "station_id": 1,
    "station": {
      "station_id": 1,
      "station_name": "Trạm ABC",
      "address": "123 Đường XYZ",
      "price_per_kwh": 5000,
      "status": "active",
      "avatar_url": "https://example.com/image.jpg"
    },
    "created_at": "2025-11-07T10:00:00Z"
  }
]
```

### POST /favorites
Thêm trạm yêu thích

**Request Body:**
```json
{
  "station_id": 1
}
```

**Response:**
```json
{
  "favorite_id": 1,
  "user_id": 1,
  "station_id": 1,
  "created_at": "2025-11-07T10:00:00Z"
}
```

### DELETE /favorites/:station_id
Xóa trạm yêu thích

**Response:**
```json
{
  "message": "Đã xóa khỏi danh sách yêu thích"
}
```

---

## Error Responses

Tất cả lỗi trả về format:
```json
{
  "error": true,
  "message": "Mô tả lỗi"
}
```

**HTTP Status Codes:**
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Internal Server Error
