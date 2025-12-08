# 💳 Hướng dẫn Tích hợp VNPay Sandbox

## 📋 Tổng quan

Hệ thống đã được tích hợp VNPay Sandbox để xử lý thanh toán cho các booking. Có 2 API chính:

1. **POST /api/payments/vnpay-init** - Khởi tạo thanh toán và tạo redirect URL
2. **GET /api/payments/vnpay-callback** - Xử lý callback từ VNPay

---

## 🔧 Cấu hình Environment Variables

Thêm các biến sau vào file `.env`:

```env
# VNPay Configuration (Sandbox)
VNPAY_TMN_CODE=YOUR_TMN_CODE
VNPAY_SECRET_KEY=YOUR_SECRET_KEY
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3000/api/payments/vnpay-callback
```

### Lấy thông tin VNPay Sandbox:

1. Đăng ký tài khoản tại: https://sandbox.vnpayment.vn/
2. Lấy `TMN Code` và `Secret Key` từ dashboard
3. Điền vào `.env` file

---

## 📡 API Endpoints

### **1. POST /api/payments/vnpay-init**

**Mục đích:** Khởi tạo thanh toán và tạo redirect URL để chuyển hướng user đến VNPay.

**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "booking_id": 3
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment URL generated successfully",
  "data": {
    "payment_id": 1,
    "booking_id": 3,
    "amount": 17500,
    "redirect_url": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...",
    "vnp_txn_ref": "20251208143000_3_1234"
  }
}
```

**Process:**
1. Verify user owns booking và booking có status `completed` hoặc `charging`
2. Tính toán `total_amount` từ `booking.total_cost`
3. Tạo hoặc update payment record với status `pending`
4. Tạo VNPay payment URL với hash
5. Return `redirect_url` để Frontend chuyển hướng

---

### **2. GET /api/payments/vnpay-callback**

**Mục đích:** Xử lý callback từ VNPay sau khi user thanh toán.

**Authentication:** Không cần (Public endpoint)

**Query Parameters:** (VNPay tự động gửi)
- `vnp_ResponseCode`: Mã phản hồi ('00' = thành công)
- `vnp_TxnRef`: Transaction reference
- `vnp_Amount`: Số tiền (đã nhân 100)
- `vnp_SecureHash`: Hash để verify
- ... (các tham số khác từ VNPay)

**Response:**
```json
{
  "RspCode": "00",
  "Message": "Success"
}
```

**Process:**
1. **Verify hash** (QUAN TRỌNG - phải check đầu tiên)
2. Extract `booking_id` từ `vnp_TxnRef`
3. Verify amount khớp với payment record
4. Update payment status:
   - `vnp_ResponseCode = '00'` → `status = 'success'`
   - Khác → `status = 'failed'`
5. Gửi notification cho user
6. Return response theo format VNPay yêu cầu

---

## 🔐 VNPay Hash Logic

### **Tạo Hash (khi init):**
1. Sort tất cả parameters theo key (alphabetical)
2. Tạo query string từ sorted parameters
3. Dùng HMAC-SHA512 với `secretKey` để hash
4. Thêm `vnp_SecureHash` vào URL

### **Verify Hash (khi callback):**
1. Extract `vnp_SecureHash` từ parameters
2. Remove `vnp_SecureHash` khỏi parameters
3. Sort parameters theo key
4. Tạo query string và hash
5. So sánh với `vnp_SecureHash` nhận được

**Code:** Xem `server/utils/vnpay.js`

---

## 🧪 Test với Postman

### **Bước 1: Login và lấy Token**
```
POST http://localhost:3000/api/auth/login
Body: { "email": "...", "password": "..." }
```

### **Bước 2: Tạo Booking (nếu chưa có)**
```
POST http://localhost:3000/api/bookings
Headers: Authorization: Bearer <token>
Body: { "station_id": 1, "vehicle_type": "xe_may_usb", ... }
```

### **Bước 3: Update Booking Status (để test payment)**
```sql
-- Trong MySQL, update booking status thành 'completed' hoặc 'charging'
UPDATE bookings SET status = 'completed' WHERE booking_id = 3;
```

### **Bước 4: Khởi tạo Payment**
```
POST http://localhost:3000/api/payments/vnpay-init
Headers: Authorization: Bearer <token>
Body: { "booking_id": 3 }
```

**Response sẽ có `redirect_url`** → Copy URL này và mở trong browser để test thanh toán.

### **Bước 5: Test Callback (Manual)**
Sau khi thanh toán trên VNPay Sandbox, VNPay sẽ redirect về `VNPAY_RETURN_URL` với query parameters.

Hoặc test manual:
```
GET http://localhost:3000/api/payments/vnpay-callback?vnp_ResponseCode=00&vnp_TxnRef=...&vnp_Amount=...&vnp_SecureHash=...
```

---

## 🔄 Flow hoạt động

```
1. User chọn "Thanh toán" trên Frontend
   ↓
2. Frontend gọi POST /api/payments/vnpay-init
   ↓
3. Backend tạo payment record + VNPay URL
   ↓
4. Frontend redirect user đến VNPay URL
   ↓
5. User thanh toán trên VNPay
   ↓
6. VNPay redirect về GET /api/payments/vnpay-callback
   ↓
7. Backend verify hash + update payment status
   ↓
8. Backend gửi notification cho user
   ↓
9. Frontend hiển thị kết quả thanh toán
```

---

## ⚠️ Lưu ý quan trọng

1. **Hash Verification:** Luôn verify hash TRƯỚC khi xử lý payment (bảo mật)
2. **Amount Format:** VNPay gửi amount * 100 (ví dụ: 17500 VND → 1750000)
3. **Transaction Reference:** Format: `YYYYMMDDHHmmss_booking_id_random`
4. **Booking Status:** Chỉ cho phép thanh toán booking có status `completed` hoặc `charging`
5. **Duplicate Payment:** Check nếu payment đã `success` thì không cho thanh toán lại

---

## 📝 Database Schema

### **payments table:**
- `payment_id`: Primary key
- `booking_id`: Foreign key (unique - 1 booking = 1 payment)
- `user_id`: Foreign key
- `amount`: Số tiền thanh toán
- `method`: 'qr' hoặc 'bank' (VNPay = 'bank')
- `status`: 'pending', 'success', 'failed'
- `payment_date`: Thời gian thanh toán

---

## 🎯 Kết luận

Hệ thống đã sẵn sàng tích hợp VNPay. Chỉ cần:
1. Thêm VNPay credentials vào `.env`
2. Test với VNPay Sandbox
3. Frontend redirect user đến `redirect_url` từ API response

