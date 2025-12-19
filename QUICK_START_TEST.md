# ⚡ Quick Start - Test Charging Status Real-time

## 🚀 3 Bước nhanh để test

### **Bước 1: Khởi động Backend & Frontend**

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd Client
npm run dev
```

**✅ Kiểm tra:**
- Backend: `http://localhost:3000/health` → OK
- Frontend: `http://localhost:5173` → Mở được

---

### **Bước 2: Tạo Booking và Lấy booking_id**

**Cách nhanh nhất:**
1. Login vào frontend
2. Đặt lịch sạc
3. Manager phê duyệt (hoặc dùng tài khoản manager)
4. Copy `booking_id` từ URL hoặc database

**Hoặc check database:**
```sql
SELECT booking_id, status FROM bookings 
WHERE status IN ('confirmed', 'charging') 
ORDER BY booking_id DESC LIMIT 1;
```

**→ Lưu `booking_id` (ví dụ: `5`)**

---

### **Bước 3: Chạy IoT Simulator**

**Terminal 3 - IoT Simulator:**

**Windows PowerShell:**
```powershell
cd server
$env:BOOKING_ID=5
npm run iot-simulator
```

**Windows CMD:**
```cmd
cd server
set BOOKING_ID=23
npm run iot-simulator
```

**Linux/Mac:**
```bash
cd server
BOOKING_ID=5 npm run iot-simulator
```

**✅ Kết quả:**
- Simulator gửi update mỗi 3 giây
- Battery tăng: 50% → 51% → 52% ...
- Energy tăng: 0.0 → 0.1 → 0.2 kWh ...

---

### **Bước 4: Mở Frontend và Test**

1. **Mở browser:** `http://localhost:5173`
2. **Login** với user đã tạo booking
3. **Vào Booking History** → Tìm booking đã phê duyệt
4. **Click "Nhập mã để bắt đầu sạc"** → Nhập mã check-in
5. **Hoặc truy cập trực tiếp:** `http://localhost:5173/bookings/5/charging`

**✅ Quan sát:**
- Data cập nhật **mỗi 3 giây** (battery, energy, cost, time)
- Không cần refresh trang
- Hiển thị "Cập nhật real-time qua WebSocket"

---

## 📋 Tóm tắt các Terminal

| Terminal | Lệnh | Mục đích |
|----------|------|----------|
| **Terminal 1** | `cd server && npm run dev` | Backend Server + Socket.IO |
| **Terminal 2** | `cd Client && npm run dev` | Frontend React |
| **Terminal 3** | `cd server && BOOKING_ID=5 npm run iot-simulator` | IoT Simulator |

---

## 🔍 Kiểm tra hoạt động

### **Backend Console (Terminal 1):**
```
[Socket.IO] Emitted charging_update to room: booking_5
```

### **IoT Simulator (Terminal 3):**
```
[10:30:18] Sending update to booking 5:
  - Battery: 51%
  - Energy: 0.1 kWh
  ✓ Update sent successfully
```

### **Browser Console (F12):**
```
[Socket.IO] Connected to server
[ChargingStatus] Received charging update: { ... }
```

---

## ⚠️ Lưu ý

1. **booking_id phải khớp:**
   - IoT Simulator: `BOOKING_ID=5`
   - Frontend URL: `/bookings/5/charging`

2. **Booking phải có status = 'confirmed' hoặc 'charging'**

3. **Cả 3 terminal phải chạy cùng lúc**

---

## 🐛 Nếu không hoạt động

1. **Kiểm tra backend:** `http://localhost:3000/health`
2. **Kiểm tra frontend:** `http://localhost:5173`
3. **Kiểm tra booking_id:** Phải khớp giữa IoT Simulator và Frontend
4. **Kiểm tra console:** Mở F12 → Console → Xem có lỗi không

---

**Xem hướng dẫn chi tiết:** `HUONG_DAN_TEST_CHARGING_STATUS.md`

