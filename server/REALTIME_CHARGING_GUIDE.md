# Hướng dẫn Test Real-Time Charging Status System

## 📋 Tổng quan luồng hoạt động

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Client    │         │   Server     │         │ IoT Device  │
│  (Frontend) │         │  (Node.js)   │         │ (Simulator) │
└──────┬──────┘         └──────┬───────┘         └──────┬──────┘
       │                       │                         │
       │ 1. GET /api/bookings/:id/charging/status         │
       │───────────────────────>│                         │
       │                       │                         │
       │ 2. Response + socket_room                        │
       │<───────────────────────│                         │
       │                       │                         │
       │ 3. Connect Socket.IO & join room                 │
       │───────────────────────>│                         │
       │                       │                         │
       │                       │ 4. POST /internal/charging-update/:id
       │                       │<─────────────────────────│
       │                       │                         │
       │                       │ 5. Update DB & Emit Socket.IO
       │                       │─────────────────────────>│
       │                       │                         │
       │ 6. Receive real-time update                       │
       │<───────────────────────│                         │
       │                       │                         │
```

## 🔄 Chi tiết luồng hoạt động

### **Bước 1: User xem trạng thái sạc (Initial Status)**
- **API:** `GET /api/bookings/:booking_id/charging/status`
- **Auth:** JWT Token (user phải là chủ booking)
- **Process:**
  1. Verify user owns booking
  2. Get charging session data từ database
  3. Calculate current values (battery, energy, cost, time remaining)
  4. Return initial data + `socket_room` identifier

### **Bước 2: Client kết nối Socket.IO**
- Client dùng `socket_room` từ response để join room
- Socket.IO room format: `booking_{booking_id}`
- Client listen event: `charging_update`

### **Bước 3: IoT Simulator gửi data**
- **API:** `POST /internal/charging-update/:booking_id`
- **Auth:** Không cần (internal endpoint)
- **Process:**
  1. Nhận data từ IoT: `energy_consumed`, `current_battery_percent`
  2. Update `charging_sessions` table
  3. Calculate `estimated_cost` = energy_consumed × price_per_kwh
  4. Calculate `time_remaining`
  5. **Emit Socket.IO event** `charging_update` đến room `booking_{booking_id}`

### **Bước 4: Client nhận real-time update**
- Client nhận event `charging_update` qua Socket.IO
- Update UI với data mới (battery, energy, cost, time)

---

## 🧪 Hướng dẫn Test trong Postman

### **Prerequisites:**
1. Server đang chạy: `npm run dev`
2. IoT Simulator đang chạy: `npm run iot-simulator` (terminal khác)
3. Có booking_id hợp lệ trong database

---

### **TEST 1: Lấy JWT Token (Login)**

**POST** `http://localhost:3000/api/auth/login`

**Body (JSON):**
```json
{
  "email": "khachhang@app.com",
  "password": "nhannok"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**→ Copy `token` để dùng cho các request sau**

---

### **TEST 2: Tạo Booking (nếu chưa có)**

**POST** `http://localhost:3000/api/bookings`

**Headers:**
- `Authorization: Bearer <token>`

**Body (JSON):**
```json
{
  "station_id": 1,
  "vehicle_type": "xe_may_usb",
  "start_time": "2025-12-08T10:00:00Z",
  "end_time": "2025-12-08T14:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "booking_id": 2,
    ...
  }
}
```

**→ Copy `booking_id` để dùng cho test sau**

---

### **TEST 3: Lấy Initial Charging Status**

**GET** `http://localhost:3000/api/bookings/2/charging/status`

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
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
    "socket_room": "booking_2",
    "socket_url": "http://localhost:3000"
  }
}
```

**→ Lưu `socket_room` để test Socket.IO**

---

### **TEST 4: Test Internal API (IoT Simulator)**

**POST** `http://localhost:3000/internal/charging-update/2`

**Body (JSON):**
```json
{
  "energy_consumed": 1.5,
  "current_battery_percent": 55
}
```

**Response:**
```json
{
  "success": true,
  "message": "Charging update received and broadcasted",
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

**→ Data đã được update và emit qua Socket.IO**

---

### **TEST 5: Test với IoT Simulator tự động**

**Chạy IoT Simulator (Terminal 2):**
```bash
cd server
npm run iot-simulator

# Hoặc với booking_id cụ thể:
BOOKING_ID=2 npm run iot-simulator
```

**Kết quả:**
- Simulator gửi update mỗi 3 giây
- Battery tăng 1% mỗi lần (50% → 51% → 52% ...)
- Energy tăng 0.1 kWh mỗi lần (0.0 → 0.1 → 0.2 ...)
- Server tự động emit Socket.IO event mỗi lần nhận update

---

### **TEST 6: Test Socket.IO Real-time (Terminal 3)**

**Chạy Socket.IO Test Client:**
```bash
cd server
npm run test-socket 2
# Hoặc: node test_socket_client.js 2
```

**Kết quả:**
- Client connect Socket.IO
- Join room `booking_2`
- Nhận real-time updates mỗi khi IoT simulator gửi data
- Hiển thị: battery %, energy, cost, time remaining

**Lưu ý:** Chạy cả 3 terminal cùng lúc:
- Terminal 1: Server (`npm run dev`)
- Terminal 2: IoT Simulator (`npm run iot-simulator`)
- Terminal 3: Socket.IO Client (`npm run test-socket 2`)

---

## 🔌 Mối liên hệ giữa Socket.IO và IoT Simulator

### **1. Socket.IO là gì?**
- **Socket.IO** = Real-time communication protocol
- Cho phép server "push" data đến client ngay lập tức
- Không cần client phải "polling" (hỏi liên tục)

### **2. IoT Simulator là gì?**
- **IoT Simulator** = Mô phỏng thiết bị IoT thật
- Gửi data từ "thiết bị sạc" lên server
- Giống như thiết bị thật gửi sensor data

### **3. Mối liên hệ:**

```
IoT Device (Simulator)
    │
    │ POST /internal/charging-update/:id
    │ { energy_consumed: 1.5, current_battery_percent: 55 }
    ▼
Server (Node.js)
    │
    │ 1. Update database (charging_sessions)
    │ 2. Calculate values (cost, time remaining)
    │ 3. Emit Socket.IO event to room "booking_2"
    ▼
Socket.IO Server
    │
    │ Event: "charging_update"
    │ Data: { booking_id, battery, energy, cost, time }
    ▼
All Clients in room "booking_2"
    │
    │ Receive real-time update
    ▼
Frontend (React/Vue)
    │
    │ Update UI immediately
    ▼
User sees updated data (battery %, cost, time)
```

### **4. Tại sao cần Socket.IO?**

**Không có Socket.IO:**
- Client phải polling (gọi API mỗi 5 giây) → tốn bandwidth, chậm
- Delay từ 0-5 giây tùy vào thời điểm polling

**Có Socket.IO:**
- Server push data ngay khi có update → real-time, không delay
- Tiết kiệm bandwidth (chỉ gửi khi có thay đổi)
- User experience tốt hơn

### **5. Workflow thực tế:**

1. **User mở trang charging** → Gọi GET status → Nhận initial data
2. **User join Socket.IO room** → `socket.emit('join_booking_room', bookingId)`
3. **IoT device gửi update** → POST internal API → Server emit Socket.IO
4. **User nhận update** → `socket.on('charging_update', (data) => {...})`
5. **UI tự động update** → Không cần refresh, không cần polling

---

## 📝 Test Checklist

- [ ] Login và lấy JWT token
- [ ] Tạo booking mới
- [ ] GET charging status (nhận socket_room)
- [ ] Test POST internal API (manual)
- [ ] Chạy IoT simulator
- [ ] Verify data được update trong database
- [ ] Test Socket.IO connection (cần frontend hoặc Socket.IO client)

---

## 🛠️ Test Socket.IO với Test Script

Postman không hỗ trợ Socket.IO trực tiếp. Để test Socket.IO:

### **Cách 1: Dùng Test Script (Dễ nhất)**

**Terminal 3:**
```bash
cd server
npm run test-socket 2
# Hoặc với booking_id khác:
node test_socket_client.js 2
```

**Kết quả:**
- Script sẽ connect Socket.IO
- Join room `booking_2`
- Hiển thị real-time updates khi IoT simulator gửi data
- Bạn sẽ thấy updates mỗi 3 giây khi IoT simulator chạy

### **Cách 2: Dùng Frontend**
- Frontend dùng Socket.IO client library
- Connect và listen event `charging_update`

---

## 🎯 Kết luận

- **IoT Simulator** = Nguồn data (giống thiết bị thật)
- **Internal API** = Nhận data từ IoT và update database
- **Socket.IO** = Push data real-time đến tất cả clients đang xem booking đó
- **Client** = Nhận update và hiển thị ngay lập tức

**Luồng:** IoT → Server → Socket.IO → Client → UI Update

---

## ✅ Response nào cho biết System hoạt động đúng?

### **1. GET Status Response:**
```json
{
  "success": true,
  "data": {
    "socket_room": "booking_2",  ← PHẢI CÓ
    "socket_url": "http://localhost:3000"
  }
}
```

### **2. POST Internal API Response:**
```json
{
  "success": true,
  "message": "Charging update received and broadcasted",  ← PHẢI CÓ "broadcasted"
  "data": { ... }
}
```

### **3. Server Console:**
```
[Socket.IO] Emitted charging_update to room: booking_2  ← PHẢI CÓ LOG NÀY
```

### **4. Socket.IO Client:**
```
📡 REAL-TIME UPDATE RECEIVED  ← PHẢI NHẬN ĐƯỢC MỖI 3 GIÂY
```

**Xem chi tiết trong file:** `VERIFY_REALTIME_SYSTEM.md`

