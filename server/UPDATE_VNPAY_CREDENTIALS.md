# 🔄 Cập nhật VNPay Credentials

## ✅ Credentials mới từ email VNPay

**Terminal ID (vnp_TmnCode):** `3MQ86LBJ`  
**Secret Key (vnp_HashSecret):** `QYMHUM1C6PQUUCVV7T6AYDS5X1DFED0Q`  
**URL:** `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html`

---

## 📝 Cách cập nhật

### **Bước 1: Mở file `.env`**

Mở file `server/.env` trong editor.

### **Bước 2: Cập nhật credentials**

Tìm và thay thế các dòng sau:

```env
# VNPay Configuration
VNPAY_TMN_CODE=3MQ86LBJ
VNPAY_SECRET_KEY=QYMHUM1C6PQUUCVV7T6AYDS5X1DFED0Q
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3000/api/payments/vnpay-callback
```

**⚠️ Lưu ý quan trọng:**
- `VNPAY_SECRET_KEY` phải là **một dòng duy nhất**, không có xuống dòng hoặc khoảng trắng thừa
- Copy chính xác từ email VNPay

### **Bước 3: Lưu file**

Lưu file `.env` sau khi cập nhật.

### **Bước 4: Restart server**

**Quan trọng:** Phải restart server để load lại environment variables mới.

```bash
# Dừng server hiện tại (Ctrl+C)
# Sau đó start lại
npm run dev
# hoặc
nodemon index.js
```

### **Bước 5: Kiểm tra**

Sau khi restart, kiểm tra trong terminal xem có log:
```
VNPay Config: { tmnCode: '3MQ86LBJ', hasSecret: true, secretLength: 32 }
```

Nếu thấy `tmnCode: '3MQ86LBJ'` thì đã load đúng.

---

## ✅ Checklist

- [ ] File `.env` đã được cập nhật với credentials mới
- [ ] `VNPAY_TMN_CODE=3MQ86LBJ`
- [ ] `VNPAY_SECRET_KEY=QYMHUM1C6PQUUCVV7T6AYDS5X1DFED0Q` (một dòng duy nhất)
- [ ] Server đã được restart
- [ ] Terminal log hiển thị `tmnCode: '3MQ86LBJ'`
- [ ] Test API `POST /api/payments/vnpay-init` thành công

---

## 🧪 Test sau khi cập nhật

1. **Test Initialize Payment:**
   ```bash
   POST http://localhost:3000/api/payments/vnpay-init
   Authorization: Bearer <user_token>
   Content-Type: application/json
   
   {
     "booking_id": 15
   }
   ```

2. **Kiểm tra redirect_url:**
   - URL phải chứa `vnp_TmnCode=3MQ86LBJ`
   - URL phải có `vnp_SecureHash` hợp lệ
   - Mở URL trong browser → Không còn lỗi "Sai chữ ký"

---

## 📧 Thông tin Merchant Admin

**URL:** `https://sandbox.vnpayment.vn/merchantv2/`  
**Email đăng nhập:** `nhannguyen13072003@gmail.com`

Bạn có thể đăng nhập vào Merchant Admin để:
- Xem lịch sử giao dịch
- Kiểm tra cấu hình
- Xem logs

---

## 🐛 Nếu vẫn lỗi

Nếu sau khi cập nhật credentials mới mà vẫn gặp lỗi "Sai chữ ký":

1. ✅ Kiểm tra lại file `.env` có đúng không
2. ✅ Đảm bảo server đã restart
3. ✅ Kiểm tra terminal log xem có load đúng credentials không
4. ✅ Test lại API với booking_id mới

Nếu vẫn không được, xem file `VNPAY_TROUBLESHOOTING.md` để biết thêm chi tiết.

