# 📋 User UI - API Mapping & Field Verification

**Base URL:** `http://localhost:3000/api`

---

## ✅ Hình 10: Payment (VNPay)

### UI Requirements:
- Mã đặt lịch (#596)
- Thông tin đặt lịch: Trạm sạc, Loại xe, Thời gian sạc, % pin, Năng lượng tiêu thụ
- Chi tiết giá: Giá gốc, Mã giảm giá, Tổng thanh toán
- Phương thức thanh toán: QR code hoặc Chuyển khoản ngân hàng
- **Trạng thái thanh toán thành công** (hiển thị sau khi thanh toán)

### APIs:

#### 1. Initialize Payment
```
POST /api/payments/vnpay-init
```
**Body:**
```json
{
  "booking_id": 596
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "payment_id": 123,
    "booking_id": 596,
    "amount": 84000,
    "redirect_url": "https://sandbox.vnpayment.vn/...",
    "vnp_txn_ref": "..."
  }
}
```

**✅ Đủ fields:** `booking_id`, `amount` → FE redirect user đến `redirect_url`

#### 2. VNPay Callback
```
GET /api/payments/vnpay-callback?vnp_ResponseCode=00&vnp_TxnRef=...&...
```

**Response (Success):**
```json
{
  "RspCode": "00",
  "Message": "Success"
}
```

**⚠️ VẤN ĐỀ:** Callback API này **chỉ trả JSON** cho VNPay, không redirect về FE.

**Giải pháp cho FE:**
1. **Option A:** FE tự redirect về trang payment với query params:
   ```
   /payment?booking_id=596&status=success
   ```
   Sau đó FE gọi `GET /api/bookings/:booking_id` để lấy thông tin booking + payment status.

2. **Option B:** Backend redirect về FE URL:
   ```javascript
   // Trong vnpayCallback, sau khi success:
   res.redirect(`${process.env.FRONTEND_URL}/payment/success?booking_id=${booking_id}`);
   ```

**✅ Để hiển thị "Thanh toán thành công":**
- FE cần gọi `GET /api/bookings/:booking_id` sau callback
- Response có `payment_info.status = "success"` → hiển thị badge "Thành công"

---

## ✅ Hình 11-12: View History (Lịch sử sạc & thanh toán)

### UI Requirements:
- Mã booking (#1, #2)
- Trạm sạc
- Loại xe
- Ngày sạc
- Thời lượng
- % pin (20% → 80%)
- Năng lượng (30 kWh)
- Phương thức TT (QR)
- Tổng tiền (84,000₫)
- Status: "Hoàn thành", "Thành công"

### API:
```
GET /api/bookings/my?status=completed
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "booking_id": 1,
      "station_name": "Trạm sạc Hải Châu",
      "vehicle_type_display": "Ô tô CCS",
      "charging_date": "15/1/2025",
      "duration": "1h 20m",
      "battery_range": "20% - 80%",
      "energy_consumed": 30,
      "payment_method_display": "QR",
      "total_cost": 84000,
      "booking_status_display": "Hoàn thành",
      "payment_status_display": "Thành công"
    }
  ]
}
```

**✅ Đủ fields:** Tất cả fields UI cần đều có trong response.

---

## ⚠️ Hình 13-16: Lịch sử đặt lịch (Cần bổ sung API)

### Flow:
1. Manager phê duyệt → gửi mã check-in qua notification ✅ (đã có)
2. User xem danh sách bookings với status "Đã xác nhận" ✅ (đã có)
3. User nhập mã check-in → **CẦN API mới**
4. Verify mã → chuyển sang màn hình sạc (Hình 8) ✅ (đã có `GET /api/bookings/:id/charging/status`)
5. User hủy booking → **CẦN API mới cho User**
6. Xem chi tiết booking → ✅ (đã có `GET /api/bookings/:booking_id`)

### UI Requirements (Hình 13):
- Mã booking (#1, #2)
- Loại xe
- Ngày đặt
- Thời gian
- Tổng tiền
- Status: "Đã xác nhận", "Hoàn thành"
- Buttons: "Nhập mã để bắt đầu sạc", "Hủy", "Chi tiết"

### API hiện có:

#### 1. Get My Bookings (Lịch sử đặt lịch)
```
GET /api/bookings/my?status=confirmed
```

**Response hiện tại:**
```json
{
  "success": true,
  "data": [
    {
      "booking_id": 1,
      "vehicle_type_display": "Ô tô CCS",
      "created_at": "2025-12-16T...",
      "start_time": "2025-12-16T22:08:00.000Z",
      "end_time": "2025-12-17T00:08:00.000Z",
      "total_cost": 159250,
      "booking_status": "confirmed",
      "booking_status_display": "Đã xác nhận",
      "checkin_code": "X9A2B1"  // ⚠️ CHƯA CÓ trong response hiện tại
    }
  ]
}
```

**❌ THIẾU:** `checkin_code` trong response → **CẦN SỬA**

#### 2. Verify Check-in Code (CẦN TẠO MỚI)
```
POST /api/bookings/:booking_id/verify-checkin
```

**Body:**
```json
{
  "checkin_code": "X9A2B1"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Mã check-in hợp lệ",
  "data": {
    "booking_id": 1,
    "status": "confirmed",
    "can_start_charging": true
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Mã check-in không đúng"
}
```

**Sau khi verify thành công:** FE chuyển sang màn hình Hình 8 (Check Charging Status)

#### 3. Cancel Booking (User) - CẦN TẠO MỚI
```
PUT /api/bookings/:booking_id/cancel-by-user
```

**Body:** (empty)

**Response:**
```json
{
  "success": true,
  "message": "Đã hủy lịch đặt sạc"
}
```

**Logic:**
- Chỉ cho phép hủy nếu `status = 'pending'` hoặc `'confirmed'`
- Update `status = 'cancelled'`
- Restore `available_slots` (nếu đã confirmed)
- Gửi notification cho Manager

#### 4. Get Booking Detail (Hình 16)
```
GET /api/bookings/:booking_id
```

**Response hiện tại:**
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
      "energy_consumed": 30
    },
    "payment_info": {
      "method": "QR",
      "status": "Thành công",
      "discount_code": "GIAM20",
      "total_amount": 84000
    }
  }
}
```

**✅ Đủ fields:** Match với Hình 16 (Chi tiết đặt lịch)

**⚠️ THIẾU:** `address` trong `station_info` → **CẦN BỔ SUNG**

---

## ✅ Hình 17: Rate Station

### UI Requirements:
- Dropdown chọn trạm đã sạc
- Star rating (1-5)
- Nội dung phản hồi (tùy chọn, max 500 ký tự)

### API:
```
POST /api/feedbacks
```

**Body:**
```json
{
  "station_id": 1,
  "rating": 5,
  "comment": "Trạm sạc rất tốt, nhanh và tiện lợi!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "feedback_id": 123,
    "station_name": "Trạm sạc Hải Châu",
    "rating": 5,
    "comment": "Trạm sạc rất tốt, nhanh và tiện lợi!",
    "created_at": "2025-12-16T..."
  }
}
```

**✅ Đủ fields:** Match với UI

**⚠️ LƯU Ý:** FE cần lấy danh sách trạm đã sạc (completed bookings) để populate dropdown:
```
GET /api/bookings/my?status=completed
```
→ Lấy `station_id` unique từ response

---

## ✅ Hình 18: Save Favorites

### UI Requirements:
- Danh sách trạm yêu thích (hoặc empty state "Bạn chưa lưu trạm nào")
- Mỗi trạm: tên, địa chỉ, rating, slots, price

### API:
```
GET /api/favorites/my
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "station_id": 1,
      "station_name": "Trạm sạc Hải Châu",
      "address": "123 Trần Phú, Hải Châu, Đà Nẵng",
      "price_per_kwh": 3500,
      "total_slots": 6,
      "available_slots": 3,
      "avg_rating": 4.5,
      "feedback_count": 2,
      "added_at": "2025-12-16T..."
    }
  ]
}
```

**✅ Đủ fields:** Match với UI (có thể thêm `connector_types`, `avatar_url` nếu cần)

---

## 📝 Tóm tắt cần bổ sung:

### 1. Sửa `GET /api/bookings/my`:
- Thêm `checkin_code` vào response (chỉ khi `status = 'confirmed'`)

### 2. Tạo API mới `POST /api/bookings/:booking_id/verify-checkin`:
- Verify checkin_code
- Trả về `can_start_charging: true` nếu hợp lệ

### 3. Tạo API mới `PUT /api/bookings/:booking_id/cancel-by-user`:
- User tự hủy booking
- Restore slots + notify manager

### 4. Sửa `GET /api/bookings/:booking_id`:
- Thêm `address` vào `station_info`

### 5. VNPay Callback:
- Cân nhắc redirect về FE URL thay vì chỉ trả JSON

---

## 🔧 Code cần implement:

Xem file `USER_UI_API_FIXES.md` (sẽ tạo tiếp) để có code cụ thể.

