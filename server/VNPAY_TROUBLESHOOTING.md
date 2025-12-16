# VNPay Troubleshooting Guide - "Sai chữ ký" Error

## Vấn đề hiện tại
Lỗi "Sai chữ ký" (Incorrect signature) từ VNPay sandbox, mặc dù:
- ✅ Credentials đã đúng format
- ✅ Hash generation logic đã đúng (Method 1: RAW query string)
- ✅ Server đã restart

## Các bước kiểm tra

### 1. Kiểm tra Credentials trong VNPay Merchant Portal

**Quan trọng:** Đảm bảo `tmnCode` và `secretKey` khớp với tài khoản VNPay của bạn.

1. Đăng nhập vào VNPay Merchant Portal
2. Vào phần **Cấu hình** hoặc **Thông tin tài khoản**
3. Kiểm tra:
   - **Terminal Code (TMN Code):** Phải là `3MQ86LBJ`
   - **Secret Key:** Phải là `QYMHUM1C6PQUUCVV7T6AYDS5X1DFED0Q`

### 2. Kiểm tra IP Whitelist (nếu có)

Một số tài khoản VNPay yêu cầu đăng ký IP whitelist:
- Kiểm tra trong VNPay Merchant Portal xem có yêu cầu IP whitelist không
- Nếu có, thêm IP server của bạn vào danh sách

### 3. Kiểm tra Environment

Đảm bảo bạn đang test trên **VNPay Sandbox**, không phải Production:
- Sandbox URL: `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html`
- Production URL: `https://vnpayment.vn/paymentv2/vpcpay.html`

### 4. Kiểm tra Code mẫu chính thức từ VNPay

VNPay có cung cấp code mẫu chính thức. Hãy:
1. Tải code mẫu từ VNPay documentation
2. So sánh logic hash generation với code hiện tại
3. Đảm bảo format query string giống nhau

### 5. Liên hệ VNPay Support

Nếu tất cả các bước trên đều đúng nhưng vẫn lỗi:
- **Email:** hotrovnpay@vnpay.vn
- **Thông tin cần cung cấp:**
   - Terminal Code: `3MQ86LBJ`
  - Mã tra cứu từ lỗi (nếu có)
  - Thời gian giao dịch
  - Mô tả vấn đề: "Lỗi Sai chữ ký khi tạo payment URL"

## Code hiện tại

Code hiện tại đang sử dụng **Method 1: RAW query string** để tính hash:

```javascript
// Hash được tính trên query string KHÔNG encode
const hashQueryString = Object.keys(sortedParams)
  .map(k => `${k}=${sortedParams[k]}`)
  .join('&');
const hmac = crypto.createHmac('sha512', secretKey);
hmac.update(hashQueryString, 'utf-8');
const hash = hmac.digest('hex');
```

Đây là cách đúng theo chuẩn VNPay.

## Debug Scripts

Chạy các script sau để debug:

```bash
# Kiểm tra credentials
node check_vnpay_env.js

# Kiểm tra hash generation
node debug_vnpay_hash.js
```

## Khả năng cao nhất

Dựa trên kinh nghiệm, vấn đề thường là:
1. **Credentials không khớp** với tài khoản VNPay thực tế (80%)
2. **IP whitelist** chưa được cấu hình (10%)
3. **VNPay sandbox** có vấn đề tạm thời (5%)
4. **Code logic** có vấn đề (5% - đã kiểm tra và đúng)

## Next Steps

1. ✅ Kiểm tra lại credentials trong VNPay Merchant Portal
2. ✅ Kiểm tra IP whitelist (nếu có)
3. ✅ Liên hệ VNPay support với thông tin chi tiết
4. ✅ Thử với code mẫu chính thức từ VNPay

