# TEST – Hệ thống Báo cáo Sự cố (Report System)

## 1. Chuẩn bị

- Backend đang chạy: `http://localhost:3000`
- Đã có trong DB:
  - **User** (role_id = 1): ví dụ `user_id = 6` (Trần Thi B)
  - **Manager** (role_id = 2): ví dụ `user_id = 21` (Manager Panel Test) quản lý `station_id = 1`
  - **Admin** (role_id = 3): ví dụ `user_id = 18` (Nguyễn Văn Admin)
  - **Station** có `manager_id` trỏ đúng manager: `station_id = 1` có `manager_id = 21`

---

## 2. Test Flow 1: User → Manager → Resolve

### Bước 1: User đăng nhập lấy token

`POST /api/auth/login`

Body (JSON):

```json
{
  "email": "tranthib@gmail.com",
  "password": "123456"
}
```

Lưu `USER_TOKEN` từ response.

---

### Bước 2: User gửi báo cáo sự cố

`POST /api/reports`

Headers:

- `Authorization: Bearer <USER_TOKEN>`

Body (form-data):

- `station_id` (text): `1`
- `title` (text): `Cổng sạc số 3 bị hỏng`
- `description` (text): `Ổ cắm số 3 không nhận sạc, kiểm tra giúp.`
- `image` (file): (optional) chọn file `.jpg` hoặc `.png`

**Kỳ vọng:**

- Status `201`
- Body:

```json
{
  "success": true,
  "message": "Report sent successfully"
}
```

- Bảng `reports`: có 1 dòng mới với:
  - `station_id = 1`
  - `reporter_id = 6` (user_id của User)
  - `status = 'pending'`
- Bảng `notifications`: có 1 notification cho **Manager** (`user_id = 21`):
  - `title = "Báo cáo sự cố mới từ khách hàng"`
  - `message` chứa: `Khách hàng Trần Thi B vừa báo cáo sự cố tại trạm...`
  - `type = 'system'`, `status = 'unread'`

**Lưu `report_id`** từ DB (ví dụ: `report_id = 8`).

---

### Bước 3: Manager đăng nhập

`POST /api/auth/login`

Body (JSON):

```json
{
  "email": "manager_panel@example.com",
  "password": "123456"
}
```

Lưu `MANAGER_TOKEN`.

---

### Bước 4: Manager xử lý báo cáo (Resolve)

`PUT /api/reports/:report_id/manager/resolve`

Headers:

- `Authorization: Bearer <MANAGER_TOKEN>`

URL params:

- `report_id`: `8` (từ Bước 2)

Body (JSON): (empty hoặc không cần body)

**Kỳ vọng:**

- Status `200`
- Body:

```json
{
  "success": true,
  "message": "Báo cáo đã được xử lý thành công"
}
```

- Bảng `reports`: dòng `report_id = 8` có `status = 'resolved'`
- Bảng `notifications`: có 1 notification mới cho **User** (`user_id = 6`):
  - `title = "Báo cáo sự cố đã được xử lý"`
  - `message` chứa: `Báo cáo của bạn về trạm... đã được Quản lý xử lý.`
  - `type = 'system'`, `status = 'unread'`

---

## 3. Test Flow 2: User → Manager → Escalate → Admin

### Bước 1: User gửi báo cáo mới

`POST /api/reports`

Headers:

- `Authorization: Bearer <USER_TOKEN>`

Body (form-data):

- `station_id` (text): `1`
- `title` (text): `Sự cố nghiêm trọng cần hỗ trợ`
- `description` (text): `Trạm gặp sự cố lớn, cần hỗ trợ từ admin.`

**Lưu `report_id` mới** (ví dụ: `report_id = 9`).

---

### Bước 2: Manager chuyển báo cáo lên Admin (Escalate)

`PUT /api/reports/:report_id/manager/escalate`

Headers:

- `Authorization: Bearer <MANAGER_TOKEN>`

URL params:

- `report_id`: `9`

Body (JSON): (empty)

**Kỳ vọng:**

- Status `200`
- Body:

```json
{
  "success": true,
  "message": "Báo cáo đã được chuyển lên Admin",
  "escalated_report_id": 10
}
```

- Bảng `reports`:
  - Dòng `report_id = 9` (báo cáo gốc từ User) vẫn giữ nguyên `status = 'pending'`
  - Có **1 dòng mới** (`report_id = 10`):
    - `station_id = 1`
    - `reporter_id = 21` (manager_id)
    - `title/description/image_url` copy từ report gốc
    - `status = 'pending'`
- Bảng `notifications`:
  - 1 notification cho **User** (`user_id = 6`): "Báo cáo đã được chuyển cho Admin"
  - 1 notification cho **mỗi Admin** (role_id = 3, status = 'active'):
    - `title = "Báo cáo sự cố mới từ Quản lý trạm"`
    - `message` chứa: `Quản lý Manager Panel Test vừa báo cáo/bảo trì tại trạm...`
    - `type = 'system'`, `status = 'unread'`

**Lưu `escalated_report_id = 10`**.

---

### Bước 3: Admin đăng nhập

`POST /api/auth/login`

Body (JSON):

```json
{
  "email": "admin@example.com",
  "password": "123456"
}
```

Lưu `ADMIN_TOKEN`.

---

### Bước 4: Admin xem danh sách báo cáo từ Manager

`GET /api/reports/admin`

Headers:

- `Authorization: Bearer <ADMIN_TOKEN>`

**Kỳ vọng:**

- Status `200`
- Body:

```json
{
  "success": true,
  "data": [
    {
      "report_id": 10,
      "station_id": 1,
      "station_name": "Trạm Sạc Cầu Rồng",
      "reporter_id": 21,
      "reporter_name": "Manager Panel Test",
      "reporter_role_id": 2,
      "title": "Sự cố nghiêm trọng cần hỗ trợ",
      "description": "Trạm gặp sự cố lớn, cần hỗ trợ từ admin.",
      "image_url": null,
      "status": "pending",
      "reported_at": "2025-12-16T..."
    }
  ]
}
```

**Lưu ý:** Chỉ hiển thị các report có `reporter_role_id = 2` (Manager).

---

### Bước 5: Admin phê duyệt / đánh dấu đã xử lý

`PUT /api/reports/:report_id/status`

Headers:

- `Authorization: Bearer <ADMIN_TOKEN>`

URL params:

- `report_id`: `10` (escalated report)

Body (JSON):

```json
{
  "status": "resolved"
}
```

**Kỳ vọng:**

- Status `200`
- Body:

```json
{
  "success": true,
  "message": "Cập nhật trạng thái báo cáo thành công"
}
```

- Bảng `reports`: dòng `report_id = 10` có `status = 'resolved'`
- Bảng `notifications`: có 1 notification mới cho **Manager** (`user_id = 21`):
  - `title = "Báo cáo sự cố đã được xử lý"`
  - `message` chứa: `Báo cáo của bạn về trạm... đã được admin xử lý.`
  - `type = 'system'`, `status = 'unread'`

---

## 4. Test Flow 3: Manager gửi báo cáo trực tiếp lên Admin

### Bước 1: Manager gửi báo cáo bảo trì

`POST /api/reports`

Headers:

- `Authorization: Bearer <MANAGER_TOKEN>`

Body (form-data):

- `station_id` (text): `1`
- `title` (text): `Bảo trì trạm định kỳ`
- `description` (text): `Trạm sẽ bảo trì từ 10h đến 12h ngày mai.`
- `image` (file): (optional)
- `user_ids` (text): `["6","19"]` (optional - broadcast cho Users đã từng booking tại trạm)

**Kỳ vọng:**

- Status `201`
- Bảng `reports`: có 1 dòng mới với `reporter_id = 21` (manager)
- Bảng `notifications`:
  - 1 notification cho **mỗi Admin** (role_id = 3)
  - (Nếu có `user_ids`) 1 notification cho mỗi user trong list đã từng booking tại trạm

---

## 5. Test Validation & Error Cases

### Test 5.1: User gửi báo cáo thiếu dữ liệu

`POST /api/reports`

Headers:

- `Authorization: Bearer <USER_TOKEN>`

Body (form-data):

- `station_id` (text): `1`
- (thiếu `title` và `description`)

**Kỳ vọng:**

- Status `400`
- Body:

```json
{
  "success": false,
  "message": "station_id, title và description là bắt buộc"
}
```

---

### Test 5.2: Manager resolve report không thuộc trạm của mình

`PUT /api/reports/:report_id/manager/resolve`

Headers:

- `Authorization: Bearer <MANAGER_TOKEN>`

URL params:

- `report_id`: `1` (report thuộc trạm khác hoặc không tồn tại)

**Kỳ vọng:**

- Status `403` hoặc `404`
- Body:

```json
{
  "success": false,
  "message": "Bạn không có quyền xử lý báo cáo này" hoặc "Report not found"
}
```

---

### Test 5.3: Manager escalate report không phải từ User

`PUT /api/reports/:report_id/manager/escalate`

Headers:

- `Authorization: Bearer <MANAGER_TOKEN>`

URL params:

- `report_id`: `10` (report do Manager tạo, không phải User)

**Kỳ vọng:**

- Status `400`
- Body:

```json
{
  "success": false,
  "message": "Chỉ có thể chuyển báo cáo từ User lên Admin"
}
```

---

### Test 5.4: Admin đổi status không hợp lệ

`PUT /api/reports/:report_id/status`

Headers:

- `Authorization: Bearer <ADMIN_TOKEN>`

Body (JSON):

```json
{
  "status": "invalid_status"
}
```

**Kỳ vọng:**

- Status `400`
- Body:

```json
{
  "success": false,
  "message": "status phải là 'pending' hoặc 'resolved'"
}
```

---

## 6. Kiểm tra Database

### Sau khi test xong, chạy SQL để verify:

```sql
-- Xem tất cả reports
SELECT report_id, station_id, reporter_id, title, status, reported_at
FROM reports
ORDER BY reported_at DESC;

-- Xem notifications liên quan
SELECT notification_id, user_id, title, message, type, status, created_at
FROM notifications
WHERE title LIKE '%báo cáo%' OR title LIKE '%sự cố%'
ORDER BY created_at DESC;
```

---

## 7. Tóm tắt các API Endpoints

| Method | Endpoint | Role | Mô tả |
|--------|----------|------|-------|
| POST | `/api/reports` | User/Manager | Gửi báo cáo sự cố |
| PUT | `/api/reports/:id/manager/resolve` | Manager | Xử lý báo cáo từ User |
| PUT | `/api/reports/:id/manager/escalate` | Manager | Chuyển báo cáo User lên Admin |
| GET | `/api/reports/admin` | Admin | Xem danh sách báo cáo từ Manager |
| PUT | `/api/reports/:id/status` | Admin | Phê duyệt/xử lý báo cáo của Manager |

---

## 8. Lưu ý

- **User** chỉ có thể gửi báo cáo, không có API xem lịch sử (có thể thêm sau).
- **Manager** chỉ có thể resolve/escalate báo cáo từ User, không có API xem danh sách (có thể thêm sau).
- **Admin** chỉ xem báo cáo từ Manager, không xem báo cáo từ User (vì User → Manager xử lý trước).

