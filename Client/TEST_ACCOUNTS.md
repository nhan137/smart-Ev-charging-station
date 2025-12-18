# Tài Khoản Test

## 🔑 Thông Tin Đăng Nhập

### 1. User (Người dùng)
- **Email:** `user@test.com`
- **Password:** `123456`
- **Role:** User
- **Tên:** Nguyễn Văn User
- **SĐT:** 0901111111

### 2. Manager (Quản lý)
- **Email:** `manager@test.com`
- **Password:** `123456`
- **Role:** Manager
- **Tên:** Trần Thị Manager
- **SĐT:** 0902222222

### 3. Admin (Quản trị viên)
- **Email:** `admin@test.com`
- **Password:** `123456`
- **Role:** Admin
- **Tên:** Lê Văn Admin
- **SĐT:** 0903333333

---

## 📊 Dữ Liệu Mẫu

### Trạm Sạc (5 trạm)
1. Trạm Sạc Quận 1 - Cả hai loại xe
2. Trạm Sạc Quận 3 - Xe máy
3. Trạm Sạc Bình Thạnh - Ô tô
4. Trạm Sạc Phú Nhuận - Cả hai loại xe
5. Trạm Sạc Tân Bình - Xe máy

### Mã Giảm Giá (3 mã)
- `SUMMER10` - Giảm 10%, tối đa 50k
- `NEWUSER20` - Giảm 20%, tối đa 100k
- `FLASH50` - Giảm 50%, tối đa 200k

### Lịch Sử Sạc (user@test.com)
- 3 lần sạc đã hoàn thành
- Có đánh giá và thanh toán
- 2 trạm yêu thích

---

## 🚀 Cách Sử Dụng

### 1. Import Database
```bash
mysql -u root -p ev_charging < seed_data.sql
```

### 2. Đăng Nhập
Sử dụng một trong 3 tài khoản trên để đăng nhập vào hệ thống

### 3. Test Features
- **User:** Xem trạm, đặt lịch, thanh toán, đánh giá
- **Manager:** Quản lý trạm sạc (nếu có tính năng)
- **Admin:** Quản trị toàn bộ hệ thống (nếu có tính năng)

---

## ⚠️ Lưu Ý

- Password đã được hash bằng bcrypt
- Tất cả tài khoản đều dùng password: `123456`
- Đây là dữ liệu test, không dùng trong production
- Cần cập nhật hash password thực tế khi deploy
