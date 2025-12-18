# 🧪 Hướng dẫn Test Real-Time Charging System - Từ Đầu Đến Cuối

## 📋 Chuẩn bị

1. **Cài đặt packages:**
```bash
cd server
npm install
```

2. **Đảm bảo MySQL đang chạy và có database `smartchargingstation_mvp`**

3. **Chuẩn bị 3 terminal windows:**
   - Terminal 1: Server
   - Terminal 2: IoT Simulator
   - Terminal 3: Socket.IO Client (hoặc Postman)

---

## 🚀 BƯỚC 1: Khởi động Server

**Terminal 1:**
```bash
cd server
npm run dev
```

**Kết quả mong đợi:**
```
MySQL Connected successfully
Server is running on port 3000
Socket.IO server is ready
Environment: development
```

**✅ Nếu thấy 3 dòng trên = Server đã sẵn sàng**

---

## 🔐 BƯỚC 2: Login và lấy JWT Token

**Postman hoặc Terminal:**

**POST** `http://localhost:3000/api/auth/login`

**Body (JSON):**
```json
{
  "email": "khachhang@app.com",
  "password": "nhannok"
}
```

**Response mong đợi:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**✅ Copy `token` để dùng cho các bước sau**

---

## 📝 BƯỚC 3: Tạo Booking (nếu chưa có)

**POST** `http://localhost:3000/api/bookings`

**Headers:**
- `Authorization: Bearer <token-vừa-copy>`

**Body (JSON):**
```json
{
  "station_id": 1,
  "vehicle_type": "xe_may_usb",
  "start_time": "2025-12-08T10:00:00Z",
  "end_time": "2025-12-08T14:00:00Z"
}
```

**Response mong đợi:**
```json
{
  "success": true,
  "data": {
    "booking_id": 2,
    "station_name": "Trạm Sạc Cầu Rồng",
    ...
  }
}
```

**✅ Copy `booking_id` (ví dụ: 2)**

---

## 📊 BƯỚC 4: Lấy Initial Charging Status

**GET** `http://localhost:3000/api/bookings/2/charging/status`

**Headers:**
- `Authorization: Bearer <token>`

**Response mong đợi:**
```json
{
  "success": true,
  "data": {
    "booking_id": 2,
    "station_name": "Trạm Sạc Cầu Rồng",
    "status": "pending",
    "current_battery_percent": null,
    "energy_consumed": 0,
    "estimated_cost": 0,
    "time_remaining": "4 giờ 0 phút",
    "socket_room": "booking_2",        ← QUAN TRỌNG
    "socket_url": "http://localhost:3000"
  }
}
```

**✅ Kiểm tra:**
- `success: true`
- Có `socket_room: "booking_2"` ← Đây là dấu hiệu API hoạt động đúng

---

## 🔌 BƯỚC 5: Kết nối Socket.IO Client

**Terminal 3:**
```bash
cd server
npm run test-socket 2
# (2 là booking_id)
```

**Kết quả mong đợi:**
```
========================================
Socket.IO Client Test
========================================
Socket URL: http://localhost:3000
Booking ID: 2
Room: booking_2
========================================

✓ Connected to server (Socket ID: abc123)

Joining room: booking_2...
✓ Joined room: booking_2
  Booking ID: 2

Waiting for charging updates...
```

**✅ Kiểm tra:**
- "✓ Connected to server"
- "✓ Joined room: booking_2"
- Đang "Waiting for charging updates..."

**→ Giữ terminal này mở để xem real-time updates**

---

## 🤖 BƯỚC 6: Khởi động IoT Simulator

**Terminal 2 (Windows PowerShell):**
```powershell
cd server
$env:BOOKING_ID=3; npm run iot-simulator
```
*(Thay `3` bằng `booking_id` bạn đã copy ở Bước 3)*

**Hoặc Windows CMD:**
```cmd
cd server
set BOOKING_ID=3 && npm run iot-simulator
```

**Kết quả mong đợi:**
```
========================================
IoT Charging Station Simulator
========================================
API URL: http://localhost:3000
Booking ID: 2
Update Interval: 3000ms (3 seconds)
Initial Battery: 50%
Initial Energy: 0 kWh
========================================
Starting simulation...

[12:00:00] Sending update to booking 2:
  - Battery: 51%
  - Energy: 0.1 kWh
  - URL: http://localhost:3000/internal/charging-update/2
  ✓ Update sent successfully
  - Estimated Cost: 350₫
  - Time Remaining: 3 giờ 59 phút

[12:00:03] Sending update to booking 2:
  - Battery: 52%
  - Energy: 0.2 kWh
  ✓ Update sent successfully
  ...
```

**✅ Kiểm tra:**
- Mỗi 3 giây có log mới
- Battery tăng: 51% → 52% → 53% ...
- Energy tăng: 0.1 → 0.2 → 0.3 ...
- "✓ Update sent successfully" mỗi lần

---

## 📡 BƯỚC 7: Kiểm tra Real-Time Updates

**Quay lại Terminal 3 (Socket.IO Client):**

Bạn sẽ thấy updates mỗi 3 giây:
```
════════════════════════════════════════
📡 REAL-TIME UPDATE RECEIVED
════════════════════════════════════════
Booking ID: 2
Station: Trạm Sạc Cầu Rồng
Status: charging
Battery: 51%
Energy: 0.1 kWh
Cost: 350₫
Time Remaining: 3 giờ 59 phút
Timestamp: 12:00:00
════════════════════════════════════════

════════════════════════════════════════
📡 REAL-TIME UPDATE RECEIVED
════════════════════════════════════════
Battery: 52%
Energy: 0.2 kWh
Cost: 700₫
...
```

**✅ Kiểm tra:**
- Nhận "📡 REAL-TIME UPDATE RECEIVED" mỗi 3 giây
- Battery, Energy, Cost tăng dần
- Timestamp khác nhau mỗi lần

**→ Đây là dấu hiệu Socket.IO hoạt động đúng!**

---

## 🖥️ BƯỚC 8: Kiểm tra Server Console

**Quay lại Terminal 1 (Server):**

Bạn sẽ thấy:
```
[Socket.IO] Client connected: abc123
[Socket.IO] Client abc123 joined room: booking_2
[Socket.IO] Emitted charging_update to room: booking_2
[Socket.IO] Emitted charging_update to room: booking_2
[Socket.IO] Emitted charging_update to room: booking_2
...
```

**✅ Kiểm tra:**
- "Client connected" khi Socket.IO client join
- "Emitted charging_update" mỗi khi nhận update từ IoT
- Log xuất hiện mỗi 3 giây

---

## 🗄️ BƯỚC 9: Verify Database

**Kiểm tra trong phpMyAdmin hoặc MySQL:**

```sql
SELECT * FROM charging_sessions WHERE booking_id = 2;
```

**Kết quả mong đợi:**
- `energy_consumed` tăng dần: 0.1 → 0.2 → 0.3 ...
- `start_battery_percent` tăng dần: 51 → 52 → 53 ...
- `started_at` có giá trị

**✅ Data được update đúng = System hoạt động hoàn hảo**

---

## ✅ BƯỚC 10: Tổng kết - System hoạt động đúng khi:

### **Checklist cuối cùng:**

- [ ] **Terminal 1 (Server):** Có log "Emitted charging_update" mỗi 3 giây
- [ ] **Terminal 2 (IoT):** Gửi update thành công mỗi 3 giây
- [ ] **Terminal 3 (Socket.IO):** Nhận "REAL-TIME UPDATE" mỗi 3 giây
- [ ] **Postman GET status:** Response có `socket_room`
- [ ] **Postman POST internal:** Response có "broadcasted"
- [ ] **Database:** Data được update đúng

**Nếu tất cả ✅ = System hoạt động hoàn hảo!**

---

## 🛑 Kết thúc Test

### **Cách dừng:**

1. **Dừng IoT Simulator (Terminal 2):**
   - Nhấn `Ctrl + C`
   - Hoặc đợi battery đạt 100% (tự động dừng)

2. **Dừng Socket.IO Client (Terminal 3):**
   - Nhấn `Ctrl + C`

3. **Dừng Server (Terminal 1):**
   - Nhấn `Ctrl + C`
   - Hoặc để chạy tiếp (nếu cần test tiếp)

---

## 📊 Tóm tắt Flow Test:

```
1. Start Server (Terminal 1)
   ↓
2. Login → Get Token
   ↓
3. Create Booking → Get booking_id
   ↓
4. GET Status → Get socket_room
   ↓
5. Connect Socket.IO Client (Terminal 3)
   ↓
6. Start IoT Simulator (Terminal 2)
   ↓
7. Verify: IoT gửi → Server emit → Client nhận
   ↓
8. Check Database updated
   ↓
✅ System hoạt động đúng!
```

---

## 🎯 Kết luận

**Bắt đầu từ:** Bước 1 (Start Server)
**Kết thúc khi:** Tất cả checklist ở Bước 10 đều ✅

**Thời gian test:** ~2-3 phút để verify toàn bộ system

