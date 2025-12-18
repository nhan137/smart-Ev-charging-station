# TEST – Manager Dashboard Overview API

## 1. Endpoint & Auth

- **Method**: `GET`
- **URL**: `/api/manager/dashboard`
- **Headers**:
  - `Authorization: Bearer <MANAGER_TOKEN>`

### Lấy MANAGER_TOKEN

`POST /api/auth/login`

Body (JSON) – dùng 1 manager đang quản lý trạm (ví dụ `manager@example.com`, `role_id = 2`):

```json
{
  "email": "manager@example.com",
  "password": "123456"
}
```

Lấy trường `token` trong response và dùng cho các request dưới.

---

## 2. Test 1 – Manager có trạm & booking trong ngày

### Request

`GET /api/manager/dashboard`

Headers:

```text
Authorization: Bearer <MANAGER_TOKEN>
```

### Kỳ vọng

- Status `200`
- Body dạng:

```json
{
  "success": true,
  "data": {
    "manager_name": "Trần Thị B",
    "stats": {
      "total_stations": 2,
      "active_stations": 2,
      "today_bookings": 3,
      "today_revenue": 245000
    },
    "recent_bookings": [
      {
        "id": 13,
        "customer_name": "Nguyễn Văn A",
        "station_name": "Trạm Sạc Hải Châu",
        "start_time": "2025-12-16T14:00:00.000Z",
        "status": "completed",
        "total_cost": 50000
      }
    ],
    "capacity": {
      "total_slots": 14,
      "used_slots": 6,
      "percent": 42.86
    }
  }
}
```

(Giá trị số có thể khác, quan trọng là đúng format.)

### Kiểm tra lại bằng SQL (phpMyAdmin)

Giả sử `manager_id = 21`:

```sql
-- Các trạm của manager
SELECT station_id, station_name, status, total_slots, available_slots
FROM stations
WHERE manager_id = 21;

-- Booking hôm nay của các trạm đó
SELECT *
FROM bookings
WHERE station_id IN (1, 2) -- thay bằng danh sách station_id ở trên
  AND DATE(created_at) = CURDATE();

-- Doanh thu hôm nay (chỉ booking completed)
SELECT SUM(total_cost) AS today_revenue
FROM bookings
WHERE station_id IN (1, 2)
  AND DATE(created_at) = CURDATE()
  AND status = 'completed';
```

Đối chiếu:

- `stats.total_stations` = số dòng trong query stations.
- `stats.active_stations` = số dòng có `status = 'active'`.
- `stats.today_bookings` = số dòng trong query bookings hôm nay.
- `stats.today_revenue` = giá trị `today_revenue` từ SQL.
- `capacity.total_slots` = SUM(total_slots).
- `capacity.used_slots` = SUM(total_slots) - SUM(available_slots).
- `capacity.percent` = `used_slots / total_slots * 100`.

---

## 3. Test 2 – Manager không có trạm

Dùng 1 account manager **chưa được gán trạm nào** (`stations.manager_id` không trỏ tới user này).

### Request

`GET /api/manager/dashboard` với token của manager đó.

### Kỳ vọng

- Status `200`
- Body:

```json
{
  "success": true,
  "data": {
    "manager_name": "Manager Không Có Trạm",
    "stats": {
      "total_stations": 0,
      "active_stations": 0,
      "today_bookings": 0,
      "today_revenue": 0
    },
    "recent_bookings": [],
    "capacity": {
      "total_slots": 0,
      "used_slots": 0,
      "percent": 0
    }
  }
}
```

---

## 4. Test 3 – Không có token / sai role

### 4.1 Không gửi Authorization

`GET /api/manager/dashboard` **không** kèm header `Authorization`.

- Kỳ vọng: Status `401`, body báo lỗi token (theo middleware `authenticate`).

### 4.2 Dùng token của User thường (role_id = 1) hoặc Admin (role_id = 3)

- Lấy token User / Admin rồi gọi:

`GET /api/manager/dashboard`

- Kỳ vọng: Status `403`, body:

```json
{
  "success": false,
  "message": "Access denied. Insufficient permissions"
}
```

---

## 5. Ghi chú cho Frontend

- Truyền `manager_name` lên header màn hình Dashboard: \"Xin chào, {{manager_name}}\".
- 4 ô thống kê top row lấy từ `data.stats`.
- Bảng \"Booking gần đây\" dùng `data.recent_bookings`.
- Thanh \"Công suất sử dụng\" dùng `data.capacity.total_slots`, `data.capacity.used_slots`, `data.capacity.percent`.


