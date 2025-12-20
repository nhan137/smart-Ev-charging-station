# TEST – Submit Maintenance Report (Manager Panel)

## 1. Chuẩn bị

- Backend đang chạy: `http://localhost:3000`
- Đã có:
  - Tài khoản **Manager** (role_id = 2) để login lấy JWT.
  - Bảng `reports` đã có cột `image_url`.
  - Một vài `stations` tồn tại trong DB.
  - Một số **Admin** (role_id = 3).
  - Một số **User** (role_id = 1) đã từng đặt lịch tại trạm cần test.

---

## 2. Đăng nhập Manager để lấy token

### Request

`POST /api/auth/login`

Body (JSON) – thay email đúng manager của bạn (ví dụ hàng có `role_id = 2` trong bảng `users`):

{
  "email": "manager1@example.com",
  "password": "123456"
}Lấy giá trị `token` trong response để dùng cho các request sau.

Header chung cho tất cả test:

Authorization: Bearer <MANAGER_JWT_TOKEN>---

## 3. Test 1 – Gửi báo cáo KHÔNG kèm hình (chỉ notify Admin)

### Mục tiêu

- Gửi report với `station_id`, `title`, `description`.
- Không gửi `user_ids` → chỉ Admin (role 3) nhận thông báo.

### Request (Postman – `form-data`)

`POST /api/reports`

Headers:

- `Authorization: Bearer <MANAGER_JWT_TOKEN>`

Body (form-data):

- `station_id` (text): `1`  
  _(Trạm Sạc Cầu Rồng – Đà Nẵng trong hình `stations`)_
- `title` (text): `Cổng sạc bị hỏng`
- `description` (text): `Ổ cắm số 3 không nhận sạc, kiểm tra giúp.`

> Không gửi field `image`, không gửi `user_ids`.

### Kỳ vọng

- Status `201`.
- Body:

{
  "success": true,
  "message": "Report sent successfully"
}- Bảng `reports` có 1 dòng mới với:
  - `station_id = 1`
  - `reporter_id = <id manager>`
  - `status = 'pending'`
  - `image_url = NULL`
- Bảng `notifications`:
  - Có **1 notification cho mỗi Admin** (role_id = 3, status = 'active'):
    - `title = "Báo cáo sự cố mới"`
    - `message` chứa: `Quản lý <tên manager> vừa báo cáo sự cố tại trạm <tên trạm>.`
    - `type = 'system'`
    - `status = 'unread'`.

---

## 4. Test 2 – Gửi báo cáo CÓ hình + gửi thêm cho User đã dùng trạm

### Bước 1 – Lấy danh sách user đã từng booking tại trạm 1

Chạy SQL (trong phpMyAdmin):

SELECT DISTINCT u.user_id, u.full_name
FROM users u
JOIN bookings b ON u.user_id = b.user_id
WHERE u.role_id = 1 AND b.station_id = 1;Giả sử kết quả có:

- `user_id = 2`
- `user_id = 3`

Ta sẽ dùng `user_ids = ["2","3"]`.

### Bước 2 – Gửi request

`POST /api/reports`

Headers:

- `Authorization: Bearer <MANAGER_JWT_TOKEN>`

Body (form-data):

- `station_id` (text): `1`
- `title` (text): `Bảo trì trạm`
- `description` (text): `Trạm sẽ bảo trì từ 10h đến 12h, vui lòng sắp xếp lại lịch.`
- `image` (file): chọn một file `.jpg` hoặc `.png`
- `user_ids` (text):  

["2","3"]> Lưu ý: gửi dạng **text** nhưng là chuỗi JSON; backend sẽ `JSON.parse`.

### Kỳ vọng

- Status `201`, body giống Test 1.
- `reports`:
  - Dòng mới có `image_url` khác NULL, bắt đầu với `/uploads/reports/`.
- `notifications`:
  - Có thông báo cho mỗi Admin giống Test 1.
  - Có thêm thông báo cho **mỗi user** trong `["2","3"]` **mà thực sự đã từng booking ở station 1**:
    - `title = "Báo cáo sự cố mới"`
    - `message` chứa: `Trạm <tên trạm> đang có báo cáo sự cố / bảo trì...`
    - `type = 'system'`, `status = 'unread'`.

---

## 5. Test 3 – `user_ids` không hợp lệ / không từng dùng trạm

### Request

Dùng `user_ids` chứa id không tồn tại hoặc user chưa từng booking trạm 1:

`POST /api/reports`

Body (form-data):

- `station_id` (text): `1`
- `title` (text): `Thông báo sai user_ids`
- `description` (text): `Test user_ids không hợp lệ.`
- `user_ids` (text):

["9999"]### Kỳ vọng

- Report vẫn tạo bình thường.
- Admin vẫn nhận đủ notification.
- KHÔNG có notification nào tạo cho `user_id = 9999`
  (do query chỉ lấy user role 1 đã từng booking tại station 1).

---

## 6. Test 4 – Thiếu dữ liệu bắt buộc

### Request

`POST /api/reports` với body thiếu `title` hoặc `description`, ví dụ:

Body (form-data):

- `station_id` (text): `1`

### Kỳ vọng

- Status `400`.
- Body:

{
  "success": false,
  "message": "station_id, title và description là bắt buộc"
}---

## 7. Test 5 – Không có token

Gửi `POST /api/reports` nhưng **không** kèm header `Authorization`.

### Kỳ vọng

- Middleware `authenticate` trả về `401 Unauthorized` theo message hiện tại của hệ thống auth.