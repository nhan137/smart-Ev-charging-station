# Hướng dẫn Test Token - Fix lỗi "Invalid token"

## 🔍 Vấn đề bạn gặp:

Token trong Postman bị **CẮT NGẮN**:
```
Token hiện tại: JeyJhbGciOiJIUzI1NilsInR5cCI6IkpXVC
Token đúng:     eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJpZCI6NCwiaWF0IjoxNzY1MTE4NjA3LCJleHAiOjE3NjU3MjM0MDd9.Z4uMrvNhxeVeg-g4NEbdfi7s5c30RvyR68_C7B7VIeE
```

## ✅ Cách copy token ĐÚNG:

### Bước 1: Login lại để lấy token mới

**Request:**
```
POST http://localhost:3000/api/auth/login
Body (JSON):
{
  "email": "newuser@example.com",
  "password": "password123"
}
```

### Bước 2: Copy TOÀN BỘ token từ response

**Response sẽ có dạng:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJpZCI6NCwiaWF0IjoxNzY1MTE4NjA3LCJleHAiOjE3NjU3MjM0MDd9.Z4uMrvNhxeVeg-g4NEbdfi7s5c30RvyR68_C7B7VIeE"
  }
}
```

**⚠️ QUAN TRỌNG:**
- Token có 3 phần, ngăn cách bởi dấu chấm (.)
- Phải copy TOÀN BỘ token, không được thiếu ký tự nào
- Token thường dài khoảng 200-300 ký tự

### Bước 3: Paste vào Postman

**Cách 1: Tab Authorization**
1. Vào tab "Authorization"
2. Type: "Bearer Token"
3. Token: Paste TOÀN BỘ token (không có chữ "Bearer" ở đây)
4. Postman sẽ tự động thêm "Bearer " vào header

**Cách 2: Tab Headers**
1. Vào tab "Headers"
2. Key: `Authorization`
3. Value: `Bearer <paste_toàn_bộ_token>`
   - Ví dụ: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 🔧 Kiểm tra token có đúng không:

Token JWT có format:
```
<header>.<payload>.<signature>
```

Ví dụ token đúng:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJpZCI6NCwiaWF0IjoxNzY1MTE4NjA3LCJleHAiOjE3NjU3MjM0MDd9.Z4uMrvNhxeVeg-g4NEbdfi7s5c30RvyR68_C7B7VIeE
```

- Phần 1: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`
- Phần 2: `eyJ1c2VyX2lkIjo0LCJpZCI6NCwiaWF0IjoxNzY1MTE4NjA3LCJleHAiOjE3NjU3MjM0MDd9`
- Phần 3: `Z4uMrvNhxeVeg-g4NEbdfi7s5c30RvyR68_C7B7VIeE`

## 🎯 Các lỗi thường gặp:

1. **Token bị cắt ngắn** → Copy lại toàn bộ
2. **Thiếu "Bearer "** → Phải có "Bearer " trước token
3. **Token hết hạn** → Login lại để lấy token mới
4. **Có khoảng trắng thừa** → Xóa khoảng trắng đầu/cuối

## 📝 Checklist trước khi test:

- [ ] Đã login và nhận được token
- [ ] Token có đủ 3 phần (có 2 dấu chấm)
- [ ] Token dài khoảng 200-300 ký tự
- [ ] Đã paste TOÀN BỘ token vào Postman
- [ ] Có "Bearer " trước token (nếu dùng Headers)
- [ ] Không có khoảng trắng thừa

