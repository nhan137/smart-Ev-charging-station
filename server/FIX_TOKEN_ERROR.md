# 🔧 Fix lỗi "Invalid token" - Token bị cắt ngắn

## ❌ Vấn đề:

Token trong Postman của bạn bị **CẮT NGẮN**:
```
Token hiện tại: JeyJhbGciOiJIUzI1NilsInR5cCI6IkpXVC
```

Token này **KHÔNG ĐẦY ĐỦ** - thiếu phần cuối!

## ✅ Token đúng phải có 3 phần:

Token JWT có format: `header.payload.signature`

Ví dụ token đúng (dài ~200-300 ký tự):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJpZCI6NCwiaWF0IjoxNzY1MTE4NjA3LCJleHAiOjE3NjU3MjM0MDd9.Z4uMrvNhxeVeg-g4NEbdfi7s5c30RvyR68_C7B7VIeE
```

## 🎯 Cách fix:

### Bước 1: Login lại để lấy token MỚI

**Request:**
```
POST http://localhost:3000/api/auth/login
```

**Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password123"
}
```

### Bước 2: Copy TOÀN BỘ token từ response

**Response sẽ có:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJpZCI6NCwiaWF0IjoxNzY1MTE4NjA3LCJleHAiOjE3NjU3MjM0MDd9.Z4uMrvNhxeVeg-g4NEbdfi7s5c30RvyR68_C7B7VIeE"
  }
}
```

**⚠️ QUAN TRỌNG:**
1. Click vào phần `"token"` trong response
2. Chọn TOÀN BỘ text (Ctrl+A)
3. Copy (Ctrl+C)
4. Token phải có **2 dấu chấm (.)** - đây là dấu hiệu token đầy đủ
5. Token phải dài khoảng **200-300 ký tự**

### Bước 3: Paste vào Postman

**Cách 1: Tab Authorization (Khuyên dùng)**
1. Vào tab **"Authorization"**
2. Type: Chọn **"Bearer Token"**
3. Token: Paste TOÀN BỘ token (không có chữ "Bearer")
4. Postman tự động thêm "Bearer " vào header

**Cách 2: Tab Headers**
1. Vào tab **"Headers"**
2. Key: `Authorization`
3. Value: `Bearer <paste_toàn_bộ_token>`
   - Ví dụ: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 🔍 Kiểm tra token có đúng không:

Token đúng phải có:
- ✅ 2 dấu chấm (.) - ngăn cách 3 phần
- ✅ Dài khoảng 200-300 ký tự
- ✅ Bắt đầu bằng `eyJ` (không phải `JeyJ`)
- ✅ Không có khoảng trắng ở đầu/cuối

## 📝 Ví dụ token đúng:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJpZCI6NCwiaWF0IjoxNzY1MTE4NjA3LCJleHAiOjE3NjU3MjM0MDd9.Z4uMrvNhxeVeg-g4NEbdfi7s5c30RvyR68_C7B7VIeE
```

Phân tích:
- Phần 1 (header): `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`
- Phần 2 (payload): `eyJ1c2VyX2lkIjo0LCJpZCI6NCwiaWF0IjoxNzY1MTE4NjA3LCJleHAiOjE3NjU3MjM0MDd9`
- Phần 3 (signature): `Z4uMrvNhxeVeg-g4NEbdfi7s5c30RvyR68_C7B7VIeE`

## ⚠️ Lưu ý:

1. **KHÔNG** copy token từ URL bar
2. **KHÔNG** copy token bị cắt ngắn
3. **PHẢI** copy từ response JSON
4. **PHẢI** copy TOÀN BỘ token (từ đầu đến cuối)

## 🎯 Test lại:

Sau khi copy token đúng:
1. GET `http://localhost:3000/api/auth/me`
2. Thêm token vào Authorization header
3. Send
4. Kết quả: `200 OK` với thông tin user

