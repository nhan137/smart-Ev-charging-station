# Giải thích chi tiết về Authentication và GET /api/auth/me

## 🔐 Token là gì?

**Token (JWT - JSON Web Token)** giống như một "thẻ căn cước" tạm thời:
- Khi bạn đăng nhập thành công, server tạo một token duy nhất cho bạn
- Token này chứa thông tin: user_id, thời gian hết hạn (7 ngày)
- Token được mã hóa, không thể giả mạo

## 📋 Flow hoàn chỉnh:

### Bước 1: Đăng ký/Đăng nhập → Nhận Token
```
POST /api/auth/login
Body: { "email": "...", "password": "..." }

Response:
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  ← ĐÂY LÀ TOKEN
  }
}
```

### Bước 2: Lưu Token
- Frontend lưu token vào: localStorage, sessionStorage, hoặc memory
- Token này sẽ dùng cho các request tiếp theo

### Bước 3: Dùng Token để gọi API Protected
```
GET /api/auth/me
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🎯 Tại sao cần GET /api/auth/me?

### Vấn đề thực tế:
1. **Khi user reload trang:**
   - Frontend chỉ có token trong localStorage
   - Cần lấy lại thông tin user (tên, email, role...)
   - → Gọi GET /api/auth/me với token

2. **Kiểm tra token còn hợp lệ không:**
   - Token có thể hết hạn
   - User có thể bị khóa
   - → Gọi GET /api/auth/me để verify

3. **Lấy thông tin user mới nhất:**
   - User có thể đổi tên, số điện thoại
   - → Gọi GET /api/auth/me để lấy data mới nhất

## 🔍 Cách hoạt động của GET /api/auth/me:

```
1. Frontend gửi request với token trong Header
   ↓
2. Middleware "authenticate" kiểm tra:
   - Token có tồn tại không?
   - Token có hợp lệ không?
   - Token có hết hạn không?
   ↓
3. Nếu OK → Lấy user_id từ token
   ↓
4. Query database lấy thông tin user
   ↓
5. Trả về thông tin user (KHÔNG có password)
```

## ❌ Lỗi bạn gặp:

**Lỗi:** `401 Unauthorized - No token provided`

**Nguyên nhân:** 
- Bạn gọi GET /api/auth/me nhưng KHÔNG gửi token trong Header
- Server không biết bạn là ai → Từ chối request

## ✅ Cách test ĐÚNG trong Postman:

### Cách 1: Dùng tab Authorization (Dễ nhất)

1. **Tạo request mới:**
   - Method: `GET`
   - URL: `http://localhost:3000/api/auth/me`

2. **Vào tab "Authorization":**
   - Type: Chọn `Bearer Token`
   - Token: Paste token bạn nhận được từ login
     ```
     eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJpZCI6NCwiaWF0IjoxNzY1MTE4NjA3LCJleHAiOjE3NjU3MjM0MDd9.Z4uMrvNhxeVeg-g4NEbdfi7s5c30RvyR68_C7B7VIeE
     ```

3. **Send** → Sẽ nhận được thông tin user

### Cách 2: Dùng tab Headers (Thủ công)

1. **Tạo request mới:**
   - Method: `GET`
   - URL: `http://localhost:3000/api/auth/me`

2. **Vào tab "Headers":**
   - Key: `Authorization`
   - Value: `Bearer <paste_token_ở_đây>`
     ```
     Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     ```
   ⚠️ **QUAN TRỌNG:** Phải có chữ "Bearer " (có dấu cách) trước token!

3. **Send** → Sẽ nhận được thông tin user

## 📝 Ví dụ thực tế trong Frontend:

```javascript
// 1. Login và lưu token
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
});
const { data } = await loginResponse.json();
localStorage.setItem('token', data.token); // Lưu token

// 2. Sau đó, khi cần thông tin user
const token = localStorage.getItem('token');
const userResponse = await fetch('/api/auth/me', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}` // Gửi token trong header
  }
});
const userData = await userResponse.json();
console.log(userData.data); // Thông tin user
```

## 🎓 Tóm tắt:

1. **Token** = "Thẻ căn cước" để chứng minh bạn đã đăng nhập
2. **GET /api/auth/me** = Dùng token để lấy thông tin user hiện tại
3. **Cách gửi token:** Thêm vào Header với format: `Authorization: Bearer <token>`
4. **Lỗi 401** = Bạn chưa gửi token hoặc token sai format

