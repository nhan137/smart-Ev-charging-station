# Hướng dẫn Verify Real-Time System hoạt động đúng

## ✅ Các Response cần kiểm tra

---

## 1. GET /api/bookings/:id/charging/status

### **Response thành công:**
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
    "socket_room": "booking_2",        ← QUAN TRỌNG: Có socket_room
    "socket_url": "http://localhost:3000"
  }
}
```

**✅ Dấu hiệu đúng:**
- `success: true`
- Có field `socket_room: "booking_2"`
- Có field `socket_url`

---

## 2. POST /internal/charging-update/:booking_id

### **Response thành công:**
```json
{
  "success": true,
  "message": "Charging update received and broadcasted",  ← QUAN TRỌNG: "broadcasted"
  "data": {
    "booking_id": 2,
    "station_name": "Trạm Sạc Cầu Rồng",
    "status": "charging",
    "current_battery_percent": 55,
    "energy_consumed": 1.5,
    "estimated_cost": 5250,
    "time_remaining": "3 giờ 45 phút"
  }
}
```

**✅ Dấu hiệu đúng:**
- `success: true`
- `message` có chứa "broadcasted" → Socket.IO đã emit
- `data` có đầy đủ thông tin

### **Kiểm tra Server Console:**
Bạn sẽ thấy log:
```
[Socket.IO] Emitted charging_update to room: booking_2
```
→ Nếu có log này = Socket.IO đã emit thành công

---

## 3. IoT Simulator Console Output

### **Output đúng:**
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
  - URL: http://localhost:3000/internal/charging-update/2
  ✓ Update sent successfully
  - Estimated Cost: 700₫
  - Time Remaining: 3 giờ 58 phút
```

**✅ Dấu hiệu đúng:**
- Mỗi 3 giây có log mới
- Battery tăng dần: 51% → 52% → 53% ...
- Energy tăng dần: 0.1 → 0.2 → 0.3 ...
- Có "✓ Update sent successfully"
- Có Estimated Cost và Time Remaining

---

## 4. Socket.IO Client Console Output

### **Output đúng:**
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
Booking ID: 2
Station: Trạm Sạc Cầu Rồng
Status: charging
Battery: 52%
Energy: 0.2 kWh
Cost: 700₫
Time Remaining: 3 giờ 58 phút
Timestamp: 12:00:03
════════════════════════════════════════
```

**✅ Dấu hiệu đúng:**
- "✓ Connected to server"
- "✓ Joined room: booking_2"
- Nhận "📡 REAL-TIME UPDATE RECEIVED" mỗi 3 giây
- Data update đúng (battery, energy, cost tăng dần)
- Timestamp khác nhau mỗi lần

---

## 5. Server Console Output

### **Output đúng:**
```
Server is running on port 3000
Socket.IO server is ready
Environment: development

[Socket.IO] Client connected: abc123
[Socket.IO] Client abc123 joined room: booking_2
[Socket.IO] Emitted charging_update to room: booking_2
[Socket.IO] Emitted charging_update to room: booking_2
[Socket.IO] Emitted charging_update to room: booking_2
```

**✅ Dấu hiệu đúng:**
- "Socket.IO server is ready"
- "Client connected" khi có client join
- "Client ... joined room: booking_X"
- "Emitted charging_update" mỗi khi nhận update từ IoT

---

## 🔍 Checklist Verify System

### **Test 1: API Status Endpoint**
- [ ] GET status trả về `success: true`
- [ ] Response có `socket_room: "booking_X"`
- [ ] Response có `socket_url`

### **Test 2: Internal API**
- [ ] POST internal API trả về `success: true`
- [ ] Message có "broadcasted"
- [ ] Server console có log "Emitted charging_update"

### **Test 3: IoT Simulator**
- [ ] Simulator chạy không lỗi
- [ ] Gửi update mỗi 3 giây
- [ ] Battery và Energy tăng dần
- [ ] Response có "✓ Update sent successfully"

### **Test 4: Socket.IO Client**
- [ ] Client connect thành công
- [ ] Join room thành công
- [ ] Nhận updates mỗi 3 giây
- [ ] Data update đúng (battery, energy, cost)

### **Test 5: Database**
- [ ] `charging_sessions` table có data
- [ ] `energy_consumed` và `start_battery_percent` được update
- [ ] Data khớp với IoT simulator gửi

---

## 🎯 Kết luận: System hoạt động đúng khi:

1. ✅ **GET status** → Có `socket_room` trong response
2. ✅ **POST internal** → Message có "broadcasted" + Server log "Emitted"
3. ✅ **IoT Simulator** → Gửi thành công mỗi 3 giây
4. ✅ **Socket.IO Client** → Nhận updates real-time mỗi 3 giây
5. ✅ **Database** → Data được update đúng

**Nếu tất cả 5 điều trên đều ✅ = System hoạt động hoàn hảo!**

