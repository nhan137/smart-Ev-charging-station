# 💳 Hướng dẫn Test Thanh toán VNPay - Từng Bước Cụ Thể

## 📋 Chuẩn bị

### **Bước 0: Cấu hình VNPay Sandbox**

1. **Đăng ký tài khoản VNPay Sandbox:**
   - Truy cập: https://sandbox.vnpayment.vn/
   - Click "Đăng ký" hoặc "Register"
   - Điền thông tin và tạo tài khoản (miễn phí)
   - **QUAN TRỌNG:** Phải đăng nhập vào dashboard trước khi test

2. **Lấy thông tin:**
   - Đăng nhập vào dashboard: https://sandbox.vnpayment.vn/merchantv2/
   - Vào mục "Thông tin kết nối" hoặc "Integration"
   - Copy `TMN Code` và `Secret Key`
   - **Lưu ý:** Nếu chưa có TMN Code, có thể cần tạo merchant account trước

3. **Cập nhật file `.env`:**
   ```env
   VNPAY_TMN_CODE=YOUR_TMN_CODE_HERE
   VNPAY_SECRET_KEY=YOUR_SECRET_KEY_HERE
   VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
   VNPAY_RETURN_URL=http://localhost:3000/api/payments/vnpay-callback
   ```

4. **Restart server:**
   ```bash
   # Terminal 1
   cd server
   npm run dev
   ```

---

## 🚀 Các Bước Test

### **BƯỚC 1: Login và lấy JWT Token**

**Postman:**
```
POST http://localhost:3000/api/auth/login
```

**Body (JSON):**
```json
{
  "email": "khachhang@app.com",
  "password": "nhannok"
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

**✅ Copy `token` để dùng cho các bước sau**

---

### **BƯỚC 2: Tạo Booking**

**Postman:**
```
POST http://localhost:3000/api/bookings
```

**Headers:**
- `Authorization: Bearer <token-vừa-copy>`
- `Content-Type: application/json`

**Body (JSON):**
```json
{
  "station_id": 1,
  "vehicle_type": "xe_may_usb",
  "start_time": "2025-12-08T10:00:00Z",
  "end_time": "2025-12-08T14:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "booking_id": 3,
    "total_cost": 17500,
    ...
  }
}
```

**✅ Copy `booking_id` (ví dụ: 3)**

---

### **BƯỚC 3: Update Booking Status thành "completed" hoặc "charging"**

**Lý do:** API payment chỉ cho phép thanh toán booking có status `completed` hoặc `charging`.

**Cách 1: Dùng MySQL (phpMyAdmin hoặc MySQL Workbench):**
```sql
UPDATE bookings 
SET status = 'completed' 
WHERE booking_id = 3;
```

**Cách 2: Dùng Postman (nếu có API update booking):**
```
PUT http://localhost:3000/api/bookings/3
Headers: Authorization: Bearer <token>
Body: { "status": "completed" }
```

**✅ Verify:**
```sql
SELECT booking_id, status, total_cost FROM bookings WHERE booking_id = 3;
```

**Kết quả mong đợi:**
- `status` = `'completed'` hoặc `'charging'`
- `total_cost` có giá trị (ví dụ: 17500)

---

### **BƯỚC 4: Khởi tạo Payment (VNPay Init)**

**Postman:**
```
POST http://localhost:3000/api/payments/vnpay-init
```

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Body (JSON):**
```json
{
  "booking_id": 3
}
```

**Response mong đợi:**
```json
{
  "success": true,
  "message": "Payment URL generated successfully",
  "data": {
    "payment_id": 1,
    "booking_id": 3,
    "amount": 17500,
    "redirect_url": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Version=2.1.0&vnp_Command=pay&vnp_TmnCode=...&vnp_Amount=1750000&vnp_CurrCode=VND&vnp_TxnRef=...&vnp_SecureHash=...",
    "vnp_txn_ref": "20251208143000_3_1234"
  }
}
```

**✅ Kiểm tra:**
- `success: true`
- Có `redirect_url` (URL dài với nhiều parameters)
- Có `payment_id`
- `amount` khớp với `booking.total_cost`

**✅ Copy `redirect_url` để test**

---

### **BƯỚC 5: Test Payment trên VNPay Sandbox**

**Cách 1: Mở URL trong Browser:**
1. Copy `redirect_url` từ response Bước 4
2. Paste vào browser và Enter
3. Sẽ redirect đến trang VNPay Sandbox

**Cách 2: Dùng Postman (GET request):**
- Không khuyến nghị (VNPay cần browser để hiển thị form)

**Trên trang VNPay Sandbox:**
1. Chọn ngân hàng test (ví dụ: NCB)
2. Nhập thông tin test:
   - **Số thẻ:** `9704198526191432198`
   - **Tên chủ thẻ:** `NGUYEN VAN A`
   - **Ngày phát hành:** `07/15`
   - **OTP:** `123456`
3. Click "Thanh toán"

**Kết quả:**
- Nếu thành công → VNPay redirect về `VNPAY_RETURN_URL` với query parameters
- Nếu thất bại → VNPay hiển thị lỗi

---

### **BƯỚC 6: Verify Payment trong Database**

**MySQL Query:**
```sql
SELECT * FROM payments WHERE booking_id = 3;
```

**Kết quả mong đợi (nếu thanh toán thành công):**
- `payment_id`: 1
- `booking_id`: 3
- `user_id`: 1 (hoặc user_id của bạn)
- `amount`: 17500.00
- `method`: 'bank'
- `status`: 'success' (nếu thành công) hoặc 'failed' (nếu thất bại)
- `payment_date`: có giá trị

---

### **BƯỚC 7: Verify Notification**

**MySQL Query:**
```sql
SELECT * FROM notifications 
WHERE user_id = 1 
AND type = 'payment' 
ORDER BY created_at DESC 
LIMIT 1;
```

**Kết quả mong đợi:**
- Có notification mới
- `title`: "Thanh toán thành công" hoặc "Thanh toán thất bại"
- `type`: 'payment'
- `status`: 'unread'

---

## 🧪 Test Callback Manual (Optional)

Nếu muốn test callback mà không qua VNPay Sandbox:

### **Bước 1: Tạo Payment (Bước 4)**

### **Bước 2: Tạo Hash cho Callback**

**Sử dụng code trong `server/utils/vnpay.js` hoặc test manual:**

```javascript
// Test hash generation
const params = {
  vnp_Amount: '1750000',
  vnp_BankCode: 'NCB',
  vnp_BankTranNo: 'VNP12345678',
  vnp_CardType: 'ATM',
  vnp_OrderInfo: 'Thanh toan don hang 3',
  vnp_PayDate: '20251208143000',
  vnp_ResponseCode: '00',
  vnp_TmnCode: 'YOUR_TMN_CODE',
  vnp_TransactionNo: '12345678',
  vnp_TransactionStatus: '00',
  vnp_TxnRef: '20251208143000_3_1234'
};

// Sort và hash (xem code trong vnpay.js)
```

### **Bước 3: Test Callback với Postman**

```
GET http://localhost:3000/api/payments/vnpay-callback?vnp_ResponseCode=00&vnp_TxnRef=20251208143000_3_1234&vnp_Amount=1750000&vnp_SecureHash=...
```

**Lưu ý:** Cần hash đúng để test thành công.

---

## ✅ Checklist Test

- [ ] **Bước 0:** Đã cấu hình VNPay credentials trong `.env`
- [ ] **Bước 1:** Login thành công, có token
- [ ] **Bước 2:** Tạo booking thành công, có `booking_id`
- [ ] **Bước 3:** Update booking status thành `completed` hoặc `charging`
- [ ] **Bước 4:** POST vnpay-init thành công, có `redirect_url`
- [ ] **Bước 5:** Mở `redirect_url` trong browser, thanh toán trên VNPay Sandbox
- [ ] **Bước 6:** Verify payment trong database có `status = 'success'`
- [ ] **Bước 7:** Verify notification đã được tạo

---

## 🔍 Troubleshooting

### **Lỗi 1: "VNPay configuration missing"**
**Nguyên nhân:** Chưa cấu hình `.env`
**Giải pháp:** Thêm `VNPAY_TMN_CODE` và `VNPAY_SECRET_KEY` vào `.env` và restart server

### **Lỗi 2: "403 Forbidden" khi mở redirect_url**
**Nguyên nhân:** 
- Chưa đăng nhập VNPay Sandbox dashboard
- TMN Code hoặc Secret Key sai
- Hash không đúng
**Giải pháp:** 
1. Đăng nhập tại: https://sandbox.vnpayment.vn/merchantv2/
2. Kiểm tra lại TMN Code và Secret Key trong `.env`
3. Restart server
4. Test lại

### **Lỗi 2: "Booking not found, not owned by user, or not eligible for payment"**
**Nguyên nhân:** 
- Booking không thuộc user
- Booking status không phải `completed` hoặc `charging`
**Giải pháp:** 
- Check booking thuộc user đúng
- Update booking status: `UPDATE bookings SET status = 'completed' WHERE booking_id = 3;`

### **Lỗi 3: "Payment already completed"**
**Nguyên nhân:** Payment đã `success` rồi
**Giải pháp:** Tạo booking mới hoặc xóa payment cũ:
```sql
DELETE FROM payments WHERE booking_id = 3;
```

### **Lỗi 4: "Invalid hash" trong callback**
**Nguyên nhân:** Hash không khớp
**Giải pháp:** 
- Check `VNPAY_SECRET_KEY` đúng chưa
- Verify hash calculation trong `vnpay.js`

---

## 📊 Flow Test Hoàn Chỉnh

```
1. Setup VNPay credentials (.env)
   ↓
2. Login → Get token
   ↓
3. Create booking → Get booking_id
   ↓
4. Update booking status = 'completed'
   ↓
5. POST /api/payments/vnpay-init → Get redirect_url
   ↓
6. Open redirect_url in browser
   ↓
7. Pay on VNPay Sandbox
   ↓
8. VNPay redirects to callback URL
   ↓
9. Backend processes callback → Updates payment status
   ↓
10. Check database: payment.status = 'success'
   ↓
11. Check notification created
   ↓
✅ Test thành công!
```

---

## 🎯 Kết luận

**Tóm tắt các bước:**
1. Cấu hình VNPay (`.env`)
2. Login → Token
3. Tạo booking
4. Update booking status
5. Khởi tạo payment → Lấy redirect_url
6. Thanh toán trên VNPay Sandbox
7. Verify payment trong database

**Thời gian test:** ~5-10 phút

