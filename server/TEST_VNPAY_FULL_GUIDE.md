# 💳 Hướng dẫn Test Thanh toán VNPay (Full Guide)

## 1. Chuẩn bị môi trường

### 1.1. Tài khoản VNPay Sandbox
- Truy cập `https://sandbox.vnpayment.vn/` → Đăng ký / Đăng nhập.
- Mở dashboard Merchant: `https://sandbox.vnpayment.vn/merchantv2/`.
- Lấy 2 thông tin trong email/portal VNPay:
  - **TMN Code (vnp_TmnCode):** `3MQ86LBJ`
  - **Secret Key (vnp_HashSecret):** `QYMHUM1C6PQUUCVV7T6AYDS5X1DFED0Q`

### 1.2. Cấu hình file `.env` (trong thư mục `server/`)
```env
# VNPay Configuration
VNPAY_TMN_CODE=3MQ86LBJ
VNPAY_SECRET_KEY=QYMHUM1C6PQUUCVV7T6AYDS5X1DFED0Q
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3000/api/payments/vnpay-callback

# Frontend URL (dùng cho redirect Option B)
FRONTEND_URL=http://localhost:5173
```

**Lưu ý:**
- `VNPAY_SECRET_KEY` phải là **một dòng duy nhất**, không có khoảng trắng hoặc xuống dòng thừa.
- Sau khi sửa `.env` → luôn **restart server**:
```bash
cd server
npm run dev
```

---

## 2. Flow tổng quan

1. User login → lấy JWT token.
2. User tạo booking.
3. Cập nhật booking sang trạng thái `completed` hoặc `charging` (để được phép thanh toán).
4. Gọi `POST /api/payments/vnpay-init` → backend tạo bản ghi payment `pending` + sinh `redirect_url` VNPay.
5. FE redirect người dùng tới `redirect_url` → thanh toán trên trang VNPay Sandbox.
6. VNPay gọi lại `GET /api/payments/vnpay-callback` với nhiều query param.
7. Backend verify hash + số tiền → cập nhật `payments.status` (`success` / `failed`) + tạo notification.
8. Backend redirect về FE (`/payment/success` hoặc `/payment/failed`).

---

## 3. Test chi tiết từng bước (dùng Postman)

### Bước 1: Login và lấy JWT Token
```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "khachhang@app.com",
  "password": "nhannok"
}
```
- Response chứa `data.token` → copy token để dùng cho các bước sau.

---

### Bước 2: Tạo Booking
```http
POST http://localhost:3000/api/bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "station_id": 1,
  "vehicle_type": "oto_ccs",
  "start_time": "2025-12-17T14:00:00.000Z",
  "end_time": "2025-12-17T15:30:00.000Z"
}
```
- Response trả về `data.booking_id` và `data.total_cost` → ghi lại `booking_id`.

---

### Bước 3: Cập nhật trạng thái booking sang `completed` hoặc `charging`
VNPay chỉ cho thanh toán booking đã hoàn thành / đang sạc.

**Cách nhanh (SQL):**
```sql
UPDATE bookings
SET status = 'completed'
WHERE booking_id = <BOOKING_ID>;
```

Sau đó kiểm tra:
```sql
SELECT booking_id, status, total_cost
FROM bookings
WHERE booking_id = <BOOKING_ID>;
```
- Kỳ vọng: `status` = `completed` (hoặc `charging`), `total_cost` > 0.

---

### Bước 4: Khởi tạo thanh toán VNPay
```http
POST http://localhost:3000/api/payments/vnpay-init
Authorization: Bearer <token>
Content-Type: application/json

{
  "booking_id": <BOOKING_ID>
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
    "redirect_url": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Version=2.1.0&vnp_Command=pay&vnp_TmnCode=3MQ86LBJ&...&vnp_Amount=1750000&...&vnp_SecureHash=...",
    "vnp_txn_ref": "20251217140000_3_1234"
  }
}
```
- `amount` = `booking.total_cost`.
- `redirect_url` chứa rất nhiều `vnp_*` query params.
- Copy toàn bộ `redirect_url`.

---

### Bước 5: Thanh toán trên VNPay Sandbox

1. Mở browser (Chrome).
2. Paste `redirect_url` vào thanh địa chỉ → Enter.
3. Chọn ngân hàng test (ví dụ NCB), nhập thông tin test theo tài liệu VNPay:
   - Số thẻ, tên chủ thẻ, ngày phát hành, OTP test...
4. Hoàn tất thanh toán.

Nếu mọi thứ đúng:
- VNPay hiển thị trang kết quả (thành công / thất bại).
- VNPay gọi **callback** đến `VNPAY_RETURN_URL` của backend với các tham số `vnp_*`.

---

## 4. Kiểm tra kết quả backend

### 4.1. Kiểm tra bảng `payments`
```sql
SELECT *
FROM payments
WHERE booking_id = <BOOKING_ID>;
```
- Nếu thanh toán thành công: `status = 'success'`, `payment_date` có giá trị.
- Nếu thất bại / hủy: `status = 'failed'`.

### 4.2. Kiểm tra notification
```sql
SELECT *
FROM notifications
WHERE user_id = <USER_ID>
  AND type = 'payment'
ORDER BY created_at DESC
LIMIT 1;
```
- `title`: `"Thanh toán thành công"` hoặc `"Thanh toán thất bại"`.

---

## 5. Test callback thủ công (tùy chọn)

Nếu muốn test callback mà **không đi qua UI VNPay**:

1. Dùng logic hash trong `server/utils/vnpay.js`:
   - Hàm `sortObject` + `createPaymentUrl` / `verifyHash` (dùng `qs.stringify` với `{ encode: false }`).
2. Tự build bộ params ví dụ:
```js
const params = {
  vnp_Amount: '1750000',
  vnp_BankCode: 'NCB',
  vnp_CardType: 'ATM',
  vnp_OrderInfo: 'Thanh toan don hang 3',
  vnp_PayDate: '20251217140000',
  vnp_ResponseCode: '00',
  vnp_TmnCode: '3MQ86LBJ',
  vnp_TxnRef: '20251217140000_3_1234'
  // ... các tham số khác nếu cần
};
```
3. Sort + hash đúng secret để lấy `vnp_SecureHash`.
4. Gọi:
```http
GET http://localhost:3000/api/payments/vnpay-callback?...&vnp_SecureHash=<HASH>
```
5. Quan sát `payments.status` và hành vi redirect.

---

## 6. Troubleshooting nhanh

### 6.1. Lỗi "VNPay configuration missing"
- Kiểm tra `.env` đã có:
  - `VNPAY_TMN_CODE`
  - `VNPAY_SECRET_KEY`
  - `VNPAY_URL`, `VNPAY_RETURN_URL`
- Restart server sau khi sửa.

### 6.2. Lỗi trên trang VNPay: `Invalid data format (code=03)`
- `vnp_Amount` phải là số nguyên, đã nhân 100 (VD: 17500 → 1750000).
- `vnp_OrderInfo`:
  - Chỉ ASCII, không dấu; độ dài ≤ 255 ký tự.
  - Đã được xử lý trong `paymentController` (remove dấu, cắt độ dài) nhưng nếu sửa code thì cần giữ nguyên quy tắc này.
- `vnp_IpAddr` là IPv4 (`127.0.0.1`), không phải `::1`.

### 6.3. Lỗi "Sai chữ ký" (Invalid signature / code=97)
- TMN Code hoặc Secret Key trong `.env` khác với thông tin dashboard VNPay.
- Hàm hash trong `utils/vnpay.js` bị chỉnh sai:
  - Phải dùng `sortObject` + `qs.stringify(sortedParams, { encode: false })`.
  - Không được thay đổi bất cứ `vnp_*` param nào sau khi đã tính hash.
- Kiểm tra log callback trong backend để xem các giá trị `vnp_*` thực tế.

### 6.4. Lỗi "Booking not found, not owned by user, or not eligible for payment"
- `booking_id` không thuộc user hiện tại.
- `status` của booking không phải `completed` hoặc `charging`.
- `total_cost` ≤ 0.

---

## 7. Checklist cuối cùng

- [ ] `.env` đã cấu hình đầy đủ VNPay (TMN Code, Secret, URL, RETURN_URL, FRONTEND_URL).
- [ ] Server đã restart sau khi cấu hình.
- [ ] Đăng nhập VNPay Sandbox trước khi test.
- [ ] Tạo booking mới, status `completed` / `charging`, `total_cost` > 0.
- [ ] Gọi `POST /api/payments/vnpay-init` → nhận `redirect_url`.
- [ ] Mở `redirect_url` trong browser → thanh toán thành công trên VNPay.
- [ ] Bảng `payments` cập nhật `status = 'success'` và `payment_date` hợp lệ.
- [ ] Notification \"Thanh toán thành công\" được tạo cho user.

> File này thay thế cho: `TEST_PAYMENT_GUIDE.md`, `TEST_VNPAY_PAYMENT.md`, `VNPAY_CONFIG_SETUP.md`, `VNPAY_INTEGRATION_GUIDE.md`. Khi cần test VNPay, chỉ cần đọc **file này**.


