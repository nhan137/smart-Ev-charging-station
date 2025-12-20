# 📋 API Endpoints for React Frontend Integration

**Base URL:** `http://localhost:3000/api`

**Authentication:** Tất cả API (trừ login/register) cần header:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## 👤 USER APIs (9 chức năng)

### 1. Register / Login

#### 1.1. Register
```
POST /api/auth/register
```
**Body:**
```json
{
  "full_name": "Nguyễn Văn A",
  "email": "user@example.com",
  "password": "123456",
  "phone": "0901234567"
}
```

#### 1.2. Login
```
POST /api/auth/login
```
**Body:**
```json
{
  "email": "user@example.com",
  "password": "123456"
}
```
**Response:** `{ success, data: { user, token } }`

#### 1.3. Get Current User
```
GET /api/auth/me
```
**Auth:** Required

---

### 2. Search & View Map

#### 2.1. Get All Stations (with filters)
```
GET /api/stations?search=<keyword>&station_type=<xe_may|oto|ca_hai>&latitude=<lat>&longitude=<lng>
```
**Query Params:**
- `search`: Tìm kiếm theo tên/địa chỉ
- `station_type`: Lọc loại trạm
- `latitude`, `longitude`: Tọa độ để tính khoảng cách

**Response:** Array of stations với `station_id`, `station_name`, `address`, `latitude`, `longitude`, `price_per_kwh`, `total_slots`, `available_slots`, `status`, ...

---

### 3. View Station Details

#### 3.1. Get Station by ID
```
GET /api/stations/:station_id
```
**Response:** Full station details + reviews/ratings

---

### 4. Schedule Charging

#### 4.1. Create Booking
```
POST /api/bookings
```
**Body:**
```json
{
  "station_id": 1,
  "vehicle_type": "xe_may_usb",
  "start_time": "2025-12-17T14:00:00.000Z",
  "end_time": "2025-12-17T16:00:00.000Z",
  "promo_id": null
}
```
**Auth:** Required

#### 4.2. Get My Bookings (History)
```
GET /api/bookings/my?status=<pending|confirmed|charging|completed|cancelled>&page=1&limit=10
```
**Auth:** Required

#### 4.3. Get Booking Detail
```
GET /api/bookings/:booking_id
```
**Auth:** Required

---

### 5. Check Charging Status

#### 5.1. Get Charging Status (Real-time)
```
GET /api/bookings/:booking_id/charging/status
```
**Auth:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "booking_id": 101,
    "status": "charging",
    "energy_consumed": 5.2,
    "current_power": 3.5,
    "estimated_time_remaining": 45
  }
}
```

#### 5.2. Complete Charging Manually
```
POST /api/bookings/:booking_id/charging/complete
```
**Auth:** Required

---

### 6. Payment

#### 6.1. Initialize VNPay Payment
```
POST /api/payments/vnpay-init
```
**Body:**
```json
{
  "booking_id": 101,
  "amount": 50000
}
```
**Auth:** Required

**Response:** `{ payment_url: "https://sandbox.vnpayment.vn/..." }`

#### 6.2. VNPay Callback (Frontend redirect)
```
GET /api/payments/vnpay-callback?vnp_Amount=...&vnp_TransactionStatus=...
```
**Note:** Frontend redirect user đến URL này sau khi thanh toán

---

### 7. View History

#### 7.1. Get Booking History (đã có ở 4.2)
```
GET /api/bookings/my
```
**Response:** Bao gồm cả charging session và payment info

#### 7.2. Get Booking Detail (đã có ở 4.3)
```
GET /api/bookings/:booking_id
```

---

### 8. Rate Station

#### 8.1. Create Feedback/Rating
```
POST /api/feedbacks
```
**Body:**
```json
{
  "station_id": 1,
  "rating": 5,
  "comment": "Trạm sạc tốt, phục vụ nhanh chóng"
}
```
**Auth:** Required

---

### 9. Save Favorites

#### 9.1. Add to Favorites
```
POST /api/favorites
```
**Body:**
```json
{
  "station_id": 1
}
```
**Auth:** Required

#### 9.2. Remove from Favorites
```
DELETE /api/favorites/:station_id
```
**Auth:** Required

#### 9.3. Get My Favorites
```
GET /api/favorites/my
```
**Auth:** Required

---

### 🔔 User Notifications (Bonus)

#### Get Unread Notifications
```
GET /api/notifications/unread
```
**Auth:** Required

#### Get Notification History
```
GET /api/notifications?page=1&limit=10&type=<system|payment|promotion|booking>
```
**Auth:** Required

#### Mark as Read
```
PUT /api/notifications/:notification_id/read
```
**Auth:** Required

#### Mark All as Read
```
PUT /api/notifications/mark-all-read
```
**Auth:** Required

---

## 👨‍💼 MANAGER APIs (6 chức năng)

### 1. Manager Login

#### 1.1. Manager Login
```
POST /api/auth/manager/login
```
**Body:**
```json
{
  "email": "manager@example.com",
  "password": "123456"
}
```
**Response:** `{ success, data: { user, token } }`

---

### 2. View Managed Stations

#### 2.1. Get Manager's Stations
```
GET /api/manager/stations?status=<active|maintenance|inactive>
```
**Auth:** Required (Manager role)

**Response:** Array of stations managed by current manager

#### 2.2. Get Station Detail & Reviews
```
GET /api/manager/stations/:station_id
```
**Auth:** Required (Manager role)

**Response:** Station details + average_rating + recent_reviews

---

### 3. View & Confirm Schedules

#### 3.1. Get Station Bookings
```
GET /api/manager/stations/:station_id/bookings?status=<pending|confirmed|...>&start_date=2025-12-01&end_date=2025-12-31
```
**Auth:** Required (Manager role)

#### 3.2. Confirm Booking (Generate Check-in Code)
```
PUT /api/bookings/:booking_id/confirm
```
**Auth:** Required (Manager role)

**Response:**
```json
{
  "success": true,
  "data": {
    "checkin_code": "X9A2B1",
    "message": "Booking confirmed successfully"
  }
}
```

#### 3.3. Cancel Booking
```
PUT /api/bookings/:booking_id/cancel
```
**Auth:** Required (Manager role)

---

### 4. Update Station Status

#### 4.1. Update Station Status
```
PUT /api/manager/stations/:station_id/status
```
**Body:**
```json
{
  "status": "active" | "maintenance" | "inactive"
}
```
**Auth:** Required (Manager role)

---

### 5. Submit Reports

#### 5.1. Create Report (User → Manager hoặc Manager → Admin)
```
POST /api/reports
```
**Body (form-data):**
- `station_id`: number
- `title`: string
- `description`: string
- `image`: file (optional)
- `user_ids`: string (JSON array, optional - chỉ dùng khi Manager broadcast cho Users)

**Auth:** Required (User hoặc Manager)

**Flow:**
- **User gửi** → Notify Manager của trạm đó
- **Manager gửi** → Notify Admin

#### 5.2. Manager Resolve Report (từ User)
```
PUT /api/reports/:report_id/manager/resolve
```
**Auth:** Required (Manager role)

**Response:** Notify User "Báo cáo đã được Quản lý xử lý"

#### 5.3. Manager Escalate Report (chuyển lên Admin)
```
PUT /api/reports/:report_id/manager/escalate
```
**Auth:** Required (Manager role)

**Response:** 
- Tạo report mới cho Admin
- Notify User "Đã chuyển báo cáo cho Admin"
- Notify Admin "Báo cáo sự cố mới từ Quản lý trạm"

---

### 6. Dashboard Manager

#### 6.1. Get Dashboard Overview
```
GET /api/manager/dashboard
```
**Auth:** Required (Manager role)

**Response:**
```json
{
  "success": true,
  "data": {
    "manager_name": "Trần Thị B",
    "stats": {
      "total_stations": 2,
      "active_stations": 2,
      "today_bookings": 24,
      "today_revenue": 2450000
    },
    "recent_bookings": [
      {
        "id": 101,
        "customer_name": "Nguyen Van A",
        "station_name": "Trạm Sạc Hải Châu",
        "start_time": "2025-12-16T14:00:00.000Z",
        "status": "confirmed",
        "total_cost": 32000
      }
    ],
    "capacity": {
      "total_slots": 20,
      "used_slots": 6,
      "percent": 30.0
    }
  }
}
```

---

## 👑 ADMIN APIs (7 chức năng)

### 1. Admin Login

#### 1.1. Admin Login
```
POST /api/auth/admin/login
```
**Body:**
```json
{
  "email": "admin@example.com",
  "password": "123456"
}
```
**Response:** `{ success, data: { user, token } }`

---

### 2. Manage Users

#### 2.1. Get User Statistics
```
GET /api/admin/users/stats
```

#### 2.2. Get All Users
```
GET /api/admin/users?search=<keyword>&role_id=<1|2|3>&status=<active|locked>&page=1&limit=10
```

#### 2.3. Get User by ID
```
GET /api/admin/users/:user_id
```

#### 2.4. Create User
```
POST /api/admin/users
```
**Body:**
```json
{
  "full_name": "Nguyễn Văn A",
  "email": "newuser@example.com",
  "password": "123456",
  "phone": "0901234567",
  "role_id": 1
}
```

#### 2.5. Update User
```
PUT /api/admin/users/:user_id
```

#### 2.6. Update User Status (Lock/Unlock)
```
PUT /api/admin/users/:user_id/status
```
**Body:**
```json
{
  "status": "active" | "locked"
}
```

#### 2.7. Delete User
```
DELETE /api/admin/users/:user_id
```

---

### 3. Manage Stations

#### 3.1. Get Station Statistics
```
GET /api/admin/stations/stats
```

#### 3.2. Get All Stations
```
GET /api/admin/stations?search=<keyword>&status=<active|maintenance|inactive>&page=1&limit=10
```

#### 3.3. Get Station by ID
```
GET /api/admin/stations/:station_id
```

#### 3.4. Create Station
```
POST /api/admin/stations
```
**Body:** Full station object (station_name, address, latitude, longitude, price_per_kwh, station_type, total_slots, manager_id, ...)

#### 3.5. Update Station
```
PUT /api/admin/stations/:station_id
```

#### 3.6. Delete Station
```
DELETE /api/admin/stations/:station_id
```

---

### 4. Manage Schedules (Bookings)

#### 4.1. Get Booking Statistics
```
GET /api/admin/bookings/stats
```
**Response:**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "pending": 10,
    "charging": 5,
    "completed": 120
  }
}
```

#### 4.2. Get All Bookings
```
GET /api/admin/bookings?station_id=<id>&status=<pending|...>&start_date=2025-12-01&end_date=2025-12-31&search=<keyword>&page=1&limit=10
```

#### 4.3. Get Booking by ID
```
GET /api/admin/bookings/:booking_id
```

#### 4.4. Cancel Booking
```
PUT /api/admin/bookings/:booking_id/cancel
```

---

### 5. Manage Payments & Revenue

#### 5.1. Get Payment Statistics
```
GET /api/admin/payments/stats
```
**Response:**
```json
{
  "success": true,
  "data": {
    "total_revenue": 50000000,
    "pending_amount": 500000,
    "pending_count": 5,
    "success_rate": 95.5
  }
}
```

#### 5.2. Get All Payments
```
GET /api/admin/payments?station_id=<id>&status=<pending|success|failed>&start_date=2025-12-01&end_date=2025-12-31&search=<keyword>&page=1&limit=10
```

#### 5.3. Get Payment by ID
```
GET /api/admin/payments/:payment_id
```

#### 5.4. Export Payments to CSV/Excel
```
GET /api/admin/payments/export?station_id=<id>&status=<...>&start_date=...&end_date=...
```
**Response:** CSV file download

---

### 6. View Statistics (Dashboard)

#### 6.1. Get Overview Statistics
```
GET /api/admin/dashboard/overview?type=<month|year>
```
**Response:**
```json
{
  "success": true,
  "data": {
    "total_users": 500,
    "total_bookings": 1200,
    "total_revenue": 50000000,
    "total_kwh": 15000
  }
}
```

#### 6.2. Get Highlights
```
GET /api/admin/dashboard/highlights
```
**Response:**
```json
{
  "success": true,
  "data": {
    "top_station": { "station_name": "...", "total": 150 },
    "top_spender": { "full_name": "...", "total_spent": 5000000 },
    "cancel_rate": 5.2,
    "maintenance_stations": 3
  }
}
```

#### 6.3. Get Revenue Chart Data
```
GET /api/admin/dashboard/charts/revenue
```
**Response:** Array of { month, revenue } for last 6 months

#### 6.4. Get Booking Trend Chart
```
GET /api/admin/dashboard/charts/booking-trend
```
**Response:** Array of { day, count } for current week

#### 6.5. Get Station Types Chart
```
GET /api/admin/dashboard/charts/station-types
```
**Response:** Array of { type, value } for pie chart

#### 6.6. Get Recent Activities
```
GET /api/admin/dashboard/recent-activities
```
**Response:** System notifications + recent bookings/payments

---

### 7. Send Notifications

#### 7.1. Send Notification
```
POST /api/admin/notifications
```
**Body:**
```json
{
  "title": "Thông báo bảo trì",
  "message": "Hệ thống sẽ bảo trì từ 22h đến 24h",
  "type": "system",
  "recipient_type": "all" | "selected",
  "user_ids": [1, 2, 3]  // Nếu recipient_type = "selected"
}
```

#### 7.2. Get Notification History
```
GET /api/admin/notifications/history?page=1&limit=10
```

---

### 📋 Admin - Report Management (Bonus)

#### Get Reports from Managers
```
GET /api/reports/admin
```
**Auth:** Required (Admin role)

**Response:** Array of reports do Manager gửi lên

#### Update Report Status (Approve/Resolve)
```
PUT /api/reports/:report_id/status
```
**Body:**
```json
{
  "status": "pending" | "resolved"
}
```
**Auth:** Required (Admin role)

**Note:** Khi `status = "resolved"` → Tự động notify Manager "Báo cáo của bạn đã được admin xử lý"

---

## ✅ Kiểm tra tính năng đầy đủ

### USER APIs ✅
- [x] 1. Register / Login
- [x] 2. Search & View Map
- [x] 3. View Station Details
- [x] 4. Schedule Charging
- [x] 5. Check Charging Status
- [x] 6. Payment
- [x] 7. View History
- [x] 8. Rate Station
- [x] 9. Save Favorites
- [x] Bonus: Notifications

### MANAGER APIs ✅
- [x] 1. Manager Login
- [x] 2. View Managed Stations
- [x] 3. View & Confirm Schedules
- [x] 4. Update Station Status
- [x] 5. Submit Reports
- [x] 6. Dashboard Manager

### ADMIN APIs ✅
- [x] 1. Admin Login
- [x] 2. Manage Users
- [x] 3. Manage Stations
- [x] 4. Manage Schedules
- [x] 5. Manage Payments & Revenue
- [x] 6. View Statistics
- [x] 7. Send Notifications
- [x] Bonus: Report Management

---

## 📝 Ghi chú cho Frontend

1. **Authentication Flow:**
   - Login → Lưu `token` vào localStorage/sessionStorage
   - Mỗi request cần header: `Authorization: Bearer <token>`
   - Nếu 401 → Redirect về login

2. **Real-time Charging Status:**
   - Dùng Socket.IO để listen `booking_<booking_id>` room
   - Hoặc polling `GET /api/bookings/:id/charging/status` mỗi 5-10 giây

3. **File Upload (Reports):**
   - Dùng `FormData` với field name `image`
   - Content-Type: `multipart/form-data`

4. **Pagination:**
   - Tất cả list APIs hỗ trợ `page` và `limit`
   - Response thường có `total`, `page`, `limit`, `data`

5. **Error Handling:**
   - Status 400: Validation error → Hiển thị message
   - Status 401: Unauthorized → Redirect login
   - Status 403: Forbidden → Không có quyền
   - Status 404: Not found
   - Status 500: Server error

---

**🎉 Dự án đã đầy đủ tất cả tính năng theo yêu cầu!**

