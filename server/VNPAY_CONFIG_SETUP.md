# 🔧 VNPay Configuration Setup

## 📋 Thông tin tài khoản VNPay

**TMN Code:** `3MQ86LBJ`  
**Secret Key:** `QYMHUM1C6PQUUCVV7T6AYDS5X1DFED0Q`

---

## ✅ Cách setup:

### **Bước 1: Tạo file `.env` trong thư mục `server/`**

Nếu chưa có file `.env`, copy từ `.env.example`:

```bash
cd server
cp .env.example .env
```

### **Bước 2: Thêm VNPay credentials vào file `.env`**

Mở file `server/.env` và thêm/sửa các dòng sau:

```env
# VNPay Configuration
VNPAY_TMN_CODE=3MQ86LBJ
VNPAY_SECRET_KEY=QYMHUM1C6PQUUCVV7T6AYDS5X1DFED0Q
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3000/api/payments/vnpay-callback

# Frontend URL (cho redirect sau khi thanh toán)
FRONTEND_URL=http://localhost:5173
```

**⚠️ Lưu ý quan trọng:**
- `VNPAY_SECRET_KEY` phải là **một dòng duy nhất**, không có xuống dòng hoặc khoảng trắng thừa
- Nếu secret key có xuống dòng, hãy gộp lại thành một dòng

### **Bước 3: Restart server**

Sau khi thêm credentials, restart server để load biến môi trường mới:

```bash
# Dừng server (Ctrl + C)
# Sau đó chạy lại
npm run dev
```

---

## ✅ Verify Configuration

### **Test 1: Kiểm tra biến môi trường**

Thêm đoạn code này vào `paymentController.js` để debug (tạm thời):

```javascript
console.log('VNPay Config:', {
  tmnCode: process.env.VNPAY_TMN_CODE,
  hasSecret: !!process.env.VNPAY_SECRET_KEY,
  secretLength: process.env.VNPAY_SECRET_KEY?.length
});
```

**Expected output:**
```
VNPay Config: {
  tmnCode: '3MQ86LBJ',
  hasSecret: true,
  secretLength: 32
}
```

### **Test 2: Test Initialize Payment**

```bash
POST http://localhost:3000/api/payments/vnpay-init
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "booking_id": 596
}
```

**Nếu thành công:**
- Response có `redirect_url` với domain `sandbox.vnpayment.vn`
- URL có chứa `vnp_TmnCode=3MQ86LBJ`

**Nếu lỗi:**
- Kiểm tra console log xem có message "VNPay configuration missing" không
- Verify file `.env` có đúng format không

---

## 🔍 Troubleshooting

### **Lỗi: "VNPay configuration missing"**

**Nguyên nhân:**
- File `.env` không tồn tại
- Biến môi trường không được load
- Tên biến sai (phải là `VNPAY_TMN_CODE` và `VNPAY_SECRET_KEY`)

**Giải pháp:**
1. Kiểm tra file `.env` có trong thư mục `server/` không
2. Kiểm tra tên biến có đúng chính xác không (case-sensitive)
3. Restart server sau khi sửa `.env`
4. Kiểm tra file `.env` có trong `.gitignore` không (nên có để không commit credentials)

---

### **Lỗi: "Invalid hash" khi callback**

**Nguyên nhân:**
- Secret key sai hoặc có khoảng trắng thừa
- Secret key bị xuống dòng

**Giải pháp:**
1. Kiểm tra `VNPAY_SECRET_KEY` trong `.env` là một dòng duy nhất
2. Xóa tất cả khoảng trắng thừa ở đầu/cuối
3. Verify secret key: `QYMHUM1C6PQUUCVV7T6AYDS5X1DFED0Q` (32 ký tự)

---

### **Lỗi: Redirect không hoạt động**

**Nguyên nhân:**
- `FRONTEND_URL` chưa được set
- URL không đúng format

**Giải pháp:**
1. Thêm `FRONTEND_URL=http://localhost:5173` vào `.env`
2. Restart server

---

## 📝 File `.env` mẫu (đầy đủ)

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=smartchargingstation_mvp

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# Server Configuration
PORT=3000
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:5173

# VNPay Configuration
VNPAY_TMN_CODE=3MQ86LBJ
VNPAY_SECRET_KEY=QYMHUM1C6PQUUCVV7T6AYDS5X1DFED0Q
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3000/api/payments/vnpay-callback
```

---

## ✅ Checklist

- [ ] File `.env` đã được tạo trong thư mục `server/`
- [ ] `VNPAY_TMN_CODE=3MQ86LBJ` đã được thêm vào `.env`
- [ ] `VNPAY_SECRET_KEY=QYMHUM1C6PQUUCVV7T6AYDS5X1DFED0Q` đã được thêm vào `.env` (một dòng duy nhất)
- [ ] `VNPAY_URL` và `VNPAY_RETURN_URL` đã được config
- [ ] `FRONTEND_URL` đã được config
- [ ] Server đã được restart sau khi sửa `.env`
- [ ] Test initialize payment thành công
- [ ] File `.env` đã được thêm vào `.gitignore` (không commit credentials)

---

## 🔒 Security Notes

1. **KHÔNG commit file `.env` lên Git**
   - Đảm bảo `.env` có trong `.gitignore`
   - Chỉ commit `.env.example` (không có credentials thật)

2. **Production:**
   - Dùng VNPay Production URL thay vì Sandbox
   - Dùng Production credentials (khác với Sandbox)
   - Set `NODE_ENV=production`

3. **Secret Key:**
   - Giữ bí mật, không chia sẻ công khai
   - Nếu bị lộ, liên hệ VNPay để reset

---

## 📚 References

- VNPay Sandbox: https://sandbox.vnpayment.vn/
- VNPay API Docs: https://sandbox.vnpayment.vn/apis/
- Test file: `server/TEST_VNPAY_PAYMENT.md`

