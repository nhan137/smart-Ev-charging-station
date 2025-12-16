# 🧪 Test VNPay Payment API

**Base URL:** `http://localhost:3000/api`

---

## 📋 Tổng quan

File này hướng dẫn test chức năng thanh toán VNPay với **Option B** (Redirect về Frontend sau khi thanh toán).

---

## 🔧 Setup Environment Variables

Đảm bảo file `.env` có các biến sau:

```env
# VNPay Configuration
VNPAY_TMN_CODE=3MQ86LBJ
VNPAY_SECRET_KEY=QYMHUM1C6PQUUCVV7T6AYDS5X1DFED0Q
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3000/api/payments/vnpay-callback

# Frontend URL (cho redirect sau callback)
FRONTEND_URL=http://localhost:5173
```

**⚠️ Lưu ý:** 
- `VNPAY_SECRET_KEY` phải là **một dòng duy nhất**, không có xuống dòng
- Xem chi tiết setup trong file `VNPAY_CONFIG_SETUP.md`

---

## 📝 Test Flow

### **Bước 1: Tạo Booking (nếu chưa có)**

```bash
POST /api/bookings
Authorization: Bearer <user_token>

Body:
{
  "station_id": 1,
  "vehicle_type": "oto_ccs",
  "start_time": "2025-12-17T14:00:00.000Z",
  "end_time": "2025-12-17T15:30:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "booking_id": 596,
    "total_cost": 84000,
    ...
  }
}
```

**Lưu `booking_id` để dùng cho bước tiếp theo.**

---

### **Bước 2: Initialize VNPay Payment**

```bash
POST /api/payments/vnpay-init
Authorization: Bearer <user_token>
Content-Type: application/json

Body:
{
  "booking_id": 596
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment URL generated successfully",
  "data": {
    "payment_id": 123,
    "booking_id": 596,
    "amount": 84000,
    "redirect_url": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=8400000&vnp_Command=pay&...",
    "vnp_txn_ref": "20251217140000_596_abc123"
  }
}
```

**✅ Lưu `redirect_url` để test redirect.**

---

### **Bước 3: Simulate VNPay Callback (Success)**

**Cách 1: Dùng Browser/Postman**

Mở URL callback với query params giả lập VNPay success:

```
GET http://localhost:3000/api/payments/vnpay-callback?
  vnp_Amount=8400000&
  vnp_BankCode=NCB&
  vnp_CardType=ATM&
  vnp_OrderInfo=Thanh+toan+don+hang+596&
  vnp_PayDate=20251217140000&
  vnp_ResponseCode=00&
  vnp_TxnRef=20251217140000_596_abc123&
  vnp_SecureHash=<hash_value>
```

**⚠️ Lưu ý:** `vnp_SecureHash` phải được tính đúng theo thuật toán VNPay. Trong môi trường test, bạn có thể tạm thời comment phần verify hash để test redirect.

**Kết quả:**
- Backend sẽ redirect về: `http://localhost:5173/payment/success?booking_id=596&status=success`
- Frontend nhận được `booking_id` và `status=success`
- Frontend gọi `GET /api/bookings/596` để lấy payment status và hiển thị "Thanh toán thành công"

---

### **Bước 4: Verify Payment Status**

Sau khi redirect về FE, FE cần gọi API này để lấy thông tin payment:

```bash
GET /api/bookings/596
Authorization: Bearer <user_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "station_info": {
      "station_name": "Trạm sạc Hải Châu",
      "address": "123 Trần Phú, Hải Châu, Đà Nẵng",
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
      "status": "Thành công",  // ✅ Status hiển thị trên UI
      "status_raw": "success",  // Raw status từ DB
      "discount_code": "GIAM20",
      "total_amount": 84000
    }
  }
}
```

**✅ Frontend check `payment_info.status === "Thành công"` → hiển thị badge "Thanh toán thành công"**

---

## 🧪 Test Cases

### **Test Case 1: Payment Success Flow**

1. ✅ Initialize payment → Nhận `redirect_url`
2. ✅ User click vào `redirect_url` → Redirect đến VNPay
3. ✅ User thanh toán thành công trên VNPay
4. ✅ VNPay redirect về `/api/payments/vnpay-callback` với `vnp_ResponseCode=00`
5. ✅ Backend update payment status = 'success'
6. ✅ Backend redirect về FE: `/payment/success?booking_id=596&status=success`
7. ✅ FE gọi `GET /api/bookings/596` → Lấy payment status
8. ✅ FE hiển thị "Thanh toán thành công"

---

### **Test Case 2: Payment Failed Flow**

1. ✅ Initialize payment → Nhận `redirect_url`
2. ✅ User click vào `redirect_url` → Redirect đến VNPay
3. ✅ User thanh toán thất bại (hoặc cancel)
4. ✅ VNPay redirect về `/api/payments/vnpay-callback` với `vnp_ResponseCode != 00` (ví dụ: '51')
5. ✅ Backend update payment status = 'failed'
6. ✅ Backend redirect về FE: `/payment/failed?booking_id=596&error_code=51&message=...`
7. ✅ FE hiển thị thông báo lỗi

---

### **Test Case 3: Invalid Hash**

1. ✅ VNPay callback với hash không hợp lệ
2. ✅ Backend verify hash → Fail
3. ✅ Backend trả về error (không redirect)

**⚠️ Lưu ý:** Trong production, cần verify hash nghiêm ngặt. Trong test, có thể tạm thời comment để test flow.

---

## 🔍 Manual Test với Postman/Thunder Client

### **1. Initialize Payment**

```http
POST http://localhost:3000/api/payments/vnpay-init
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "booking_id": 596
}
```

### **2. Simulate VNPay Success Callback**

**⚠️ Lưu ý:** Để test redirect, bạn cần:
- Dùng browser thay vì Postman (vì Postman không follow redirect)
- Hoặc dùng Postman với "Follow redirects" = ON

**URL test (giả lập VNPay success):**
```
http://localhost:3000/api/payments/vnpay-callback?
  vnp_Amount=8400000&
  vnp_BankCode=NCB&
  vnp_CardType=ATM&
  vnp_OrderInfo=Thanh+toan+don+hang+596&
  vnp_PayDate=20251217140000&
  vnp_ResponseCode=00&
  vnp_TxnRef=20251217140000_596_abc123&
  vnp_SecureHash=<calculated_hash>
```

**Expected:** Browser redirect về:
```
http://localhost:5173/payment/success?booking_id=596&status=success
```

---

## 🐛 Troubleshooting

### **Vấn đề 1: Redirect không hoạt động**

**Nguyên nhân:**
- VNPay có thể yêu cầu response JSON thay vì redirect
- Hash verification fail

**Giải pháp:**
- Kiểm tra `FRONTEND_URL` trong `.env`
- Kiểm tra hash calculation trong `utils/vnpay.js`
- Trong test, có thể tạm thời comment hash verification

---

### **Vấn đề 2: Payment status không update**

**Nguyên nhân:**
- Booking không tồn tại
- Payment record không tìm thấy
- Transaction rollback

**Giải pháp:**
- Kiểm tra logs trong console
- Verify `booking_id` trong callback params
- Kiểm tra database: `SELECT * FROM payments WHERE booking_id = 596;`

---

### **Vấn đề 3: Frontend không nhận được booking_id**

**Nguyên nhân:**
- Query params bị mất khi redirect
- Frontend route không match

**Giải pháp:**
- Kiểm tra URL redirect có đúng format không
- Frontend cần handle route `/payment/success` và `/payment/failed`
- Extract `booking_id` từ query params

---

## 📝 Frontend Integration Notes

### **1. Handle Redirect từ VNPay**

```javascript
// Trong component PaymentSuccess.vue hoặc PaymentSuccess.jsx
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const bookingId = urlParams.get('booking_id');
  const status = urlParams.get('status');
  
  if (status === 'success' && bookingId) {
    // Gọi API để lấy payment details
    fetchBookingDetails(bookingId);
  }
}, []);
```

### **2. Fetch Payment Status**

```javascript
const fetchBookingDetails = async (bookingId) => {
  const response = await fetch(`http://localhost:3000/api/bookings/${bookingId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  
  if (data.data.payment_info.status_raw === 'success') {
    // Hiển thị "Thanh toán thành công"
    setPaymentStatus('success');
  }
};
```

### **3. Handle Payment Failed**

```javascript
// Trong component PaymentFailed.vue hoặc PaymentFailed.jsx
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const bookingId = urlParams.get('booking_id');
  const errorCode = urlParams.get('error_code');
  const errorMessage = urlParams.get('message');
  
  // Hiển thị thông báo lỗi
  setError({
    code: errorCode,
    message: decodeURIComponent(errorMessage)
  });
}, []);
```

---

## ✅ Checklist

- [ ] Environment variables đã setup đúng
- [ ] VNPay sandbox account đã tạo
- [ ] `FRONTEND_URL` đã config trong `.env`
- [ ] Test initialize payment thành công
- [ ] Test VNPay callback (success) → Redirect về FE
- [ ] Test VNPay callback (failed) → Redirect về FE với error
- [ ] Frontend nhận được `booking_id` từ query params
- [ ] Frontend gọi API lấy payment status thành công
- [ ] UI hiển thị "Thanh toán thành công" đúng

---

## 📚 References

- VNPay Documentation: https://sandbox.vnpayment.vn/apis/
- File code: `server/controllers/paymentController.js`
- Utils: `server/utils/vnpay.js`

