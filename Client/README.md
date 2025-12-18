# EV Charging Station - User Frontend

Ứng dụng React cho hệ thống quản lý trạm sạc xe điện (Phần người dùng).

## Tính năng

### 8 Màn hình chính:

1. **Đăng nhập / Đăng ký** (`/auth/login`)
   - Đăng nhập với email và mật khẩu
   - Đăng ký tài khoản mới
   - Validation đầy đủ

2. **Bản đồ Trạm Sạc** (`/stations/map`)
   - Hiển thị danh sách trạm sạc
   - Filter theo loại trạm, giá, khoảng cách
   - Xem chi tiết, lưu yêu thích, đặt lịch

3. **Chi tiết Trạm Sạc** (`/stations/:id`)
   - Thông tin đầy đủ về trạm
   - Đánh giá và feedback
   - Liên hệ, chỉ đường

4. **Đặt Lịch Sạc** (`/bookings/create`)
   - Chọn loại xe, thời gian
   - Áp dụng mã giảm giá
   - Tính giá dự kiến

5. **Trạng thái Sạc Realtime** (`/bookings/:id/charging`)
   - Theo dõi % pin, kWh, tiền
   - Cập nhật mỗi 5 giây
   - Dừng sạc

6. **Thanh Toán** (`/bookings/:id/payment`)
   - Chi tiết hóa đơn
   - Chọn phương thức (QR/Bank)
   - Mô phỏng thanh toán

7. **Lịch sử Sạc** (`/bookings/history`)
   - Xem tất cả lần sạc
   - Filter theo ngày, trạm, trạng thái
   - In hóa đơn

8. **Đánh giá & Yêu thích** (`/user/feedbacks-favorites`)
   - Gửi đánh giá cho trạm
   - Quản lý trạm yêu thích

## Cài đặt

```bash
# Clone project
cd ev-charging-station

# Cài đặt dependencies
npm install

# Tạo file .env
cp .env.example .env

# Chỉnh sửa .env với API URL của bạn
VITE_API_BASE_URL=http://localhost:3000/api

# Chạy development server
npm run dev
```

## Cấu trúc thư mục

```
src/
├── components/          # Shared components
│   └── Layout.tsx      # Layout với header/footer
├── pages/              # Page components
│   ├── Auth/
│   │   └── Login.tsx
│   ├── Stations/
│   │   ├── StationMap.tsx
│   │   └── StationDetail.tsx
│   ├── Bookings/
│   │   ├── CreateBooking.tsx
│   │   ├── ChargingStatus.tsx
│   │   ├── Payment.tsx
│   │   └── BookingHistory.tsx
│   └── User/
│       └── FeedbacksFavorites.tsx
├── services/           # API services
│   ├── api.ts
│   ├── authService.ts
│   ├── stationService.ts
│   ├── bookingService.ts
│   ├── paymentService.ts
│   ├── feedbackService.ts
│   └── favoriteService.ts
├── types/              # TypeScript types
│   └── index.ts
├── App.tsx             # Main app with routing
└── main.tsx           # Entry point
```

## API Endpoints cần thiết

Backend cần cung cấp các endpoints sau:

### Auth
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/register` - Đăng ký

### Stations
- `GET /api/stations` - Danh sách trạm (có filter)
- `GET /api/stations/:id` - Chi tiết trạm
- `GET /api/stations/:id/feedbacks` - Đánh giá của trạm

### Bookings
- `POST /api/bookings` - Tạo đặt lịch
- `GET /api/bookings/:id` - Chi tiết đặt lịch
- `PUT /api/bookings/:id/stop` - Dừng sạc
- `GET /api/bookings/history` - Lịch sử

### Promotions
- `POST /api/promotions/validate` - Validate mã giảm giá

### Payments
- `POST /api/payments` - Tạo thanh toán

### Feedbacks
- `POST /api/feedbacks` - Gửi đánh giá

### Favorites
- `GET /api/favorites` - Danh sách yêu thích
- `POST /api/favorites` - Thêm yêu thích
- `DELETE /api/favorites/:id` - Xóa yêu thích

## Scripts

```bash
npm run dev      # Chạy development server
npm run build    # Build production
npm run preview  # Preview production build
npm run lint     # Lint code
```

## Công nghệ sử dụng

- React 19
- TypeScript
- React Router DOM
- Axios
- Vite

## Lưu ý

- Đây là phần frontend, cần backend API để hoạt động đầy đủ
- Google Maps integration cần API key (chưa tích hợp)
- Payment gateway là mô phỏng, chưa tích hợp thực tế
- Realtime charging sử dụng setInterval để mô phỏng
