# API Documentation - Auth Endpoints

## Base URL
```
http://localhost:3000/api/auth
```

## Endpoints

### 1. Register (Đăng ký)
**POST** `/api/auth/register`

**Request Body:**
```json
{
  "full_name": "Nguyễn Văn A",
  "email": "user@example.com",
  "password": "password123",
  "phone": "0912345678"  // Optional
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "user_id": 1,
      "full_name": "Nguyễn Văn A",
      "email": "user@example.com",
      "phone": "0912345678",
      "role_id": 1,
      "status": "active",
      "created_at": "2025-12-07T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Email is required",
      "param": "email",
      "location": "body"
    }
  ]
}
```

---

### 2. Login (Đăng nhập)
**POST** `/api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "user_id": 1,
      "full_name": "Nguyễn Văn A",
      "email": "user@example.com",
      "phone": "0912345678",
      "role_id": 1,
      "status": "active",
      "created_at": "2025-12-07T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response (Error - 401):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

### 3. Get Current User (Lấy thông tin user hiện tại)
**GET** `/api/auth/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "user_id": 1,
    "full_name": "Nguyễn Văn A",
    "email": "user@example.com",
    "phone": "0912345678",
    "role_id": 1,
    "status": "active",
    "created_at": "2025-12-07T10:00:00.000Z"
  }
}
```

**Response (Error - 401):**
```json
{
  "success": false,
  "message": "No token provided, authorization denied"
}
```

---

## Test với cURL

### Register:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Nguyễn Văn A",
    "email": "test@example.com",
    "password": "password123",
    "phone": "0912345678"
  }'
```

### Login:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "khachhang@app.com",
    "password": "password123"
  }'
```

### Get Me (with token):
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Test với dữ liệu đã có

Dựa trên dữ liệu đã chèn vào MySQL:

**Login với User:**
- Email: `khachhang@app.com`
- Password: (password đã hash trong DB, cần biết password gốc để test)

**Login với Manager:**
- Email: `manager@app.com`

**Login với Admin:**
- Email: `admin@app.com`

**Lưu ý:** Password trong database đã được hash. Để test, bạn cần:
1. Tạo user mới qua API register (password sẽ được hash tự động)
2. Hoặc biết password gốc trước khi hash để test login

